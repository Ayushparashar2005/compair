import { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export function DuelInviteCard() {
  const [phase, setPhase] = useState<'idle' | 'loading' | 'waiting' | 'active' | 'finished' | 'error'>('idle');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [gameResult, setGameResult] = useState<{ winner: 'A' | 'B' | null; scores: { A: number; B: number } } | null>(null);
  const [error, setError] = useState('');
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  const handleCreate = async () => {
    setPhase('loading');
    setError('');
    try {
      const res = await fetch('/api/duel/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode: 'pvp' }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSessionId(data.sessionId);
      setToken(data.playerAToken);
      setInviteCode(data.inviteCode);
      const url = `${window.location.origin}/duel?join=${data.inviteCode}`;
      setInviteUrl(url);

      // Store in session storage
      sessionStorage.setItem('duel_session_id', data.sessionId);
      sessionStorage.setItem('duel_token', data.playerAToken);
      sessionStorage.setItem('duel_seat', 'A');

      setPhase('waiting');

      // Poll for friend joining
      pollSession(data.sessionId, data.playerAToken);
    } catch (e: any) {
      setError(e.message);
      setPhase('error');
    }
  };

  const pollSession = (sid: string, tok: string) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/duel/${sid}`, {
          headers: { authorization: `Bearer ${tok}` },
        });
        if (res.status === 404) {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          return;
        }
        const data = await res.json();
        if (data.session?.status === 'active') {
          setPhase('active');
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          pollForResult(sid, tok);
        }
      } catch {}
    }, 2000);
  };

  const pollForResult = (sid: string, tok: string) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/duel/${sid}`, {
          headers: { authorization: `Bearer ${tok}` },
        });
        if (res.status === 404) {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          return;
        }
        const data = await res.json();
        if (data.state?.status === 'finished') {
          setGameResult({ winner: data.state.winner, scores: data.state.scores });
          setPhase('finished');
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        }
      } catch {}
    }, 2000);
  };

  if (phase === 'idle' || phase === 'loading' || phase === 'error') {
    return (
      <div className="w-full bg-white border-4 border-black p-6 md:p-8 shadow-[6px_6px_0_#000] text-left">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="inline-block px-3 py-1 bg-black text-white font-mono text-xs uppercase font-bold tracking-widest mb-3 shadow-[2px_2px_0_#000]">
              New Feature
            </div>
            <h3 className="text-2xl md:text-3xl font-bold font-display uppercase tracking-tight mb-2">
              Challenge a Friend to a Strategy Duel
            </h3>
            <p className="font-mono text-sm text-[var(--color-brand-text-secondary)]">
              Tactical 3×5 grid card battle. Instant multiplayer in browser with zero install.
            </p>
          </div>
          <button
            onClick={handleCreate}
            disabled={phase === 'loading'}
            className="w-full md:w-auto shrink-0 py-4 px-8 bg-[var(--color-brand-accent)] text-white font-bold font-mono tracking-widest uppercase text-base border-4 border-black shadow-[4px_4px_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_#000] active:translate-y-0.5 active:shadow-[2px_2px_0_#000] transition-all disabled:opacity-50"
          >
            {phase === 'loading' ? 'CREATING...' : '⚔️ CREATE DUEL →'}
          </button>
        </div>
        {phase === 'error' && <p className="mt-4 text-[var(--color-brand-incorrect)] font-mono text-sm font-bold">Error: {error}</p>}
      </div>
    );
  }

  if (phase === 'waiting' && inviteUrl && inviteCode) {
    return (
      <div className="w-full bg-white border-4 border-black p-6 md:p-8 shadow-[6px_6px_0_#000] flex flex-col items-center gap-6 text-center">
        <div>
          <h3 className="text-3xl font-bold font-display uppercase tracking-tight mb-1">
            Waiting for Opponent
          </h3>
          <p className="font-mono text-xs font-bold text-gray-500 uppercase tracking-wider">
            Share this 6-letter code or QR link
          </p>
        </div>

        <div className="bg-white p-3 border-4 border-black shadow-[4px_4px_0_#000]">
          <QRCodeSVG value={inviteUrl} size={150} />
        </div>

        <div className="text-center">
          <div className="font-mono text-5xl font-black text-black tracking-widest mb-1">{inviteCode}</div>
          <p className="text-gray-500 font-mono text-xs font-bold uppercase">Room Code</p>
        </div>

        <div className="flex w-full max-w-sm items-center gap-2 bg-[#f4f4f0] p-2 border-2 border-black shadow-[2px_2px_0_#000]">
          <input readOnly value={inviteUrl} onClick={e => e.currentTarget.select()}
            className="flex-1 bg-transparent text-xs font-mono text-black font-bold outline-none px-2" />
          <button onClick={() => navigator.clipboard.writeText(inviteUrl)}
            className="px-4 py-1.5 bg-black text-white font-mono text-xs font-bold border-2 border-black hover:bg-gray-800 transition-colors">
            COPY
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm justify-center">
          <a
            href={`/duel/${sessionId}`}
            className="w-full text-center py-3 bg-[var(--color-brand-accent)] text-white font-mono font-bold text-sm uppercase tracking-widest border-4 border-black shadow-[3px_3px_0_#000] hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#000] transition-all"
          >
            ⚔️ Open Arena Room →
          </a>
        </div>

        <p className="text-emerald-700 font-mono text-xs font-bold uppercase tracking-wider animate-pulse flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-600 rounded-none border border-black inline-block" />
          Listening for opponent to connect...
        </p>
      </div>
    );
  }

  if (phase === 'active') {
    return (
      <div className="w-full bg-white border-4 border-black p-8 shadow-[6px_6px_0_#000] text-center flex flex-col items-center gap-4">
        <div className="text-5xl animate-pulse">⚔️</div>
        <h3 className="text-3xl font-bold font-display uppercase tracking-tight">Match in Progress!</h3>
        <p className="text-gray-600 font-mono text-sm font-medium">Your opponent joined the arena room.</p>
        <a
          href={`/duel/${sessionId}`}
          className="inline-block px-8 py-4 bg-[var(--color-brand-accent)] text-white font-bold font-mono tracking-widest uppercase text-base border-4 border-black shadow-[4px_4px_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_#000] transition-all"
        >
          ⚔️ Jump to Arena Table →
        </a>
      </div>
    );
  }

  if (phase === 'finished' && gameResult) {
    const iWon = gameResult.winner === 'A';
    return (
      <div className={`w-full border-4 border-black p-8 shadow-[6px_6px_0_#000] text-center ${iWon ? 'bg-[var(--color-brand-correct)] text-white' : 'bg-[var(--color-brand-incorrect)] text-white'}`}>
        <div className="text-5xl mb-4">{iWon ? '🏆' : '💀'}</div>
        <h3 className="text-3xl font-bold font-display uppercase mb-2">{iWon ? 'Victory!' : 'Defeated'}</h3>
        <div className="font-mono font-bold text-lg mb-6">
          Final: You {gameResult.scores.A} — {gameResult.scores.B} Opponent
        </div>
        <button
          onClick={() => setPhase('idle')}
          className="px-8 py-4 bg-black text-white font-bold font-mono uppercase tracking-widest border-2 border-black shadow-[4px_4px_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_#000] transition-all"
        >
          Challenge Again
        </button>
      </div>
    );
  }

  return null;
}
