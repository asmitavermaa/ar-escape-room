import { useState, useCallback } from 'react';
import ARScene from './components/ARScene';
import Overlay from './components/Overlay';
import IntroScreen from './components/IntroScreen';
import VictoryScreen from './components/VictoryScreen';
import { PUZZLES } from './hooks/EscapeLogic';

type GameState = 'intro' | 'playing' | 'victory';

function App() {
  const [gameState, setGameState] = useState<GameState>('intro');
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [status, setStatus] = useState<'scanning' | 'active' | 'warning'>('scanning');

  const handleStart = useCallback(() => {
    setPuzzleIdx(0);
    setGameState('playing');
  }, []);

  const handlePuzzleSolved = useCallback(() => {
    if (puzzleIdx >= PUZZLES.length - 1) {
      setGameState('victory');
    } else {
      setPuzzleIdx(p => p + 1);
    }
  }, [puzzleIdx]);

  const handleRestart = useCallback(() => {
    setPuzzleIdx(0);
    setGameState('intro');
  }, []);

  if (gameState === 'intro') {
    return <IntroScreen onStart={handleStart} />;
  }

  if (gameState === 'victory') {
    return <VictoryScreen onRestart={handleRestart} />;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: 'transparent' }}>
      <Overlay
        status={status}
        puzzle={PUZZLES[puzzleIdx]}
        totalPuzzles={PUZZLES.length}
      />
      <ARScene
        puzzleIdx={puzzleIdx}
        onPuzzleSolved={handlePuzzleSolved}
        setStatus={setStatus}
      />
    </div>
  );
}

export default App;
