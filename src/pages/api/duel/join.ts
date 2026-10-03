import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { duelSessions } from '../../../lib/db/schema/duel_sessions';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { sanitizeDuelState } from '../../../lib/duel/comparison_engine';
import type { ComparisonDuelSessionState } from '../../../lib/duel/types';

// POST /api/duel/join
// Body: { inviteCode: "ABC123", playerName?: "Challenger" }
// Returns: { sessionId, playerBToken, seat: 'B', state }
export const POST: APIRoute = async ({ request }) => {
  try {
    const { inviteCode, playerName } = await request.json().catch(() => ({}));
    if (!inviteCode) {
      return new Response(JSON.stringify({ error: 'Missing room code' }), { status: 400 });
    }

    const rows = await db.select()
      .from(duelSessions)
      .where(eq(duelSessions.inviteCode, inviteCode.trim().toUpperCase()))
      .limit(1);

    if (!rows.length) {
      return new Response(JSON.stringify({ error: 'Duel room not found or code expired' }), { status: 404 });
    }

    const session = rows[0];
    if (session.status !== 'waiting') {
      return new Response(JSON.stringify({ error: 'Game has already started in this room' }), { status: 409 });
    }

    const playerBToken = nanoid(24);
    let state = session.state as ComparisonDuelSessionState;

    // Transition state from waiting to active in_round
    state.status = 'in_round';
    state.roundStartTime = Date.now();
    state.playerB.name = playerName?.trim() || 'Challenger';
    state.playerB.hasAnswered = false;

    await db.update(duelSessions)
      .set({ 
        playerBToken, 
        status: 'in_round',
        state: state as any,
      })
      .where(eq(duelSessions.id, session.id));

    return new Response(JSON.stringify({
      sessionId: session.id,
      playerBToken,
      seat: 'B',
      state: sanitizeDuelState(state, 'B'),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[duel/join]', err);
    return new Response(JSON.stringify({ error: 'Failed to join duel match' }), { status: 500 });
  }
};
