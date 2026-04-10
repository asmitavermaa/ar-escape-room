import React, { useEffect, useState } from 'react';
import { PUZZLES } from '../hooks/EscapeLogic';

interface VictoryScreenProps {
  scores: number[];
  totalHints: number;
  onRestart: () => void;
}

const PUZZLE_ICONS: Record<string, string> = {
  dark: '🌑',
  bright: '💡',
  seated: '🪑',
  nature: '🌿',
  self: '🪞',
};

const MAX_SCORE = PUZZLES.length * 5; // 25

const VictoryScreen: React.FC<VictoryScreenProps> = ({ scores, totalHints, onRestart }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if ('vibrate' in navigator) navigator.vibrate([100, 50, 100, 50, 300]);
    const t = setTimeout(() => setShow(true), 200);
    return () => clearTimeout(t);
  }, []);

  const rawTotal = scores.reduce((s, p) => s + p, 0);
  const finalScore = Math.max(0, rawTotal - totalHints);

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: 'linear-gradient(160deg, #000a0a 0%, #001a10 60%, #000a00 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
      padding: '36px 22px 32px', fontFamily: 'monospace', boxSizing: 'border-box',
      overflowY: 'auto', gap: 20,
      opacity: show ? 1 : 0, transition: 'opacity 0.8s ease',
    }}>

      {/* Trophy + title */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem', filter: 'drop-shadow(0 0 20px rgba(0,255,136,0.6))', marginBottom: 10 }}>🏆</div>
        <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#00ff88',
          textShadow: '0 0 30px rgba(0,255,136,0.7)', letterSpacing: '0.08em', marginBottom: 6 }}>
          ESCAPE COMPLETE
        </div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', letterSpacing: '0.12em' }}>
          ALL 5 FRAGMENTS SECURED
        </div>
      </div>

      {/* Score breakdown */}
      <div style={{
        background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.2)',
        borderRadius: 16, padding: '18px 18px', width: '100%', maxWidth: 380,
      }}>
        <div style={{ color: 'rgba(0,255,136,0.6)', fontSize: '0.62rem', fontWeight: 700,
          letterSpacing: '0.2em', marginBottom: 14 }}>
          FRAGMENT SCORES
        </div>

        {PUZZLES.map((p, i) => {
          const pts = scores[i] ?? 0;
          return (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '7px 0',
              borderBottom: i < PUZZLES.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}>
              <span style={{ fontSize: '1.1rem', width: 24 }}>{PUZZLE_ICONS[p.scanType]}</span>
              <span style={{ flex: 1, color: 'rgba(255,255,255,0.75)', fontSize: '0.78rem', letterSpacing: '0.02em' }}>
                {p.name}
              </span>
              <span style={{
                color: pts > 0 ? '#00ff88' : 'rgba(255,255,255,0.3)',
                fontWeight: 700, fontSize: '0.9rem', minWidth: 36, textAlign: 'right',
              }}>
                {pts > 0 ? `+${pts}` : '—'}
              </span>
            </div>
          );
        })}

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(0,255,136,0.25)', margin: '12px 0 10px' }} />

        {/* Hints penalty */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ color: 'rgba(255,215,0,0.75)', fontSize: '0.78rem' }}>
            Hints used ({totalHints})
          </span>
          <span style={{ color: totalHints > 0 ? '#ffcc00' : 'rgba(255,255,255,0.3)', fontWeight: 700, fontSize: '0.9rem' }}>
            {totalHints > 0 ? `−${totalHints}` : '—'}
          </span>
        </div>

        {/* Final score */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(0,255,136,0.08)', borderRadius: 10, padding: '10px 14px',
        }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.08em' }}>
            FINAL SCORE
          </span>
          <span style={{ color: '#00ff88', fontWeight: 900, fontSize: '1.3rem',
            textShadow: '0 0 12px rgba(0,255,136,0.6)' }}>
            {finalScore} <span style={{ fontSize: '0.75rem', color: 'rgba(0,255,136,0.5)' }}>/ {MAX_SCORE}</span>
          </span>
        </div>
      </div>

      {/* Rating */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>
          {finalScore >= 20 ? '⭐⭐⭐' : finalScore >= 12 ? '⭐⭐' : '⭐'}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem' }}>
          {finalScore >= 20 ? 'Master Escape Artist' : finalScore >= 12 ? 'Skilled Investigator' : 'Fragment Collector'}
        </div>
      </div>

      {/* Pulse icons */}
      <div style={{ display: 'flex', gap: 14 }}>
        {Object.values(PUZZLE_ICONS).map((icon, i) => (
          <div key={i} style={{ fontSize: '1.5rem', filter: 'drop-shadow(0 0 8px rgba(0,255,136,0.5))',
            animation: `pulse 2s ease ${i * 0.2}s infinite` }}>
            {icon}
          </div>
        ))}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.55;transform:scale(0.9)} }`}</style>

      {/* Play again */}
      <button onClick={onRestart} style={{
        padding: '15px 40px', background: 'rgba(0,255,136,0.1)',
        border: '2px solid #00ff88', borderRadius: 14, color: '#00ff88',
        fontWeight: 800, fontSize: '1rem', fontFamily: 'monospace',
        letterSpacing: '0.12em', cursor: 'pointer',
        boxShadow: '0 0 20px rgba(0,255,136,0.2)',
      }}>
        PLAY AGAIN
      </button>
    </div>
  );
};

export default VictoryScreen;
