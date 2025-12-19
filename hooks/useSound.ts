import { useRef } from 'react';

export const useSound = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSuccessSound = (pitch = 800) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(pitch, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(pitch + 400, ctx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Audio playback failed", e);
    }
  };

  return { playSuccessSound };
};