import { useState, useEffect } from 'react';

export function useProgressiveImage(src?: string, placeholder?: string) {
  const [currentSrc, setCurrentSrc] = useState(placeholder ?? null);
  const [isLoading, setIsLoading] = useState(!!src);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) return;
    
    // Reset state for new src
    setIsLoading(true);
    setError(false);
    if (placeholder) setCurrentSrc(placeholder);
    else setCurrentSrc(null);
    
    const img = new Image();
    img.src = src;
    img.onload = () => { 
      // Quality Gate: Reject tiny icons or extreme aspect ratios (flags, thin maps)
      const isTooSmall = img.naturalWidth < 150;
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      const isExtremeRatio = aspectRatio > 3.0 || aspectRatio < 0.33;
      
      if (isTooSmall || isExtremeRatio) {
        setIsLoading(false);
        setError(true);
      } else {
        setCurrentSrc(src); 
        setIsLoading(false); 
      }
    };
    img.onerror = () => { 
      setIsLoading(false); 
      setError(true);
    };
    
    return () => {
      // Cleanup if unmounted or src changes
      img.onload = null;
      img.onerror = null;
    };
  }, [src, placeholder]);

  return { src: currentSrc, isLoading, error };
}
