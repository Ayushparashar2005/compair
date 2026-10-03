import crypto from 'node:crypto';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import type { 
  ComparisonDuelSessionState, 
  DuelPlayerState, 
  DuelQuestion, 
  Seat 
} from './types';

const FALLBACK_DUEL_QUESTIONS: DuelQuestion[] = [
  {
    questionId: 'fb-1',
    categoryName: 'GEOGRAPHY',
    stat: { id: 'elevation', name: 'Peak Elevation', unit: 'm' },
    entityA: { id: 'fb-everest', name: 'Mount Everest', emoji: '🏔️', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Everest_kalapatthar.jpg/800px-Everest_kalapatthar.jpg', value: 8849 },
    entityB: { id: 'fb-k2', name: 'K2', emoji: '⛰️', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/K2_2006b.jpg/800px-K2_2006b.jpg', value: 8611 },
    correctEntityId: 'fb-everest',
  },
  {
    questionId: 'fb-2',
    categoryName: 'ANIMALS',
    stat: { id: 'weight', name: 'Adult Weight', unit: 'kg' },
    entityA: { id: 'fb-whale', name: 'Blue Whale', emoji: '🐋', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Anim1754_-_Flickr_-_NOAA_Photo_Library.jpg/800px-Anim1754_-_Flickr_-_NOAA_Photo_Library.jpg', value: 150000 },
    entityB: { id: 'fb-elephant', name: 'African Elephant', emoji: '🐘', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/African_Bush_Elephant.jpg/800px-African_Bush_Elephant.jpg', value: 6000 },
    correctEntityId: 'fb-whale',
  },
  {
    questionId: 'fb-3',
    categoryName: 'ARCHITECTURE',
    stat: { id: 'height', name: 'Architectural Height', unit: 'm' },
    entityA: { id: 'fb-burj', name: 'Burj Khalifa', emoji: '🏙️', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Burj_Khalifa.jpg/800px-Burj_Khalifa.jpg', value: 828 },
    entityB: { id: 'fb-empire', name: 'Empire State Building', emoji: '🏢', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Empire_State_Building_%28aerial_view%29.jpg/800px-Empire_State_Building_%28aerial_view%29.jpg', value: 381 },
    correctEntityId: 'fb-burj',
  },
  {
    questionId: 'fb-4',
    categoryName: 'SPEED',
    stat: { id: 'speed', name: 'Top Speed', unit: 'km/h' },
    entityA: { id: 'fb-cheetah', name: 'Cheetah', emoji: '🐆', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/The_Cheetahs_of_the_Masai_Mara_%287115441117%29.jpg/800px-The_Cheetahs_of_the_Masai_Mara_%287115441117%29.jpg', value: 120 },
    entityB: { id: 'fb-bugatti', name: 'Bugatti Chiron Super Sport', emoji: '🏎️', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Bugatti_Chiron_Super_Sport_300%2B.jpg/800px-Bugatti_Chiron_Super_Sport_300%2B.jpg', value: 440 },
    correctEntityId: 'fb-bugatti',
  },
  {
    questionId: 'fb-5',
    categoryName: 'CITIES',
    stat: { id: 'population', name: 'Metro Population', unit: 'residents' },
    entityA: { id: 'fb-tokyo', name: 'Tokyo Metro Area', emoji: '🗼', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Skyscrapers_of_Shinjuku_2009_January.jpg/800px-Skyscrapers_of_Shinjuku_2009_January.jpg', value: 37400000 },
    entityB: { id: 'fb-nyc', name: 'New York City Metro', emoji: '🗽', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Statue_of_Liberty%2C_NY.jpg/800px-Statue_of_Liberty%2C_NY.jpg', value: 19800000 },
    correctEntityId: 'fb-tokyo',
  },
  {
    questionId: 'fb-6',
    categoryName: 'BUSINESS',
    stat: { id: 'market_cap', name: 'Peak Market Capitalization', unit: 'Billion USD' },
    entityA: { id: 'fb-apple', name: 'Apple Inc.', emoji: '🍎', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/800px-Apple_logo_black.svg.png', value: 3500 },
    entityB: { id: 'fb-nike', name: 'Nike, Inc.', emoji: '👟', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/800px-Logo_NIKE.svg.png', value: 120 },
    correctEntityId: 'fb-apple',
  },
  {
    questionId: 'fb-7',
    categoryName: 'SPACE',
    stat: { id: 'diameter', name: 'Celestial Diameter', unit: 'km' },
    entityA: { id: 'fb-earth', name: 'Planet Earth', emoji: '🌍', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/The_Earth_seen_from_Apollo_17.jpg/800px-The_Earth_seen_from_Apollo_17.jpg', value: 12742 },
    entityB: { id: 'fb-moon', name: 'The Moon', emoji: '🌕', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/FullMoon2010.jpg/800px-FullMoon2010.jpg', value: 3474 },
    correctEntityId: 'fb-earth',
  },
];

export function getAiBotName(difficulty: 'novice' | 'pro' | 'master'): string {
  switch (difficulty) {
    case 'novice': return 'Bot Apprentice 🤖';
    case 'pro': return 'Vector AI ⚡';
    case 'master': return 'Oracle Grandmaster 🔮';
    default: return 'Compair Bot 🤖';
  }
}

/**
 * Generate a deck of comparison questions from DB, filling with fallbacks if needed
 */
export async function generateDuelDeck(count: number = 7, categoryId?: string | null): Promise<DuelQuestion[]> {
  const questions: DuelQuestion[] = [];
  const usedEntityIds = new Set<string>();

  try {
    for (let i = 0; i < count; i++) {
      const excludeClause = usedEntityIds.size > 0 
        ? `AND e.id NOT IN (${[...usedEntityIds].map(id => `'${id}'`).join(',')})`
        : '';

      const queryStr = `
        WITH 
          entity_a_pool AS (
            SELECT e.id, e.name, e.emoji, e.image_url, e.local_image_path, e.category_id,
                   es.stat_id, es.value, s.name as stat_name, s.unit as stat_unit,
                   c.name as category_name
            FROM entities e
            JOIN entity_stats es ON e.id = es.entity_id
            JOIN stats s ON es.stat_id = s.id
            LEFT JOIN categories c ON e.category_id = c.id
            ${categoryId ? `WHERE e.category_id = '${categoryId}'` : ''}
            ORDER BY random()
            LIMIT 30
          ),
          picked_a AS (
            SELECT * FROM entity_a_pool 
            LIMIT 1
          ),
          entity_b_pool AS (
            SELECT e.id, e.name, e.emoji, e.image_url, e.local_image_path, es.value
            FROM entities e
            JOIN entity_stats es ON e.id = es.entity_id
            JOIN picked_a pa ON es.stat_id = pa.stat_id
            WHERE e.id != pa.id
              AND e.category_id = pa.category_id
              ${excludeClause}
            ORDER BY random()
            LIMIT 15
          )
        SELECT 
          pa.id as entity_a_id, pa.name as entity_a_name, pa.emoji as entity_a_emoji,
          pa.image_url as entity_a_image_url, pa.local_image_path as entity_a_local_path,
          pa.stat_id, pa.stat_name, pa.stat_unit, pa.value as value_a, pa.category_name,
          eb.id as entity_b_id, eb.name as entity_b_name, eb.emoji as entity_b_emoji,
          eb.image_url as entity_b_image_url, eb.local_image_path as entity_b_local_path,
          eb.value as value_b
        FROM picked_a pa
        CROSS JOIN LATERAL (
          SELECT * FROM entity_b_pool 
          LIMIT 1
        ) eb;
      `;

      const res = await db.execute(sql.raw(queryStr));
      if (res.rows && res.rows.length > 0) {
        const row = res.rows[0] as any;
        const valA = Number(row.value_a);
        const valB = Number(row.value_b);
        const correctEntityId = valA >= valB ? row.entity_a_id : row.entity_b_id;

        const imageA = row.entity_a_local_path ?? row.entity_a_image_url;
        const imageB = row.entity_b_local_path ?? row.entity_b_image_url;

        if (!imageA || !imageB) {
          i--;
          continue;
        }

        usedEntityIds.add(row.entity_a_id);
        usedEntityIds.add(row.entity_b_id);

        questions.push({
          questionId: crypto.randomUUID(),
          categoryName: row.category_name ?? 'GENERAL',
          stat: {
            id: row.stat_id,
            name: row.stat_name,
            unit: row.stat_unit,
          },
          entityA: {
            id: row.entity_a_id,
            name: row.entity_a_name,
            emoji: row.entity_a_emoji,
            imageUrl: row.entity_a_local_path ?? row.entity_a_image_url,
            value: valA,
          },
          entityB: {
            id: row.entity_b_id,
            name: row.entity_b_name,
            emoji: row.entity_b_emoji,
            imageUrl: row.entity_b_local_path ?? row.entity_b_image_url,
            value: valB,
          },
          correctEntityId,
        });
      }
    }
  } catch (err) {
    console.warn('[duel/generateDuelDeck] DB question query error, falling back to curated deck:', err);
  }

  // Fill in any remaining slots with randomized fallbacks
  if (questions.length < count) {
    const shuffledFallbacks = [...FALLBACK_DUEL_QUESTIONS].sort(() => Math.random() - 0.5);
    for (const fb of shuffledFallbacks) {
      if (questions.length >= count) break;
      if (!questions.some(q => q.entityA.name === fb.entityA.name)) {
        questions.push({
          ...fb,
          questionId: crypto.randomUUID(),
        });
      }
    }
  }

  return questions;
}

function createInitialPlayer(seat: Seat, name: string): DuelPlayerState {
  return {
    seat,
    name,
    score: 0,
    streak: 0,
    bestStreak: 0,
    roundsWon: 0,
    selectedEntityId: null,
    hasAnswered: false,
    timeRemainingMs: null,
    answeredAtMs: null,
    lastPointsEarned: 0,
    lastCorrect: null,
    lastSpeedBonus: false,
  };
}

/**
 * Creates a new comparison duel match session
 */
export async function createComparisonMatch(
  sessionId: string,
  mode: 'house' | 'pvp',
  options: {
    difficulty?: 'novice' | 'pro' | 'master';
    playerName?: string;
    categoryId?: string | null;
    totalRounds?: number;
  } = {}
): Promise<ComparisonDuelSessionState> {
  const totalRounds = options.totalRounds ?? 7;
  const difficulty = options.difficulty ?? 'pro';
  const playerName = options.playerName?.trim() || 'Player 1';
  const deck = await generateDuelDeck(totalRounds, options.categoryId);

  const playerA = createInitialPlayer('A', playerName);
  const playerB = createInitialPlayer('B', mode === 'house' ? getAiBotName(difficulty) : 'Opponent');

  const now = Date.now();
  const state: ComparisonDuelSessionState = {
    matchId: sessionId,
    mode,
    status: mode === 'house' ? 'in_round' : 'waiting',
    currentRound: 1,
    totalRounds,
    roundStartTime: now,
    roundTimeLimitMs: 10000,
    aiDifficulty: difficulty,
    playerA,
    playerB,
    currentQuestion: deck[0] ?? null,
    questionsDeck: deck,
    roundsHistory: [],
    winner: null,
    lastActionAt: now,
  };

  return state;
}

/**
 * Calculates score multiplier from current streak
 */
export function getStreakMultiplier(streak: number): number {
  if (streak <= 1) return 1.0;
  if (streak === 2) return 1.25;
  if (streak === 3) return 1.5;
  return 2.0;
}

/**
 * Submit answer for seat 'A' or 'B'
 */
export function submitDuelAnswer(
  state: ComparisonDuelSessionState,
  seat: Seat,
  selectedEntityId: string | null,
  timeRemainingMs: number
): ComparisonDuelSessionState {
  if (state.status !== 'in_round' || !state.currentQuestion) {
    return state;
  }

  const now = Date.now();
  const player = seat === 'A' ? state.playerA : state.playerB;
  
  // Record choice
  player.selectedEntityId = selectedEntityId;
  player.hasAnswered = true;
  player.timeRemainingMs = Math.max(0, timeRemainingMs);
  player.answeredAtMs = now;
  state.lastActionAt = now;

  // If in house mode (playing vs AI), simulate the AI's answer
  if (state.mode === 'house' && seat === 'A') {
    simulateAiResponse(state);
    return resolveRound(state);
  }

  // In PvP mode: if both players have now answered, resolve round!
  if (state.mode === 'pvp') {
    if (state.playerA.hasAnswered && state.playerB.hasAnswered) {
      return resolveRound(state);
    }
  }

  return state;
}

/**
 * Simulates AI thinking time and correctness
 */
function simulateAiResponse(state: ComparisonDuelSessionState) {
  if (!state.currentQuestion) return;
  const diff = state.aiDifficulty;
  
  // Accuracy distribution
  let accuracy = 0.75;
  let minDelay = 2000;
  let maxDelay = 3500;

  if (diff === 'novice') {
    accuracy = 0.55;
    minDelay = 3000;
    maxDelay = 4800;
  } else if (diff === 'master') {
    accuracy = 0.92;
    minDelay = 1200;
    maxDelay = 2200;
  }

  const isAiCorrect = Math.random() < accuracy;
  const aiDelayMs = Math.floor(minDelay + Math.random() * (maxDelay - minDelay));
  const aiTimeRemainingMs = Math.max(500, state.roundTimeLimitMs - aiDelayMs);

  const { entityA, entityB, correctEntityId } = state.currentQuestion;
  const wrongEntityId = correctEntityId === entityA.id ? entityB.id : entityA.id;

  state.playerB.selectedEntityId = isAiCorrect ? correctEntityId : wrongEntityId;
  state.playerB.hasAnswered = true;
  state.playerB.timeRemainingMs = aiTimeRemainingMs;
  state.playerB.answeredAtMs = state.roundStartTime + aiDelayMs;
}

/**
 * Resolves points, streaks, bonuses, and round winner
 */
export function resolveRound(state: ComparisonDuelSessionState): ComparisonDuelSessionState {
  if (!state.currentQuestion) return state;

  const q = state.currentQuestion;
  const correctId = q.correctEntityId;

  const aChoice = state.playerA.selectedEntityId;
  const bChoice = state.playerB.selectedEntityId;

  const aCorrect = aChoice === correctId;
  const bCorrect = bChoice === correctId;

  state.playerA.lastCorrect = aCorrect;
  state.playerB.lastCorrect = bCorrect;

  // Streak Multipliers
  const multA = aCorrect ? getStreakMultiplier(state.playerA.streak) : 1.0;
  const multB = bCorrect ? getStreakMultiplier(state.playerB.streak) : 1.0;

  let pointsA = aCorrect ? Math.round(100 * multA) : 0;
  let pointsB = bCorrect ? Math.round(100 * multB) : 0;

  // Speed bonus (+30 pts to fastest correct player)
  let speedBonusA = false;
  let speedBonusB = false;

  const timeA = state.playerA.timeRemainingMs ?? 0;
  const timeB = state.playerB.timeRemainingMs ?? 0;

  if (aCorrect && bCorrect) {
    if (timeA > timeB) {
      pointsA += 30;
      speedBonusA = true;
    } else if (timeB > timeA) {
      pointsB += 30;
      speedBonusB = true;
    }
  } else if (aCorrect && timeA >= 7000) {
    // Quick answer bonus (+15) if alone
    pointsA += 15;
    speedBonusA = true;
  } else if (bCorrect && timeB >= 7000) {
    pointsB += 15;
    speedBonusB = true;
  }

  state.playerA.lastSpeedBonus = speedBonusA;
  state.playerB.lastSpeedBonus = speedBonusB;
  state.playerA.lastPointsEarned = pointsA;
  state.playerB.lastPointsEarned = pointsB;

  // Update cumulative scores
  state.playerA.score += pointsA;
  state.playerB.score += pointsB;

  // Update streaks
  if (aCorrect) {
    state.playerA.streak += 1;
    state.playerA.bestStreak = Math.max(state.playerA.bestStreak, state.playerA.streak);
  } else {
    state.playerA.streak = 0;
  }

  if (bCorrect) {
    state.playerB.streak += 1;
    state.playerB.bestStreak = Math.max(state.playerB.bestStreak, state.playerB.streak);
  } else {
    state.playerB.streak = 0;
  }

  // Round Winner
  let roundWinner: Seat | 'TIE' = 'TIE';
  if (pointsA > pointsB) {
    roundWinner = 'A';
    state.playerA.roundsWon += 1;
  } else if (pointsB > pointsA) {
    roundWinner = 'B';
    state.playerB.roundsWon += 1;
  }

  state.roundsHistory.push({
    round: state.currentRound,
    question: q,
    choiceA: aChoice,
    choiceB: bChoice,
    pointsEarnedA: pointsA,
    pointsEarnedB: pointsB,
    winner: roundWinner,
  });

  state.status = 'round_revealed';
  state.lastActionAt = Date.now();

  return state;
}

/**
 * Advance to next round or finish the match
 */
export function advanceToNextRound(state: ComparisonDuelSessionState): ComparisonDuelSessionState {
  if (state.currentRound >= state.totalRounds) {
    state.status = 'match_finished';
    state.winner = state.playerA.score > state.playerB.score 
      ? 'A' 
      : state.playerB.score > state.playerA.score 
        ? 'B' 
        : 'TIE';
    state.lastActionAt = Date.now();
    return state;
  }

  state.currentRound += 1;
  const nextQ = state.questionsDeck[state.currentRound - 1] ?? null;
  state.currentQuestion = nextQ;

  // Reset per-round player choices
  const resetPlayerRound = (p: DuelPlayerState) => {
    p.selectedEntityId = null;
    p.hasAnswered = false;
    p.timeRemainingMs = null;
    p.answeredAtMs = null;
    p.lastPointsEarned = 0;
    p.lastCorrect = null;
    p.lastSpeedBonus = false;
  };

  resetPlayerRound(state.playerA);
  resetPlayerRound(state.playerB);

  state.status = 'in_round';
  state.roundStartTime = Date.now();
  state.lastActionAt = Date.now();

  return state;
}

/**
 * Resets match for a Rematch in the same room
 */
export async function resetRematch(state: ComparisonDuelSessionState): Promise<ComparisonDuelSessionState> {
  const newDeck = await generateDuelDeck(state.totalRounds);
  
  state.currentRound = 1;
  state.questionsDeck = newDeck;
  state.currentQuestion = newDeck[0] ?? null;
  state.roundsHistory = [];
  state.winner = null;

  const resetPlayerFull = (p: DuelPlayerState) => {
    p.score = 0;
    p.streak = 0;
    p.roundsWon = 0;
    p.selectedEntityId = null;
    p.hasAnswered = false;
    p.timeRemainingMs = null;
    p.answeredAtMs = null;
    p.lastPointsEarned = 0;
    p.lastCorrect = null;
    p.lastSpeedBonus = false;
  };

  resetPlayerFull(state.playerA);
  resetPlayerFull(state.playerB);

  state.status = 'in_round';
  state.roundStartTime = Date.now();
  state.lastActionAt = Date.now();

  return state;
}

/**
 * Sanitizes state for sending over API so players cannot inspect hidden values or opponent choices in network tab
 */
export function sanitizeDuelState(
  state: ComparisonDuelSessionState,
  viewerSeat: Seat | null
): ComparisonDuelSessionState {
  const copy: ComparisonDuelSessionState = JSON.parse(JSON.stringify(state));

  // If match is waiting for friend to join
  if (copy.status === 'waiting') {
    return copy;
  }

  // During active round, hide secret values and opponent choice
  if (copy.status === 'in_round' && copy.currentQuestion) {
    delete copy.currentQuestion.entityA.value;
    delete copy.currentQuestion.entityB.value;
    // @ts-ignore
    delete copy.currentQuestion.correctEntityId;

    // Mask opponent's chosen ID, only leaving `hasAnswered`
    if (viewerSeat === 'A') {
      copy.playerB.selectedEntityId = null;
    } else if (viewerSeat === 'B') {
      copy.playerA.selectedEntityId = null;
    } else {
      // Spectator
      copy.playerA.selectedEntityId = null;
      copy.playerB.selectedEntityId = null;
    }

    // Never leak future questions in deck
    copy.questionsDeck = [];
  }

  return copy;
}
