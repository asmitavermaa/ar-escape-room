import { useEffect, useRef, useState } from 'react';
import { ImageSegmenter, FilesetResolver } from '@mediapipe/tasks-vision';
import { ScanType } from './EscapeLogic';

export interface PathSample {
  x: number;           // normalised 0-1 horizontal centre of walkable corridor
  y: number;           // normalised 0-1 vertical position in image
  corridorWidth: number; // normalised width of walkable gap
  clear: boolean;
}

export interface MaskData {
  mask: Uint8Array | null;
  vw: number;
  vh: number;
}

export const useVision = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const segmenterRef = useRef<ImageSegmenter | null>(null);
  const [ready, setReady] = useState(false);

  // Cached segmentation — at most every 350ms to avoid monotonic-timestamp conflicts
  const lastSegMask = useRef<Uint8Array | null>(null);
  const lastSegTimestamp = useRef(0);

  // Single persistent off-screen canvas reused by all pixel-sampling helpers
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);

  // Previous path for temporal smoothing
  const prevPathRef = useRef<PathSample[]>([]);

  useEffect(() => {
    const initVision = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        const video = document.createElement('video');
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        Object.assign(video.style, {
          position: 'fixed', top: '0', left: '0',
          width: '100vw', height: '100vh',
          objectFit: 'cover', zIndex: '-1',
        });
        document.body.appendChild(video);
        video.play();
        videoRef.current = video;

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        segmenterRef.current = await ImageSegmenter.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/latest/deeplab_v3.tflite',
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
    return () => { if (videoRef.current) document.body.removeChild(videoRef.current); };
  }, []);

  // ── Internal helpers ────────────────────────────────────────────────────────

  const getSegMask = (): Uint8Array | null => {
    if (!videoRef.current || !segmenterRef.current || !ready) return null;
    const now = performance.now();
    if (now - lastSegTimestamp.current < 350 && lastSegMask.current) return lastSegMask.current;
    lastSegTimestamp.current = now;
    try {
      const result = segmenterRef.current.segmentForVideo(videoRef.current, now);
      lastSegMask.current = result.categoryMask?.getAsUint8Array() ?? null;
    } catch { /* keep stale mask */ }
    return lastSegMask.current;
  };

  /** Returns the persistent 80×80 off-screen canvas context, or null if unavailable. */
  const getOffscreen = (): CanvasRenderingContext2D | null => {
    if (!offscreenRef.current) {
      const c = document.createElement('canvas');
      c.width = 80; c.height = 80;
      offscreenRef.current = c;
    }
    return offscreenRef.current.getContext('2d');
  };

  /** Average brightness (0–255) of a centre crop of the frame, or null on failure. */
  const getCenterBrightness = (): number | null => {
    const v = videoRef.current;
    if (!v || !ready || v.videoWidth === 0) return null;
    const ctx = getOffscreen();
    if (!ctx) return null;
    ctx.drawImage(v, v.videoWidth * 0.3, v.videoHeight * 0.3, v.videoWidth * 0.4, v.videoHeight * 0.4, 0, 0, 80, 80);
    const data = ctx.getImageData(0, 0, 80, 80).data;
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
    return sum / (80 * 80);
  };

  /** Fraction of a centre crop that is green-dominant (proxy for plants). */
  const getCenterGreenRatio = (): number => {
    const v = videoRef.current;
    if (!v || !ready || v.videoWidth === 0) return 0;
    const ctx = getOffscreen();
    if (!ctx) return 0;
    ctx.drawImage(v, v.videoWidth * 0.2, v.videoHeight * 0.2, v.videoWidth * 0.6, v.videoHeight * 0.6, 0, 0, 80, 80);
    const data = ctx.getImageData(0, 0, 80, 80).data;
    let greenPx = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (g > r + 15 && g > b + 15 && g > 50) greenPx++;
    }
    return greenPx / (80 * 80);
  };

  /** Fraction of the centre 50% of frame matching any of the given DeepLab category IDs. */
  const getCenterCategoryRatio = (categoryIds: number[]): number => {
    const mask = getSegMask();
    if (!mask || !videoRef.current) return 0;
    const { videoWidth: w, videoHeight: h } = videoRef.current;
    const catSet = new Set(categoryIds);
    const x1 = Math.floor(w * 0.25), x2 = Math.floor(w * 0.75);
    const y1 = Math.floor(h * 0.25), y2 = Math.floor(h * 0.75);
    let match = 0, total = 0;
    for (let y = y1; y < y2; y += 2) {
      for (let x = x1; x < x2; x += 2) {
        if (catSet.has(mask[y * w + x])) match++;
        total++;
      }
    }
    return total > 0 ? match / total : 0;
  };

  // ── Public API ──────────────────────────────────────────────────────────────

  const checkScanTarget = (type: ScanType): boolean => {
    if (!ready) return false;
    switch (type) {
      case 'dark': { const b = getCenterBrightness(); return b !== null && b < 60; }
      case 'bright': { const b = getCenterBrightness(); return b !== null && b > 150; }
      case 'seated': return getCenterCategoryRatio([9, 18]) > 0.04;
      case 'nature': return getCenterCategoryRatio([16]) > 0.03 || getCenterGreenRatio() > 0.12;
      case 'self': return getCenterCategoryRatio([15]) > 0.05;
      default: throw new Error(`Unhandled ScanType: ${type}`);
    }
  };

  /** 3D obstacle positions for the Three.js danger-zone overlay. */
  const getObstacles = (): { x: number; z: number; label: number }[] => {
    const mask = getSegMask();
    if (!mask || !videoRef.current) return [];
    const { videoWidth: width, videoHeight: height } = videoRef.current;
    const obstacles: { x: number; z: number; label: number }[] = [];
    const horizon = 0.35;
    for (let y = Math.floor(height * horizon); y < height; y += 30) {
      for (let x = Math.floor(width * 0.05); x < width * 0.95; x += 30) {
        const category = mask[y * width + x];
        if (category === 0) continue;
        const normY = y / height;
        const depth = -3.0 / (normY - horizon + 0.05);
        if (depth < -15 || depth > -0.2) continue;
        const lateral = ((x / width - 0.5) * 2.0) * Math.abs(depth) * 0.9;
        obstacles.push({ x: lateral, z: depth, label: category });
      }
    }
    return obstacles.sort((a, b) => Math.abs(a.z) - Math.abs(b.z)).slice(0, 15);
  };

  /**
   * Analyses the floor area of the current frame and returns a series of path
   * samples from near (index 0, bottom of image) to far (last index, horizon).
   * Each sample gives the centre and width of the largest walkable corridor at
   * that depth strip. Used by the 2D PathCanvas for accurate floor-path drawing.
   */
  const getWalkablePath = (): PathSample[] => {
    const mask = getSegMask();
    const v = videoRef.current;
    if (!v || v.videoWidth === 0) return [];

    const vw = v.videoWidth, vh = v.videoHeight;
    const horizonY = Math.floor(vh * 0.38);
    const NUM_STRIPS = 14;
    const raw: PathSample[] = [];

    for (let s = 0; s < NUM_STRIPS; s++) {
      const frac = s / (NUM_STRIPS - 1);
      // s=0 → bottom (near), s=NUM_STRIPS-1 → horizon (far)
      const stripY = Math.floor(vh - 1 - frac * (vh - 1 - horizonY));
      const normY = stripY / vh;

      if (!mask) {
        raw.push({ x: 0.5, y: normY, corridorWidth: 0.3, clear: false });
        continue;
      }

      const xL = Math.floor(vw * 0.03), xR = Math.floor(vw * 0.97);
      const runs: { start: number; end: number }[] = [];
      let inRun = false, runStart = 0;

      for (let x = xL; x <= xR; x++) {
        if (mask[stripY * vw + x] === 0) {
          if (!inRun) { inRun = true; runStart = x; }
        } else {
          if (inRun) { inRun = false; runs.push({ start: runStart, end: x - 1 }); }
        }
      }
      if (inRun) runs.push({ start: runStart, end: xR });

      if (runs.length === 0) {
        raw.push({ x: 0.5, y: normY, corridorWidth: 0, clear: false });
      } else {
        // Prefer run closest to horizontal centre, weighted by width
        const cx = vw * 0.5;
        const best = runs.reduce((b, r) => {
          const rc = (r.start + r.end) / 2, bc = (b.start + b.end) / 2;
          return (r.end - r.start) - Math.abs(rc - cx) * 0.5 >
                 (b.end - b.start) - Math.abs(bc - cx) * 0.5 ? r : b;
        }, runs[0]);
        raw.push({
          x: (best.start + best.end) / 2 / vw,
          y: normY,
          corridorWidth: (best.end - best.start) / vw,
          clear: true,
        });
      }
    }

    // Spatial smoothing (3-tap)
    for (let i = 1; i < raw.length - 1; i++) {
      raw[i].x = (raw[i - 1].x + raw[i].x * 1.5 + raw[i + 1].x) / 3.5;
      raw[i].corridorWidth = (raw[i - 1].corridorWidth + raw[i].corridorWidth + raw[i + 1].corridorWidth) / 3;
    }

    // Temporal smoothing (blend with previous frame)
    const prev = prevPathRef.current;
    if (prev.length === raw.length) {
      for (let i = 0; i < raw.length; i++) {
        raw[i].x = prev[i].x * 0.35 + raw[i].x * 0.65;
        raw[i].corridorWidth = prev[i].corridorWidth * 0.35 + raw[i].corridorWidth * 0.65;
      }
    }
    prevPathRef.current = raw;
    return raw;
  };

  /** Raw mask + dimensions for the 2D canvas to draw obstacle regions. */
  const getRawMaskData = (): MaskData => ({
    mask: lastSegMask.current,
    vw: videoRef.current?.videoWidth ?? 0,
    vh: videoRef.current?.videoHeight ?? 0,
  });

  return { ready, getObstacles, checkScanTarget, getWalkablePath, getRawMaskData };
};
