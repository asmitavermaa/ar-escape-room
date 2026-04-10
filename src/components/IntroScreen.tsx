import React from 'react';
import { PUZZLES } from '../hooks/EscapeLogic';

interface IntroScreenProps {
  onStart: () => void;
}

const scanIcons: Record<string, string> = {
  dark: '🌑',
  bright: '💡',
  seated: '🪑',
  nature: '🌿',
  self: '🪞',
};

const IntroScreen: React.FC<IntroScreenProps> = ({ onStart }) => {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(160deg, #000a12 0%, #001a2e 60%, #000510 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '40px 24px 36px',
        fontFamily: 'monospace',
        overflowY: 'auto',
        boxSizing: 'border-box',
      }}
    >
      {/* Title block */}
      <div style={{ textAlign: 'center', paddingTop: 8 }}>
        <div style={{ color: 'rgba(0,229,255,0.4)', fontSize: '0.65rem', letterSpacing: '0.35em', marginBottom: 10 }}>
          ◈ INITIALIZING SYSTEM ◈
        </div>
        <div style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: '0.06em', lineHeight: 1.1, color: '#fff' }}>
          SPATIAL
        </div>
        <div
          style={{
            fontSize: '2.4rem',
            fontWeight: 900,
            letterSpacing: '0.06em',
            lineHeight: 1.1,
            color: '#00e5ff',
            textShadow: '0 0 30px rgba(0,229,255,0.6)',
            marginBottom: 8,
          }}
        >
          ESCAPE
        </div>
        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem', letterSpacing: '0.1em' }}>
          5 FRAGMENTS · AR PUZZLE HUNT
        </div>
      </div>

      {/* How to play */}
      <div
        style={{
          background: 'rgba(0,229,255,0.05)',
          border: '1px solid rgba(0,229,255,0.2)',
          borderRadius: '16px',
          padding: '20px 18px',
          width: '100%',
          maxWidth: 380,
        }}
      >
        <div style={{ color: 'rgba(0,229,255,0.7)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', marginBottom: 14 }}>
          HOW TO PLAY
        </div>
        {[
          { icon: '📷', text: 'Grant camera access when prompted' },
          { icon: '🔍', text: 'Point your camera at the target described at the bottom of the screen' },
          { icon: '⏳', text: 'Hold steady — the ring fills as it detects the target' },
          { icon: '🧩', text: 'Solve the riddle that appears to unlock each fragment' },
          { icon: '🏆', text: 'Collect all 5 fragments to escape' },
        ].map(({ icon, text }, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
            <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{icon}</span>
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.82rem', lineHeight: 1.5 }}>{text}</span>
          </div>
        ))}
      </div>

      {/* Fragment preview */}
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.62rem', letterSpacing: '0.18em', textAlign: 'center', marginBottom: 10 }}>
          FRAGMENTS TO FIND
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          {PUZZLES.map((p) => (
            <div
              key={p.id}
              style={{
                background: 'rgba(0,229,255,0.06)',
                border: '1px solid rgba(0,229,255,0.2)',
                borderRadius: '10px',
                padding: '10px 8px',
                flex: 1,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.3rem', marginBottom: 4 }}>{scanIcons[p.scanType]}</div>
              <div style={{ color: 'rgba(0,229,255,0.6)', fontSize: '0.55rem', letterSpacing: '0.1em' }}>
                {p.id}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Start button */}
      <button
        onClick={onStart}
        style={{
          width: '100%',
          maxWidth: 380,
          padding: '18px',
          background: 'rgba(0,229,255,0.12)',
          border: '2px solid #00e5ff',
          borderRadius: '14px',
          color: '#00e5ff',
          fontWeight: 900,
          fontSize: '1.1rem',
          fontFamily: 'monospace',
          letterSpacing: '0.15em',
          cursor: 'pointer',
          boxShadow: '0 0 20px rgba(0,229,255,0.2)',
        }}
      >
        BEGIN TRANSMISSION
      </button>
    </div>
  );
};

export default IntroScreen;
