import { useState, useEffect } from 'react';
import type { ComparisonDuelSessionState } from '../../lib/duel/types';

interface DuelReplayViewerProps {
  gameId: string;
  initialSessionData?: any;
}

export function DuelReplayViewer({ gameId, initialSessionData }: DuelReplayViewerProps) {
  const [session, setSession] = useState<any>(initialSessionData ?? null);
  const [currentRoundIdx, setCurrentRoundIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(!initialSessionData);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!initialSessionData) {
      (async () => {
        try {
          const res = await fetch(`/api/duel/${gameId}`);
          if (!res.ok) throw new Error('Match replay not found');
          const data = await res.json();
          setSession(data);
          setLoading(false);
        } catch (e: any) {
          setError(e.message);
          setLoading(false);
        }
      })();
    }
  }, [gameId, initialSessionData]);

  const state = session?.state as ComparisonDuelSessionState | undefined;
  const history = state?.roundsHistory || [];
  const totalRounds = history.length;

  // Auto playback
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && totalRounds > 0) {
      timer = setInterval(() => {
        setCurrentRoundIdx(prev => {
          if (prev >= totalRounds - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, totalRounds]);

  if (loading) {
    return (
      <div className="w-full bg-white border-4 border-black p-8 text-center shadow-[6px_6px_0_#000]">
        <div className="animate-spin text-4xl mb-3">⏳</div>
        <p className="font-mono text-sm font-bold uppercase">Loading Match Replay...</p>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="w-full bg-white border-4 border-black p-8 text-center shadow-[6px_6px_0_#000]">
        <p className="font-mono text-sm font-bold text-red-600 mb-4">{error || 'Replay not available'}</p>
        <a href="/duel" className="inline-block px-4 py-2 bg-black text-white font-mono text-xs uppercase font-bold">
          ← Back to Arena
        </a>
      </div>
    );
  }

  const currentRound = history[currentRoundIdx];

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Match Overview Header */}
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_#000]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="font-mono text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-black text-white mb-2 inline-block">
              COMPARISON SHOWDOWN REPLAY
            </span>
            <h2 className="text-2xl md:text-3xl font-display font-black uppercase">
              {state.playerA.name} <span className="text-gray-400">vs</span> {state.playerB.name}
            </h2>
          </div>

          <div className="flex items-center gap-4 bg-[#f4f4f0] border-2 border-black px-4 py-2">
            <div className="text-right">
              <span className="text-[10px] font-mono font-bold uppercase text-gray-500 block">FINAL SCORE</span>
              <span className="text-xl font-display font-black text-black">
                {state.playerA.score} - {state.playerB.score}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Round Viewer */}
      {currentRound ? (
        <div className="bg-white border-4 border-black p-6 md:p-8 shadow-[6px_6px_0_#000]">
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-black">
            <span className="font-mono text-xs font-black uppercase tracking-wider bg-[var(--color-brand-accent)] text-white px-2 py-1 border border-black">
              ROUND {currentRound.round} OF {totalRounds}
            </span>
            <span className="font-mono text-xs font-bold text-gray-600 uppercase">
              {currentRound.question.stat.name}
            </span>
          </div>

          <h3 className="text-2xl md:text-3xl font-display font-black text-center uppercase tracking-tight mb-8">
            WHICH HAS A HIGHER {currentRound.question.stat.name.toUpperCase()}?
          </h3>

          {/* Cards display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative mb-8">
            {/* Entity A */}
            <div className={`p-6 border-4 shadow-[4px_4px_0_#000] flex flex-col justify-between ${
              currentRound.question.correctEntityId === currentRound.question.entityA.id
                ? 'bg-green-50 border-green-600'
                : 'bg-white border-black'
            }`}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-mono font-bold uppercase text-gray-500">OPTION A</span>
                {currentRound.choiceA === currentRound.question.entityA.id && (
                  <span className="text-[10px] font-mono font-black uppercase bg-black text-white px-2 py-0.5">
                    {state.playerA.name}'S PICK
                  </span>
                )}
                {currentRound.choiceB === currentRound.question.entityA.id && (
                  <span className="text-[10px] font-mono font-black uppercase bg-purple-600 text-white px-2 py-0.5">
                    {state.playerB.name}'S PICK
                  </span>
                )}
              </div>
              <h4 className="text-xl font-display font-black uppercase mb-4">
                {currentRound.question.entityA.name}
              </h4>
              <div className="text-2xl font-mono font-black text-black pt-4 border-t border-black/10">
                {currentRound.question.entityA.value?.toLocaleString()}{' '}
                <span className="text-xs font-normal text-gray-500">{currentRound.question.stat.unit}</span>
              </div>
            </div>

            {/* Entity B */}
            <div className={`p-6 border-4 shadow-[4px_4px_0_#000] flex flex-col justify-between ${
              currentRound.question.correctEntityId === currentRound.question.entityB.id
                ? 'bg-green-50 border-green-600'
                : 'bg-white border-black'
            }`}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-mono font-bold uppercase text-gray-500">OPTION B</span>
                {currentRound.choiceA === currentRound.question.entityB.id && (
                  <span className="text-[10px] font-mono font-black uppercase bg-black text-white px-2 py-0.5">
                    {state.playerA.name}'S PICK
                  </span>
                )}
                {currentRound.choiceB === currentRound.question.entityB.id && (
                  <span className="text-[10px] font-mono font-black uppercase bg-purple-600 text-white px-2 py-0.5">
                    {state.playerB.name}'S PICK
                  </span>
                )}
              </div>
              <h4 className="text-xl font-display font-black uppercase mb-4">
                {currentRound.question.entityB.name}
              </h4>
              <div className="text-2xl font-mono font-black text-black pt-4 border-t border-black/10">
                {currentRound.question.entityB.value?.toLocaleString()}{' '}
                <span className="text-xs font-normal text-gray-500">{currentRound.question.stat.unit}</span>
              </div>
            </div>
          </div>

          {/* Stepper Controls */}
          <div className="flex items-center justify-between pt-6 border-t-2 border-black">
            <button
              onClick={() => setCurrentRoundIdx(Math.max(0, currentRoundIdx - 1))}
              disabled={currentRoundIdx === 0}
              className="px-4 py-2 bg-white border-2 border-black font-mono text-xs font-black uppercase disabled:opacity-30 hover:bg-gray-100"
            >
              ← PREV ROUND
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-6 py-2 bg-black text-white border-2 border-black font-mono text-xs font-black uppercase hover:bg-gray-800"
            >
              {isPlaying ? '⏸ PAUSE' : '▶ AUTO PLAY'}
            </button>

            <button
              onClick={() => setCurrentRoundIdx(Math.min(totalRounds - 1, currentRoundIdx + 1))}
              disabled={currentRoundIdx === totalRounds - 1}
              className="px-4 py-2 bg-white border-2 border-black font-mono text-xs font-black uppercase disabled:opacity-30 hover:bg-gray-100"
            >
              NEXT ROUND →
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border-4 border-black p-8 text-center">
          <p className="font-mono text-xs uppercase font-bold text-gray-500">No round history recorded for this match.</p>
        </div>
      )}
    </div>
  );
}
