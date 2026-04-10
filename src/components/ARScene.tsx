import { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useVision } from '../hooks/useVision';
import { initAudio } from '../hooks/SpatialAudio';
import { PUZZLES, ScanType } from '../hooks/EscapeLogic';
import { PuzzleUI } from './PuzzleUI';

// ── Pulsing red circle for detected obstacles ─────────────────────────────────
const DangerZone = ({ position }: { position: THREE.Vector3 }) => {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.15;
    ref.current.scale.set(scale, scale, scale);
  });
  return (
    <mesh ref={ref} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.8, 32]} />
      <meshBasicMaterial color="red" transparent opacity={0.3} />
    </mesh>
  );
};

// ── Three.js inner scene: gyroscope camera + obstacle overlay ─────────────────
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
  const [obstacles, setObstacles] = useState<THREE.Vector3[]>([]);
  const lastObstacleScan = useRef(0);
  const lastScanCheck = useRef(0);
  const foundRef = useRef(false);

  // Reset when scan type changes (new puzzle)
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
    const unlock = () => initAudio();
    window.addEventListener('click', unlock, { once: true });
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [gl]);

  useFrame(() => {
    camera.quaternion.setFromEuler(deviceRot.current);
    camera.position.set(0, 1.6, 0);

    const now = performance.now();

    // Obstacle scan — throttled to every 1500ms (purely cosmetic)
    if (now - lastObstacleScan.current > 1500) {
      lastObstacleScan.current = now;
      const raw = getObstacles();
      setObstacles(raw.map(o => new THREE.Vector3(o.x, 0, o.z)));
    }

    // Scan target check — throttled to every 500ms
    if (!riddleOpen && !foundRef.current && ready && now - lastScanCheck.current > 500) {
      lastScanCheck.current = now;
      const detected = checkScanTarget(scanType);
      if (detected) {
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
      {obstacles.map((pos, i) => (
        <DangerZone key={i} position={pos} />
      ))}
    </>
  );
};

// ── SVG scan reticle (HTML overlay) ──────────────────────────────────────────
const ScanReticle = ({ progress }: { progress: number }) => {
  const radius = 46;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - progress);
  const color =
    progress > 0.7 ? '#00ff88' : progress > 0.05 ? '#00e5ff' : 'rgba(255,255,255,0.55)';

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 500,
      }}
    >
      <svg width="130" height="130" viewBox="0 0 130 130">
        {/* Guide ring */}
        <circle cx="65" cy="65" r={radius} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
        {/* Progress arc */}
        <circle
          cx="65" cy="65" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 65 65)"
          style={{ transition: 'stroke-dashoffset 0.12s linear, stroke 0.3s' }}
        />
        {/* Center crosshair */}
        <line x1="60" y1="65" x2="70" y2="65" stroke={color} strokeWidth="2" />
        <line x1="65" y1="60" x2="65" y2="70" stroke={color} strokeWidth="2" />
        {/* Corner brackets */}
        <path d="M 14 30 L 14 14 L 30 14" fill="none" stroke={color} strokeWidth="2.5" opacity="0.75" />
        <path d="M 116 30 L 116 14 L 100 14" fill="none" stroke={color} strokeWidth="2.5" opacity="0.75" />
        <path d="M 14 100 L 14 116 L 30 116" fill="none" stroke={color} strokeWidth="2.5" opacity="0.75" />
        <path d="M 116 100 L 116 116 L 100 116" fill="none" stroke={color} strokeWidth="2.5" opacity="0.75" />
      </svg>
    </div>
  );
};

// ── "TARGET ACQUIRED" flash ───────────────────────────────────────────────────
const FoundFlash = () => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(0, 255, 136, 0.25)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '12px',
    }}
  >
    <div
      style={{
        fontSize: '1.6rem',
        fontWeight: 900,
        color: '#00ff88',
        textShadow: '0 0 30px #00ff88, 0 0 60px #00ff88',
        letterSpacing: '0.15em',
        fontFamily: 'monospace',
      }}
    >
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
  onPuzzleSolved: () => void;
  setStatus: (s: 'scanning' | 'active' | 'warning') => void;
}

export default function ARScene({ puzzleIdx, onPuzzleSolved, setStatus }: ARSceneProps) {
  const { ready, getObstacles, checkScanTarget } = useVision();
  const [displayProgress, setDisplayProgress] = useState(0);
  const [riddleOpen, setRiddleOpen] = useState(false);
  const [foundFlash, setFoundFlash] = useState(false);
  const scanProgressRef = useRef(0);
  const puzzle = PUZZLES[puzzleIdx];

  // Sync scan progress ref → React state at 100ms for reticle display
  useEffect(() => {
    const id = setInterval(() => {
      setDisplayProgress(scanProgressRef.current);
    }, 100);
    return () => clearInterval(id);
  }, []);

  // Reset state when puzzle changes
  useEffect(() => {
    setRiddleOpen(false);
    setFoundFlash(false);
    setDisplayProgress(0);
    scanProgressRef.current = 0;
  }, [puzzleIdx]);

  // Update HUD status
  useEffect(() => {
    if (!ready) setStatus('scanning');
    else if (displayProgress > 0.15) setStatus('warning');
    else setStatus('active');
  }, [ready, displayProgress, setStatus]);

  const handleFound = useCallback(() => {
    setFoundFlash(true);
    if ('vibrate' in navigator) navigator.vibrate([80, 40, 180, 40, 80]);
    setTimeout(() => {
      setFoundFlash(false);
      setRiddleOpen(true);
    }, 900);
  }, []);

  const handleSolve = useCallback(() => {
    setRiddleOpen(false);
    onPuzzleSolved();
  }, [onPuzzleSolved]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {foundFlash && <FoundFlash />}

      {/* 3D obstacle layer (transparent canvas over camera feed) */}
      <Canvas
        camera={{ fov: 75, position: [0, 1.6, 0] }}
        gl={{ alpha: true }}
        style={{ position: 'absolute', inset: 0 }}
      >
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

      {/* Scan reticle (only while hunting) */}
      {!riddleOpen && !foundFlash && (
        <ScanReticle progress={displayProgress} />
      )}

      {/* Riddle panel */}
      {riddleOpen && <PuzzleUI puzzle={puzzle} onSolve={handleSolve} />}
    </div>
  );
}
