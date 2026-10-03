import type { GameState, Card, Seat, Tile } from '../../lib/duel/types';
import { DuelCard } from './DuelCard';

interface DuelBoardProps {
  state: GameState;
  mySeat: Seat;
  myHand: Card[];
  selectedCard: Card | null;
  legalMoves: string[];
  recruitSourceTile?: { row: number; col: number } | null;
  onTileClick: (row: number, col: number) => void;
  onCardSelect: (card: Card) => void;
}

const COL_LABEL = ['A', 'B', 'C', 'D', 'E'];

export function DuelBoard({
  state,
  mySeat,
  myHand,
  selectedCard,
  legalMoves,
  recruitSourceTile,
  onTileClick,
  onCardSelect
}: DuelBoardProps) {
  const isMyTurn = state.turn === mySeat;
  const enemySeat: Seat = mySeat === 'A' ? 'B' : 'A';

  const myScore = mySeat === 'A' ? state.scores.A : state.scores.B;
  const foeScore = mySeat === 'A' ? state.scores.B : state.scores.A;

  return (
    <div className="flex flex-col items-center gap-5 w-full select-none font-mono">

      {/* Score bar */}
      <div className="w-full max-w-xl bg-white border-4 border-black p-4 shadow-[4px_4px_0_#000] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-blue-600 border-2 border-black" />
          <div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">You (Seat {mySeat})</div>
            <div className="text-2xl font-display font-black leading-none">{myScore} <span className="text-xs font-mono font-bold text-gray-400">PTS</span></div>
          </div>
        </div>

        {/* Tug of war bar */}
        <div className="flex-1 h-4 bg-[#ececec] border-2 border-black overflow-hidden relative">
          <div
            className="h-full bg-[var(--color-brand-accent)] transition-all duration-500"
            style={{ width: `${(myScore / 15) * 100}%` }}
          />
        </div>

        <div className="flex items-center gap-3 text-right">
          <div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Opponent</div>
            <div className="text-2xl font-display font-black leading-none">{foeScore} <span className="text-xs font-mono font-bold text-gray-400">PTS</span></div>
          </div>
          <div className="w-4 h-4 bg-red-600 border-2 border-black" />
        </div>
      </div>

      {/* Turn & instruction status */}
      <div className={`w-full max-w-xl py-2 px-4 border-4 border-black text-center font-bold text-xs uppercase tracking-widest shadow-[3px_3px_0_#000] transition-colors ${
        state.status === 'finished'
          ? (state.winner === mySeat ? 'bg-[var(--color-brand-correct)] text-white' : 'bg-[var(--color-brand-incorrect)] text-white')
          : isMyTurn
            ? 'bg-black text-white'
            : 'bg-white text-gray-500'
      }`}>
        {state.status === 'finished' ? (
          state.winner === mySeat ? '🏆 VICTORY!' : '💀 DEFEATED'
        ) : isMyTurn ? (
          selectedCard?.kind === 'effect' ? (
            (selectedCard as any).effect === 'RECRUIT' ? (
              recruitSourceTile ? '🤝 STEP 2: CHOOSE EMPTY TILE TO PLACE CARD' : '🤝 STEP 1: CLICK ENEMY CARD TO RECRUIT'
            ) : (selectedCard as any).effect === 'BOULDER' ? (
              '🪨 CLICK ANY CARD TO TRIGGER BOULDER BLAST'
            ) : (selectedCard as any).effect === 'FREEZE' ? (
              '❄️ CLICK YOUR CARD TO FREEZE PERMANENTLY'
            ) : (
              '⚡ CLICK CARD TO ACTIVATE TACTIC'
            )
          ) : selectedCard ? (
            '⚡ CLICK ANY HIGHLIGHTED TILE TO PLACE'
          ) : (
            '⚡ YOUR TURN — SELECT A CARD FROM YOUR HAND'
          )
        ) : (
          '⏳ OPPONENT\'S TURN — AWAITING MOVE...'
        )}
      </div>

      {/* 3×5 Board */}
      <div className="bg-white border-4 border-black p-4 shadow-[6px_6px_0_#000]">
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gridTemplateRows: 'repeat(3, minmax(0, 1fr))' }}>
          {COL_LABEL.map(l => (
            <div key={l} className="text-center text-xs font-black text-black uppercase pb-1">{l}</div>
          ))}

          {state.board.map((row, r) =>
            row.map((tile, c) => {
              const coordStr = `${COL_LABEL[c]}${r + 1}`;
              const isRecruitSource = recruitSourceTile?.row === r && recruitSourceTile?.col === c;

              let canClick = false;
              let highlightClass = '';

              if (isMyTurn && selectedCard) {
                if (selectedCard.kind === 'character') {
                  if (!tile.card && legalMoves.includes(`${coordStr}:${selectedCard.id}`)) {
                    canClick = true;
                    highlightClass = 'bg-emerald-100 border-4 border-emerald-600 shadow-[2px_2px_0_#000] cursor-pointer animate-pulse';
                  }
                } else {
                  const eff = (selectedCard as any).effect;
                  if (eff === 'BOULDER' && tile.card && !tile.frozen) {
                    canClick = true;
                    highlightClass = 'bg-orange-100 border-4 border-orange-600 shadow-[2px_2px_0_#000] cursor-pointer animate-pulse';
                  } else if (eff === 'FREEZE' && tile.card && tile.owner === mySeat && !tile.frozen) {
                    canClick = true;
                    highlightClass = 'bg-cyan-100 border-4 border-cyan-600 shadow-[2px_2px_0_#000] cursor-pointer animate-pulse';
                  } else if (eff === 'RECRUIT') {
                    if (!recruitSourceTile) {
                      if (tile.card && tile.owner === enemySeat && !tile.frozen) {
                        canClick = true;
                        highlightClass = 'bg-purple-100 border-4 border-purple-600 shadow-[2px_2px_0_#000] cursor-pointer animate-pulse';
                      }
                    } else {
                      if (!tile.card) {
                        canClick = true;
                        highlightClass = 'bg-emerald-100 border-4 border-emerald-600 shadow-[2px_2px_0_#000] cursor-pointer animate-pulse';
                      }
                    }
                  }
                }
              }

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => canClick && onTileClick(r, c)}
                  className={`
                    relative w-20 h-20 flex items-center justify-center
                    transition-all duration-150
                    ${tile.card ? '' : 'border-2 border-black bg-[#f4f4f0] hover:bg-[#e5e5e0]'}
                    ${highlightClass}
                    ${isRecruitSource ? 'ring-4 ring-purple-600 border-4 border-purple-600 scale-105 z-10' : ''}
                  `}
                >
                  {/* Row label on left column */}
                  {c === 0 && (
                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 text-xs font-black text-black">{r + 1}</div>
                  )}

                  {tile.card ? (
                    <DuelCard
                      card={tile.card}
                      owner={tile.owner}
                      isFrozen={tile.frozen}
                      size="md"
                      onClick={() => canClick && onTileClick(r, c)}
                    />
                  ) : (
                    canClick && <div className="text-emerald-700 font-black text-3xl leading-none">+</div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Player Hand */}
      {state.status === 'active' && (
        <div className="w-full max-w-xl bg-white border-4 border-black p-4 shadow-[4px_4px_0_#000]">
          <div className="text-xs font-bold text-black uppercase tracking-widest mb-3 flex items-center justify-between border-b-2 border-black pb-1">
            <span>Your Hand</span>
            <span className="text-[10px] text-gray-500">{isMyTurn ? 'CLICK TO SELECT' : 'WAITING FOR TURN'}</span>
          </div>
          <div className="flex gap-3 justify-center flex-wrap min-h-[80px] items-center">
            {myHand.map(card => (
              <DuelCard
                key={card.id}
                card={card}
                isSelected={selectedCard?.id === card.id}
                onClick={() => isMyTurn && onCardSelect(card)}
                size="lg"
                className={!isMyTurn ? 'opacity-40 cursor-not-allowed hover:translate-y-0' : ''}
              />
            ))}
          </div>
          {selectedCard?.kind === 'effect' && (
            <div className="mt-3 text-center text-xs font-bold bg-amber-100 border-2 border-black p-2 shadow-[2px_2px_0_#000]">
              {selectedCard.emoji} <strong className="uppercase">{selectedCard.name}:</strong> {(selectedCard as any).description}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
