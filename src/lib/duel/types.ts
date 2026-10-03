export type Seat = 'A' | 'B';

export interface DuelEntity {
  id: string;
  name: string;
  emoji?: string;
  imageUrl?: string;
  value?: number; // Hidden during active question, revealed on reveal phase
}

export interface DuelStat {
  id: string;
  name: string;
  unit?: string | null;
}

export interface DuelQuestion {
  questionId: string;
  categoryName?: string;
  stat: DuelStat;
  entityA: DuelEntity;
  entityB: DuelEntity;
  correctEntityId: string;
}

export interface DuelPlayerState {
  seat: Seat;
  name: string;
  score: number;
  streak: number;
  bestStreak: number;
  roundsWon: number;
  selectedEntityId: string | null;
  hasAnswered: boolean;
  timeRemainingMs: number | null;
  answeredAtMs: number | null;
  lastPointsEarned: number;
  lastCorrect: boolean | null;
  lastSpeedBonus: boolean;
}

export interface DuelRoundHistory {
  round: number;
  question: DuelQuestion;
  choiceA: string | null;
  choiceB: string | null;
  pointsEarnedA: number;
  pointsEarnedB: number;
  winner: Seat | 'TIE';
}

export type DuelStatus = 'waiting' | 'in_round' | 'round_revealed' | 'match_finished';

export interface ComparisonDuelSessionState {
  matchId: string;
  mode: 'house' | 'pvp';
  status: DuelStatus;
  currentRound: number;
  totalRounds: number;
  roundStartTime: number;
  roundTimeLimitMs: number;
  aiDifficulty: 'novice' | 'pro' | 'master';
  playerA: DuelPlayerState;
  playerB: DuelPlayerState;
  currentQuestion: DuelQuestion | null;
  questionsDeck: DuelQuestion[];
  roundsHistory: DuelRoundHistory[];
  winner: Seat | 'TIE' | null;
  lastActionAt: number;
}

// Backwards compatibility alias for components that import GameState
export type GameState = ComparisonDuelSessionState;
