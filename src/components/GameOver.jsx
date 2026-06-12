import React from 'react';

const GameOver = ({ score, onRestart, onMainMenu }) => {
  return (
    <div className="overlay-screen" style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}>
      <div className="glass-panel" style={{ width: '80%', maxWidth: '500px', borderColor: 'var(--neon-red)', boxShadow: '0 0 20px rgba(255, 51, 102, 0.4)' }}>
        <h1 className="title-glow danger">
          Koniec Gry
        </h1>
        <h2 className="subtitle-glow" style={{ color: '#fff', textShadow: 'none' }}>
          Twój Statek Został Zniszczony!
        </h2>

        <div style={{ margin: '25px 0', fontSize: '1.5rem', fontFamily: 'var(--font-display)' }}>
          WYNIK KOŃCOWY: <span className="hud-value" style={{ color: 'var(--neon-yellow)' }}>{score}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          <button className="arcade-btn danger" onClick={onRestart}>
            Zagraj Ponownie
          </button>
          <button className="arcade-btn" onClick={onMainMenu}>
            Menu Główne
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;
