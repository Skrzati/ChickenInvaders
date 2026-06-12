import React from 'react';

const HUD = ({ score, lives, weaponLevel, wave, bossHealth, maxBossHealth }) => {
  const livesArray = Array.from({ length: Math.max(0, lives) });

  const getWeaponName = (level) => {
    switch(level) {
      case 1: return 'Zwykły Laser';
      case 2: return 'Podwójny Laser';
      case 3: return 'Potrójny Laser';
      default: return 'Mega Plasma';
    }
  };

  return (
    <div className="hud-container">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <div className="hud-item">
          <span>WYNIK:</span>
          <span className="hud-value">{score}</span>
        </div>
        <div className="hud-item" style={{ fontSize: '0.9rem' }}>
          <span>FALA:</span>
          <span className="hud-value" style={{ color: 'var(--neon-blue)' }}>{wave}</span>
        </div>
      </div>

      {bossHealth !== null && bossHealth > 0 && (
        <div className="boss-health-container">
          <div className="boss-name">Główny Mega-Kurczak</div>
          <div 
            className="boss-health-bar" 
            style={{ width: `${Math.max(0, (bossHealth / maxBossHealth) * 100)}%` }}
          />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-end' }}>
        <div className="hud-item">
          <span>ŻYCIA:</span>
          <div className="hud-lives">
            {livesArray.map((_, i) => (
              <span key={i} className="hud-life-icon" />
            ))}
            {lives <= 0 && <span style={{ color: 'var(--neon-red)', fontSize: '0.9rem' }}>KRYTYCZNY BRAK</span>}
          </div>
        </div>
        <div className="hud-item" style={{ fontSize: '0.85rem' }}>
          <span>BROŃ:</span>
          <span className="hud-weapon">{getWeaponName(weaponLevel)}</span>
        </div>
      </div>
    </div>
  );
};

export default HUD;
