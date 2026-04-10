import { useEffect, useRef, useState } from 'react';
import { ImageSegmenter, FilesetResolver } from '@mediapipe/tasks-vision';
import { ScanType } from './EscapeLogic';

export const useVision = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const segmenterRef = useRef<ImageSegmenter | null>(null);
  const [ready, setReady] = useState(false);

  // Cached segmentation — run at most every 350ms to avoid timestamp conflicts
  const lastSegMask = useRef<Uint8Array | null>(null);
  const lastSegTimestamp = useRef(0);

  useEffect(() => {
    const initVision = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        const video = document.createElement('video');
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        video.style.position = 'fixed';
        video.style.top = '0';
        video.style.left = '0';
        video.style.width = '100vw';
        video.style.height = '100vh';
        video.style.objectFit = 'cover';
        video.style.zIndex = '-1';

        document.body.appendChild(video);
        video.play();
        videoRef.current = video;

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        segmenterRef.current = await ImageSegmenter.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/latest/deeplab_v3.tflite',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          outputCategoryMask: true,
        });

        video.onloadeddata = () => setReady(true);
      } catch (err) {
        console.error('Vision initialization failed:', err);
      }
    };

    initVision();
    return () => {
      if (videoRef.current) document.body.removeChild(videoRef.current);
    };
  }, []);

  /** Returns cached segmentation mask, refreshed at most every 350ms */
  const getSegMask = (): Uint8Array | null => {
    if (!videoRef.current || !segmenterRef.current || !ready) return null;
    const now = performance.now();
    if (now - lastSegTimestamp.current < 350 && lastSegMask.current) {
      return lastSegMask.current;
    }
    lastSegTimestamp.current = now;
    try {
      const result = segmenterRef.current.segmentForVideo(videoRef.current, now);
      lastSegMask.current = result.categoryMask?.getAsUint8Array() ?? null;
    } catch {
      // keep stale mask on error
    }
    return lastSegMask.current;
  };

  /** Average brightness (0–255) of the center 40% of the frame */
  const getCenterBrightness = (): number => {
    if (!videoRef.current || !ready) return -1;
    const v = videoRef.current;
    if (v.videoWidth === 0) return -1;
    const canvas = document.createElement('canvas');
    canvas.width = 80;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');
    if (!ctx) return -1;
    ctx.drawImage(v, v.videoWidth * 0.3, v.videoHeight * 0.3, v.videoWidth * 0.4, v.videoHeight * 0.4, 0, 0, 80, 80);
    const data = ctx.getImageData(0, 0, 80, 80).data;
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    return sum / (80 * 80);
  };

  /** Fraction of center pixels that are green-dominant */
  const getCenterGreenRatio = (): number => {
    if (!videoRef.current || !ready) return 0;
    const v = videoRef.current;
    if (v.videoWidth === 0) return 0;
    const canvas = document.createElement('canvas');
    canvas.width = 80;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;
    ctx.drawImage(v, v.videoWidth * 0.2, v.videoHeight * 0.2, v.videoWidth * 0.6, v.videoHeight * 0.6, 0, 0, 80, 80);
    const data = ctx.getImageData(0, 0, 80, 80).data;
    let greenPx = 0;
    const total = 80 * 80;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (g > r + 15 && g > b + 15 && g > 50) greenPx++;
    }
    return greenPx / total;
  };

  /** Fraction of center 50% of frame matching any of the given DeepLab category IDs */
  const getCenterCategoryRatio = (categoryIds: number[]): number => {
    const mask = getSegMask();
    if (!mask || !videoRef.current) return 0;
    const { videoWidth: w, videoHeight: h } = videoRef.current;
    const x1 = Math.floor(w * 0.25), x2 = Math.floor(w * 0.75);
    const y1 = Math.floor(h * 0.25), y2 = Math.floor(h * 0.75);
    let match = 0, total = 0;
    for (let y = y1; y < y2; y += 2) {
      for (let x = x1; x < x2; x += 2) {
        if (categoryIds.includes(mask[y * w + x])) match++;
        total++;
      }
    }
    return total > 0 ? match / total : 0;
  };

  /**
   * Returns true if the camera currently sees the requested scan target.
   * Called at ~500ms intervals by the game loop.
   */
  const checkScanTarget = (type: ScanType): boolean => {
    if (!ready) return false;
    switch (type) {
      case 'dark': {
        const b = getCenterBrightness();
        return b >= 0 && b < 60;
      }
      case 'bright': {
        const b = getCenterBrightness();
        return b >= 0 && b > 150;
      }
      case 'seated': {
        // Chair=9, Sofa/couch=18
        return getCenterCategoryRatio([9, 18]) > 0.04;
      }
      case 'nature': {
        // Plant=16 OR dominant green color
        if (getCenterCategoryRatio([16]) > 0.03) return true;
        return getCenterGreenRatio() > 0.12;
      }
      case 'self': {
        // Person=15
        return getCenterCategoryRatio([15]) > 0.05;
      }
    }
  };

  /** Returns nearby detected objects for the obstacle overlay */
  const getObstacles = (): { x: number; z: number; label: number }[] => {
    const mask = getSegMask();
    if (!mask || !videoRef.current) return [];
    const { videoWidth: width, videoHeight: height } = videoRef.current;
    const obstacles: { x: number; z: number; label: number }[] = [];
    const step = 30;
    const horizon = 0.35;
    for (let y = Math.floor(height * horizon); y < height; y += step) {
      for (let x = Math.floor(width * 0.05); x < width * 0.95; x += step) {
        const category = mask[y * width + x];
        if (category > 0) {
          const normY = y / height;
          const depth = -3.0 / (normY - horizon + 0.05);
          const lateral = ((x / width - 0.5) * 2.0) * Math.abs(depth) * 0.9;
          if (depth < -15 || depth > -0.2) continue;
          obstacles.push({ x: lateral, z: depth, label: category });
        }
      }
    }
    return obstacles
      .sort((a, b) => Math.abs(a.z) - Math.abs(b.z))
      .slice(0, 15);
  };

  return { ready, getObstacles, checkScanTarget };
};
