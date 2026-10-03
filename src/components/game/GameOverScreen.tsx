import { useEffect, useRef } from 'react';
import anime from 'animejs';
import { DuelInviteCard } from '../duel/DuelInviteCard';

interface GameOverScreenProps {
  score: number;
  questionsAnswered: number;
  correctAnswers: number;
  streak: number;
  allTimeBestScore?: number;
  allTimeBestStreak?: number;
  isNewBestScore?: boolean;
  isNewBestStreak?: boolean;
  onRestart: () => void;
}

export function GameOverScreen({ 
  score, questionsAnswered, correctAnswers, streak, 
  allTimeBestScore, allTimeBestStreak, isNewBestScore, isNewBestStreak, 
  onRestart 
}: GameOverScreenProps) {
  const accuracy = questionsAnswered > 0 ? Math.round((correctAnswers / questionsAnswered) * 100) : 0;
  
  const getHeadlineEmoji = () => {
    if (accuracy >= 90) return 'PERFECT';
    if (accuracy >= 70) return 'SHARP';
    if (accuracy >= 50) return 'DECENT';
    return 'ROUGH RUN';
  };
  
  const scoreRef = useRef<HTMLDivElement>(null);
  const accuracyRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  
  // Animate numbers
  useEffect(() => {
    const counter = { score: 0, accuracy: 0 };
    anime({
      targets: counter,
      score: score,
      accuracy: accuracy,
      round: 1,
      duration: 1500,
      easing: 'easeOutExpo',
      update: () => {
        if (scoreRef.current) scoreRef.current.textContent = counter.score.toLocaleString();
        if (accuracyRef.current) accuracyRef.current.textContent = `${counter.accuracy}%`;
      }
    });

    if (headlineRef.current) {
      anime({
        targets: headlineRef.current,
        scale: [1.2, 1],
        opacity: [0, 1],
        duration: 800,
        easing: 'spring(1, 80, 12, 0)'
      });
    }
  }, [score, accuracy]);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-8 text-center">
      {(isNewBestScore || isNewBestStreak) && (
        <div className="text-white font-mono text-sm font-bold px-4 py-2 border-2 border-black mb-6 animate-pulse uppercase tracking-widest bg-[var(--color-brand-accent)] shadow-[2px_2px_0_#000]">
          ⚡ NEW PERSONAL BEST{isNewBestScore && isNewBestStreak ? '!' : isNewBestScore ? ' SCORE!' : ' STREAK!'}
        </div>
      )}
      
      <div className="text-xl md:text-2xl font-mono text-[var(--color-brand-text-secondary)] font-bold mb-2 uppercase tracking-widest">
        {getHeadlineEmoji()}
      </div>
      <h2 ref={headlineRef} className="text-5xl md:text-7xl font-display font-black mb-12 tracking-tighter uppercase [text-wrap:balance]">GAME OVER</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full mb-12">
        <div className="md:col-span-2 bg-white border-4 border-black p-6 md:p-8 text-left relative overflow-hidden shadow-[4px_4px_0_#000]">
          <div className="text-sm font-mono text-[var(--color-brand-text-secondary)] mb-2 uppercase font-bold tracking-widest">Final Score</div>
          <div ref={scoreRef} className="text-6xl font-bold font-mono text-[var(--color-brand-accent)] tracking-tighter">0</div>
          <div className="absolute bottom-0 left-0 h-2 bg-[var(--color-brand-accent)] transition-all duration-1000" style={{ width: `${Math.min(100, (score / 1500) * 100)}%` }}></div>
        </div>
        
        <div className="md:col-span-1 bg-white border-4 border-black p-6 text-left relative overflow-hidden shadow-[4px_4px_0_#000]">
          <div className="text-sm font-mono text-[var(--color-brand-text-secondary)] mb-2 uppercase font-bold tracking-widest">Accuracy</div>
          <div ref={accuracyRef} className="text-4xl font-bold font-mono">0%</div>
          <div className="absolute bottom-0 left-0 h-2 bg-black transition-all duration-1000" style={{ width: `${accuracy}%` }}></div>
        </div>
        
        <div className="md:col-span-1 bg-white border-4 border-black p-6 text-left shadow-[4px_4px_0_#000]">
          <div className="text-sm font-mono text-[var(--color-brand-text-secondary)] mb-2 uppercase font-bold tracking-widest">Best Streak</div>
          <div className="text-4xl font-bold font-mono text-[var(--color-brand-accent-warm)]">🔥 {streak}</div>
        </div>
        
        <div className="md:col-span-4 bg-white border-4 border-black p-6 text-left flex items-center justify-between shadow-[4px_4px_0_#000]">
          <div className="text-sm font-mono text-[var(--color-brand-text-secondary)] uppercase font-bold tracking-widest">Correct Answers</div>
          <div className="text-3xl font-bold font-mono">{correctAnswers}<span className="text-xl text-[var(--color-brand-text-secondary)] ml-1">/ {questionsAnswered}</span></div>
        </div>
      </div>
      
      {(allTimeBestScore !== undefined && allTimeBestStreak !== undefined) && (
        <div className="text-[var(--color-brand-text-secondary)] font-mono text-sm mb-12 border-t-2 border-[var(--color-brand-border)] pt-6 w-full opacity-70">
          ALL-TIME BEST: <span className="font-bold text-[var(--color-brand-text-primary)]">{allTimeBestScore.toLocaleString()}</span> PTS | <span className="font-bold text-[var(--color-brand-text-primary)]">🔥 {allTimeBestStreak}</span> STREAK
        </div>
      )}
      
      <div className="w-full max-w-md flex flex-col gap-4">
        <button 
          onClick={onRestart}
          className="w-full py-5 bg-[var(--color-brand-accent)] text-white font-bold font-mono tracking-widest uppercase text-xl border-4 border-black shadow-[6px_6px_0_#000] hover:-translate-y-1 hover:shadow-[8px_8px_0_#000] active:translate-y-0.5 active:shadow-[2px_2px_0_#000] transition-all duration-150"
        >
          Play again →
        </button>
        <a 
          href="/play"
          className="w-full py-5 bg-white border-4 border-black text-black font-bold font-mono tracking-widest uppercase text-lg shadow-[6px_6px_0_#000] hover:-translate-y-1 hover:shadow-[8px_8px_0_#000] active:translate-y-0.5 active:shadow-[2px_2px_0_#000] transition-all duration-150 text-center"
        >
          Choose category
        </a>
      </div>

      <div className="w-full mt-16 max-w-4xl">
        <DuelInviteCard />
      </div>
    </div>
  );
}
