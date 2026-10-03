import { useState, useEffect, useRef } from 'react';

// Easing function for a more abrupt "snap" at the end, fitting neo-brutalism
const easeOutCirc = (x: number): number => {
  return Math.sqrt(1 - Math.pow(x - 1, 2));
};

export function useNumberCountUp(endValue: number | string | null, duration = 800) {
  const [displayValue, setDisplayValue] = useState<number | string | null>(null);
  const frameRef = useRef<number | undefined>(undefined);
  const startRef = useRef<number | undefined>(undefined);
  
  useEffect(() => {
    if (endValue === null) {
      setDisplayValue(null);
      return;
    }

    // Only count up if it's a parseable number
    const targetNum = Number(endValue);
    if (isNaN(targetNum)) {
        setDisplayValue(endValue);
        return;
    }

    startRef.current = performance.now();
    
    const tick = (now: number) => {
      const elapsed = now - startRef.current!;
      const progress = Math.min(elapsed / duration, 1);
      
      const easedProgress = easeOutCirc(progress);
      
      const currentVal = targetNum * easedProgress;
      
      // Determine formatting based on the target value
      let formattedValue: string | number;
      if (Number.isInteger(targetNum)) {
        formattedValue = Math.round(currentVal);
      } else {
        formattedValue = currentVal.toFixed(2);
      }
      
      setDisplayValue(formattedValue);
      
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
          setDisplayValue(endValue); // Ensure exact final value
      }
    };
    
    frameRef.current = requestAnimationFrame(tick);
    
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [endValue, duration]);

  return displayValue;
}
