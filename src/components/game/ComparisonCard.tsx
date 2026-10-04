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
        relative w-full flex flex-col items-center justify-center min-h-[120px] xs:min-h-[140px] sm:min-h-[180px] md:min-h-[280px] overflow-hidden
        transition-all duration-300 ease-out text-left bg-white/80 backdrop-blur-xl neo-border rounded-2xl neo-shadow
        ${!disabled && !isRevealed ? 'hover:-translate-y-2 hover:shadow-[8px_8px_0_#09090b] cursor-pointer hover:bg-white' : ''}
        ${disabled ? 'cursor-default' : ''}
        ${isRevealed && isWinner ? '!border-green-500 shadow-[6px_6px_0_#22c55e] bg-white' : ''}
        ${isRevealed && !isWinner ? 'grayscale opacity-50 transition-[filter,opacity] duration-[600ms]' : ''}
        ${className}
      `}
    >
      <VgpuHoverEffect isHovered={isHovered} />

      {isRevealed && isWinner && (
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-7 h-7 sm:w-10 sm:h-10 bg-green-400 neo-border rounded-full flex items-center justify-center text-black font-black text-sm sm:text-lg shadow-[2px_2px_0_#15803d] z-20">
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
        <div className="text-5xl sm:text-7xl mb-2 sm:mb-4 mt-4 sm:mt-8 drop-shadow-2xl">{emoji}</div>
      )}
      
      <div className="z-10 relative mt-auto flex flex-col items-center w-full px-1.5 sm:px-4 md:px-6 pb-2 sm:pb-4 md:pb-6">
        <h3 className={`text-sm xs:text-base sm:text-xl md:text-3xl font-bold font-display text-center leading-tight mb-2 sm:mb-4 line-clamp-1 xs:line-clamp-2 ${hasImage ? 'text-white drop-shadow-lg' : 'text-gray-900 drop-shadow-sm'}`}>
          {scrambledName}
        </h3>
        
        <div className={`h-10 sm:h-14 md:h-16 flex items-center justify-center w-full bg-white neo-border rounded-xl text-black shadow-[2px_2px_0_#000] transition-all`}>
          {showBack ? (
            <div className="text-xl sm:text-2xl md:text-3xl font-mono font-black text-black">
              {revealedValue !== null ? revealedValue.toLocaleString() : statValue.toLocaleString()} <span className="text-sm sm:text-lg md:text-xl opacity-80 uppercase text-gray-700 font-bold">{statUnit}</span>
            </div>
          ) : (
            <div className="text-xl sm:text-2xl md:text-3xl font-mono font-bold blur-[6px] select-none opacity-40 text-gray-400">
              {statValue.toLocaleString().replace(/[0-9]/g, '8')} <span className="text-sm sm:text-lg md:text-xl uppercase">{statUnit}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
