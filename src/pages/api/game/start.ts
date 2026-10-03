import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { gameSessions } from '../../../lib/db/schema/game_sessions';
import crypto from 'node:crypto';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const categoryId = body.categoryId || null;
    
    // In a real app we would link this to a logged-in user or anonymous cookie
    const sessionId = crypto.randomUUID();
    
    await db.insert(gameSessions).values({
      id: sessionId,
      categoryId,
      score: 0,
    });
    
    return new Response(JSON.stringify({ sessionId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to start game' }), { status: 500 });
  }
};
