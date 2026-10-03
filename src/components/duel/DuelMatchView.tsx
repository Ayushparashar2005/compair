import { useState, useEffect, useRef, useCallback } from 'react';
import type { ComparisonDuelSessionState, Seat } from '../../lib/duel/types';
import { useSFX } from '../../lib/hooks/useSFX';
import { QRCodeSVG } from 'qrcode.react';

interface DuelMatchViewProps {
  sessionId: string;
}

export function DuelMatchView({ sessionId }: DuelMatchViewProps) {
  const [state, setState] = useState<ComparisonDuelSessionState | null>(null);
  const [token, setToken] = useState<string>('');
  const [seat, setSeat] = useState<Seat>('A');
  const [inviteCode, setInviteCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(10);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [advanceCountdown, setAdvanceCountdown] = useState<number | null>(null);

  const { play } = useSFX();
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);
  const advanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastRoundSeenRef = useRef<number>(0);
  const lastStatusSeenRef = useRef<string>('');

  // 1. Initialize Seat and Token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlSeat = params.get('seat') as Seat | null;

    const storedToken = sessionStorage.getItem('duel_token');
    const storedSeat = (sessionStorage.getItem('duel_seat') as Seat) || 'A';

    const activeToken = urlToken || storedToken || '';
    const activeSeat = urlSeat || storedSeat;

    setToken(activeToken);
    setSeat(activeSeat);

    fetchState(activeToken, activeSeat);
  }, [sessionId]);

  // 2. Fetch Match State from Server
  const fetchState = useCallback(async (activeToken = token, activeSeat = seat) => {
    try {
      const res = await fetch(`/api/duel/${sessionId}`, {
        headers: activeToken ? { authorization: `Bearer ${activeToken}` } : {},
      });
      if (!res.ok) {
        if (res.status === 404) throw new Error('Match not found or expired.');
        throw new Error('Failed to load match state.');
      }
      const data = await res.json();
      const newState = data.state as ComparisonDuelSessionState;

      setState(newState);
      if (data.session?.inviteCode) {
        setInviteCode(data.session.inviteCode);
      }
      setLoading(false);

      // Sound & animations on state transitions
      if (newState.status === 'round_revealed' && lastStatusSeenRef.current !== 'round_revealed') {
        const myPlayer = activeSeat === 'A' ? newState.playerA : newState.playerB;
        if (myPlayer.lastCorrect) {
          if (myPlayer.streak >= 3) {
            play('streak');
          } else {
            play('correct');
          }
        } else {
          play('wrong');
        }
      } else if (newState.status === 'match_finished' && lastStatusSeenRef.current !== 'match_finished') {
        const myScore = activeSeat === 'A' ? newState.playerA.score : newState.playerB.score;
        const opponentScore = activeSeat === 'A' ? newState.playerB.score : newState.playerA.score;
        if (myScore > opponentScore) {
          play('highscore');
        } else {
          play('gameover');
        }
      }

      lastRoundSeenRef.current = newState.currentRound;
      lastStatusSeenRef.current = newState.status;
    } catch (err: any) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  }, [sessionId, token, seat, play]);

  // 3. Polling loop: pauses on tab hide, stops on terminal error
  useEffect(() => {
    if (loading || errorMsg) return;

    const tick = () => {
      if (document.hidden) return;
      fetchState();
    };

    // Fast poll (800ms) during active battle or waiting room
    pollTimerRef.current = setInterval(tick, 850);

    const handleVisibilityChange = () => {
      if (!document.hidden) fetchState();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loading, errorMsg, fetchState]);

  // 4. In-Round Countdown Timer (10s local clock synchronized with roundStartTime)
  useEffect(() => {
    if (state?.status === 'in_round' && state.roundStartTime) {
      if (roundTimerRef.current) clearInterval(roundTimerRef.current);

      const updateClock = () => {
        const elapsed = Date.now() - state.roundStartTime;
        const remaining = Math.max(0, Math.ceil((state.roundTimeLimitMs - elapsed) / 1000));
        setTimeRemaining(remaining);

        // If time runs out and player hasn't answered, trigger timeout auto-submit
        const me = seat === 'A' ? state.playerA : state.playerB;
        if (remaining <= 0 && !me.hasAnswered && !submittingAnswer) {
          handleSelectCard(null);
        }
      };

      updateClock();
      roundTimerRef.current = setInterval(updateClock, 250);

      return () => {
        if (roundTimerRef.current) clearInterval(roundTimerRef.current);
      };
    }
  }, [state?.status, state?.roundStartTime, state?.currentRound, seat, submittingAnswer]);

  // 5. Auto-advance timer when round is revealed (3.5s countdown to next round)
  useEffect(() => {
    if (state?.status === 'round_revealed') {
      setAdvanceCountdown(4);
      const countdownInterval = setInterval(() => {
        setAdvanceCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownInterval);
            triggerNextRound();
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    } else {
      setAdvanceCountdown(null);
    }
  }, [state?.status, state?.currentRound]);

  // Action: Select Card
  const handleSelectCard = async (entityId: string | null) => {
    if (!state || state.status !== 'in_round' || submittingAnswer) return;

    const me = seat === 'A' ? state.playerA : state.playerB;
    if (me.hasAnswered) return;

    setSubmittingAnswer(true);
    play('select');

    const elapsed = Date.now() - state.roundStartTime;
    const timeRemainingMs = Math.max(0, state.roundTimeLimitMs - elapsed);

    try {
      const res = await fetch(`/api/duel/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          action: 'answer',
          selectedEntityId: entityId,
          timeRemainingMs,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setState(data.state);
      }
    } catch (e) {
      console.error('Failed to submit answer', e);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Action: Next Round
  const triggerNextRound = async () => {
    if (!state || state.status !== 'round_revealed') return;
    try {
      const res = await fetch(`/api/duel/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ action: 'next' }),
      });
      if (res.ok) {
        const data = await res.json();
        setState(data.state);
      }
    } catch (e) {
      console.error('Failed to advance round', e);
    }
  };

  // Action: Rematch
  const handleRematch = async () => {
    try {
      const res = await fetch(`/api/duel/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ action: 'rematch' }),
      });
      if (res.ok) {
        const data = await res.json();
        setState(data.state);
      }
    } catch (e) {
      console.error('Failed to request rematch', e);
    }
  };

  // Copy Invite Link Helper
  const copyInviteLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/duel?join=${inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ── Render States ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="w-full max-w-xl mx-auto bg-white border-4 border-black p-10 text-center shadow-[8px_8px_0_#000]">
        <div className="text-5xl mb-4 animate-bounce">⚡</div>
        <h2 className="text-3xl font-display font-black uppercase tracking-tight mb-2">ENTERING DUEL ARENA</h2>
        <p className="font-mono text-gray-600 mb-6 text-sm">Synchronizing comparison deck & live matchmaking...</p>
        <div className="inline-block px-5 py-2.5 bg-black text-white font-mono text-xs uppercase font-bold tracking-widest animate-pulse">
          PREPARING BATTLEGROUND...
        </div>
      </div>
    );
  }

  if (errorMsg || !state) {
    return (
      <div className="w-full max-w-xl mx-auto bg-white border-4 border-black p-8 text-center shadow-[8px_8px_0_#000]">
        <div className="text-5xl mb-3">⚠️</div>
        <h2 className="text-2xl font-display font-black uppercase text-[var(--color-brand-incorrect)] mb-2">
          Arena Connection Error
        </h2>
        <p className="font-mono text-gray-700 text-sm mb-6">{errorMsg || 'Unable to join duel match.'}</p>
        <a
          href="/duel"
          className="inline-block px-8 py-3 bg-black text-white font-mono font-bold uppercase tracking-widest text-sm hover:bg-gray-800 transition-colors shadow-[4px_4px_0_#000]"
        >
          ← Return to Duel Lobby
        </a>
      </div>
    );
  }

  const myPlayer = seat === 'A' ? state.playerA : state.playerB;
  const oppPlayer = seat === 'A' ? state.playerB : state.playerA;
  const isHouse = state.mode === 'house';

  // ── SCREEN 1: WAITING ROOM (PvP before friend joins) ─────────────────────────
  if (state.status === 'waiting') {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/duel?join=${inviteCode}`;

    return (
      <div className="w-full max-w-2xl mx-auto bg-white border-4 border-black p-6 md:p-10 shadow-[8px_8px_0_#000] text-center">
        <div className="inline-block px-4 py-1.5 bg-purple-600 text-white font-mono text-xs uppercase font-black tracking-widest mb-4 border-2 border-black shadow-[2px_2px_0_#000]">
          ROOM OPEN • WAITING FOR OPPONENT
        </div>

        <h1 className="text-3xl md:text-5xl font-display font-black uppercase tracking-tight mb-3">
          Challenge a Friend
        </h1>
        <p className="font-mono text-gray-600 text-sm max-w-md mx-auto mb-8">
          Share your room code or link. When your opponent opens it, the 7-round comparison duel begins immediately!
        </p>

        {/* Room Code Showcase */}
        <div className="bg-[#f4f4f0] border-4 border-black p-6 mb-8 max-w-md mx-auto shadow-[4px_4px_0_#000]">
          <span className="text-xs font-mono font-bold uppercase text-gray-500 tracking-widest block mb-1">
            ROOM INVITE CODE
          </span>
          <div className="text-4xl md:text-5xl font-mono font-black tracking-widest text-black select-all py-1">
            {inviteCode}
          </div>
        </div>

        {/* Share buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto mb-8">
          <button
            onClick={copyInviteLink}
            className={`w-full py-3.5 px-6 font-mono font-black uppercase text-sm tracking-wider border-4 border-black shadow-[4px_4px_0_#000] hover:-translate-y-0.5 active:translate-y-0 transition-all ${
              copied
                ? 'bg-green-500 text-white'
                : 'bg-[var(--color-brand-accent)] text-white hover:bg-orange-600'
            }`}
          >
            {copied ? '✅ LINK COPIED TO CLIPBOARD!' : '📋 COPY INVITE LINK'}
          </button>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center justify-center p-4 bg-white border-2 border-black inline-block mx-auto mb-8 shadow-[3px_3px_0_#000]">
          <QRCodeSVG value={shareUrl} size={150} level="M" />
          <span className="text-[10px] font-mono font-bold text-gray-500 mt-2 uppercase tracking-wider">
            Scan to join on mobile
          </span>
        </div>

        {/* Radar Waiting Indicator */}
        <div className="flex items-center justify-center gap-3 font-mono text-xs uppercase font-bold text-gray-600">
          <span className="w-3 h-3 rounded-full bg-green-500 animate-ping"></span>
          <span>Listening for challenger connection...</span>
        </div>
      </div>
    );
  }

  // ── SCREEN 2: MATCH FINISHED (Victory / Defeat Screen) ───────────────────────
  if (state.status === 'match_finished') {
    const isWinner = myPlayer.score > oppPlayer.score;
    const isTie = myPlayer.score === oppPlayer.score;

    return (
      <div className="w-full max-w-3xl mx-auto bg-white border-4 border-black p-6 md:p-10 shadow-[10px_10px_0_#000] text-center">
        {/* Banner */}
        <div
          className={`inline-block px-6 py-2 font-mono text-sm uppercase font-black tracking-widest mb-4 border-4 border-black shadow-[4px_4px_0_#000] ${
            isTie
              ? 'bg-yellow-400 text-black'
              : isWinner
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {isTie ? '🤝 HARD FOUGHT DRAW' : isWinner ? '🏆 DUEL VICTORY!' : '💀 DEFEAT'}
        </div>

        <h1 className="text-4xl md:text-6xl font-display font-black uppercase tracking-tight mb-6">
          {isTie ? 'DEAD HEAT' : isWinner ? 'ARENA CHAMPION' : 'BETTER LUCK NEXT DUEL'}
        </h1>

        {/* Score comparison card */}
        <div className="grid grid-cols-2 gap-4 bg-[#f4f4f0] border-4 border-black p-6 mb-8 max-w-lg mx-auto shadow-[6px_6px_0_#000]">
          <div className="text-center border-r-2 border-black pr-2">
            <span className="text-xs font-mono font-bold uppercase text-gray-500 block mb-1">
              {myPlayer.name} (YOU)
            </span>
            <div className="text-4xl md:text-5xl font-display font-black text-black">
              {myPlayer.score.toLocaleString()}
            </div>
            <div className="text-xs font-mono font-bold text-[var(--color-brand-accent)] mt-1">
              🔥 Best Streak: {myPlayer.bestStreak}
            </div>
          </div>
          <div className="text-center pl-2">
            <span className="text-xs font-mono font-bold uppercase text-gray-500 block mb-1">
              {oppPlayer.name}
            </span>
            <div className="text-4xl md:text-5xl font-display font-black text-gray-700">
              {oppPlayer.score.toLocaleString()}
            </div>
            <div className="text-xs font-mono font-bold text-gray-500 mt-1">
              🔥 Best Streak: {oppPlayer.bestStreak}
            </div>
          </div>
        </div>

        {/* Round by Round History Breakdown */}
        <div className="mb-8 text-left max-w-xl mx-auto">
          <h3 className="font-mono text-xs font-black uppercase tracking-wider text-gray-500 mb-3">
            ROUND BY ROUND RECAP
          </h3>
          <div className="flex flex-col gap-2">
            {state.roundsHistory.map((rh, idx) => {
              const myPick = seat === 'A' ? rh.choiceA : rh.choiceB;
              const oppPick = seat === 'A' ? rh.choiceB : rh.choiceA;
              const myPts = seat === 'A' ? rh.pointsEarnedA : rh.pointsEarnedB;
              const oppPts = seat === 'A' ? rh.pointsEarnedB : rh.pointsEarnedA;
              const didIWinRound = myPts > oppPts;

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-white border-2 border-black text-xs font-mono shadow-[2px_2px_0_#000]"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-black px-1.5 py-0.5 bg-black text-white text-[10px]">
                      R{rh.round}
                    </span>
                    <span className="font-bold truncate max-w-[180px] sm:max-w-xs">
                      {rh.question.stat.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-bold">
                    <span className={myPts > 0 ? 'text-green-600' : 'text-red-500'}>
                      +{myPts}
                    </span>
                    <span className="text-gray-400">vs</span>
                    <span className={oppPts > 0 ? 'text-green-600' : 'text-red-500'}>
                      +{oppPts}
                    </span>
                    <span className="text-sm">
                      {didIWinRound ? '✅' : myPts === oppPts ? '➖' : '❌'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={handleRematch}
            className="w-full sm:w-auto px-8 py-4 bg-[var(--color-brand-accent)] text-white font-mono font-black uppercase text-sm tracking-wider border-4 border-black shadow-[4px_4px_0_#000] hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            ⚔️ REMATCH (SAME ARENA)
          </button>
          <a
            href="/duel"
            className="w-full sm:w-auto px-8 py-4 bg-white text-black font-mono font-black uppercase text-sm tracking-wider border-4 border-black shadow-[4px_4px_0_#000] hover:bg-gray-100 transition-colors"
          >
            🏠 RETURN TO LOBBY
          </a>
        </div>
      </div>
    );
  }

  // ── SCREEN 3: ACTIVE BATTLEGROUND (in_round / round_revealed) ────────────────
  const q = state.currentQuestion;
  if (!q) return null;

  const totalScore = Math.max(1, myPlayer.score + oppPlayer.score);
  const myScorePct = Math.round((myPlayer.score / totalScore) * 100);

  const isRevealed = state.status === 'round_revealed';
  const myPick = myPlayer.selectedEntityId;
  const oppHasLocked = oppPlayer.hasAnswered;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* ── LIVE DUEL HUD ──────────────────────────────────────────────────────── */}
      <div className="w-full bg-white border-4 border-black p-4 md:p-6 mb-6 shadow-[8px_8px_0_#000]">
        <div className="grid grid-cols-3 items-center gap-2 md:gap-4 mb-4">
          {/* Player 1 (You) */}
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="font-mono text-xs font-black uppercase bg-black text-white px-2 py-0.5 shadow-[1px_1px_0_#000]">
                YOU
              </span>
              <span className="font-mono text-xs md:text-sm font-bold truncate max-w-[100px] md:max-w-[150px]">
                {myPlayer.name}
              </span>
            </div>
            <div className="text-2xl md:text-4xl font-display font-black text-black tracking-tight">
              {myPlayer.score.toLocaleString()} <span className="text-xs font-mono font-normal text-gray-500">PTS</span>
            </div>
            {/* Streak & Status */}
            <div className="flex items-center gap-2 mt-1.5">
              {myPlayer.streak > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--color-brand-accent)] text-white text-[10px] md:text-xs font-mono font-black border border-black shadow-[1px_1px_0_#000] animate-pulse">
                  🔥 {myPlayer.streak} STREAK
                </span>
              )}
              {state.status === 'in_round' && (
                <span
                  className={`text-[10px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 border ${
                    myPlayer.hasAnswered
                      ? 'bg-green-100 text-green-800 border-green-600'
                      : 'bg-yellow-100 text-yellow-800 border-yellow-600 animate-pulse'
                  }`}
                >
                  {myPlayer.hasAnswered ? '⚡ LOCKED IN' : 'THINKING...'}
                </span>
              )}
            </div>
          </div>

          {/* Center Battle Hub: Round & Timer */}
          <div className="flex flex-col items-center justify-center text-center">
            <span className="font-mono text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500 mb-1">
              ROUND {state.currentRound} / {state.totalRounds}
            </span>

            {/* Countdown / Round Indicator */}
            {state.status === 'in_round' ? (
              <div
                className={`w-12 h-12 md:w-16 md:h-16 rounded-none border-4 border-black flex items-center justify-center font-display font-black text-xl md:text-2xl shadow-[3px_3px_0_#000] transition-colors ${
                  timeRemaining <= 3
                    ? 'bg-red-500 text-white animate-bounce'
                    : 'bg-[#f4f4f0] text-black'
                }`}
              >
                {timeRemaining}s
              </div>
            ) : (
              <div className="px-3 py-1 bg-black text-white font-mono text-xs font-black uppercase tracking-widest border-2 border-black animate-pulse">
                {advanceCountdown !== null ? `NEXT IN ${advanceCountdown}s` : 'REVEALING...'}
              </div>
            )}
          </div>

          {/* Player 2 (Opponent) */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="font-mono text-xs md:text-sm font-bold truncate max-w-[100px] md:max-w-[150px]">
                {oppPlayer.name}
              </span>
              <span className="font-mono text-xs font-black uppercase bg-gray-200 text-gray-800 px-2 py-0.5 border border-black shadow-[1px_1px_0_#000]">
                {isHouse ? 'AI' : 'RIVAL'}
              </span>
            </div>
            <div className="text-2xl md:text-4xl font-display font-black text-gray-700 tracking-tight">
              {oppPlayer.score.toLocaleString()} <span className="text-xs font-mono font-normal text-gray-400">PTS</span>
            </div>
            {/* Streak & Status */}
            <div className="flex items-center gap-2 mt-1.5">
              {oppPlayer.streak > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-800 text-[10px] md:text-xs font-mono font-bold border border-black">
                  🔥 {oppPlayer.streak} STREAK
                </span>
              )}
              {state.status === 'in_round' && (
                <span
                  className={`text-[10px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 border ${
                    oppPlayer.hasAnswered
                      ? 'bg-green-100 text-green-800 border-green-600'
                      : 'bg-gray-100 text-gray-600 border-gray-400'
                  }`}
                >
                  {oppPlayer.hasAnswered ? '⚡ LOCKED IN' : 'THINKING...'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Real-time Tug-of-War Score Bar */}
        <div className="w-full bg-gray-200 h-3 border-2 border-black flex overflow-hidden relative shadow-[1px_1px_0_#000]">
          <div
            className="h-full bg-[var(--color-brand-accent)] transition-all duration-500 ease-out"
            style={{ width: `${myScorePct}%` }}
          />
          <div
            className="h-full bg-black transition-all duration-500 ease-out"
            style={{ width: `${100 - myScorePct}%` }}
          />
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white z-10 -translate-x-1/2" />
        </div>
      </div>

      {/* ── QUESTION BANNER ────────────────────────────────────────────────────── */}
      <div className="text-center mb-8 px-4">
        <span className="inline-block px-3 py-1 bg-black text-white font-mono text-[11px] font-black uppercase tracking-widest mb-3 shadow-[2px_2px_0_#000]">
          {q.categoryName ?? 'COMPARISON SHOWDOWN'} • {q.stat.name}
        </span>
        <h2 className="text-3xl md:text-5xl font-display font-black uppercase tracking-tight text-black [text-wrap:balance]">
          WHICH HAS A HIGHER {q.stat.name}?
        </h2>
      </div>

      {/* ── REAL-TIME OPPONENT ALERT BADGE ─────────────────────────────────────── */}
      {state.status === 'in_round' && oppHasLocked && (
        <div className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 bg-yellow-400 text-black font-mono text-xs font-black uppercase border-2 border-black shadow-[3px_3px_0_#000] animate-bounce">
          ⚡ {oppPlayer.name.toUpperCase()} HAS LOCKED IN! ANSWER FAST FOR SPEED BONUS!
        </div>
      )}

      {/* ── COMPARISON CARDS ARENA ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full px-4 relative mb-8">
        {/* CARD A */}
        <BattleCard
          entity={q.entityA}
          statUnit={q.stat.unit}
          isRevealed={isRevealed}
          isCorrectWinner={isRevealed && q.correctEntityId === q.entityA.id}
          isMyPick={myPick === q.entityA.id}
          isOpponentPick={isRevealed && oppPlayer.selectedEntityId === q.entityA.id}
          disabled={state.status !== 'in_round' || myPlayer.hasAnswered || submittingAnswer}
          onSelect={() => handleSelectCard(q.entityA.id)}
        />

        {/* Center VS Emblem */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-[#f4f4f0] border-4 border-black items-center justify-center font-display font-black text-xl z-20 hidden md:flex shadow-[4px_4px_0_#000]">
          VS
        </div>

        {/* CARD B */}
        <BattleCard
          entity={q.entityB}
          statUnit={q.stat.unit}
          isRevealed={isRevealed}
          isCorrectWinner={isRevealed && q.correctEntityId === q.entityB.id}
          isMyPick={myPick === q.entityB.id}
          isOpponentPick={isRevealed && oppPlayer.selectedEntityId === q.entityB.id}
          disabled={state.status !== 'in_round' || myPlayer.hasAnswered || submittingAnswer}
          onSelect={() => handleSelectCard(q.entityB.id)}
        />
      </div>

      {/* ── ROUND REVEAL CALLOUT BANNER ────────────────────────────────────────── */}
      {isRevealed && (
        <div className="w-full max-w-2xl px-4 flex flex-col items-center">
          <div className="w-full bg-white border-4 border-black p-6 text-center shadow-[6px_6px_0_#000] mb-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-2xl">
                {myPlayer.lastCorrect ? '🎯' : '❌'}
              </span>
              <h3 className="text-2xl md:text-3xl font-display font-black uppercase tracking-tight">
                {myPlayer.lastCorrect ? 'CORRECT CALL!' : 'INCORRECT CHOICE'}
              </h3>
            </div>

            {/* Score & speed bonus pills */}
            <div className="flex flex-wrap justify-center gap-2 font-mono text-xs font-bold mb-4">
              <span
                className={`px-3 py-1 border-2 border-black ${
                  myPlayer.lastPointsEarned > 0
                    ? 'bg-green-400 text-black'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                +{myPlayer.lastPointsEarned} PTS EARNED
              </span>

              {myPlayer.lastSpeedBonus && (
                <span className="px-3 py-1 bg-yellow-400 text-black border-2 border-black">
                  ⚡ SPEED BONUS (+30 PTS)
                </span>
              )}

              {oppPlayer.lastSpeedBonus && (
                <span className="px-3 py-1 bg-gray-200 text-black border-2 border-black">
                  🏎️ OPPONENT WAS FASTER
                </span>
              )}
            </div>

            {/* Instant Skip Countdown Button */}
            <button
              onClick={triggerNextRound}
              className="px-6 py-2.5 bg-black text-white font-mono font-black uppercase text-xs tracking-wider border-2 border-black hover:bg-gray-800 transition-colors shadow-[2px_2px_0_#000]"
            >
              NEXT ROUND NOW →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── BATTLE CARD COMPONENT ──────────────────────────────────────────────────────

interface BattleCardProps {
  entity: {
    id: string;
    name: string;
    emoji?: string;
    imageUrl?: string;
    value?: number;
  };
  statUnit?: string | null;
  isRevealed: boolean;
  isCorrectWinner: boolean;
  isMyPick: boolean;
  isOpponentPick: boolean;
  disabled: boolean;
  onSelect: () => void;
}

function BattleCard({
  entity,
  statUnit,
  isRevealed,
  isCorrectWinner,
  isMyPick,
  isOpponentPick,
  disabled,
  onSelect,
}: BattleCardProps) {
  const [imgError, setImgError] = useState(false);

  // Border & background styling based on state
  let cardStyle = 'bg-white border-black';
  if (isRevealed) {
    if (isCorrectWinner) {
      cardStyle = 'bg-green-50 border-green-600 ring-4 ring-green-500';
    } else {
      cardStyle = 'bg-gray-50 border-black opacity-80';
    }
  } else if (isMyPick) {
    cardStyle = 'bg-orange-50 border-[var(--color-brand-accent)] ring-4 ring-[var(--color-brand-accent)]';
  }

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`w-full text-left p-6 md:p-8 border-4 transition-all duration-200 flex flex-col justify-between min-h-[360px] md:min-h-[420px] relative shadow-[6px_6px_0_#000] ${cardStyle} ${
        !disabled && !isMyPick
          ? 'hover:-translate-y-1 hover:shadow-[10px_10px_0_#000] cursor-pointer'
          : 'cursor-default'
      }`}
    >
      {/* Pick Ribbons */}
      <div className="absolute top-4 right-4 flex flex-col gap-1 items-end z-10">
        {isMyPick && (
          <span className="px-3 py-1 bg-[var(--color-brand-accent)] text-white font-mono text-xs font-black uppercase tracking-wider border-2 border-black shadow-[2px_2px_0_#000]">
            ⚡ YOUR PICK
          </span>
        )}
        {isOpponentPick && isRevealed && (
          <span className="px-3 py-1 bg-black text-white font-mono text-xs font-black uppercase tracking-wider border-2 border-black shadow-[2px_2px_0_#000]">
            RIVAL'S PICK
          </span>
        )}
        {isRevealed && isCorrectWinner && (
          <span className="px-3 py-1 bg-green-500 text-white font-mono text-xs font-black uppercase tracking-wider border-2 border-black shadow-[2px_2px_0_#000] animate-bounce">
            🏆 HIGHER STAT
          </span>
        )}
      </div>

      {/* Top: Entity Image or Emoji */}
      <div className="w-full flex justify-center mb-6">
        {entity.imageUrl && !imgError ? (
          <img
            src={entity.imageUrl}
            alt={entity.name}
            onError={() => setImgError(true)}
            className="w-36 h-36 md:w-44 md:h-44 object-cover border-4 border-black shadow-[4px_4px_0_#000]"
          />
        ) : (
          <div className="w-36 h-36 md:w-44 md:h-44 bg-[#f4f4f0] border-4 border-black flex items-center justify-center text-6xl shadow-[4px_4px_0_#000]">
            {entity.emoji ?? '📊'}
          </div>
        )}
      </div>

      {/* Center: Entity Name */}
      <div className="text-center w-full mb-4">
        <h3 className="text-2xl md:text-3xl font-display font-black uppercase tracking-tight text-black line-clamp-2">
          {entity.name}
        </h3>
      </div>

      {/* Bottom: Revealed Value or Pick Prompt */}
      <div className="w-full text-center mt-auto pt-4 border-t-2 border-black/10">
        {isRevealed ? (
          <div className="animate-fade-in">
            <span className="font-mono text-xs text-gray-500 uppercase tracking-widest block mb-0.5">
              ACTUAL METRIC
            </span>
            <div className="text-3xl md:text-4xl font-mono font-black text-black">
              {entity.value !== undefined ? entity.value.toLocaleString() : '—'}{' '}
              <span className="text-sm font-normal text-gray-600">{statUnit ?? ''}</span>
            </div>
          </div>
        ) : isMyPick ? (
          <div className="font-mono text-xs font-black uppercase text-[var(--color-brand-accent)] tracking-widest animate-pulse">
            LOCKED IN • WAITING...
          </div>
        ) : (
          <div className="font-mono text-xs font-bold uppercase text-gray-400 tracking-wider">
            TAP TO CHOOSE
          </div>
        )}
      </div>
    </button>
  );
}
