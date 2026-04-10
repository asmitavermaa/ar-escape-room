import React, { useEffect, useState } from 'react';

interface VictoryScreenProps {
  onRestart: () => void;
}

const VictoryScreen: React.FC<VictoryScreenProps> = ({ onRestart }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if ('vibrate' in navigator) navigator.vibrate([100, 50, 100, 50, 300]);
    const t = setTimeout(() => setShow(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(160deg, #000a0a 0%, #001a10 60%, #000a00 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        fontFamily: 'monospace',
        boxSizing: 'border-box',
        gap: '28px',
        opacity: show ? 1 : 0,
        transition: 'opacity 0.8s ease',
      }}
    >
      {/* Trophy */}
      <div style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 20px rgba(0,255,136,0.6))' }}>
        🏆
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: '1.8rem',
            fontWeight: 900,
            color: '#00ff88',
            textShadow: '0 0 30px rgba(0,255,136,0.7)',
            letterSpacing: '0.08em',
            marginBottom: 8,
          }}
        >
          ESCAPE COMPLETE
        </div>
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', letterSpacing: '0.1em' }}>
          ALL 5 FRAGMENTS SECURED
        </div>
      </div>

      {/* Message */}
      <div
        style={{
          background: 'rgba(0,255,136,0.05)',
          border: '1px solid rgba(0,255,136,0.25)',
          borderRadius: '16px',
          padding: '20px 22px',
          maxWidth: 360,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.88rem', lineHeight: 1.7 }}>
          You navigated the shadows, found the light, solved the riddles of the resting and the living — and faced yourself.
          <br /><br />
          <span style={{ color: '#00ff88', fontWeight: 700 }}>
            The loop is broken. You are free.
          </span>
        </div>
      </div>

      {/* Fragment icons */}
      <div style={{ display: 'flex', gap: 16 }}>
        {['🌑', '💡', '🪑', '🌿', '🪞'].map((icon, i) => (
          <div
            key={i}
            style={{
              fontSize: '1.6rem',
              filter: 'drop-shadow(0 0 8px rgba(0,255,136,0.5))',
              animation: `pulse 2s ease ${i * 0.2}s infinite`,
            }}
          >
            {icon}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.92); }
        }
      `}</style>

      {/* Play again */}
      <button
        onClick={onRestart}
        style={{
          padding: '16px 40px',
          background: 'rgba(0,255,136,0.1)',
          border: '2px solid #00ff88',
          borderRadius: '14px',
          color: '#00ff88',
          fontWeight: 800,
          fontSize: '1rem',
          fontFamily: 'monospace',
          letterSpacing: '0.12em',
          cursor: 'pointer',
          boxShadow: '0 0 20px rgba(0,255,136,0.2)',
        }}
      >
        PLAY AGAIN
      </button>
    </div>
  );
};

export default VictoryScreen;
