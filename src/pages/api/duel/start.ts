import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { duelSessions } from '../../../lib/db/schema/duel_sessions';
import { createComparisonMatch, sanitizeDuelState } from '../../../lib/duel/comparison_engine';
import { nanoid } from 'nanoid';

// POST /api/duel/start
// Body: { mode: "house" | "pvp", difficulty?: "novice" | "pro" | "master", playerName?: string, categoryId?: string, totalRounds?: number }
// Returns: { sessionId, playerAToken, inviteCode, state }
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const mode = body.mode === 'pvp' ? 'pvp' : 'house';
    const difficulty = body.difficulty ?? 'pro';
    const playerName = body.playerName ?? 'Player 1';
    const categoryId = body.categoryId ?? null;
    const totalRounds = body.totalRounds ?? 7;

    const sessionId = nanoid(12);
    const playerAToken = nanoid(24);
    const inviteCode = mode === 'pvp' ? nanoid(6).toUpperCase() : null;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const state = await createComparisonMatch(sessionId, mode, {
      difficulty,
      playerName,
      categoryId,
      totalRounds,
    });

    await db.insert(duelSessions).values({
      id: sessionId,
      state: state as any,
      playerAToken,
      inviteCode,
      mode,
      status: state.status,
      expiresAt,
    });

    return new Response(JSON.stringify({
      sessionId,
      playerAToken,
      inviteCode,
      state: sanitizeDuelState(state, 'A'),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[duel/start]', err);
    return new Response(JSON.stringify({ error: 'Failed to start duel match' }), { status: 500 });
  }
};
