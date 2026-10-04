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
        <div className="text-black font-mono text-sm font-black px-4 py-2 rounded-lg neo-border-sm mb-6 animate-pulse uppercase tracking-widest bg-[var(--color-brand-accent)] neo-shadow-sm">
          ⚡ NEW PERSONAL BEST{isNewBestScore && isNewBestStreak ? '!' : isNewBestScore ? ' SCORE!' : ' STREAK!'}
        </div>
      )}
      
      <div className="text-xl md:text-2xl font-mono text-gray-500 font-bold mb-2 uppercase tracking-widest">
        {getHeadlineEmoji()}
      </div>
      <h2 ref={headlineRef} className="text-3xl sm:text-5xl md:text-7xl font-display font-black mb-4 sm:mb-12 tracking-tighter uppercase [text-wrap:balance] text-black drop-shadow-sm">GAME OVER</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 w-full mb-4 sm:mb-12">
        <div className="col-span-2 md:col-span-2 neo-panel p-4 sm:p-6 md:p-8 text-left relative overflow-hidden rounded-2xl">
          <div className="text-xs sm:text-sm font-mono text-black mb-1 sm:mb-2 uppercase font-black tracking-widest">Final Score</div>
          <div ref={scoreRef} className="text-5xl sm:text-6xl font-black font-mono text-[var(--color-brand-accent)] tracking-tighter" style={{ textShadow: '2px 2px 0 #000' }}>0</div>
          <div className="absolute bottom-0 left-0 h-1.5 border-r-2 border-black bg-[var(--color-brand-accent)] transition-all duration-1000" style={{ width: `${Math.min(100, (score / 1500) * 100)}%` }}></div>
        </div>
        
        <div className="col-span-1 md:col-span-1 neo-panel p-4 sm:p-6 text-left relative overflow-hidden rounded-2xl">
          <div className="text-xs sm:text-sm font-mono text-black mb-1 sm:mb-2 uppercase font-black tracking-widest">Accuracy</div>
          <div ref={accuracyRef} className="text-3xl sm:text-4xl font-black font-mono text-black">0%</div>
          <div className="absolute bottom-0 left-0 h-1.5 border-r-2 border-black bg-gray-900 transition-all duration-1000" style={{ width: `${accuracy}%` }}></div>
        </div>
        
        <div className="col-span-1 md:col-span-1 neo-panel p-4 sm:p-6 text-left rounded-2xl">
          <div className="text-xs sm:text-sm font-mono text-black mb-1 sm:mb-2 uppercase font-black tracking-widest">Best Streak</div>
          <div className="text-3xl sm:text-4xl font-black font-mono text-[var(--color-brand-accent)]" style={{ textShadow: '1.5px 1.5px 0 #000' }}>🔥 {streak}</div>
        </div>
        
        <div className="col-span-2 md:col-span-4 neo-panel p-4 sm:p-6 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-2xl gap-2">
          <div className="text-xs sm:text-sm font-mono text-black uppercase font-black tracking-widest">Correct Answers</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-black">{correctAnswers}<span className="text-lg sm:text-xl text-gray-500 ml-1">/ {questionsAnswered}</span></div>
        </div>
      </div>
      
      {(allTimeBestScore !== undefined && allTimeBestStreak !== undefined) && (
        <div className="text-gray-900 font-mono text-sm mb-4 sm:mb-12 border-t-2 border-black border-dashed pt-3 sm:pt-6 w-full font-bold">
          ALL-TIME BEST: <span className="font-black text-black bg-white px-2 py-0.5 rounded-sm neo-border-sm mx-1">{allTimeBestScore.toLocaleString()}</span> PTS | <span className="font-black text-black bg-white px-2 py-0.5 rounded-sm neo-border-sm mx-1">🔥 {allTimeBestStreak}</span> STREAK
        </div>
      )}
      
      <div className="w-full max-w-md flex flex-col gap-4">
        <button 
          onClick={onRestart}
          className="w-full py-4 sm:py-5 bg-[var(--color-brand-accent)] text-black font-black font-mono tracking-widest uppercase text-base sm:text-xl rounded-xl neo-border neo-shadow neo-btn group"
        >
          Play again <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
        </button>
        <a 
          href="/play"
          className="w-full py-4 sm:py-5 bg-white neo-border text-black font-black font-mono tracking-widest uppercase text-sm sm:text-lg rounded-xl neo-btn hover:neo-shadow-sm text-center"
        >
          Choose category
        </a>
      </div>

      <div className="w-full mt-8 md:mt-16 max-w-4xl px-2 sm:px-0">
        <DuelInviteCard />
      </div>
    </div>
  );
}
