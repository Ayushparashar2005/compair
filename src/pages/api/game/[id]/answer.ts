import type { APIRoute } from 'astro';
import { db } from '../../../../lib/db';
import { gameQuestions } from '../../../../lib/db/schema/game_questions';
import { gameSessions } from '../../../../lib/db/schema/game_sessions';
import { calculateScore } from '../../../../lib/game/scoring';
import { eq, and } from 'drizzle-orm';
import { entities } from '../../../../lib/db/schema/entities';

export const POST: APIRoute = async ({ params, request }) => {
  const sessionId = params.id;
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Session ID required' }), { status: 400 });
  }

  try {
    const body = await request.json();
    const { questionId, answerEntityId, currentStreak = 0, timeRemainingMs = 0 } = body;

    // Fetch the question
    const questionResult = await db.select().from(gameQuestions).where(
      and(eq(gameQuestions.id, questionId), eq(gameQuestions.sessionId, sessionId))
    ).limit(1);

    if (!questionResult.length) {
      return new Response(JSON.stringify({ error: 'Question not found' }), { status: 404 });
    }

    const question = questionResult[0];

    if (question.isCorrect !== null) {
      return new Response(JSON.stringify({ error: 'Question already answered' }), { status: 400 });
    }

    // null answerEntityId means they timed out
    const isCorrect = answerEntityId !== null && question.correctEntityId === answerEntityId;
    
    const { pointsAwarded, newStreak, multiplier } = calculateScore(100, currentStreak, isCorrect, timeRemainingMs);

    // Update question
    await db.update(gameQuestions).set({
      userAnswerEntityId: answerEntityId,
      isCorrect,
      pointsAwarded,
    }).where(eq(gameQuestions.id, questionId));

    // Update session score
    const sessionResult = await db.select().from(gameSessions).where(eq(gameSessions.id, sessionId)).limit(1);
    if (sessionResult.length) {
      await db.update(gameSessions).set({
        score: sessionResult[0].score + pointsAwarded,
        questionsAnswered: sessionResult[0].questionsAnswered + 1,
        correctAnswers: sessionResult[0].correctAnswers + (isCorrect ? 1 : 0),
      }).where(eq(gameSessions.id, sessionId));
    }

    return new Response(JSON.stringify({
      isCorrect,
      isTimeOut: answerEntityId === null,
      correctEntityId: question.correctEntityId,
      pointsAwarded,
      newStreak,
      multiplier,
      totalScore: sessionResult.length ? sessionResult[0].score + pointsAwarded : pointsAwarded
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Failed to process answer' }), { status: 500 });
  }
};
