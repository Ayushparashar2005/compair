import type { APIRoute } from 'astro';
import { generateNextQuestion } from '../../../../lib/game/engine';
import { db } from '../../../../lib/db';
import { gameSessions } from '../../../../lib/db/schema/game_sessions';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ params, request }) => {
  const sessionId = params.id;
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Session ID required' }), { status: 400 });
  }

  try {
    const session = await db.select().from(gameSessions).where(eq(gameSessions.id, sessionId)).limit(1);
    
    if (session.length === 0) {
      return new Response(JSON.stringify({ error: 'Session not found' }), { status: 404 });
    }

    const categoryId = session[0].categoryId ?? null;

    const question = await generateNextQuestion(sessionId, categoryId);
    
    if (!question) {
      return new Response(JSON.stringify({ error: 'No more questions available' }), { status: 404 });
    }
    
    return new Response(JSON.stringify(question), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Failed to generate question' }), { status: 500 });
  }
};
