import { useCallback } from 'react';

// Use a shared audio context so we don't hit browser limits
let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

const playTone = (freq: number, type: OscillatorType, duration: number, vol = 0.1, slideFreq?: number) => {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (slideFreq) {
    osc.frequency.exponentialRampToValueAtTime(slideFreq, ctx.currentTime + duration);
  }
  
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + duration);
};

export function useSFX() {
  const play = useCallback((sound: 'select' | 'correct' | 'wrong' | 'streak' | 'gameover' | 'highscore') => {
    try {
      switch (sound) {
        case 'select':
          playTone(200, 'square', 0.1, 0.05, 100);
          break;
        case 'correct':
          playTone(523.25, 'sine', 0.1, 0.1); // C5
          setTimeout(() => playTone(659.25, 'sine', 0.1, 0.1), 100); // E5
          setTimeout(() => playTone(783.99, 'sine', 0.3, 0.1), 200); // G5
          break;
        case 'wrong':
          playTone(150, 'sawtooth', 0.3, 0.1, 80);
          break;
        case 'streak':
          playTone(400, 'triangle', 0.1, 0.1, 800);
          setTimeout(() => playTone(600, 'triangle', 0.3, 0.1, 1200), 100);
          break;
        case 'gameover':
          playTone(300, 'square', 0.2, 0.05, 200);
          setTimeout(() => playTone(250, 'square', 0.4, 0.05, 150), 200);
          break;
        case 'highscore':
          playTone(523.25, 'square', 0.1, 0.05); // C5
          setTimeout(() => playTone(659.25, 'square', 0.1, 0.05), 150); // E5
          setTimeout(() => playTone(783.99, 'square', 0.1, 0.05), 300); // G5
          setTimeout(() => playTone(1046.50, 'square', 0.4, 0.05), 450); // C6
          break;
      }
    } catch (e) {
      console.warn("SFX failed", e);
    }
  }, []);
  
  return { play };
}
