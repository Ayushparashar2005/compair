import { FULL_DECK, shuffleDeck } from './cards';
import type { Card, CharacterCard, EffectCard, GameState, ParsedMove, Seat, Tile } from './types';
import { nanoid } from 'nanoid';

// ─── Board helpers ───────────────────────────────────────────────────────────

export function emptyBoard(): Tile[][] {
  return Array.from({ length: 3 }, (_, row) =>
    Array.from({ length: 5 }, (_, col) => ({
      col, row, card: null, owner: null, frozen: false
    }))
  );
}

function countScores(board: Tile[][]): { A: number; B: number } {
  let A = 0, B = 0;
  for (const row of board) {
    for (const tile of row) {
      if (tile.owner === 'A') A++;
      else if (tile.owner === 'B') B++;
    }
  }
  return { A, B };
}

function isBoardFull(board: Tile[][]): boolean {
  return board.every(row => row.every(tile => tile.card !== null));
}

// The opposite side when two cards face each other
const OPPOSITE: Record<string, 'top' | 'right' | 'bottom' | 'left'> = {
  top: 'bottom', bottom: 'top', left: 'right', right: 'left'
};

// Which side of the PLACED card faces a neighbour in direction [dr, dc]
function placedSide(dr: number, dc: number): 'top' | 'right' | 'bottom' | 'left' {
  if (dr === -1) return 'top';
  if (dr === 1)  return 'bottom';
  if (dc === -1) return 'left';
  return 'right';
}

// Return which tiles flip after placing a character at (row, col) by `seat`
function captureTargets(
  board: Tile[][], row: number, col: number, card: CharacterCard, seat: Seat
): { row: number; col: number }[] {
  const captured: { row: number; col: number }[] = [];
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  for (const [dr, dc] of dirs) {
    const nr = row + dr, nc = col + dc;
    if (nr < 0 || nr > 2 || nc < 0 || nc > 4) continue;
    const neighbour = board[nr][nc];
    if (!neighbour.card || neighbour.owner === seat || neighbour.frozen) continue;
    if (neighbour.card.kind !== 'character') continue;
    const mySide = placedSide(dr, dc);
    const theirSide = OPPOSITE[mySide];
    const myVal  = card[mySide];
    const theirVal = (neighbour.card as CharacterCard)[theirSide];
    if (myVal >= theirVal) captured.push({ row: nr, col: nc });
  }
  return captured;
}

// ─── Move parsing ─────────────────────────────────────────────────────────────

// Column letter A=0 … E=4, row number 1=0 … 3=2
function parseCoord(s: string): { row: number; col: number } {
  const col = s.charCodeAt(0) - 65; // 'A'=0
  const row = parseInt(s[1]) - 1;
  return { col, row };
}

export function parseMove(move: string): ParsedMove {
  if (move === 'PASS') return { type: 'PASS' };
  if (move === 'FLIP') return { type: 'FLIP' };
  if (move === 'SWAP') return { type: 'SWAP' };
  if (move.startsWith('BOULDER:')) {
    return { type: 'BOULDER', ...parseCoord(move.slice(8)) };
  }
  if (move.startsWith('FREEZE:')) {
    return { type: 'FREEZE', ...parseCoord(move.slice(7)) };
  }
  if (move.startsWith('RECRUIT:')) {
    const parts = move.slice(8).split('>');
    return { type: 'RECRUIT', ...parseCoord(parts[0]), targetCol: parseCoord(parts[1]).col, targetRow: parseCoord(parts[1]).row };
  }
  // Place: "A1:5"
  const [coord, idStr] = move.split(':');
  return { type: 'place', cardId: parseInt(idStr), ...parseCoord(coord) };
}

// ─── Legal moves ─────────────────────────────────────────────────────────────

export function getLegalMoves(state: GameState): string[] {
  if (state.status === 'finished') return [];

  const hand = state.turn === 'A' ? state.handA : state.handB;
  const moves: string[] = [];
  const emptyTiles: Tile[] = [];

  for (const row of state.board) {
    for (const tile of row) {
      if (!tile.card) emptyTiles.push(tile);
    }
  }

  const colLetter = (c: number) => String.fromCharCode(65 + c);
  const coord = (t: { col: number; row: number }) => `${colLetter(t.col)}${t.row + 1}`;

  for (const card of hand) {
    if (card.kind === 'character') {
      for (const tile of emptyTiles) {
        moves.push(`${coord(tile)}:${card.id}`);
      }
    } else {
      const eff = (card as EffectCard).effect;
      if (eff === 'FLIP' || eff === 'SWAP') {
        // Can always be played if opponent has cards (SWAP) or any cards exist (FLIP)
        const hasCards = state.board.some(r => r.some(t => t.card));
        if (eff === 'FLIP' && hasCards) moves.push('FLIP');
        if (eff === 'SWAP') moves.push('SWAP');
      }
      if (eff === 'BOULDER') {
        // Any non-frozen card on the board
        for (const row of state.board) {
          for (const tile of row) {
            if (tile.card && !tile.frozen) moves.push(`BOULDER:${coord(tile)}`);
          }
        }
      }
      if (eff === 'FREEZE') {
        // Any of your own unfrozen cards
        const myTiles = state.board.flat().filter(t => t.card && t.owner === state.turn && !t.frozen);
        for (const t of myTiles) moves.push(`FREEZE:${coord(t)}`);
      }
      if (eff === 'RECRUIT') {
        // Any unfrozen enemy card → any empty tile
        const enemySeat: Seat = state.turn === 'A' ? 'B' : 'A';
        const enemyTiles = state.board.flat().filter(t => t.card && t.owner === enemySeat && !t.frozen);
        for (const src of enemyTiles) {
          for (const dst of emptyTiles) {
            moves.push(`RECRUIT:${coord(src)}>${coord(dst)}`);
          }
        }
      }
    }
  }

  // If no moves can be legally made, allow passing to prevent deadlock
  if (moves.length === 0) {
    return ['PASS'];
  }

  return moves;
}

// ─── Apply move (immutable) ───────────────────────────────────────────────────

function deepCloneBoard(board: Tile[][]): Tile[][] {
  return board.map(row => row.map(tile => ({ ...tile })));
}

function removeCardFromHand(hand: Card[], cardId: number): Card[] {
  const idx = hand.findIndex(c => c.id === cardId);
  if (idx === -1) return hand;
  return [...hand.slice(0, idx), ...hand.slice(idx + 1)];
}

function consumeCardFromHand(next: GameState, cardId: number): void {
  const key = next.turn === 'A' ? 'handA' : 'handB';
  next[key] = removeCardFromHand(next[key], cardId);
  if (next.drawPile.length > 0) {
    next[key] = [...next[key], next.drawPile[0]];
    next.drawPile = next.drawPile.slice(1);
  }
}

export function applyMove(state: GameState, move: string): GameState {
  const parsed = parseMove(move);
  const next: GameState = {
    ...state,
    board: deepCloneBoard(state.board),
    handA: [...state.handA],
    handB: [...state.handB],
    drawPile: [...state.drawPile],
    moveLog: [...state.moveLog, move],
  };

  const hand = next.turn === 'A' ? next.handA : next.handB;
  const enemySeat: Seat = next.turn === 'A' ? 'B' : 'A';

  if (parsed.type === 'place' && parsed.cardId !== undefined) {
    const { row, col, cardId } = parsed;
    const card = hand.find(c => c.id === cardId)!;
    next.board[row!][col!] = { row: row!, col: col!, card, owner: next.turn, frozen: false };

    if (card.kind === 'character') {
      const targets = captureTargets(next.board, row!, col!, card as CharacterCard, next.turn);
      for (const t of targets) {
        next.board[t.row][t.col] = { ...next.board[t.row][t.col], owner: next.turn };
      }
    }

    // Remove from hand and draw
    consumeCardFromHand(next, cardId);
  } else if (parsed.type === 'BOULDER') {
    const { row, col } = parsed;
    const anchor = next.board[row!][col!];
    if (anchor.card && !anchor.frozen) {
      // Remove anchor + all non-frozen in same row and col
      const toRemove = new Set<string>();
      toRemove.add(`${row},${col}`);
      for (let c = 0; c < 5; c++) { if (!next.board[row!][c].frozen) toRemove.add(`${row},${c}`); }
      for (let r = 0; r < 3; r++) { if (!next.board[r][col!].frozen) toRemove.add(`${r},${col}`); }
      for (const key of toRemove) {
        const [r, c] = key.split(',').map(Number);
        next.board[r][c] = { row: r, col: c, card: null, owner: null, frozen: false };
      }
    }
    consumeCardFromHand(next, 101);
  } else if (parsed.type === 'FLIP') {
    // Flip board 180° and swap sides
    const flipped: Tile[][] = [[], [], []];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        const src = next.board[2 - r][4 - c];
        flipped[r][c] = {
          row: r, col: c,
          card: src.card,
          owner: src.owner === 'A' ? 'B' : src.owner === 'B' ? 'A' : null,
          frozen: src.frozen
        };
      }
    }
    next.board = flipped;
    consumeCardFromHand(next, 102);
  } else if (parsed.type === 'FREEZE') {
    const { row, col } = parsed;
    next.board[row!][col!] = { ...next.board[row!][col!], frozen: true };
    consumeCardFromHand(next, 103);
  } else if (parsed.type === 'RECRUIT') {
    const { row, col, targetRow, targetCol } = parsed;
    const stolenTile = next.board[row!][col!];
    next.board[row!][col!] = { row: row!, col: col!, card: null, owner: null, frozen: false };
    next.board[targetRow!][targetCol!] = { row: targetRow!, col: targetCol!, card: stolenTile.card, owner: next.turn, frozen: false };
    // Also apply captures from the recruited card's new position
    if (stolenTile.card?.kind === 'character') {
      const targets = captureTargets(next.board, targetRow!, targetCol!, stolenTile.card as CharacterCard, next.turn);
      for (const t of targets) next.board[t.row][t.col] = { ...next.board[t.row][t.col], owner: next.turn };
    }
    consumeCardFromHand(next, 104);
  } else if (parsed.type === 'SWAP') {
    consumeCardFromHand(next, 105);
    const tmpHand = next.handA;
    next.handA = next.handB;
    next.handB = tmpHand;
  } else if (parsed.type === 'PASS') {
    // If previous move was also a PASS, both players are locked -> finish game
    const previousMove = state.moveLog[state.moveLog.length - 1];
    if (previousMove === 'PASS') {
      next.status = 'finished';
    }
  }

  next.scores = countScores(next.board);
  next.turn = enemySeat;

  if (isBoardFull(next.board) || next.status === 'finished') {
    next.status = 'finished';
    if (next.scores.A > next.scores.B) {
      next.winner = 'A';
    } else if (next.scores.B > next.scores.A) {
      next.winner = 'B';
    } else {
      next.winner = null; // Clean Draw
    }
  }

  return next;
}

// ─── Game factory ─────────────────────────────────────────────────────────────

export function createGame(seed?: number, playerScore?: number): GameState {
  const deck = shuffleDeck(FULL_DECK, seed);
  const handA = deck.slice(0, 5);
  const handB = deck.slice(5, 10);
  const drawPile = deck.slice(10);
  return {
    id: nanoid(12),
    board: emptyBoard(),
    handA,
    handB,
    drawPile,
    turn: 'A',
    status: 'active',
    winner: undefined,
    scores: { A: 0, B: 0 },
    moveLog: [],
    playerScore: playerScore ?? 0,
  };
}
