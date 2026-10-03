import { useEffect, useState } from 'react';

interface ScaleBarProps {
  value: number;
  maxValue: number;
  colorClass?: string;
  delayMs?: number;
}

export function ScaleBar({ value, maxValue, colorClass = "bg-[var(--color-brand-accent)]", delayMs = 0 }: ScaleBarProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRevealed(true);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  // Calculate percentage (cap at 100%, minimum 1% so it's not zero-scale)
  const percentage = Math.max(0.01, Math.min(1, value / maxValue));

  return (
    <div className="w-full h-4 bg-[var(--color-brand-surface-elevated)] rounded-full overflow-hidden relative">
      <div 
        className={`absolute top-0 left-0 h-full w-full rounded-full origin-left ${colorClass}`}
        style={{
          transform: isRevealed ? `scaleX(${percentage})` : 'scaleX(0.01)',
          opacity: isRevealed ? 1 : 0.5,
          transition: 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms ease-out',
        }}
      />
    </div>
  );
}
