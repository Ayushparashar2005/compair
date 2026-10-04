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
      className="fixed md:relative bottom-0 left-0 right-0 z-[45] bg-white/95 md:bg-white/80 mt-0 md:mt-8 p-4 sm:p-6 w-full max-w-2xl mx-auto rounded-t-3xl md:rounded-3xl border-t-[3px] md:border-2 border-black shadow-[0_-4px_0_#000] md:neo-shadow-lg max-h-[70vh] md:max-h-none overflow-y-auto"
      style={{
        animation: 'slideInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}
    >
      {/* Mobile drag handle */}
      <div className="w-12 h-1.5 bg-black/10 rounded-full mx-auto mb-4 md:hidden"></div>
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
        <div className="mt-3 sm:mt-8 pt-3 sm:pt-6 border-t border-black/5">
          <p className="text-gray-900 font-mono text-sm sm:text-base leading-relaxed">
            <strong className="bg-[var(--color-brand-accent)] text-black font-black uppercase px-2 py-0.5 neo-border-sm mr-2 text-xs rounded-sm inline-block -translate-y-0.5">DID YOU KNOW?</strong> {explanation}
          </p>
        </div>
      )}

      <div className="mt-4 sm:mt-8 relative group flex flex-col gap-2 sm:gap-4">
        <CountdownRing durationMs={2500} onComplete={onNext} />
        
        <div className="flex flex-col md:flex-row gap-2 sm:gap-4 w-full relative z-10">
          {onBonusRound && (
            <button 
              onClick={onBonusRound}
              className="flex-1 py-3 sm:py-4 bg-indigo-200 text-black font-black font-mono uppercase tracking-widest text-sm sm:text-lg md:text-xl 
                neo-border rounded-xl neo-shadow-sm neo-btn flex items-center justify-center gap-2"
            >
              Play Bonus Round
            </button>
          )}

          <button 
            onClick={onNext}
            className="flex-1 py-3 sm:py-4 bg-white text-black font-black font-mono uppercase tracking-widest text-sm sm:text-lg md:text-xl 
              neo-border rounded-xl neo-shadow-accent neo-btn group flex items-center justify-center gap-2"
          >
            Next <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
