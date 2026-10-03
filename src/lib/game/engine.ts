import { and, eq, sql, inArray, notInArray, ne } from 'drizzle-orm';
import crypto from 'node:crypto';
import { db } from '../db';
import { entities } from '../db/schema/entities';
import { entityStats } from '../db/schema/entity_stats';
import { stats } from '../db/schema/stats';
import { gameQuestions } from '../db/schema/game_questions';

export const generateNextQuestion = async (sessionId: string, categoryId: string | null) => {
  // Get all previously asked entity_a and entity_b pairs for this session to avoid repeats
  const previousQuestions = await db.select({
    entityAId: gameQuestions.entityAId,
    entityBId: gameQuestions.entityBId,
    statId: gameQuestions.statId,
  }).from(gameQuestions).where(eq(gameQuestions.sessionId, sessionId));

  const usedEntityAIds = previousQuestions.map(q => q.entityAId);
  const usedEntityBIds = previousQuestions.map(q => q.entityBId);
  const allUsedIds = [...new Set([...usedEntityAIds, ...usedEntityBIds])].slice(-50);

  // We want to find a pair of entities (A and B) that share a statistic.
  // And the ratio between them should be interesting (e.g., 1.5x to 50x difference).
  
  // Use a single round-trip raw query with CTEs to pick A and B
  const queryStr = `
    WITH 
      -- Fast random entity A using offset strategy
      entity_a_pool AS (
        SELECT e.id, e.name, e.emoji, e.image_url, e.local_image_path, e.category_id,
               es.stat_id, es.value, s.name as stat_name, s.unit as stat_unit
        FROM entities e TABLESAMPLE SYSTEM(1)
        JOIN entity_stats es ON e.id = es.entity_id
        JOIN stats s ON es.stat_id = s.id
        ${categoryId ? `WHERE e.category_id = '${categoryId}'` : ''}
      ),
      picked_a AS (
        SELECT * FROM entity_a_pool 
        OFFSET floor(random() * (SELECT count(*) FROM entity_a_pool))
        LIMIT 1
      ),
      -- Find B in same category + same stat
      entity_b_pool AS (
        SELECT e.id, e.name, e.emoji, e.image_url, e.local_image_path, es.value
        FROM entities e
        JOIN entity_stats es ON e.id = es.entity_id
        JOIN picked_a pa ON es.stat_id = pa.stat_id
        WHERE e.id != pa.id
          AND e.category_id = pa.category_id
          ${allUsedIds.length > 0 ? `AND e.id NOT IN (${allUsedIds.map(id => `'${id}'`).join(',')})` : ''}
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
      OFFSET floor(random() * GREATEST((SELECT count(*) FROM entity_b_pool) - 1, 0))
      LIMIT 1
    ) eb;
  `;

  const res = await db.execute(sql.raw(queryStr));
  if (!res.rows || res.rows.length === 0) return null;
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

  // Trigger lazy image fetches in the background if either entity is missing a local image
  const triggerImageFetch = (entityId: string) => {
    try {
      fetch(`http://localhost:4321/api/images/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId })
      }).catch(() => {}); // Fire and forget
    } catch (e) {
      // Ignore
    }
  };

  if (!a.entityALocalImagePath) triggerImageFetch(a.entityAId);
  if (!selectedB.entityBLocalImagePath) triggerImageFetch(selectedB.entityBId);

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
