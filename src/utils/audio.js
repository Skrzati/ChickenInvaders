let audioCtx = null;
let isMuted = false;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

export const toggleMute = () => {
  isMuted = !isMuted;
  return isMuted;
};

export const getMuted = () => isMuted;

let noiseBuffer = null;
function getNoiseBuffer() {
  if (noiseBuffer) return noiseBuffer;
  
  initAudio();
  const bufferSize = audioCtx.sampleRate * 1.5;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuffer = buffer;
  return noiseBuffer;
}

export const playLaserSound = (level = 1) => {
  if (isMuted) return;
  initAudio();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  
  if (level === 1) {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);
    
    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start(now);
    osc.stop(now + 0.13);
  } 
  else if (level === 2) {
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(1000, now);
    osc1.frequency.exponentialRampToValueAtTime(200, now + 0.15);
    
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1020, now);
    osc2.frequency.exponentialRampToValueAtTime(210, now + 0.15);
    
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.16);
    osc2.stop(now + 0.16);
  } 
  else if (level === 3) {
    const osc = audioCtx.createOscillator();
    const subOsc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.18);
    
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(300, now);
    subOsc.frequency.exponentialRampToValueAtTime(50, now + 0.18);
    
    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
    
    osc.connect(gainNode);
    subOsc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start(now);
    subOsc.start(now);
    osc.stop(now + 0.19);
    subOsc.stop(now + 0.19);
  } 
  else {
    const osc = audioCtx.createOscillator();
    const oscMod = audioCtx.createOscillator();
    const modGain = audioCtx.createGain();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.25);
    
    oscMod.type = 'sawtooth';
    oscMod.frequency.setValueAtTime(80, now);
    
    modGain.gain.setValueAtTime(200, now);
    
    gainNode.gain.setValueAtTime(0.25, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    
    oscMod.connect(modGain);
    modGain.connect(osc.frequency);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start(now);
    oscMod.start(now);
    osc.stop(now + 0.26);
    oscMod.stop(now + 0.26);
  }
};

export const playExplosionSound = () => {
  if (isMuted) return;
  initAudio();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  const duration = 0.6;
  
  const noise = audioCtx.createBufferSource();
  noise.buffer = getNoiseBuffer();
  
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, now);
  filter.frequency.exponentialRampToValueAtTime(30, now + duration);
  
  const gainNode = audioCtx.createGain();
  gainNode.gain.setValueAtTime(0.35, now);
  gainNode.gain.linearRampToValueAtTime(0.1, now + 0.15);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
  
  const subOsc = audioCtx.createOscillator();
  const subGain = audioCtx.createGain();
  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(120, now);
  subOsc.frequency.linearRampToValueAtTime(10, now + 0.25);
  
  subGain.gain.setValueAtTime(0.4, now);
  subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
  
  noise.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  subOsc.connect(subGain);
  subGain.connect(audioCtx.destination);
  
  noise.start(now);
  noise.stop(now + duration);
  
  subOsc.start(now);
  subOsc.stop(now + 0.26);
};

export const playChickenCluck = () => {
  if (isMuted) return;
  initAudio();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(450, now);
  osc1.frequency.exponentialRampToValueAtTime(900, now + 0.04);
  osc1.frequency.exponentialRampToValueAtTime(500, now + 0.08);
  
  osc2.type = 'square';
  osc2.frequency.setValueAtTime(470, now);
  osc2.frequency.exponentialRampToValueAtTime(920, now + 0.04);
  osc2.frequency.exponentialRampToValueAtTime(520, now + 0.08);
  
  gainNode.gain.setValueAtTime(0.06, now);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
  
  osc1.connect(gainNode);
  osc2.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.11);
  osc2.stop(now + 0.11);
};

export const playPowerUpSound = () => {
  if (isMuted) return;
  initAudio();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  
  const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
  const duration = 0.07;
  
  notes.forEach((freq, idx) => {
    const time = now + idx * duration;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);
    
    gainNode.gain.setValueAtTime(0.0, time);
    gainNode.gain.linearRampToValueAtTime(0.12, time + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start(time);
    osc.stop(time + 0.16);
  });
};

export const playGameOverSound = () => {
  if (isMuted) return;
  initAudio();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  
  const notes = [392.00, 349.23, 311.13, 246.94, 196.00];
  const duration = 0.15;
  
  notes.forEach((freq, idx) => {
    const time = now + idx * duration;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.linearRampToValueAtTime(freq - 20, time + 0.25);
    
    gainNode.gain.setValueAtTime(0.0, time);
    gainNode.gain.linearRampToValueAtTime(0.15, time + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start(time);
    osc.stop(time + 0.36);
  });
};

export const playVictorySound = () => {
  if (isMuted) return;
  initAudio();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  
  const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 523.25, 783.99];
  const duration = 0.12;
  
  notes.forEach((freq, idx) => {
    const time = now + idx * duration;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = idx === notes.length - 1 ? 'square' : 'triangle';
    osc.frequency.setValueAtTime(freq, time);
    
    gainNode.gain.setValueAtTime(0.0, time);
    gainNode.gain.linearRampToValueAtTime(idx === notes.length - 1 ? 0.12 : 0.15, time + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + (idx === notes.length - 1 ? 0.6 : 0.25));
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start(time);
    osc.stop(time + (idx === notes.length - 1 ? 0.61 : 0.26));
  });
};
