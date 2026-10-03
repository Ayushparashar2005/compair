import { useEffect } from 'react';

interface CountdownRingProps {
  durationMs: number;
  onComplete: () => void;
}

export function CountdownRing({ durationMs, onComplete }: CountdownRingProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, durationMs);
    return () => clearTimeout(timer);
  }, [durationMs, onComplete]);

  return (
    <div className="w-full h-2 bg-black/10">
      <div 
        className="h-full bg-black origin-left"
        style={{ animation: `shrink ${durationMs}ms linear forwards` }}
      />
    </div>
  );
}
