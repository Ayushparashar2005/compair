import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { duelSessions } from '../../../lib/db/schema/duel_sessions';
import { 
  submitDuelAnswer, 
  advanceToNextRound, 
  resetRematch, 
  resolveRound, 
  sanitizeDuelState 
} from '../../../lib/duel/comparison_engine';
import { eq } from 'drizzle-orm';
import type { ComparisonDuelSessionState, Seat } from '../../../lib/duel/types';

// GET /api/duel/[id]
// Header: Authorization: Bearer <playerToken>
export const GET: APIRoute = async ({ params, request }) => {
  const { id } = params;
  if (!id) return new Response(JSON.stringify({ error: 'Missing match ID' }), { status: 400 });

  const token = request.headers.get('authorization')?.replace('Bearer ', '').trim();

  try {
    const rows = await db.select().from(duelSessions).where(eq(duelSessions.id, id)).limit(1);
    if (!rows.length) return new Response(JSON.stringify({ error: 'Match not found' }), { status: 404 });

    const session = rows[0];
    const seat: Seat | null = token === session.playerAToken 
      ? 'A' 
      : token === session.playerBToken 
        ? 'B' 
        : null;

    let state = session.state as ComparisonDuelSessionState;

    // Check for round timeout in active PvP matches
    if (state.status === 'in_round' && state.roundStartTime) {
      const elapsed = Date.now() - state.roundStartTime;
      const timeoutThreshold = state.roundTimeLimitMs + 1500; // 10s + 1.5s grace period

      if (elapsed > timeoutThreshold) {
        // Auto-resolve round if timer ran out
        state = resolveRound(state);
        await db.update(duelSessions)
          .set({ state: state as any, status: state.status })
          .where(eq(duelSessions.id, id));
      }
    }

    return new Response(JSON.stringify({
      state: sanitizeDuelState(state, seat),
      session: {
        id: session.id,
        mode: session.mode,
        status: state.status,
        inviteCode: session.inviteCode,
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[duel/get]', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch match state' }), { status: 500 });
  }
};

// POST /api/duel/[id]
// Header: Authorization: Bearer <playerToken>
// Body: 
//   - { action: 'answer', selectedEntityId: string, timeRemainingMs: number }
//   - { action: 'next' }
//   - { action: 'rematch' }
export const POST: APIRoute = async ({ params, request }) => {
  const { id } = params;
  if (!id) return new Response(JSON.stringify({ error: 'Missing match ID' }), { status: 400 });

  const token = request.headers.get('authorization')?.replace('Bearer ', '').trim();

  try {
    const body = await request.json().catch(() => ({}));
    const rows = await db.select().from(duelSessions).where(eq(duelSessions.id, id)).limit(1);
    if (!rows.length) return new Response(JSON.stringify({ error: 'Match not found' }), { status: 404 });

    const session = rows[0];
    const seat: Seat | null = token === session.playerAToken 
      ? 'A' 
      : token === session.playerBToken 
        ? 'B' 
        : null;

    if (!seat) {
      return new Response(JSON.stringify({ error: 'Unauthorized token' }), { status: 403 });
    }

    let state = session.state as ComparisonDuelSessionState;

    if (body.action === 'answer') {
      const { selectedEntityId, timeRemainingMs = 0 } = body;
      state = submitDuelAnswer(state, seat, selectedEntityId ?? null, timeRemainingMs);
    } else if (body.action === 'next') {
      if (state.status === 'round_revealed') {
        state = advanceToNextRound(state);
      }
    } else if (body.action === 'rematch') {
      state = await resetRematch(state);
    }

    await db.update(duelSessions)
      .set({ 
        state: state as any, 
        status: state.status 
      })
      .where(eq(duelSessions.id, id));

    return new Response(JSON.stringify({
      state: sanitizeDuelState(state, seat),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[duel/post]', err);
    return new Response(JSON.stringify({ error: 'Failed to process match action' }), { status: 500 });
  }
};
