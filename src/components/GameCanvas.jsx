import React, { useEffect, useRef, useState } from 'react';
import { 
  playLaserSound, 
  playExplosionSound, 
  playChickenCluck, 
  playPowerUpSound 
} from '../utils/audio';

const VIRTUAL_WIDTH = 800;
const VIRTUAL_HEIGHT = 600;

const chromaKeyBlack = (img, threshold = 20) => {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  
  try {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      if (r <= threshold && g <= threshold && b <= threshold) {
        data[i + 3] = 0;
      }
    }
    
    ctx.putImageData(imgData, 0, 0);
    return canvas;
  } catch (e) {
    console.error("Chroma keying failed (likely CORS issue, returning original image)", e);
    return img;
  }
};

const GameCanvas = ({ controls, updateHUD, onGameOver, onVictory }) => {
  const canvasRef = useRef(null);
  
  const spritesRef = useRef({
    player: null,
    chickenNormal: null,
    chickenBoss: null,
    egg: null,
    drumstick: null,
    gift: null,
    spaceBg: null,
    loaded: false,
  });

  useEffect(() => {
    const assets = {
      player: { src: '/assets/player_ship.png', key: true, threshold: 25 },
      chickenNormal: { src: '/assets/chicken_normal.png', key: true, threshold: 25 },
      chickenBoss: { src: '/assets/chicken_boss.png', key: true, threshold: 25 },
      egg: { src: '/assets/egg.png', key: true, threshold: 20 },
      drumstick: { src: '/assets/drumstick.png', key: true, threshold: 20 },
      gift: { src: '/assets/gift.png', key: true, threshold: 20 },
      spaceBg: { src: '/assets/space_bg.png', key: false }
    };

    let loadedCount = 0;
    const assetKeys = Object.keys(assets);
    const totalAssets = assetKeys.length;

    assetKeys.forEach((key) => {
      const img = new Image();
      img.src = assets[key].src;
      img.onload = () => {
        if (assets[key].key) {
          spritesRef.current[key] = chromaKeyBlack(img, assets[key].threshold);
        } else {
          spritesRef.current[key] = img;
        }
        loadedCount++;
        if (loadedCount === totalAssets) {
          spritesRef.current.loaded = true;
        }
      };
      img.onerror = () => {
        console.warn(`Failed to load asset: ${assets[key].src}, using vector fallback`);
        loadedCount++;
        if (loadedCount === totalAssets) {
          spritesRef.current.loaded = true;
        }
      };
    });
  }, []);

  const gameStateRef = useRef({
    player: {
      x: VIRTUAL_WIDTH / 2,
      y: VIRTUAL_HEIGHT - 60,
      width: 65,
      height: 65,
      speed: 6,
      lives: 3,
      score: 0,
      weaponLevel: 1,
      lastShotTime: 0,
      shotCooldown: 220, // ms between shots
      invulnTime: 0, // temporary invulnerability frames when hit
      shieldActive: false,
    },
    keys: {},
    mouse: { x: VIRTUAL_WIDTH / 2, y: VIRTUAL_HEIGHT - 60 },
    projectiles: [], // lasers shot by player
    eggs: [], // eggs dropped by chickens
    chickens: [], // list of chicken enemies
    particles: [], // visual explosion particles
    gifts: [], // weapon level upgrades
    food: [], // collectable chicken legs
    stars: [], // background stars
    wave: 1,
    waveTransition: 0, // screen animation frames for wave transitions
    boss: null, // boss state if active
    isGameOver: false,
    isVictory: false,
    frame: 0,
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      gameStateRef.current.keys[e.code] = true;
    };
    const handleKeyUp = (e) => {
      gameStateRef.current.keys[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const state = gameStateRef.current;
    state.stars = [];
    for (let i = 0; i < 80; i++) {
      state.stars.push({
        x: Math.random() * VIRTUAL_WIDTH,
        y: Math.random() * VIRTUAL_HEIGHT,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 1.5 + 0.5,
        color: Math.random() > 0.8 ? '#aaccff' : '#ffffff'
      });
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    initWave(gameStateRef.current.wave);

    const loop = () => {
      updateGame();
      drawGame(ctx);
      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [controls]);

  const initWave = (waveNum) => {
    const state = gameStateRef.current;
    state.chickens = [];
    state.projectiles = [];
    state.eggs = [];
    state.gifts = [];
    state.food = [];
    state.boss = null;
    state.waveTransition = 120; // 2 seconds of transition text
    
    if (waveNum === 4) {
      state.boss = {
        x: VIRTUAL_WIDTH / 2,
        y: -150, // Starts offscreen, flies in
        targetY: 130,
        width: 150,
        height: 120,
        health: 120,
        maxHealth: 120,
        speedX: 2.5,
        direction: 1,
        attackCooldown: 100,
        attackState: 'idle',
        attackTimer: 0,
      };
      playChickenCluck();
    } else {
      const rows = 3 + waveNum; // Wave 1: 4 rows, Wave 2: 5 rows...
      const cols = 6 + waveNum; // Wave 1: 7 cols, Wave 2: 8 cols...
      const spacingX = 65;
      const spacingY = 55;
      
      const startX = (VIRTUAL_WIDTH - (cols - 1) * spacingX) / 2;
      const startY = 60;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let type = 'normal';
          let hp = 1;
          if (waveNum >= 2 && r === 0) {
            type = 'armored'; // takes 2 hits
            hp = 2;
          }
          if (waveNum >= 3 && r === 1 && c % 2 === 0) {
            type = 'fast';
            hp = 1;
          }

          state.chickens.push({
            x: startX + c * spacingX,
            y: startY + r * spacingY,
            width: 48,
            height: 44,
            type,
            health: hp,
            maxHealth: hp,
            originX: startX + c * spacingX,
            offsetX: 0,
            direction: 1,
            animOffset: Math.random() * 100,
          });
        }
      }
    }
  };

  const fireLaser = (state) => {
    const now = Date.now();
    if (now - state.player.lastShotTime < state.player.shotCooldown) return;
    state.player.lastShotTime = now;

    const p = state.player;
    playLaserSound(p.weaponLevel);

    if (p.weaponLevel === 1) {
      state.projectiles.push({
        x: p.x,
        y: p.y - 15,
        width: 4,
        height: 15,
        speed: 10,
        color: 'var(--neon-red)',
        glow: 'rgba(255, 51, 102, 0.8)',
        damage: 1,
      });
    } else if (p.weaponLevel === 2) {
      state.projectiles.push({
        x: p.x - 12,
        y: p.y - 10,
        width: 4,
        height: 15,
        speed: 11,
        color: 'var(--neon-green)',
        glow: 'rgba(51, 255, 102, 0.8)',
        damage: 1,
      });
      state.projectiles.push({
        x: p.x + 12,
        y: p.y - 10,
        width: 4,
        height: 15,
        speed: 11,
        color: 'var(--neon-green)',
        glow: 'rgba(51, 255, 102, 0.8)',
        damage: 1,
      });
    } else if (p.weaponLevel === 3) {
      state.projectiles.push({
        x: p.x,
        y: p.y - 15,
        width: 4,
        height: 15,
        speedX: 0,
        speedY: -11,
        color: 'var(--neon-blue)',
        glow: 'rgba(51, 153, 255, 0.8)',
        damage: 1,
      });
      state.projectiles.push({
        x: p.x - 15,
        y: p.y - 10,
        width: 4,
        height: 15,
        speedX: -2,
        speedY: -10,
        color: 'var(--neon-blue)',
        glow: 'rgba(51, 153, 255, 0.8)',
        damage: 1,
      });
      state.projectiles.push({
        x: p.x + 15,
        y: p.y - 10,
        width: 4,
        height: 15,
        speedX: 2,
        speedY: -10,
        color: 'var(--neon-blue)',
        glow: 'rgba(51, 153, 255, 0.8)',
        damage: 1,
      });
    } else {
      state.projectiles.push({
        x: p.x,
        y: p.y - 20,
        width: 14,
        height: 14,
        isPlasma: true,
        speed: 9,
        color: '#ff33ff',
        glow: 'rgba(255, 51, 255, 0.9)',
        damage: 3,
      });
    }
  };

  const spawnExplosion = (x, y, color, count = 15, size = 3) => {
    const state = gameStateRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1.5;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * size + 1.5,
        color,
        life: 1.0,
        decay: Math.random() * 0.04 + 0.02,
      });
    }
    playExplosionSound();
  };

  const updateGame = () => {
    const state = gameStateRef.current;
    if (state.isGameOver || state.isVictory) return;

    state.frame++;

    state.stars.forEach(star => {
      star.y += star.speed;
      if (star.y > VIRTUAL_HEIGHT) {
        star.y = 0;
        star.x = Math.random() * VIRTUAL_WIDTH;
      }
    });

    if (state.waveTransition > 0) {
      state.waveTransition--;
    }

    const p = state.player;
    if (p.invulnTime > 0) p.invulnTime--;

    if (controls === 'mouse') {
      const dx = state.mouse.x - p.x;
      const dy = state.mouse.y - p.y;
      p.x += dx * 0.15;
      p.y += dy * 0.15;
    } else {
      if (state.keys['ArrowLeft'] || state.keys['KeyA']) {
        p.x -= p.speed;
      }
      if (state.keys['ArrowRight'] || state.keys['KeyD']) {
        p.x += p.speed;
      }
      if (state.keys['ArrowUp'] || state.keys['KeyW']) {
        p.y -= p.speed;
      }
      if (state.keys['ArrowDown'] || state.keys['KeyS']) {
        p.y += p.speed;
      }
    }

    p.x = Math.max(p.width / 2, Math.min(VIRTUAL_WIDTH - p.width / 2, p.x));
    p.y = Math.max(p.height / 2, Math.min(VIRTUAL_HEIGHT - p.height / 2, p.y));

    if (state.frame % 2 === 0) {
      state.particles.push({
        x: p.x,
        y: p.y + p.height / 2 - 5,
        vx: (Math.random() - 0.5) * 1.5,
        vy: Math.random() * 2 + 2,
        size: Math.random() * 3 + 1,
        color: Math.random() > 0.4 ? 'var(--neon-blue)' : '#ff9933',
        life: 0.7,
        decay: 0.05,
      });
    }

    if (controls === 'keyboard' && state.keys['Space']) {
      fireLaser(state);
    }
    if (controls === 'mouse' && state.keys['MouseDown']) {
      fireLaser(state);
    }

    for (let i = state.projectiles.length - 1; i >= 0; i--) {
      const proj = state.projectiles[i];
      if (proj.isPlasma) {
        proj.y -= proj.speed;
      } else if (proj.speedX !== undefined) {
        proj.x += proj.speedX;
        proj.y += proj.speedY;
      } else {
        proj.y -= proj.speed;
      }

      if (proj.y < -30 || proj.x < -30 || proj.x > VIRTUAL_WIDTH + 30) {
        state.projectiles.splice(i, 1);
      }
    }

    let waveShiftDown = false;
    let waveEdgeHit = false;

    if (!state.boss) {
      state.chickens.forEach(ch => {
        ch.offsetX += ch.direction * (state.wave * 0.4 + 0.6);
        ch.x = ch.originX + ch.offsetX;
        
        if (ch.x > VIRTUAL_WIDTH - 25 || ch.x < 25) {
          waveEdgeHit = true;
        }

        if (Math.random() < 0.0003) {
          playChickenCluck();
        }

        const dropThreshold = 0.0006 + (state.wave * 0.0004);
        if (state.waveTransition === 0 && Math.random() < dropThreshold) {
          state.eggs.push({
            x: ch.x,
            y: ch.y + 12,
            width: 18,
            height: 25,
            speed: 2.2 + state.wave * 0.4,
          });
        }
      });

      if (waveEdgeHit) {
        state.chickens.forEach(ch => {
          ch.direction *= -1;
          ch.originX += ch.direction * 5; // offset correction
          ch.y += 12; // move down
          if (ch.y > VIRTUAL_HEIGHT - 100) {
            triggerGameOver();
          }
        });
      }
    }

    if (state.boss) {
      const b = state.boss;
      
      if (b.y < b.targetY) {
        b.y += 2;
      } else {
        b.x += b.speedX * b.direction;
        if (b.x < 100 || b.x > VIRTUAL_WIDTH - 100) {
          b.direction *= -1;
        }

        b.attackTimer++;

        if (b.attackState === 'idle' && b.attackTimer > 120) {
          const rand = Math.random();
          if (rand < 0.5) {
            b.attackState = 'eggShower';
            b.attackTimer = 0;
          } else {
            b.attackState = 'charge';
            b.attackTimer = 0;
            b.origY = b.y;
          }
        }

        if (b.attackState === 'eggShower') {
          if (b.attackTimer % 15 === 0) {
            for (let i = -1; i <= 1; i++) {
              state.eggs.push({
                x: b.x + i * 24,
                y: b.y + 45,
                width: 22,
                height: 30,
                speedX: i * 1.5,
                speedY: 4.5,
              });
            }
            playChickenCluck();
          }
          if (b.attackTimer > 180) {
            b.attackState = 'idle';
            b.attackTimer = 0;
          }
        }

        if (b.attackState === 'charge') {
          if (b.attackTimer < 45) {
            b.y += 7;
          } else if (b.attackTimer < 90) {
            b.y -= 7;
          } else {
            b.y = b.targetY;
            b.attackState = 'idle';
            b.attackTimer = 0;
          }
        }

        if (Math.random() < 0.035) {
          state.eggs.push({
            x: b.x + (Math.random() - 0.5) * 80,
            y: b.y + 30,
            width: 18,
            height: 25,
            speedX: 0,
            speedY: 3.5,
          });
        }
      }
    }

    for (let i = state.eggs.length - 1; i >= 0; i--) {
      const egg = state.eggs[i];
      if (egg.speedX) {
        egg.x += egg.speedX;
        egg.y += egg.speedY;
      } else {
        egg.y += egg.speed;
      }

      if (
        p.invulnTime === 0 &&
        Math.abs(egg.x - p.x) < (egg.width + p.width) / 2.2 &&
        Math.abs(egg.y - p.y) < (egg.height + p.height) / 2.2
      ) {
        state.eggs.splice(i, 1);
        playerHit();
        continue;
      }

      if (egg.y > VIRTUAL_HEIGHT + 20) {
        state.eggs.splice(i, 1);
      }
    }

    for (let i = state.gifts.length - 1; i >= 0; i--) {
      const gift = state.gifts[i];
      gift.y += 1.8;

      if (
        Math.abs(gift.x - p.x) < (25 + p.width) / 2 &&
        Math.abs(gift.y - p.y) < (25 + p.height) / 2
      ) {
        state.gifts.splice(i, 1);
        playPowerUpSound();
        if (p.weaponLevel < 4) {
          p.weaponLevel++;
        }
        p.score += 200;
        continue;
      }

      if (gift.y > VIRTUAL_HEIGHT + 20) {
        state.gifts.splice(i, 1);
      }
    }

    for (let i = state.food.length - 1; i >= 0; i--) {
      const leg = state.food[i];
      leg.y += 2.2;

      leg.angle += 0.05;

      if (
        Math.abs(leg.x - p.x) < (20 + p.width) / 2 &&
        Math.abs(leg.y - p.y) < (20 + p.height) / 2
      ) {
        state.food.splice(i, 1);
        playPowerUpSound();
        p.score += 500;
        continue;
      }

      if (leg.y > VIRTUAL_HEIGHT + 20) {
        state.food.splice(i, 1);
      }
    }

    for (let i = state.particles.length - 1; i >= 0; i--) {
      const part = state.particles[i];
      part.x += part.vx;
      part.y += part.vy;
      part.vy += 0.03; // small gravity
      part.life -= part.decay;
      if (part.life <= 0) {
        state.particles.splice(i, 1);
      }
    }

    for (let i = state.projectiles.length - 1; i >= 0; i--) {
      const proj = state.projectiles[i];
      let projDestroyed = false;

      if (!state.boss) {
        for (let j = state.chickens.length - 1; j >= 0; j--) {
          const ch = state.chickens[j];
          if (
            Math.abs(proj.x - ch.x) < (proj.width + ch.width) / 2 &&
            Math.abs(proj.y - ch.y) < (proj.height + ch.height) / 2
          ) {
            ch.health -= proj.damage;
            spawnExplosion(ch.x, ch.y, '#ffffaa', 6, 2); // hit sparks
            
            if (ch.health <= 0) {
              spawnExplosion(ch.x, ch.y, ch.type === 'armored' ? 'var(--neon-purple)' : 'var(--neon-green)', 20, 4);
              
              const rand = Math.random();
              if (rand < 0.08) {
                state.gifts.push({ x: ch.x, y: ch.y });
              } else if (rand < 0.28) {
                state.food.push({ x: ch.x, y: ch.y, angle: 0 });
              }
              
              state.chickens.splice(j, 1);
              p.score += ch.type === 'armored' ? 250 : 100;
            }

            projDestroyed = true;
            break;
          }
        }
      } else {
        const b = state.boss;
        if (
          b.y > 0 && // boss fully in screen
          Math.abs(proj.x - b.x) < (proj.width + b.width) / 2 &&
          Math.abs(proj.y - b.y) < (proj.height + b.height) / 2
        ) {
          b.health -= proj.damage;
          spawnExplosion(proj.x, proj.y, 'var(--neon-yellow)', 6, 2.5); // sparkles
          
          if (b.health <= 0) {
            spawnExplosion(b.x, b.y, 'var(--neon-yellow)', 60, 6);
            spawnExplosion(b.x - 30, b.y - 10, 'var(--neon-red)', 40, 5);
            spawnExplosion(b.x + 30, b.y + 10, 'var(--neon-blue)', 40, 5);
            
            for (let k = 0; k < 6; k++) {
              state.food.push({ x: b.x + (Math.random() - 0.5) * 80, y: b.y + (Math.random() - 0.5) * 40, angle: Math.random() * Math.PI });
            }
            state.boss = null;
            p.score += 5000;
            
            setTimeout(() => {
              state.isVictory = true;
              onVictory(p.score);
            }, 1000);
          }
          projDestroyed = true;
        }
      }

      if (projDestroyed) {
        state.projectiles.splice(i, 1);
      }
    }

    if (!state.boss && p.invulnTime === 0) {
      for (let i = 0; i < state.chickens.length; i++) {
        const ch = state.chickens[i];
        if (
          Math.abs(ch.x - p.x) < (ch.width + p.width) / 2.2 &&
          Math.abs(ch.y - p.y) < (ch.height + p.height) / 2.2
        ) {
          playerHit();
          break;
        }
      }
    }

    if (state.boss && p.invulnTime === 0) {
      const b = state.boss;
      if (
        b.y > 0 &&
        Math.abs(b.x - p.x) < (b.width + p.width) / 2.5 &&
        Math.abs(b.y - p.y) < (b.height + p.height) / 2.5
      ) {
        playerHit();
      }
    }

    if (state.waveTransition === 0 && !state.boss && state.chickens.length === 0) {
      if (state.wave < 4) {
        state.wave++;
        initWave(state.wave);
      }
    }

    updateHUD({
      score: p.score,
      lives: p.lives,
      weaponLevel: p.weaponLevel,
      wave: state.wave,
      bossHealth: state.boss ? state.boss.health : null,
      maxBossHealth: state.boss ? state.boss.maxHealth : null,
    });
  };

  const playerHit = () => {
    const state = gameStateRef.current;
    const p = state.player;

    spawnExplosion(p.x, p.y, 'var(--neon-red)', 30, 4.5);
    p.lives--;
    p.weaponLevel = Math.max(1, p.weaponLevel - 1); // downgrade weapon level
    p.invulnTime = 90; // ~1.5s invulnerable

    if (p.lives <= 0) {
      triggerGameOver();
    }
  };

  const triggerGameOver = () => {
    const state = gameStateRef.current;
    state.isGameOver = true;
    onGameOver(state.player.score);
  };

  const drawGame = (ctx) => {
    ctx.clearRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
    const state = gameStateRef.current;

    if (spritesRef.current.spaceBg) {
      const bgScrollY = (state.frame * 0.4) % VIRTUAL_HEIGHT;
      ctx.drawImage(spritesRef.current.spaceBg, 0, bgScrollY - VIRTUAL_HEIGHT, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
      ctx.drawImage(spritesRef.current.spaceBg, 0, bgScrollY, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
    }
    state.stars.forEach(star => {
      ctx.fillStyle = star.color;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    state.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    state.projectiles.forEach(proj => {
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = proj.glow;
      ctx.fillStyle = proj.color;
      if (proj.isPlasma) {
        const pulseSize = proj.width + Math.sin(state.frame * 0.2) * 2;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, pulseSize / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(proj.x - proj.width / 2, proj.y - proj.height / 2, proj.width, proj.height);
      }
      ctx.restore();
    });

    state.eggs.forEach(egg => {
      ctx.save();
      if (spritesRef.current.egg) {
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#ffff00';
        ctx.drawImage(spritesRef.current.egg, egg.x - egg.width / 2, egg.y - egg.height / 2, egg.width, egg.height);
      } else {
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        const grad = ctx.createRadialGradient(egg.x - 2, egg.y - 2, 1, egg.x, egg.y, egg.height / 2);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.7, '#fffae0');
        grad.addColorStop(1, '#ffd080');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(egg.x, egg.y, egg.width / 2, egg.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    state.gifts.forEach(gift => {
      ctx.save();
      if (spritesRef.current.gift) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = 'var(--neon-purple)';
        ctx.translate(gift.x, gift.y);
        ctx.rotate(state.frame * 0.02);
        ctx.drawImage(spritesRef.current.gift, -10, -10, 20, 20);
      } else {
        ctx.shadowBlur = 12;
        ctx.shadowColor = 'var(--neon-purple)';
        
        ctx.fillStyle = '#1e1e4a';
        ctx.strokeStyle = 'var(--neon-purple)';
        ctx.lineWidth = 2;
        ctx.strokeRect(gift.x - 10, gift.y - 10, 20, 20);
        ctx.fillRect(gift.x - 10, gift.y - 10, 20, 20);

        ctx.fillStyle = 'var(--neon-yellow)';
        ctx.fillRect(gift.x - 2, gift.y - 10, 4, 20);
        ctx.fillRect(gift.x - 10, gift.y - 2, 20, 4);

        ctx.beginPath();
        ctx.arc(gift.x - 4, gift.y - 12, 4, 0, Math.PI * 2);
        ctx.arc(gift.x + 4, gift.y - 12, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'var(--neon-yellow)';
        ctx.fill();
      }
      ctx.restore();
    });

    state.food.forEach(leg => {
      ctx.save();
      ctx.translate(leg.x, leg.y);
      ctx.rotate(leg.angle);
      if (spritesRef.current.drumstick) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#d27d2d';
        ctx.drawImage(spritesRef.current.drumstick, -12, -15, 24, 30);
      } else {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#d27d2d';

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        ctx.fillRect(-2, 0, 4, 15);
        ctx.beginPath();
        ctx.arc(-3, 14, 3, 0, Math.PI * 2);
        ctx.arc(3, 14, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#b35a1a';
        ctx.beginPath();
        ctx.ellipse(0, -2, 10, 13, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffaa44';
        ctx.beginPath();
        ctx.ellipse(-3, -3, 4, 7, Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    const p = state.player;
    const isInvuln = p.invulnTime > 0;
    
    if (!isInvuln || Math.floor(state.frame / 4) % 2 === 0) {
      ctx.save();
      ctx.translate(p.x, p.y);
      
      if (spritesRef.current.player) {
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#00ffff';
        ctx.drawImage(spritesRef.current.player, -p.width / 2, -p.height / 2, p.width, p.height);
      } else {
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'var(--neon-blue)';

        ctx.fillStyle = 'rgba(20, 40, 120, 0.8)';
        ctx.strokeStyle = 'var(--neon-blue)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -25); // Nose
        ctx.lineTo(-25, 20); // Left wingtip
        ctx.lineTo(-8, 12);  // Left thruster connection
        ctx.lineTo(8, 12);   // Right thruster connection
        ctx.lineTo(25, 20);  // Right wingtip
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'var(--neon-yellow)';
        ctx.beginPath();
        ctx.ellipse(0, -5, 5, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#111';
        ctx.strokeStyle = '#5588ff';
        ctx.strokeRect(-12, 10, 6, 8);
        ctx.fillRect(-12, 10, 6, 8);
        ctx.strokeRect(6, 10, 6, 8);
        ctx.fillRect(6, 10, 6, 8);
      }

      if (isInvuln) {
        ctx.strokeStyle = 'rgba(255, 51, 102, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, 32, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }

    const wingPhase = Math.sin(state.frame * 0.12);
    state.chickens.forEach(ch => {
      drawChickenSprite(ctx, ch.x, ch.y, ch.width, ch.height, wingPhase, ch.type, ch.health, ch.maxHealth);
    });

    if (state.boss) {
      const b = state.boss;
      const bossWingPhase = Math.sin(state.frame * 0.2);
      drawBossSprite(ctx, b.x, b.y, b.width, b.height, bossWingPhase, b.health, b.maxHealth);
    }

    if (state.waveTransition > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

      ctx.font = 'bold 36px var(--font-display)';
      ctx.fillStyle = 'var(--neon-yellow)';
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'var(--neon-yellow)';
      ctx.textAlign = 'center';
      
      const text = state.wave === 4 ? "FALA FINAŁOWA: MEGA BOSS" : `FALA ${state.wave}`;
      ctx.fillText(text, VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 - 20);

      ctx.font = '20px var(--font-mono)';
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0;
      
      const subText = state.wave === 4 ? "Unikaj ładunków i zniszcz kurczaka!" : "Zestrzel kosmiczne kurczaki!";
      ctx.fillText(subText, VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 + 25);
      ctx.restore();
    }
  };

  const drawChickenSprite = (ctx, x, y, width, height, wingPhase, type, hp, maxHp) => {
    ctx.save();
    ctx.translate(x, y);

    const isDamaged = hp < maxHp;
    const isFlashing = isDamaged && Math.floor(gameStateRef.current.frame / 3) % 2 === 0;

    if (spritesRef.current.chickenNormal) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = type === 'armored' ? 'var(--neon-purple)' : 'var(--neon-green)';
      
      const wingScaleY = 1 + wingPhase * 0.08;
      
      ctx.drawImage(spritesRef.current.chickenNormal, -width / 2, (-height / 2) * wingScaleY, width, height * wingScaleY);

      if (isFlashing) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'rgba(255, 51, 102, 0.65)';
        ctx.fillRect(-width / 2, (-height / 2) * wingScaleY, width, height * wingScaleY);
        ctx.restore();
      }
      
      if (type === 'armored') {
        ctx.strokeStyle = 'var(--neon-purple)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, width / 1.6, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      ctx.shadowBlur = 8;
      ctx.shadowColor = type === 'armored' ? 'var(--neon-purple)' : 'var(--neon-green)';

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(-width/2, wingPhase * 4, 8, 12, wingPhase * 0.4 - 0.4, 0, Math.PI * 2);
      ctx.ellipse(width/2, wingPhase * 4, 8, 12, -wingPhase * 0.4 + 0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'var(--neon-yellow)';
      ctx.fillRect(-8, height/2 - 4, 4, 8);
      ctx.fillRect(4, height/2 - 4, 4, 8);

      ctx.fillStyle = isFlashing ? '#ff3333' : '#eeeeee';
      ctx.beginPath();
      ctx.arc(0, 0, width / 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = type === 'armored' ? '#9933ff' : '#00ffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, width / 2.2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.arc(-width / 5, -height / 5, width / 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'var(--neon-red)';
      ctx.beginPath();
      ctx.moveTo(-6, -height / 2);
      ctx.lineTo(0, -height / 2 - 6);
      ctx.lineTo(6, -height / 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-5, -2, 2.5, 0, Math.PI * 2);
      ctx.arc(5, -2, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'var(--neon-yellow)';
      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.lineTo(-4, 4);
      ctx.lineTo(4, 4);
      ctx.closePath();
      ctx.fill();

      if (type === 'armored') {
        ctx.strokeStyle = 'var(--neon-purple)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, width / 1.7, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();
  };

  const drawBossSprite = (ctx, x, y, width, height, wingPhase, hp, maxHp) => {
    ctx.save();
    ctx.translate(x, y);

    const healthPercent = hp / maxHp;
    const isFlashing = hp < maxHp && Math.floor(gameStateRef.current.frame / 4) % 2 === 0;

    if (spritesRef.current.chickenBoss) {
      ctx.shadowBlur = 30;
      ctx.shadowColor = 'var(--neon-red)';
      
      const wingScaleY = 1 + wingPhase * 0.05;
      ctx.drawImage(spritesRef.current.chickenBoss, -width / 2, (-height / 2) * wingScaleY, width, height * wingScaleY);

      if (isFlashing) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'rgba(255, 51, 102, 0.65)';
        ctx.fillRect(-width / 2, (-height / 2) * wingScaleY, width, height * wingScaleY);
        ctx.restore();
      }

      ctx.strokeStyle = `rgba(255, 51, 102, ${0.25 + Math.sin(gameStateRef.current.frame * 0.1) * 0.15})`;
      ctx.lineWidth = 3.5;
      ctx.setLineDash([10, 15]);
      ctx.beginPath();
      ctx.arc(0, 0, width / 1.6, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.shadowBlur = 25;
      ctx.shadowColor = 'var(--neon-red)';

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(-width / 2.2, wingPhase * 15, 25, 45, wingPhase * 0.4 - 0.4, 0, Math.PI * 2);
      ctx.ellipse(width / 2.2, wingPhase * 15, 25, 45, -wingPhase * 0.4 + 0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'var(--neon-yellow)';
      ctx.fillRect(-25, height / 2 - 10, 10, 20);
      ctx.fillRect(15, height / 2 - 10, 10, 20);

      ctx.fillStyle = isFlashing ? '#ff4444' : '#dddddd';
      ctx.beginPath();
      ctx.arc(0, 0, width / 2.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'var(--neon-yellow)';
      ctx.strokeStyle = '#ff9900';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-30, -height / 2);
      ctx.lineTo(-25, -height / 2 - 25);
      ctx.lineTo(-10, -height / 2 - 10);
      ctx.lineTo(0, -height / 2 - 32); // Center peak
      ctx.lineTo(10, -height / 2 - 10);
      ctx.lineTo(25, -height / 2 - 25);
      ctx.lineTo(30, -height / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'var(--neon-red)';
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'var(--neon-red)';
      ctx.beginPath();
      ctx.arc(-18, -10, 8, 0, Math.PI * 2);
      ctx.arc(18, -10, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-18 + Math.sin(gameStateRef.current.frame * 0.05) * 3, -10, 4, 0, Math.PI * 2);
      ctx.arc(18 + Math.sin(gameStateRef.current.frame * 0.05) * 3, -10, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'var(--neon-yellow)';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(-12, 18);
      ctx.lineTo(12, 18);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = `rgba(255, 51, 102, ${0.25 + Math.sin(gameStateRef.current.frame * 0.1) * 0.15})`;
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 15]);
      ctx.beginPath();
      ctx.arc(0, 0, width / 1.7, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  };

  const handleMouseMove = (e) => {
    if (controls !== 'mouse') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = VIRTUAL_WIDTH / rect.width;
    const scaleY = VIRTUAL_HEIGHT / rect.height;

    gameStateRef.current.mouse.x = (e.clientX - rect.left) * scaleX;
    gameStateRef.current.mouse.y = (e.clientY - rect.top) * scaleY;
  };

  const handleMouseDown = () => {
    gameStateRef.current.keys['MouseDown'] = true;
  };

  const handleMouseUp = () => {
    gameStateRef.current.keys['MouseDown'] = false;
  };

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      width={VIRTUAL_WIDTH}
      height={VIRTUAL_HEIGHT}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      style={{ cursor: controls === 'mouse' ? 'none' : 'default' }}
    />
  );
};

export default GameCanvas;
