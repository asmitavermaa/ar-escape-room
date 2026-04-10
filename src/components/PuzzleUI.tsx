import React, { useState, useEffect, useRef } from 'react';
import { Puzzle } from '../hooks/EscapeLogic';

interface PuzzleUIProps {
  puzzle: Puzzle;
  onSolve: (points: number, hintsUsed: number) => void;
}

const TIMER_TOTAL = 30;

function getPoints(elapsed: number): number {
  if (elapsed < 5) return 5;
  if (elapsed < 10) return 4;
  if (elapsed < 15) return 3;
  if (elapsed < 20) return 2;
  if (elapsed < 25) return 1;
  return 0;
}

function timerColor(timeLeft: number): string {
  if (timeLeft > 15) return '#00ff88';
  if (timeLeft > 8) return '#ffcc00';
  return '#ff4444';
}

export const PuzzleUI: React.FC<PuzzleUIProps> = ({ puzzle, onSolve }) => {
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(TIMER_TOTAL);
  const [wrongCount, setWrongCount] = useState(0);
  const [shake, setShake] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [solved, setSolved] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const hintsUsedRef = useRef(0);

  // Countdown timer
  useEffect(() => {
    if (solved || timedOut) return;
    if (timeLeft <= 0) {
      setTimedOut(true);
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
      setTimeout(() => onSolve(0, hintsUsedRef.current), 2000);
      return;
    }
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, solved, timedOut, onSolve]);

  const elapsed = TIMER_TOTAL - timeLeft;
  const currentPoints = getPoints(elapsed);
  const progressFraction = timeLeft / TIMER_TOTAL;
  const color = timerColor(timeLeft);
  const canHint = wrongCount >= 2 && hintsRevealed < puzzle.answer.length;
  const hintDisplay = puzzle.answer.slice(0, hintsRevealed) + '_'.repeat(Math.max(0, puzzle.answer.length - hintsRevealed));

  const handleSubmit = () => {
    if (solved || timedOut) return;
    const guess = input.toLowerCase().trim();
    if (guess === puzzle.answer.toLowerCase().trim()) {
      setSolved(true);
      if ('vibrate' in navigator) navigator.vibrate([50, 30, 100]);
      setTimeout(() => onSolve(currentPoints, hintsUsedRef.current), 1800);
    } else {
      setWrongCount(c => c + 1);
      setShake(true);
      if ('vibrate' in navigator) navigator.vibrate(200);
      setTimeout(() => setShake(false), 500);
      setInput('');
    }
  };

  const handleHint = () => {
    if (hintsRevealed < puzzle.answer.length) {
      setHintsRevealed(h => h + 1);
      hintsUsedRef.current += 1;
    }
  };

  if (timedOut) {
    return (
      <PuzzlePanel borderColor="#ff4444" boxShadow="0 0 40px rgba(255,68,68,0.3)">
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏰</div>
        <div style={{ color: '#ff4444', fontWeight: 800, fontSize: '1.15rem', letterSpacing: '0.1em', marginBottom: 10 }}>
          TIME UP
        </div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', lineHeight: 1.5 }}>
          The answer was: <span style={{ color: '#fff', fontWeight: 700 }}>{puzzle.answer}</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', marginTop: 10 }}>
          Moving to next fragment...
        </div>
      </PuzzlePanel>
    );
  }

  if (solved) {
    return (
      <PuzzlePanel borderColor="#00ff88" boxShadow="0 0 40px rgba(0,255,136,0.3)">
        <div style={{ fontSize: '2rem', marginBottom: 10 }}>✅</div>
        <div style={{ color: '#00ff88', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.1em', marginBottom: 8 }}>
          FRAGMENT SECURED
        </div>
        <div style={{ color: '#ffd700', fontWeight: 700, fontSize: '1.3rem', marginBottom: 10 }}>
          +{currentPoints} pts
        </div>
        <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem', lineHeight: 1.5 }}>
          {puzzle.solvedMessage}
        </div>
      </PuzzlePanel>
    );
  }

  return (
    <PuzzlePanel shake={shake}>
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        @keyframes timerFlash {
          0%,100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Timer row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          {/* Countdown number */}
          <div style={{
            fontSize: '2rem', fontWeight: 900, color, minWidth: 48, textAlign: 'center',
            textShadow: `0 0 12px ${color}`,
            animation: timeLeft <= 5 ? 'timerFlash 0.6s ease infinite' : 'none',
          }}>
            {timeLeft}
          </div>
          {/* Progress bar */}
          <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 4,
              width: `${progressFraction * 100}%`,
              background: color,
              boxShadow: `0 0 6px ${color}`,
              transition: 'width 1s linear, background 0.5s',
            }} />
          </div>
          {/* Points preview */}
          <div style={{
            background: 'rgba(0,0,0,0.5)',
            border: `1px solid ${color}`,
            borderRadius: 6, padding: '3px 8px',
            color, fontSize: '0.8rem', fontWeight: 700, minWidth: 36, textAlign: 'center',
          }}>
            +{currentPoints}
          </div>
        </div>

        {/* Header */}
        <div style={{ color: 'rgba(0,229,255,0.5)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.2em', marginBottom: 4 }}>
          CIPHER UNLOCKED — {puzzle.chapter.toUpperCase()}
        </div>
        <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.05rem', marginBottom: 14, letterSpacing: '0.04em' }}>
          {puzzle.name}
        </div>

        {/* Riddle */}
        <div style={{
          background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.2)',
          borderRadius: 10, padding: '12px 14px',
          color: 'rgba(255,255,255,0.85)', fontSize: '0.88rem', lineHeight: 1.6,
          marginBottom: 14, fontStyle: 'italic',
        }}>
          "{puzzle.riddle}"
        </div>

        {/* Hint display */}
        {hintsRevealed > 0 && (
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <span style={{ color: 'rgba(255,215,0,0.75)', fontSize: '0.72rem', letterSpacing: '0.1em' }}>HINT: </span>
            <span style={{ color: '#ffd700', fontSize: '1.05rem', letterSpacing: '0.25em', fontWeight: 700 }}>
              {hintDisplay.toUpperCase()}
            </span>
          </div>
        )}

        {/* Wrong count */}
        {wrongCount > 0 && (
          <div style={{ textAlign: 'center', marginBottom: 8, color: '#ff6666', fontSize: '0.68rem', letterSpacing: '0.08em' }}>
            ✗ {wrongCount} wrong{wrongCount > 1 ? 's' : ''}
            {canHint ? ' — tap HINT below' : wrongCount < 2 ? ` — hint after ${2 - wrongCount} more` : ''}
          </div>
        )}

        {/* Input */}
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Enter answer..."
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          style={{
            width: '100%', padding: '12px 14px',
            background: 'rgba(255,255,255,0.07)',
            border: '1.5px solid rgba(0,229,255,0.4)',
            borderRadius: 10, color: '#fff',
            fontSize: '1rem', fontFamily: 'monospace',
            letterSpacing: '0.08em', outline: 'none',
            boxSizing: 'border-box', marginBottom: 10,
          }}
        />

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          {canHint && (
            <button onClick={handleHint} style={{
              flex: 1, padding: '11px',
              background: 'rgba(255,215,0,0.1)',
              border: '1.5px solid rgba(255,215,0,0.5)',
              borderRadius: 10, color: '#ffd700',
              fontWeight: 700, fontSize: '0.82rem',
              fontFamily: 'monospace', cursor: 'pointer',
              letterSpacing: '0.08em',
            }}>
              HINT (-1pt)
            </button>
          )}
          <button onClick={handleSubmit} style={{
            flex: 3, padding: '13px',
            background: 'rgba(0,229,255,0.12)',
            border: '2px solid #00e5ff',
            borderRadius: 10, color: '#00e5ff',
            fontWeight: 800, fontSize: '0.95rem',
            fontFamily: 'monospace', cursor: 'pointer',
            letterSpacing: '0.1em',
          }}>
            TRANSMIT CODE
          </button>
        </div>
    </PuzzlePanel>
  );
};

// ── Shared panel wrapper ──────────────────────────────────────────────────────
const PuzzlePanel = ({
  borderColor = '#00e5ff',
  boxShadow,
  shake,
  children,
}: {
  borderColor?: string;
  boxShadow?: string;
  shake?: boolean;
  children: React.ReactNode;
}) => (
  <div style={overlayStyle}>
    <div style={{
      ...panelStyle,
      borderColor,
      boxShadow: boxShadow ?? '0 0 40px rgba(0,229,255,0.2)',
      animation: shake ? 'shake 0.4s ease' : 'none',
    }}>
      {children}
    </div>
  </div>
);

// ── Shared styles ─────────────────────────────────────────────────────────────
const overlayStyle: React.CSSProperties = {
  position: 'absolute', inset: 0, zIndex: 5000,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(0,0,0,0.6)', fontFamily: 'monospace',
};

const panelStyle: React.CSSProperties = {
  background: 'rgba(0,5,15,0.97)',
  border: '2px solid #00e5ff',
  borderRadius: 20, padding: '22px 20px',
  width: '88%', maxWidth: 400,
  boxShadow: '0 0 40px rgba(0,229,255,0.2)',
  textAlign: 'center' as const,
};
