import { useState, useEffect, useCallback, useRef } from 'react';
import { ComparisonCard } from './ComparisonCard';
import { AnswerReveal } from './AnswerReveal';
import { GameOverScreen } from './GameOverScreen';
import { StatHighlight } from './StatHighlight';
import { AnswerBurst } from './AnswerBurst';
import { DuelModal } from '../duel/DuelModal';
import { useSFX } from '../../lib/hooks/useSFX';
import { screenshake } from '../../lib/animation/effects';
import { animateHeadlineIn } from '../../lib/animation/textSplit';

interface GameBoardProps {
  categoryId?: string;
}

type GameState = 'idle' | 'loading' | 'question' | 'answering' | 'revealed' | 'bonus_round' | 'error' | 'gameover';

const STAT_VERB_MAP: Record<string, string> = {
  weight:             'WHICH WEIGHS MORE?',
  'top-speed':        'WHICH IS FASTER?',
  height:             'WHICH IS TALLER?',
  length:             'WHICH IS LONGER?',
  lifespan:           'WHICH LIVES LONGER?',
  depth:              'WHICH IS DEEPER?',
  duration:           'WHICH LASTED LONGER?',
  temperature:        'WHICH IS HOTTER?',
  'distance-from-sun':'WHICH IS FARTHER FROM THE SUN?',
  age:                'WHICH IS OLDER?',
  volume:             'WHICH IS BIGGER?',
};

export function GameBoard({ categoryId }: GameBoardProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [question, setQuestion] = useState<any>(null);
  const [answerResult, setAnswerResult] = useState<any>(null);
  const [stats, setStats] = useState({ score: 0, streak: 0, questionsAnswered: 0, correctAnswers: 0, bestStreak: 0 });
  const [allTimeBest, setAllTimeBest] = useState({ score: 0, streak: 0 });
  const [newBestFlags, setNewBestFlags] = useState({ score: false, streak: false });
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [bonusMultiplier, setBonusMultiplier] = useState<number>(1);
  const { play } = useSFX();
  const boardRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const prefetchPromiseRef = useRef<Promise<any> | null>(null);

  const initGame = useCallback(async () => {
    // Load all-time best
    try {
      const stored = JSON.parse(localStorage.getItem('compair_record') ?? '{}');
      setAllTimeBest({ score: stored.score ?? 0, streak: stored.streak ?? 0 });
    } catch (e) {
      // Ignore JSON parse errors
    }

    setGameState('loading');
    try {
      const res = await fetch('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId })
      });
      if (!res.ok) throw new Error('Failed to start game');
      const data = await res.json();
      setSessionId(data.sessionId);
      setStats({ score: 0, streak: 0, questionsAnswered: 0, correctAnswers: 0, bestStreak: 0 });
      fetchNextQuestion(data.sessionId, 0);
    } catch (err) {
      setGameState('error');
    }
  }, [categoryId]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'question' && question) {
        if (e.key === '1') handleSelect(question.entityA.id);
        if (e.key === '2') handleSelect(question.entityB.id);
      } else if (gameState === 'revealed' && sessionId) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          fetchNextQuestion(sessionId);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, question, sessionId, stats.questionsAnswered]);

  // Auto-advance for AnswerReveal
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    if (gameState === 'revealed' && sessionId) {
      timeoutId = setTimeout(() => {
        fetchNextQuestion(sessionId);
      }, 2500);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [gameState, sessionId, stats.questionsAnswered, bonusMultiplier]);

  // 10-second Time Limit per question
  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;
    if (gameState === 'question') {
      timerId = setTimeout(() => {
        handleSelect(null); // Time out = wrong answer
      }, 10000);
    }
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [gameState, question]);

  // Headline Animation
  useEffect(() => {
    if (gameState === 'question' && headlineRef.current && question) {
      animateHeadlineIn(headlineRef.current);
    }
  }, [gameState, question?.questionId]);

  const fetchNextQuestion = async (sid: string, currentQuestionsAnswered = stats.questionsAnswered) => {
    if (currentQuestionsAnswered >= 10) {
      setGameState('gameover');
      
      // Update all-time best if needed
      const isNewBestScore = stats.score > allTimeBest.score;
      const isNewBestStreak = stats.bestStreak > allTimeBest.streak;
      
      if (isNewBestScore || isNewBestStreak) {
        setNewBestFlags({ score: isNewBestScore, streak: isNewBestStreak });
        localStorage.setItem('compair_record', JSON.stringify({
          score: Math.max(stats.score, allTimeBest.score),
          streak: Math.max(stats.bestStreak, allTimeBest.streak)
        }));
        play('highscore');
      } else {
        play('gameover');
      }

      // Fire and forget to record end time
      fetch(`/api/game/${sid}/end`, { method: 'POST' }).catch(() => {});
      return;
    }

    setGameState('loading');
    setAnswerResult(null);
    try {
      let data;
      if (prefetchPromiseRef.current) {
        data = await prefetchPromiseRef.current;
        prefetchPromiseRef.current = null;
      } else {
        const url = new URL(window.location.origin + `/api/game/${sid}/question`);
        if (categoryId) url.searchParams.set('categoryId', categoryId);
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error('Failed to load question');
        data = await res.json();
      }
      
      setQuestion(data);
      setGameState('question');
      setQuestionStartTime(Date.now());
    } catch (err) {
      setGameState('error');
    }
  };

  const handleSelect = async (entityId: string | null) => {
    if (gameState !== 'question' || !sessionId || !question) return;
    
    if (entityId) {
      play('select');
    }
    setGameState('answering');
    
    const timeRemainingMs = Math.max(0, 10000 - (Date.now() - questionStartTime));

    try {
      const res = await fetch(`/api/game/${sessionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.questionId,
          answerEntityId: entityId,
          currentStreak: stats.streak,
          timeRemainingMs
        })
      });
      
      const data = await res.json();
      
      // Apply bonus multiplier if any
      if (bonusMultiplier > 1 && data.isCorrect) {
        data.totalScore = Math.round(data.totalScore * bonusMultiplier);
        setBonusMultiplier(1);
      }

      setAnswerResult(data);
      const newQuestionsAnswered = stats.questionsAnswered + 1;
      setStats(prev => ({ 
        score: data.totalScore, 
        streak: data.newStreak,
        questionsAnswered: newQuestionsAnswered,
        correctAnswers: prev.correctAnswers + (data.isCorrect ? 1 : 0),
        bestStreak: Math.max(prev.bestStreak, data.newStreak)
      }));
      
      if (data.isCorrect) {
        if (data.newStreak > 2 && data.newStreak > stats.streak) {
          play('streak');
        } else {
          play('correct');
        }
      } else {
        play('wrong');
        if (boardRef.current) screenshake(boardRef.current);
      }
      
      if (newQuestionsAnswered < 10) {
        const url = new URL(window.location.origin + `/api/game/${sessionId}/question`);
        if (categoryId) url.searchParams.set('categoryId', categoryId);
        prefetchPromiseRef.current = fetch(url.toString()).then(r => {
          if (!r.ok) throw new Error();
          return r.json();
        }).catch(() => null);
      }
      
      setGameState('revealed');
    } catch (err) {
      setGameState('error');
    }
  };

  const buildExplanation = () => {
    if (!question) return '';
    const { entityA, entityB } = question;
    const ratio = Math.max(entityA.value, entityB.value) / Math.min(entityA.value, entityB.value);
    const larger = entityA.value > entityB.value ? entityA.name : entityB.name;
    const smaller = entityA.value > entityB.value ? entityB.name : entityA.name;
    return `The ${larger} has roughly ${ratio.toFixed(1)}× the ${question.stat.name.toLowerCase()} of the ${smaller}.`;
  };

  if (gameState === 'idle' || gameState === 'loading') {
    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
        <div className="flex w-full justify-center items-center mb-8 px-4 opacity-50">
          <div className="bg-white border-4 border-black px-6 py-3 shadow-[4px_4px_0_#000] font-mono font-bold">LOADING...</div>
        </div>
        <h2 className="text-3xl md:text-5xl font-display font-bold text-center mb-12 tracking-tight opacity-30 animate-pulse">
          WHICH IS HIGHER?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full px-4 relative">
          <div className="flex flex-col items-center justify-center p-8 md:p-12 min-h-[300px] neo-glass">
            <div className="w-32 h-32 md:w-40 md:h-40 bg-black/10 animate-pulse mb-6 mx-auto" />
            <div className="h-6 w-3/4 bg-black/10 animate-pulse mb-3 mx-auto" />
            <div className="h-4 w-1/2 bg-black/10 animate-pulse mx-auto" />
          </div>
          <div className="md:hidden flex items-center justify-center py-2 text-[var(--color-brand-text-secondary)] font-display font-bold opacity-50">VS</div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-[#f4f4f0] border-4 border-black items-center justify-center z-10 hidden md:flex animate-pulse" />
          <div className="flex flex-col items-center justify-center p-8 md:p-12 min-h-[300px] neo-glass">
            <div className="w-32 h-32 md:w-40 md:h-40 bg-black/10 animate-pulse mb-6 mx-auto" style={{ animationDelay: '150ms' }} />
            <div className="h-6 w-3/4 bg-black/10 animate-pulse mb-3 mx-auto" style={{ animationDelay: '150ms' }} />
            <div className="h-4 w-1/2 bg-black/10 animate-pulse mx-auto" style={{ animationDelay: '150ms' }} />
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-[var(--color-brand-incorrect)] font-display text-2xl">
          An error occurred.
        </div>
        <button 
          onClick={() => sessionId ? fetchNextQuestion(sessionId) : initGame()}
          className="mt-4 px-6 py-3 bg-black text-white font-mono font-bold uppercase border-4 border-black shadow-[4px_4px_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_#000] active:translate-y-0 active:shadow-[2px_2px_0_#000] transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (gameState === 'gameover') {
    return (
      <GameOverScreen 
        score={stats.score}
        questionsAnswered={stats.questionsAnswered}
        correctAnswers={stats.correctAnswers}
        streak={stats.bestStreak}
        allTimeBestScore={allTimeBest.score}
        allTimeBestStreak={allTimeBest.streak}
        isNewBestScore={newBestFlags.score}
        isNewBestStreak={newBestFlags.streak}
        onRestart={() => {
          window.location.reload();
        }}
      />
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center relative" ref={boardRef}>
      
      {/* Top Time Bar (Full width) */}
      {gameState === 'question' && (
        <div className="absolute -top-4 md:-top-8 left-0 right-0 h-1 bg-black/10 overflow-hidden rounded-none z-30">
          <div 
            className="h-full bg-[var(--color-brand-accent)] origin-left"
            style={{ animation: 'shrink 10s linear forwards' }}
          />
        </div>
      )}

      {/* Unified HUD Strip */}
      <div className="flex w-full justify-between items-center mb-8 px-4 z-20">
        <div className="w-full bg-white border-4 border-black p-3 shadow-[4px_4px_0_#000] flex justify-between items-center">
          {/* Score section */}
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] md:text-xs uppercase font-bold text-gray-500 hidden sm:inline">Score</span>
            <span className="font-mono font-black text-lg md:text-xl text-[var(--color-brand-accent)]">{stats.score.toLocaleString()}</span>
          </div>

          {/* Question progress pips */}
          <div className="flex items-center gap-1.5 md:gap-2 mx-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full border border-black transition-all duration-300 ${
                  i < stats.questionsAnswered ? 'bg-black scale-100' : 'bg-black/10 scale-90'
                }`}
              />
            ))}
          </div>

          {/* Streak section */}
          <div className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 border-2 border-black transition-all duration-300 ${
            stats.streak >= 3 ? 'bg-[var(--color-brand-accent-warm)] text-white' : 'bg-gray-100 text-gray-400'
          }`}>
            <span className="text-sm md:text-base">{stats.streak >= 3 ? '🔥' : '—'}</span>
            <span className="font-mono font-bold text-xs md:text-sm">{stats.streak >= 3 ? `×${stats.streak}` : 'STREAK'}</span>
            {answerResult?.multiplier && answerResult.multiplier > 1 && (
              <span className="font-mono text-[10px] px-1 py-0.5 bg-black/20 text-white font-bold animate-pulse ml-1 hidden sm:inline">
                ×{answerResult.multiplier}
              </span>
            )}
          </div>
        </div>
      </div>

      <h2 key={question.questionId} ref={headlineRef} className="text-2xl md:text-4xl lg:text-5xl font-display font-black text-center mb-8 tracking-tighter uppercase [text-wrap:balance]">
        {STAT_VERB_MAP[question.stat.id] || `WHICH HAS HIGHER `}
        {!STAT_VERB_MAP[question.stat.id] && <StatHighlight trigger={question.questionId}>{question.stat.name}?</StatHighlight>}
      </h2>

      {gameState === 'revealed' && answerResult !== null && (
        <div className="w-full flex justify-center mb-8 z-20" style={{ animation: 'slideInUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}>
          <div className={`flex flex-col items-center justify-center px-8 py-3 border-4 border-black shadow-[8px_8px_0_0_#000] ${answerResult.isCorrect ? 'bg-[var(--color-brand-correct)] text-black' : 'bg-[var(--color-brand-incorrect)] text-black'}`}>
            <div className="text-4xl font-display font-black uppercase tracking-widest">
              {answerResult.isTimeOut ? 'TIME OUT' : answerResult.isCorrect ? 'CORRECT' : 'WRONG'}
            </div>
            {answerResult.isCorrect && answerResult.multiplier > 1.2 && (
              <div className="text-sm font-mono font-bold uppercase mt-1 opacity-80">
                Speed Bonus!
              </div>
            )}
          </div>
        </div>
      )}

      {gameState === 'revealed' && answerResult !== null && (
        <AnswerBurst isCorrect={answerResult.isCorrect} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full px-4 relative">
        <ComparisonCard 
          name={question.entityA.name}
          emoji={question.entityA.emoji}
          imageUrl={question.entityA.imageUrl}
          statValue={question.entityA.value}
          statUnit={question.stat.unit}
          isRevealed={gameState === 'revealed'}
          isWinner={gameState === 'revealed' && answerResult?.correctEntityId === question.entityA.id}
          onSelect={() => handleSelect(question.entityA.id)}
          disabled={gameState !== 'question'}
          className={gameState === 'question' ? 'animate-slide-in-left' : ''}
        />
        
        {/* Desktop Divider */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-[var(--color-brand-accent)] border-4 border-black items-center justify-center font-display font-black text-white text-2xl z-10 hidden md:flex shadow-[6px_6px_0_#000] rotate-3 transition-transform hover:scale-110">
          VS
        </div>
        
        {/* Mobile Divider */}
        <div className="md:hidden flex items-center justify-center py-4 relative z-10">
          <div className="px-4 py-2 bg-[var(--color-brand-accent)] border-2 border-black text-white font-display font-black rotate-2 shadow-[4px_4px_0_#000]">
            VS
          </div>
        </div>

        <ComparisonCard 
          name={question.entityB.name}
          emoji={question.entityB.emoji}
          imageUrl={question.entityB.imageUrl}
          statValue={question.entityB.value}
          statUnit={question.stat.unit}
          isRevealed={gameState === 'revealed'}
          isWinner={gameState === 'revealed' && answerResult?.correctEntityId === question.entityB.id}
          onSelect={() => handleSelect(question.entityB.id)}
          disabled={gameState !== 'question'}
          className={gameState === 'question' ? 'animate-slide-in-right' : ''}
        />
      </div>

      {gameState === 'revealed' && (
        <AnswerReveal 
          entityA={question.entityA}
          entityB={question.entityB}
          stat={question.stat}
          isCorrect={answerResult?.isCorrect}
          explanation={buildExplanation()}
          onNext={() => fetchNextQuestion(sessionId!)}
          onBonusRound={stats.streak >= 3 ? () => setGameState('bonus_round') : undefined}
        />
      )}

      {gameState === 'bonus_round' && (
        <DuelModal 
          compairScore={stats.score}
          onClose={(won) => {
            if (won) setBonusMultiplier(1.25);
            fetchNextQuestion(sessionId!);
          }} 
        />
      )}
    </div>
  );
}
