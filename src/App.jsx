import React, { useState } from 'react';
import MainMenu from './components/MainMenu';
import HUD from './components/HUD';
import GameCanvas from './components/GameCanvas';
import GameOver from './components/GameOver';
import Victory from './components/Victory';
import { playGameOverSound, playVictorySound } from './utils/audio';

function App() {
  const [gameState, setGameState] = useState('MENU');
  const [controls, setControls] = useState('mouse');
  const [hudState, setHudState] = useState({
    score: 0,
    lives: 3,
    weaponLevel: 1,
    wave: 1,
    bossHealth: null,
    maxBossHealth: null,
  });

  const handleStartGame = () => {
    setHudState({
      score: 0,
      lives: 3,
      weaponLevel: 1,
      wave: 1,
      bossHealth: null,
      maxBossHealth: null,
    });
    setGameState('PLAYING');
  };

  const handleGameOver = (finalScore) => {
    setHudState(prev => ({ ...prev, score: finalScore }));
    setGameState('GAMEOVER');
    playGameOverSound();
  };

  const handleVictory = (finalScore) => {
    setHudState(prev => ({ ...prev, score: finalScore }));
    setGameState('VICTORY');
    playVictorySound();
  };

  const handleMainMenu = () => {
    setGameState('MENU');
  };

  return (
    <div className="space-bg">
      <div className="stars-container">
        <div className="star star-small"></div>
        <div className="star star-medium"></div>
        <div className="star star-large"></div>
      </div>

      <div className="game-container">
        {gameState === 'MENU' && (
          <MainMenu 
            onStartGame={handleStartGame} 
            controls={controls} 
            setControls={setControls} 
          />
        )}

        {gameState === 'PLAYING' && (
          <>
            <HUD 
              score={hudState.score}
              lives={hudState.lives}
              weaponLevel={hudState.weaponLevel}
              wave={hudState.wave}
              bossHealth={hudState.bossHealth}
              maxBossHealth={hudState.maxBossHealth}
            />
            <GameCanvas 
              controls={controls} 
              updateHUD={setHudState}
              onGameOver={handleGameOver}
              onVictory={handleVictory}
            />
          </>
        )}

        {gameState === 'GAMEOVER' && (
          <GameOver 
            score={hudState.score} 
            onRestart={handleStartGame} 
            onMainMenu={handleMainMenu} 
          />
        )}

        {gameState === 'VICTORY' && (
          <Victory 
            score={hudState.score} 
            onRestart={handleStartGame} 
            onMainMenu={handleMainMenu} 
          />
        )}
      </div>

      <style>{`
        .stars-container {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          overflow: hidden;
          z-index: 0;
          pointer-events: none;
        }

        .star {
          position: absolute;
          border-radius: 50%;
          background: white;
          opacity: 0.3;
        }

        .star-small {
          width: 1px;
          height: 1px;
          box-shadow: 
            10vw 20vh white, 25vw 45vh white, 40vw 10vh white, 
            55vw 70vh white, 70vw 30vh white, 85vw 60vh white, 
            95vw 15vh white, 15vw 80vh white, 50vw 90vh white;
          animation: starScroll 15s linear infinite;
        }

        .star-medium {
          width: 2px;
          height: 2px;
          box-shadow: 
            5vw 15vh #aaccff, 30vw 55vh #aaccff, 50vw 25vh #aaccff, 
            75vw 65vh #aaccff, 90vw 45vh #aaccff, 20vw 92vh #aaccff;
          animation: starScroll 25s linear infinite;
        }

        .star-large {
          width: 3px;
          height: 3px;
          box-shadow: 
            12vw 8vh white, 35vw 72vh white, 65vw 38vh white, 
            80vw 88vh white, 92vw 50vh white;
          animation: starScroll 40s linear infinite;
        }

        @keyframes starScroll {
          from { transform: translateY(0); }
          to { transform: translateY(100vh); }
        }
      `}</style>
    </div>
  );
}

export default App;
