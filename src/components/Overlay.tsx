import React from 'react';
import { Puzzle } from '../hooks/EscapeLogic';

interface OverlayProps {
  status: 'scanning' | 'active' | 'warning';
  puzzle: Puzzle;
  totalPuzzles: number;
  accessMode: boolean;
  onToggleAccess: () => void;
}

const Overlay: React.FC<OverlayProps> = ({ status, puzzle, totalPuzzles, accessMode, onToggleAccess }) => {
  const puzzleNum = puzzle.id;

  const statusColor =
    status === 'warning' ? '#ff4444' : status === 'active' ? '#00e5ff' : '#888';
  const statusLabel =
    status === 'warning' ? 'DETECTING' : status === 'active' ? 'SCANNING' : 'CALIBRATING';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '16px',
        fontFamily: 'monospace',
      }}
    >
      {/* ── Top bar ───────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Title */}
        <div
          style={{
            background: 'rgba(0,0,0,0.75)',
            border: `1.5px solid ${statusColor}`,
            borderRadius: '10px',
            padding: '8px 14px',
            backdropFilter: 'blur(8px)',
          }}
        >
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.08em' }}>
            SPATIAL{' '}
          </span>
          <span style={{ color: '#00e5ff', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.08em' }}>
            ESCAPE
          </span>
        </div>

        {/* Right side: access toggle + status */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, pointerEvents: 'auto' }}>
          {/* Accessibility guide toggle */}
          <button
            onClick={onToggleAccess}
            style={{
              background: accessMode ? 'rgba(0,229,255,0.18)' : 'rgba(0,0,0,0.6)',
              border: `1.5px solid ${accessMode ? '#00e5ff' : 'rgba(255,255,255,0.25)'}`,
              borderRadius: '20px', padding: '5px 11px',
              backdropFilter: 'blur(8px)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <span style={{ fontSize: '0.85rem' }}>👁</span>
            <span style={{
              color: accessMode ? '#00e5ff' : 'rgba(255,255,255,0.4)',
              fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em',
            }}>
              GUIDE {accessMode ? 'ON' : 'OFF'}
            </span>
          </button>
          {/* Status pill */}
          <div style={{
            background: 'rgba(0,0,0,0.75)', border: `1.5px solid ${statusColor}`,
            borderRadius: '20px', padding: '5px 11px', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
            <span style={{ color: statusColor, fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em' }}>
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      {/* ── Progress dots ──────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
        {Array.from({ length: totalPuzzles }).map((_, i) => (
          <div
            key={i}
            style={{
              width: i < puzzleNum - 1 ? 12 : 10,
              height: i < puzzleNum - 1 ? 12 : 10,
              borderRadius: '50%',
              background:
                i < puzzleNum - 1
                  ? '#00ff88'
                  : i === puzzleNum - 1
                  ? '#00e5ff'
                  : 'rgba(255,255,255,0.2)',
              border:
                i === puzzleNum - 1 ? '2px solid #00e5ff' : '2px solid transparent',
              boxShadow:
                i < puzzleNum - 1
                  ? '0 0 6px #00ff88'
                  : i === puzzleNum - 1
                  ? '0 0 10px #00e5ff'
                  : 'none',
              transition: 'all 0.4s',
            }}
          />
        ))}
      </div>

      {/* ── Bottom info card ────────────────────────── */}
      <div
        style={{
          background: 'rgba(0,0,0,0.85)',
          border: '1.5px solid rgba(0,229,255,0.35)',
          borderRadius: '16px',
          padding: '16px 18px',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Chapter label */}
        <div style={{ color: 'rgba(0,229,255,0.6)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em', marginBottom: 6 }}>
          {puzzle.chapter.toUpperCase()}
        </div>

        {/* Puzzle name */}
        <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem', marginBottom: 6, letterSpacing: '0.04em' }}>
          {puzzle.name}
        </div>

        {/* Hint */}
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', marginBottom: 10, fontStyle: 'italic' }}>
          "{puzzle.hint}"
        </div>

        {/* Scan instruction box */}
        <div
          style={{
            background: 'rgba(0,229,255,0.08)',
            border: '1px solid rgba(0,229,255,0.25)',
            borderRadius: '8px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '1rem' }}>📷</span>
          <span style={{ color: '#00e5ff', fontSize: '0.78rem', fontWeight: 600 }}>
            {puzzle.scanInstruction}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Overlay;
