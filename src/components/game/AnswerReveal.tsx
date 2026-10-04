import { useEffect, useRef } from 'react';
import { burstConfetti } from '../../lib/animation/effects';
import { D3BarChart } from './D3BarChart';
import { CountdownRing } from './CountdownRing';

interface AnswerRevealProps {
  entityA: { name: string; value: number };
  entityB: { name: string; value: number };
  stat: { name: string; unit: string };
  isCorrect: boolean;
  explanation?: string;
  onNext: () => void;
  onBonusRound?: () => void;
}

export function AnswerReveal({ entityA, entityB, stat, isCorrect, explanation, onNext, onBonusRound }: AnswerRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isCorrect && containerRef.current) {
      burstConfetti(containerRef.current);
    }
  }, [isCorrect]);
  
  return (
    <div 
      ref={containerRef}
      className="mt-3 sm:mt-8 p-3 sm:p-6 neo-glass w-full max-w-2xl mx-auto border-4 border-black shadow-[4px_4px_0_#000] sm:shadow-[8px_8px_0_#000] max-h-[60vh] overflow-y-auto"
      style={{
        animation: 'crossBlurReveal 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}
    >
      {/* Removed the verdict/button header to be replaced by the full-width button at bottom */}
      
      <div className="w-full">
        <D3BarChart 
          entityA={entityA} 
          entityB={entityB} 
          stat={stat} 
          isCorrect={isCorrect} 
        />
      </div>
      
      {explanation && (
        <div className="mt-3 sm:mt-8 pt-3 sm:pt-6 border-t border-[var(--color-brand-border)]">
          <p className="text-[var(--color-brand-text-secondary)]">
            <strong className="text-[var(--color-brand-text-primary)]">Did you know?</strong> {explanation}
          </p>
        </div>
      )}

      <div className="mt-4 sm:mt-8 relative group flex flex-col gap-2 sm:gap-4">
        <CountdownRing durationMs={2500} onComplete={onNext} />
        
        <div className="flex flex-col md:flex-row gap-2 sm:gap-4 w-full relative z-10">
          {onBonusRound && (
            <button 
              onClick={onBonusRound}
              className="flex-1 py-2.5 sm:py-4 bg-blue-600 text-white font-bold font-mono uppercase tracking-widest text-sm sm:text-lg md:text-xl 
                border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] 
                hover:-translate-y-1 hover:shadow-[6px_6px_0_rgba(0,0,0,1)] hover:bg-blue-500
                active:translate-y-0.5 active:shadow-[2px_2px_0_rgba(0,0,0,1)] 
                transition-all duration-150"
            >
              Play Bonus Round
            </button>
          )}

          <button 
            onClick={onNext}
            className="flex-1 py-2.5 sm:py-4 bg-black text-white font-bold font-mono uppercase tracking-widest text-sm sm:text-lg md:text-xl 
              border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] 
              hover:-translate-y-1 hover:shadow-[6px_6px_0_rgba(0,0,0,1)] 
              active:translate-y-0.5 active:shadow-[2px_2px_0_rgba(0,0,0,1)] 
              transition-all duration-150"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
