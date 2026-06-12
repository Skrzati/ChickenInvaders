import React, { useState } from 'react';
import { getMuted, toggleMute } from '../utils/audio';

const MainMenu = ({ onStartGame, controls, setControls }) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [muted, setMuted] = useState(getMuted());

  const handleToggleMute = () => {
    const newMuted = toggleMute();
    setMuted(newMuted);
  };

  return (
    <div className="overlay-screen">
      <div className="glass-panel" style={{ width: '80%', maxWidth: '600px' }}>
        <h1 className="title-glow">Chicken Invaders</h1>
        <h2 className="subtitle-glow">Retro Force</h2>

        {!showInstructions && !showSettings ? (
          <div className="menu-options">
            <button className="arcade-btn success" onClick={onStartGame}>
              Uruchom Grę
            </button>
            <button className="arcade-btn" onClick={() => setShowInstructions(true)}>
              Instrukcja
            </button>
            <button className="arcade-btn" onClick={() => setShowSettings(true)}>
              Ustawienia
            </button>
          </div>
        ) : showInstructions ? (
          <div className="instructions-panel">
            <h3>Instrukcja Gry</h3>
            <p>Uratuj galaktykę przed inwazją kurczaków! Unikaj spadających jajek, zbieraj prezenty, aby ulepszyć swoją broń, oraz jedzenie, aby zdobyć punkty.</p>
            
            <div className="key-list">
              <span className="key-cap">Myszka</span>
              <span>Ruch statku (jeśli włączone sterowanie myszką). Lewy przycisk myszy strzela.</span>
              
              <span className="key-cap">← / → / ↑ / ↓</span>
              <span>Poruszanie statkiem (Klawiatura)</span>
              
              <span className="key-cap">Spacja</span>
              <span>Strzelanie (Klawiatura)</span>

              <span className="key-cap">Prezenty</span>
              <span>Ulepszają poziom Twojej broni (do poziomu 4)</span>

              <span className="key-cap">Udka kurczaka</span>
              <span>Dają dodatkowe punkty (Score)</span>
            </div>

            <button className="arcade-btn" onClick={() => setShowInstructions(false)} style={{ display: 'block', margin: '20px auto 0' }}>
              Wstecz
            </button>
          </div>
        ) : (
          <div className="instructions-panel">
            <h3>Ustawienia</h3>
            
            <div className="settings-row">
              <span className="settings-label">Dźwięk:</span>
              <button className={`arcade-btn ${muted ? 'danger' : 'success'}`} onClick={handleToggleMute}>
                {muted ? 'WYŁĄCZONY' : 'WŁĄCZONY'}
              </button>
            </div>

            <div className="settings-row">
              <span className="settings-label">Sterowanie:</span>
              <button 
                className="arcade-btn" 
                onClick={() => setControls(controls === 'mouse' ? 'keyboard' : 'mouse')}
              >
                {controls === 'mouse' ? 'MYSZKA' : 'KLAWIATURA'}
              </button>
            </div>

            <button className="arcade-btn" onClick={() => setShowSettings(false)} style={{ display: 'block', margin: '20px auto 0' }}>
              Zapisz i Wstecz
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainMenu;
