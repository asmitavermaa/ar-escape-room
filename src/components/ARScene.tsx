import { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useVision, PathSample, MaskData } from '../hooks/useVision';
import { initAudio } from '../hooks/SpatialAudio';
import { PUZZLES, ScanType } from '../hooks/EscapeLogic';
import { PuzzleUI } from './PuzzleUI';

// ── Obstacle marker (atmospheric 3D ring, not accuracy-critical) ──────────────
const DangerZone = ({ x, z }: { x: number; z: number }) => {
  const groupRef = useRef<THREE.Group>(null!);
  useFrame((state) => {
    groupRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 4) * 0.12);
  });
  return (
    <group ref={groupRef} position={[x, 0, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.8, 32]} />
        <meshBasicMaterial color="#ff2200" transparent opacity={0.22} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1.08, 32]} />
        <meshBasicMaterial color="#ff5500" transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
};

// ── Three.js scene: gyroscope camera + atmospheric obstacle rings ─────────────
interface SceneProps {
  getObstacles: () => { x: number; z: number; label: number }[];
  checkScanTarget: (type: ScanType) => boolean;
  scanType: ScanType;
  riddleOpen: boolean;
  ready: boolean;
  scanProgressRef: React.MutableRefObject<number>;
  onFound: () => void;
}

const Scene = ({ getObstacles, checkScanTarget, scanType, riddleOpen, ready, scanProgressRef, onFound }: SceneProps) => {
  const { camera, gl } = useThree();
  const deviceRot = useRef(new THREE.Euler());
  const [obstacles, setObstacles] = useState<{ x: number; z: number }[]>([]);
  const lastObstacleScan = useRef(0);
  const lastScanCheck = useRef(0);
  const foundRef = useRef(false);

  useEffect(() => {
    foundRef.current = false;
    scanProgressRef.current = 0;
  }, [scanType, scanProgressRef]);

  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null && e.beta !== null && e.gamma !== null) {
        deviceRot.current.set(
          THREE.MathUtils.degToRad(e.beta),
          THREE.MathUtils.degToRad(e.alpha),
          -THREE.MathUtils.degToRad(e.gamma),
          'YXZ'
        );
      }
    };
    window.addEventListener('deviceorientation', handleOrientation);
    gl.setClearColor(0x000000, 0);
    window.addEventListener('click', initAudio, { once: true });
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [gl]);

  useFrame(() => {
    camera.quaternion.setFromEuler(deviceRot.current);
    camera.position.set(0, 1.6, 0);
    const now = performance.now();

    if (now - lastObstacleScan.current > 1500) {
      lastObstacleScan.current = now;
      setObstacles(getObstacles().map(o => ({ x: o.x, z: o.z })));
    }

    if (!riddleOpen && !foundRef.current && ready && now - lastScanCheck.current > 500) {
      lastScanCheck.current = now;
      if (checkScanTarget(scanType)) {
        scanProgressRef.current = Math.min(1, scanProgressRef.current + 0.38);
      } else {
        scanProgressRef.current = Math.max(0, scanProgressRef.current - 0.22);
      }
      if (scanProgressRef.current >= 1) {
        foundRef.current = true;
        onFound();
      }
    }
  });

  return (
    <>
      <ambientLight intensity={1.5} />
      {obstacles.map((o, i) => <DangerZone key={i} x={o.x} z={o.z} />)}
    </>
  );
};

// ── 2D path canvas — draws directly in image space, no 3D projection ─────────

function drawPath(ctx: CanvasRenderingContext2D, pts: PathSample[], cw: number, ch: number, t: number) {
  if (pts.length < 3) return;

  // Convert normalised coords to canvas pixels
  const CP = pts.map(p => ({
    cx: p.x * cw,
    cy: p.y * ch,
    hw: Math.max(18, Math.min(p.corridorWidth * cw * 0.44, 90)),
  }));

  const pulse = 0.8 + 0.2 * Math.sin(t * 2.2);

  // Filled corridor
  ctx.save();
  ctx.beginPath();
  CP.forEach((p, i) => (i === 0 ? ctx.moveTo(p.cx - p.hw, p.cy) : ctx.lineTo(p.cx - p.hw, p.cy)));
  [...CP].reverse().forEach(p => ctx.lineTo(p.cx + p.hw, p.cy));
  ctx.closePath();
  const fillGrad = ctx.createLinearGradient(0, ch, 0, ch * 0.38);
  fillGrad.addColorStop(0, `rgba(0,255,255,${0.18 * pulse})`);
  fillGrad.addColorStop(0.6, `rgba(0,200,255,${0.09 * pulse})`);
  fillGrad.addColorStop(1, 'rgba(0,150,255,0.02)');
  ctx.fillStyle = fillGrad;
  ctx.fill();
  ctx.restore();

  // Animated dashed edge lines
  const dashOffset = -(t * 35 % 18);
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.setLineDash([10, 7]);
    ctx.lineDashOffset = dashOffset;
    ctx.strokeStyle = `rgba(0,230,255,${0.65 * pulse})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    CP.forEach((p, i) => (i === 0 ? ctx.moveTo(p.cx + side * p.hw, p.cy) : ctx.lineTo(p.cx + side * p.hw, p.cy)));
    ctx.stroke();
    ctx.restore();
  }

  // Centre line
  ctx.save();
  ctx.strokeStyle = `rgba(0,255,255,${0.45 * pulse})`;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 16;
  ctx.beginPath();
  CP.forEach((p, i) => (i === 0 ? ctx.moveTo(p.cx, p.cy) : ctx.lineTo(p.cx, p.cy)));
  ctx.stroke();
  ctx.restore();

  // Animated directional chevrons (flow near→far = bottom→top)
  for (let k = 0; k < 5; k++) {
    const t2 = ((t * 0.45 + k / 5) % 1);
    const idx = t2 * (CP.length - 2);
    const i = Math.floor(idx);
    if (i >= CP.length - 1) continue;
    const frac = idx - i;
    const p1 = CP[i], p2 = CP[i + 1];
    const cx = p1.cx + (p2.cx - p1.cx) * frac;
    const cy = p1.cy + (p2.cy - p1.cy) * frac;
    const nearness = 1 - t2;
    const size = 6 + nearness * 12;
    const angle = Math.atan2(p2.cy - p1.cy, p2.cx - p1.cx);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 14;
    ctx.fillStyle = `rgba(0,255,255,${(0.35 + nearness * 0.5) * pulse})`;
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.6, -size * 0.5);
    ctx.lineTo(-size * 0.2, 0);
    ctx.lineTo(-size * 0.6, size * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawObstacleHighlights(ctx: CanvasRenderingContext2D, data: MaskData, cw: number, ch: number, t: number) {
  const { mask, vw, vh } = data;
  if (!mask || vw === 0 || vh === 0) return;
  const scaleX = cw / vw, scaleY = ch / vh;
  const horizonY = Math.floor(vh * 0.38);
  const pulse = 0.5 + 0.5 * Math.abs(Math.sin(t * 3.5));
  const STEP = 15;

  ctx.save();
  ctx.shadowColor = '#ff5500';
  ctx.shadowBlur = 10;
  for (let y = horizonY; y < vh; y += STEP) {
    const nearness = (y - horizonY) / (vh - horizonY);
    for (let x = Math.floor(vw * 0.03); x < vw * 0.97; x += STEP) {
      if (mask[y * vw + x] === 0) continue;
      ctx.fillStyle = `rgba(255,80,0,${(0.35 + nearness * 0.35) * pulse})`;
      ctx.beginPath();
      ctx.arc(x * scaleX, y * scaleY, 2 + nearness * 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

const PathCanvas = ({
  getWalkablePath,
  getRawMaskData,
}: {
  getWalkablePath: () => PathSample[];
  getRawMaskData: () => MaskData;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Use refs so the rAF loop always calls the latest version without re-creating the loop
  const fnRef = useRef({ getWalkablePath, getRawMaskData });
  fnRef.current = { getWalkablePath, getRawMaskData };

  const pathRef = useRef<PathSample[]>([]);
  const maskRef = useRef<MaskData>({ mask: null, vw: 0, vh: 0 });
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let animId: number;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const draw = (ts: number) => {
      animId = requestAnimationFrame(draw);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (ts - lastUpdateRef.current > 250) {
        lastUpdateRef.current = ts;
        const pts = fnRef.current.getWalkablePath();
        if (pts.length >= 3) pathRef.current = pts;
        maskRef.current = fnRef.current.getRawMaskData();
      }

      const t = ts / 1000;
      drawObstacleHighlights(ctx, maskRef.current, canvas.width, canvas.height, t);
      drawPath(ctx, pathRef.current, canvas.width, canvas.height, t);
    };

    animId = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 50 }}
    />
  );
};

// ── SVG scan reticle ──────────────────────────────────────────────────────────
const ScanReticle = ({ progress }: { progress: number }) => {
  const radius = 46, circ = 2 * Math.PI * radius;
  const color = progress > 0.7 ? '#00ff88' : progress > 0.05 ? '#00e5ff' : 'rgba(255,255,255,0.55)';
  return (
    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 500 }}>
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={radius} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
        <circle cx="65" cy="65" r={radius} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)} strokeLinecap="round"
          transform="rotate(-90 65 65)" style={{ transition: 'stroke-dashoffset 0.12s linear, stroke 0.3s' }} />
        <line x1="60" y1="65" x2="70" y2="65" stroke={color} strokeWidth="2" />
        <line x1="65" y1="60" x2="65" y2="70" stroke={color} strokeWidth="2" />
        <path d="M 14 30 L 14 14 L 30 14" fill="none" stroke={color} strokeWidth="2.5" opacity="0.75" />
        <path d="M 116 30 L 116 14 L 100 14" fill="none" stroke={color} strokeWidth="2.5" opacity="0.75" />
        <path d="M 14 100 L 14 116 L 30 116" fill="none" stroke={color} strokeWidth="2.5" opacity="0.75" />
        <path d="M 116 100 L 116 116 L 100 116" fill="none" stroke={color} strokeWidth="2.5" opacity="0.75" />
      </svg>
    </div>
  );
};

const FoundFlash = () => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 1000, background: 'rgba(0,255,136,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#00ff88',
      textShadow: '0 0 30px #00ff88, 0 0 60px #00ff88', letterSpacing: '0.15em', fontFamily: 'monospace' }}>
      TARGET ACQUIRED
    </div>
    <div style={{ fontSize: '0.85rem', color: 'rgba(0,255,136,0.7)', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
      UNLOCKING CIPHER...
    </div>
  </div>
);

// ── Main exported component ───────────────────────────────────────────────────
interface ARSceneProps {
  puzzleIdx: number;
  onPuzzleSolved: (points: number, hintsUsed: number) => void;
  setStatus: (s: 'scanning' | 'active' | 'warning') => void;
  accessMode: boolean;
}

export default function ARScene({ puzzleIdx, onPuzzleSolved, setStatus, accessMode }: ARSceneProps) {
  const { ready, getObstacles, checkScanTarget, getWalkablePath, getRawMaskData } = useVision();
  const [displayProgress, setDisplayProgress] = useState(0);
  const [riddleOpen, setRiddleOpen] = useState(false);
  const [foundFlash, setFoundFlash] = useState(false);
  const scanProgressRef = useRef(0);
  const prevDisplayRef = useRef(0);
  const puzzle = PUZZLES[puzzleIdx];

  // Sync progress ref → React state, skipping no-op updates to avoid extra renders
  useEffect(() => {
    const id = setInterval(() => {
      const v = scanProgressRef.current;
      if (Math.abs(v - prevDisplayRef.current) > 0.01) {
        prevDisplayRef.current = v;
        setDisplayProgress(v);
      }
    }, 100);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setRiddleOpen(false);
    setFoundFlash(false);
    setDisplayProgress(0);
    scanProgressRef.current = 0;
    prevDisplayRef.current = 0;
  }, [puzzleIdx]);

  useEffect(() => {
    setStatus(!ready ? 'scanning' : displayProgress > 0.15 ? 'warning' : 'active');
  }, [ready, displayProgress, setStatus]);

  const handleFound = useCallback(() => {
    setFoundFlash(true);
    if ('vibrate' in navigator) navigator.vibrate([80, 40, 180, 40, 80]);
    setTimeout(() => { setFoundFlash(false); setRiddleOpen(true); }, 900);
  }, []);

  const handleSolve = useCallback((points: number, hintsUsed: number) => {
    setRiddleOpen(false);
    onPuzzleSolved(points, hintsUsed);
  }, [onPuzzleSolved]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {foundFlash && <FoundFlash />}

      {/* Accurate 2D path + obstacle highlights drawn directly over camera feed */}
      {accessMode && !riddleOpen && !foundFlash && (
        <PathCanvas getWalkablePath={getWalkablePath} getRawMaskData={getRawMaskData} />
      )}

      {/* Three.js canvas: atmospheric danger rings + scan logic */}
      <Canvas camera={{ fov: 75, position: [0, 1.6, 0] }} gl={{ alpha: true }}
        style={{ position: 'absolute', inset: 0 }}>
        <Scene
          getObstacles={getObstacles}
          checkScanTarget={checkScanTarget}
          scanType={puzzle.scanType}
          riddleOpen={riddleOpen}
          ready={ready}
          scanProgressRef={scanProgressRef}
          onFound={handleFound}
        />
      </Canvas>

      {!riddleOpen && !foundFlash && <ScanReticle progress={displayProgress} />}
      {riddleOpen && <PuzzleUI puzzle={puzzle} onSolve={handleSolve} />}
    </div>
  );
}
