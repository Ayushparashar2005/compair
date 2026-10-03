import { useState, useEffect, useRef } from 'react';

const CHAR_POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$%&';

export function useTextScramble(text: string, duration = 500, trigger = text) {
  const [displayText, setDisplayText] = useState(text);
  const frameRef = useRef<number | undefined>(undefined);
  const startRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // If there's no text, do nothing.
    if (!text) {
        setDisplayText('');
        return;
    }

    startRef.current = performance.now();
    
    const tick = (now: number) => {
      const elapsed = now - startRef.current!;
      const progress = Math.min(elapsed / duration, 1);
      
      let scrambled = '';
      for (let i = 0; i < text.length; i++) {
        // If it's a space, keep the space.
        if (text[i] === ' ') {
            scrambled += ' ';
            continue;
        }
        
        // Progress dictates how many characters from the left are "locked in"
        const charProgress = (i + 1) / text.length;
        
        if (progress >= charProgress) {
          scrambled += text[i];
        } else {
          // Add a random character from the pool
          scrambled += CHAR_POOL[Math.floor(Math.random() * CHAR_POOL.length)];
        }
      }
      
      setDisplayText(scrambled);
      
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };
    
    frameRef.current = requestAnimationFrame(tick);
    
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [text, duration, trigger]);

  return displayText;
}
