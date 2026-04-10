import React, { useState, useRef } from 'react';
import { Puzzle } from '../hooks/EscapeLogic';

interface PuzzleUIProps {
  puzzle: Puzzle;
  onSolve: () => void;
}

export const PuzzleUI: React.FC<PuzzleUIProps> = ({ puzzle, onSolve }) => {
  const [input, setInput] = useState('');
  const [wrongCount, setWrongCount] = useState(0);
  const [shake, setShake] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [solved, setSolved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const revealedAnswer = puzzle.answer.slice(0, hintsRevealed);
  const hintDisplay = revealedAnswer + '_'.repeat(Math.max(0, puzzle.answer.length - hintsRevealed));

  const handleSubmit = () => {
    const guess = input.toLowerCase().trim();
    const correct = puzzle.answer.toLowerCase().trim();
    if (guess === correct) {
      setSolved(true);
      if ('vibrate' in navigator) navigator.vibrate([50, 30, 100]);
      setTimeout(() => onSolve(), 1800);
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
    }
  };

  const canHint = wrongCount >= 2 && hintsRevealed < puzzle.answer.length;

  if (solved) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5000,
          background: 'rgba(0,0,0,0.6)',
          fontFamily: 'monospace',
        }}
      >
        <div
          style={{
            background: 'rgba(0,15,10,0.97)',
            border: '2px solid #00ff88',
            borderRadius: '20px',
            padding: '36px 28px',
            width: '85%',
            maxWidth: 380,
            textAlign: 'center',
            boxShadow: '0 0 40px rgba(0,255,136,0.3)',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✅</div>
          <div style={{ color: '#00ff88', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '0.1em', marginBottom: 14 }}>
            FRAGMENT SECURED
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', lineHeight: 1.5 }}>
            {puzzle.solvedMessage}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5000,
        background: 'rgba(0,0,0,0.65)',
        fontFamily: 'monospace',
      }}
    >
      <div
        style={{
          background: 'rgba(0,5,15,0.97)',
          border: '2px solid #00e5ff',
          borderRadius: '20px',
          padding: '28px 22px',
          width: '88%',
          maxWidth: 400,
          boxShadow: '0 0 40px rgba(0,229,255,0.2)',
          animation: shake ? 'shake 0.4s ease' : 'none',
        }}
      >
        {/* Shake keyframes injected inline */}
        <style>{`
          @keyframes shake {
            0%,100% { transform: translateX(0); }
            20% { transform: translateX(-8px); }
            40% { transform: translateX(8px); }
            60% { transform: translateX(-6px); }
            80% { transform: translateX(6px); }
          }
        `}</style>

        {/* Header */}
        <div style={{ color: 'rgba(0,229,255,0.55)', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.2em', marginBottom: 6 }}>
          CIPHER UNLOCKED — {puzzle.chapter.toUpperCase()}
        </div>
        <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', marginBottom: 18, letterSpacing: '0.04em' }}>
          {puzzle.name}
        </div>

        {/* Riddle */}
        <div
          style={{
            background: 'rgba(0,229,255,0.06)',
            border: '1px solid rgba(0,229,255,0.2)',
            borderRadius: '10px',
            padding: '14px',
            color: 'rgba(255,255,255,0.85)',
            fontSize: '0.9rem',
            lineHeight: 1.6,
            marginBottom: 20,
            fontStyle: 'italic',
          }}
        >
          "{puzzle.riddle}"
        </div>

        {/* Hint display (shows after 2 wrong answers) */}
        {hintsRevealed > 0 && (
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <span style={{ color: 'rgba(255,220,0,0.8)', fontSize: '0.75rem', letterSpacing: '0.12em' }}>
              HINT: {' '}
            </span>
            <span
              style={{
                color: '#ffd700',
                fontSize: '1.1rem',
                letterSpacing: '0.25em',
                fontWeight: 700,
              }}
            >
              {hintDisplay.toUpperCase()}
            </span>
          </div>
        )}

        {/* Wrong answer counter */}
        {wrongCount > 0 && (
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <span style={{ color: '#ff6666', fontSize: '0.7rem', letterSpacing: '0.1em' }}>
              ✗ {wrongCount} incorrect attempt{wrongCount > 1 ? 's' : ''}
              {canHint ? ' — hint available below' : wrongCount < 2 ? ` — hint after ${2 - wrongCount} more` : ''}
            </span>
          </div>
        )}

        {/* Input */}
        <input
          ref={inputRef}
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
            width: '100%',
            padding: '12px 14px',
            background: 'rgba(255,255,255,0.07)',
            border: '1.5px solid rgba(0,229,255,0.4)',
            borderRadius: '10px',
            color: '#fff',
            fontSize: '1rem',
            fontFamily: 'monospace',
            letterSpacing: '0.08em',
            outline: 'none',
            boxSizing: 'border-box',
            marginBottom: 12,
          }}
        />

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          {canHint && (
            <button
              onClick={handleHint}
              style={{
                flex: 1,
                padding: '12px',
                background: 'rgba(255,215,0,0.12)',
                border: '1.5px solid rgba(255,215,0,0.5)',
                borderRadius: '10px',
                color: '#ffd700',
                fontWeight: 700,
                fontSize: '0.85rem',
                fontFamily: 'monospace',
                cursor: 'pointer',
                letterSpacing: '0.08em',
              }}
            >
              HINT
            </button>
          )}
          <button
            onClick={handleSubmit}
            style={{
              flex: 3,
              padding: '14px',
              background: 'rgba(0,229,255,0.15)',
              border: '2px solid #00e5ff',
              borderRadius: '10px',
              color: '#00e5ff',
              fontWeight: 800,
              fontSize: '1rem',
              fontFamily: 'monospace',
              cursor: 'pointer',
              letterSpacing: '0.1em',
            }}
          >
            TRANSMIT CODE
          </button>
        </div>
      </div>
    </div>
  );
};
