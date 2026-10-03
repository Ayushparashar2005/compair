import { getLegalMoves, applyMove } from './engine';
import type { GameState } from './types';

type Difficulty = 'easy' | 'medium' | 'hard';

// Score a board state for seat B (AI)
function scoreForB(state: GameState): number {
  return state.scores.B - state.scores.A;
}

// Count how many tiles a move would capture
function countCaptures(state: GameState, move: string): number {
  const before = state.scores;
  const after = applyMove(state, move).scores;
  return (after.B - before.B) - (after.A - before.A);
}

export function getAiMove(state: GameState, difficulty: Difficulty = 'medium'): string {
  const legalMoves = getLegalMoves(state);
  if (legalMoves.length === 0 || (legalMoves.length === 1 && legalMoves[0] === 'PASS')) {
    return 'PASS';
  }

  if (difficulty === 'easy') {
    // Random move
    return legalMoves[Math.floor(Math.random() * legalMoves.length)];
  }

  if (difficulty === 'medium') {
    // Greedy: pick move that gives the best immediate board score
    let best = legalMoves[0];
    let bestScore = -Infinity;
    for (const move of legalMoves) {
      const score = countCaptures(state, move);
      if (score > bestScore) { bestScore = score; best = move; }
    }
    return best;
  }

  if (difficulty === 'hard') {
    // 1-ply minimax: maximise our gain, minimise opponent's best response
    let best = legalMoves[0];
    let bestScore = -Infinity;

    for (const myMove of legalMoves) {
      const afterMyMove = applyMove(state, myMove);
      // Opponent's best counter
      const opponentMoves = getLegalMoves(afterMyMove);
      let opponentBest = -Infinity;
      for (const oppMove of opponentMoves) {
        const afterOpp = applyMove(afterMyMove, oppMove);
        const s = scoreForB(afterOpp);
        if (s > opponentBest) opponentBest = s;
      }
      // Our net score = our gain - opponent's best counter
      const net = scoreForB(afterMyMove) - opponentBest;
      if (net > bestScore) { bestScore = net; best = myMove; }
    }
    return best;
  }

  return legalMoves[0];
}

// Map Compair score → AI difficulty
export function scoreToDifficulty(score: number): Difficulty {
  if (score < 200) return 'easy';
  if (score < 600) return 'medium';
  return 'hard';
}
