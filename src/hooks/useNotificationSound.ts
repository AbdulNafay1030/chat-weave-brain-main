import { useCallback, useRef, useEffect } from 'react';

// Create notification sound using Web Audio API
const createNotificationSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  return () => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };
};

export const useNotificationSound = () => {
  const playSound = useRef<(() => void) | null>(null);
  const isInitialized = useRef(false);

  // Initialize on first user interaction
  useEffect(() => {
    const initSound = () => {
      if (!isInitialized.current) {
        try {
          playSound.current = createNotificationSound();
          isInitialized.current = true;
        } catch (e) {
          console.warn('Could not initialize notification sound:', e);
        }
      }
    };

    // Initialize on first click/keypress
    document.addEventListener('click', initSound, { once: true });
    document.addEventListener('keydown', initSound, { once: true });

    return () => {
      document.removeEventListener('click', initSound);
      document.removeEventListener('keydown', initSound);
    };
  }, []);

  const play = useCallback(() => {
    if (playSound.current) {
      try {
        playSound.current();
      } catch (e) {
        console.warn('Could not play notification sound:', e);
      }
    }
  }, []);

  return { play };
};
