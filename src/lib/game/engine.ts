import { and, eq, sql } from 'drizzle-orm';
import crypto from 'node:crypto';
import { db } from '../db';
import { gameQuestions } from '../db/schema/game_questions';

export const generateNextQuestion = async (sessionId: string, categoryId: string | null) => {
  // Get all previously asked entity_a and entity_b pairs for this session to avoid repeats
  const previousQuestions = await db.select({
    entityAId: gameQuestions.entityAId,
    entityBId: gameQuestions.entityBId,
  }).from(gameQuestions).where(eq(gameQuestions.sessionId, sessionId));

  const usedEntityAIds = previousQuestions.map(q => q.entityAId);
  const usedEntityBIds = previousQuestions.map(q => q.entityBId);
  const allUsedIds = [...new Set([...usedEntityAIds, ...usedEntityBIds])].slice(-50);

  // Helper to execute selection query with optional exclusion
  const executeQuery = async (excludeIds: string[], filterCategory: string | null) => {
    const queryStr = `
      WITH 
        entity_a_pool AS (
          SELECT e.id, e.name, e.emoji, e.image_url, e.local_image_path, e.category_id,
                 es.stat_id, es.value, s.name as stat_name, s.unit as stat_unit
          FROM entities e
          JOIN entity_stats es ON e.id = es.entity_id
          JOIN stats s ON es.stat_id = s.id
          ${filterCategory ? `WHERE e.category_id = '${filterCategory}'` : ''}
          ORDER BY random()
          LIMIT 25
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
            ${excludeIds.length > 0 ? `AND e.id NOT IN (${excludeIds.map(id => `'${id}'`).join(',')})` : ''}
          ORDER BY random()
          LIMIT 15
        )
      SELECT 
        pa.id as entity_a_id, pa.name as entity_a_name, pa.emoji as entity_a_emoji,
        pa.image_url as entity_a_image_url, pa.local_image_path as entity_a_local_path,
        pa.stat_id, pa.stat_name, pa.stat_unit, pa.value as value_a,
        eb.id as entity_b_id, eb.name as entity_b_name, eb.emoji as entity_b_emoji,
        eb.image_url as entity_b_image_url, eb.local_image_path as entity_b_local_path,
        eb.value as value_b
      FROM picked_a pa
      CROSS JOIN LATERAL (
        SELECT * FROM entity_b_pool 
        LIMIT 1
      ) eb;
    `;
    return await db.execute(sql.raw(queryStr));
  };

  // Primary attempt with repeat exclusions
  let res = await executeQuery(allUsedIds, categoryId);

  // Fallback 1: If no pair found with recent exclusions, relax exclusions
  if (!res.rows || res.rows.length === 0) {
    res = await executeQuery([], categoryId);
  }

  // Fallback 2: If still no pair found and category was filtered, try global cross-category
  if ((!res.rows || res.rows.length === 0) && categoryId) {
    res = await executeQuery([], null);
  }

  if (!res.rows || res.rows.length === 0) {
    return null;
  }

  const row = res.rows[0] as any;
  
  const a = {
    entityAId: row.entity_a_id,
    entityAName: row.entity_a_name,
    entityAEmoji: row.entity_a_emoji,
    entityAImageUrl: row.entity_a_image_url,
    entityALocalImagePath: row.entity_a_local_path,
    statId: row.stat_id,
    statName: row.stat_name,
    statUnit: row.stat_unit,
    valueA: row.value_a,
  };
  
  const selectedB = {
    entityBId: row.entity_b_id,
    entityBName: row.entity_b_name,
    entityBEmoji: row.entity_b_emoji,
    entityBImageUrl: row.entity_b_image_url,
    entityBLocalImagePath: row.entity_b_local_path,
    valueB: row.value_b,
  };

  const correctEntityId = a.valueA > selectedB.valueB ? a.entityAId : selectedB.entityBId;

  // Insert the question into the database
  const questionId = crypto.randomUUID();
  await db.insert(gameQuestions).values({
    id: questionId,
    sessionId: sessionId,
    entityAId: a.entityAId,
    entityBId: selectedB.entityBId,
    statId: a.statId,
    correctEntityId: correctEntityId,
  });

  return {
    questionId,
    entityA: {
      id: a.entityAId,
      name: a.entityAName,
      emoji: a.entityAEmoji,
      imageUrl: a.entityALocalImagePath ?? a.entityAImageUrl ?? `/api/image?q=${encodeURIComponent(a.entityAName)}`,
      value: a.valueA,
    },
    entityB: {
      id: selectedB.entityBId,
      name: selectedB.entityBName,
      emoji: selectedB.entityBEmoji,
      imageUrl: selectedB.entityBLocalImagePath ?? selectedB.entityBImageUrl ?? `/api/image?q=${encodeURIComponent(selectedB.entityBName)}`,
      value: selectedB.valueB,
    },
    stat: {
      id: a.statId,
      name: a.statName,
      unit: a.statUnit,
    }
  };
};
