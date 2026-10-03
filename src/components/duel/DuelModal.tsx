import { useState, useEffect } from 'react';
import { DuelMatchView } from './DuelMatchView';

interface DuelModalProps {
  compairScore?: number;
  onClose: (won: boolean) => void;
}

export function DuelModal({ compairScore = 0, onClose }: DuelModalProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/duel/start', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ 
            mode: 'house', 
            difficulty: 'pro',
            totalRounds: 3, 
            playerName: 'Streak Master' 
          }),
        });
        if (!res.ok) throw new Error('Failed to create bonus duel');
        const data = await res.json();
        if (mounted) {
          sessionStorage.setItem('duel_token', data.playerAToken);
          sessionStorage.setItem('duel_seat', 'A');
          setSessionId(data.sessionId);
          setLoading(false);
        }
      } catch (e) {
        console.error('Failed to initialize bonus duel', e);
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-[#f4f4f0] border-4 border-black p-4 md:p-6 relative shadow-[12px_12px_0_#000] my-auto">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b-2 border-black">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <span className="font-mono font-black text-sm md:text-base uppercase tracking-wider text-black">
              BONUS STREAK SHOWDOWN: 3-ROUND SPEED CLASH
            </span>
          </div>
          <button
            onClick={() => onClose(false)}
            className="px-3 py-1 bg-black text-white font-mono font-black text-xs uppercase tracking-wider hover:bg-gray-800 transition-colors shadow-[2px_2px_0_#000]"
          >
            ✕ RETURN TO SOLO
          </button>
        </div>

        {loading || !sessionId ? (
          <div className="py-20 text-center font-mono font-bold text-gray-600 animate-pulse">
            PREPARING LIGHTNING BATTLEGROUND...
          </div>
        ) : (
          <DuelMatchView sessionId={sessionId} />
        )}
      </div>
    </div>
  );
}
