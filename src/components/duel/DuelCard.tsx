import type { Card, CharacterCard, Seat } from '../../lib/duel/types';

interface DuelCardProps {
  card: Card;
  owner?: Seat | null;
  isSelected?: boolean;
  isFrozen?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const COLOR_CLASSES: Record<string, string> = {
  red:    'bg-red-500 text-white',
  blue:   'bg-blue-500 text-white',
  green:  'bg-emerald-500 text-white',
  yellow: 'bg-amber-400 text-black',
  pink:   'bg-pink-500 text-white',
  purple: 'bg-purple-500 text-white',
  cyan:   'bg-cyan-400 text-black',
  orange: 'bg-[var(--color-brand-accent)] text-white',
};

export function DuelCard({ card, owner, isSelected, isFrozen, onClick, size = 'md', className = '' }: DuelCardProps) {
  const isChar = card.kind === 'character';
  const ch = isChar ? (card as CharacterCard) : null;
  const colorClass = ch ? (COLOR_CLASSES[ch.color] ?? COLOR_CLASSES.blue) : 'bg-gray-800 text-white';

  const sizeClasses = {
    sm: 'w-14 h-14 text-[10px]',
    md: 'w-20 h-20 text-xs',
    lg: 'w-28 h-28 text-sm',
  }[size];

  const ownerBadge = owner === 'A' ? 'border-4 border-blue-600 ring-2 ring-black' :
                     owner === 'B' ? 'border-4 border-red-600 ring-2 ring-black' :
                     'border-2 border-black';

  return (
    <div
      onClick={onClick}
      className={`
        relative ${colorClass} ${ownerBadge}
        flex flex-col items-center justify-center cursor-pointer select-none font-mono
        transition-all duration-150 shadow-[2px_2px_0_#000]
        ${isSelected ? '-translate-y-2 scale-105 shadow-[6px_6px_0_#000] ring-4 ring-black z-20' : 'hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000]'}
        ${isFrozen ? 'opacity-80 ring-4 ring-cyan-300' : ''}
        ${sizeClasses}
        ${className}
      `}
    >
      {/* Frozen indicator */}
      {isFrozen && (
        <div className="absolute -top-2 -right-2 bg-cyan-300 text-black text-[10px] font-black px-1 border border-black z-20">
          ❄️
        </div>
      )}

      {/* Owner Badge */}
      {owner && (
        <div className={`absolute -bottom-1 -left-1 px-1 text-[8px] font-mono font-black uppercase text-white border border-black ${owner === 'A' ? 'bg-blue-600' : 'bg-red-600'}`}>
          {owner === 'A' ? 'YOU' : 'FOE'}
        </div>
      )}

      {isChar && ch ? (
        <>
          {/* Top value */}
          <div className="absolute top-0.5 left-1/2 -translate-x-1/2 font-black text-sm leading-none drop-shadow-sm">
            {ch.top}
          </div>
          {/* Left */}
          <div className="absolute left-0.5 top-1/2 -translate-y-1/2 font-black text-sm leading-none drop-shadow-sm">
            {ch.left}
          </div>
          {/* Right */}
          <div className="absolute right-0.5 top-1/2 -translate-y-1/2 font-black text-sm leading-none drop-shadow-sm">
            {ch.right}
          </div>
          {/* Bottom */}
          <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 font-black text-sm leading-none drop-shadow-sm">
            {ch.bottom}
          </div>
          {/* Center: emoji + name */}
          <div className="flex flex-col items-center gap-0.5 z-10 pointer-events-none">
            <span className="text-base leading-none">{card.emoji}</span>
            <span className="font-display font-black text-[8px] tracking-tight uppercase leading-none max-w-[48px] truncate">
              {card.name}
            </span>
          </div>
        </>
      ) : (
        /* Effect card */
        <div className="flex flex-col items-center justify-center gap-1 p-1 text-center">
          <span className="text-xl leading-none">{card.emoji}</span>
          <span className="font-display font-black text-[9px] uppercase tracking-wider leading-none">
            {card.name}
          </span>
          <div className="text-[7px] font-bold opacity-80 uppercase tracking-tighter">
            TACTIC
          </div>
        </div>
      )}
    </div>
  );
}
