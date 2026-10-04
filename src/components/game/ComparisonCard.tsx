import { useEffect, useRef, useState } from 'react';
import { useProgressiveImage } from '../../lib/hooks/useProgressiveImage';
import { animateCardFlip } from '../../lib/animation/cardFlip';
import { useTextScramble } from '../../lib/hooks/useTextScramble';
import { useNumberCountUp } from '../../lib/hooks/useNumberCountUp';
import { VgpuHoverEffect } from './VgpuHoverEffect';

interface ComparisonCardProps {
  name: string;
  emoji: string;
  imageUrl?: string;
  statValue: number;
  statUnit: string;
  isRevealed: boolean;
  isWinner: boolean;
  onSelect?: () => void;
  disabled?: boolean;
  className?: string;
}

export function ComparisonCard({ 
  name, 
  emoji, 
  imageUrl,
  statValue, 
  statUnit, 
  isRevealed, 
  isWinner,
  onSelect,
  disabled,
  className = ''
}: ComparisonCardProps) {
  const cardRef = useRef<HTMLButtonElement>(null);
  const [showBack, setShowBack] = useState(isRevealed);
  const [isHovered, setIsHovered] = useState(false);
  
  // Use our backend API to dynamically fetch real Wikipedia images for the entity
  const safeImageUrl = (imageUrl?.includes('pollinations.ai') || imageUrl?.includes('picsum.photos') || imageUrl?.includes('loremflickr.com'))
    ? `/api/image?q=${encodeURIComponent(name)}`
    : imageUrl;
    
  const { src: loadedSrc, isLoading, error } = useProgressiveImage(safeImageUrl);
  const hasImage = Boolean(safeImageUrl && !error);
  const scrambledName = useTextScramble(name, 500, name);
  const revealedValue = useNumberCountUp(showBack ? statValue : null, 800);
  
  useEffect(() => {
    if (isRevealed && cardRef.current) {
      // Small timeout to allow state to settle if needed
      setTimeout(() => {
        animateCardFlip(cardRef.current!, isWinner);
        // Swap content midway through flip
        setTimeout(() => setShowBack(true), 280); 
      }, 50);
    } else if (!isRevealed) {
      setShowBack(false);
    }
  }, [isRevealed, isWinner]);

  return (
    <button
      ref={cardRef}
      onClick={onSelect}
      disabled={disabled}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        perspective: '1000px',
        ...(isRevealed && isWinner ? { '--shadow-color': 'var(--color-brand-correct)' } as any : {})
      }}
      className={`
        relative w-full flex flex-col items-center justify-center min-h-[240px] sm:min-h-[300px] overflow-hidden
        transition-all duration-300 ease-out text-left neo-glass border-4
        ${!disabled && !isRevealed ? 'hover:-translate-y-2 hover:shadow-[10px_10px_0_0_#000] cursor-pointer' : ''}
        ${disabled ? 'cursor-default' : ''}
        ${isRevealed && isWinner ? '!border-[var(--color-brand-correct)] animate-winner-sparkle' : ''}
        ${isRevealed && !isWinner ? 'grayscale opacity-50 transition-[filter,opacity] duration-[600ms]' : 'border-[var(--color-brand-border)]'}
        ${className}
      `}
    >
      <VgpuHoverEffect isHovered={isHovered} />

      {isRevealed && isWinner && (
        <div className="absolute top-4 right-4 w-10 h-10 bg-[var(--color-brand-correct)] border-4 border-black flex items-center justify-center text-black font-bold text-lg shadow-[4px_4px_0_#000] z-20">
          ✓
        </div>
      )}

      {hasImage && (
        <div className="absolute inset-0 z-0 bg-[var(--color-brand-surface)]">
          <img 
            src={loadedSrc || safeImageUrl} 
            alt={name} 
            loading="lazy"
            decoding="async"
            className={`w-full h-full object-cover transition-all duration-700 ease-out ${!isLoading ? 'blur-0 scale-100 opacity-100' : 'blur-md scale-105 opacity-50'}`} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>
      )}
      {!hasImage && (
        <div className="text-7xl mb-4 mt-8">{emoji}</div>
      )}
      
      <div className="z-10 relative mt-auto flex flex-col items-center w-full px-4 sm:px-6 pb-4 sm:pb-6 pt-8 sm:pt-12">
        <h3 className={`text-xl sm:text-2xl md:text-3xl font-bold font-display text-center leading-tight mb-3 sm:mb-4 line-clamp-2 ${hasImage ? 'text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]' : 'text-black'}`}>
          {scrambledName}
        </h3>
        
        <div className={`h-14 sm:h-16 flex items-center justify-center w-full bg-white border-4 border-black text-black shadow-[4px_4px_0_#000] transition-all`}>
          {showBack ? (
            <div className="text-2xl sm:text-3xl font-mono font-bold">
              {revealedValue !== null ? revealedValue.toLocaleString() : statValue.toLocaleString()} <span className="text-lg sm:text-xl opacity-80 uppercase">{statUnit}</span>
            </div>
          ) : (
            <div className="text-2xl sm:text-3xl font-mono font-bold blur-[6px] select-none opacity-60">
              {statValue.toLocaleString().replace(/[0-9]/g, '8')} <span className="text-lg sm:text-xl uppercase">{statUnit}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
