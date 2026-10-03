import type { APIRoute } from 'astro';
import { db } from '../../../../lib/db';
import { gameSessions } from '../../../../lib/db/schema/game_sessions';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ params }) => {
  const sessionId = params.id;
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Session ID required' }), { status: 400 });
  }

  try {
    await db.update(gameSessions)
      .set({ endedAt: new Date() })
      .where(eq(gameSessions.id, sessionId));
    
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to end game' }), { status: 500 });
  }
};
