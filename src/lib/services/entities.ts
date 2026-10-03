import { eq } from 'drizzle-orm';
import { db } from '../db';
import { entities } from '../db/schema/entities';
import { entityStats } from '../db/schema/entity_stats';
import { stats } from '../db/schema/stats';

export const getEntitiesByCategory = async (categoryId: string) => {
  return await db.select().from(entities).where(eq(entities.categoryId, categoryId)).orderBy(entities.name).limit(50);
};

export const getEntityWithStats = async (slug: string) => {
  const entityResult = await db.select().from(entities).where(eq(entities.slug, slug)).limit(1);
  if (!entityResult.length) return null;

  const entity = entityResult[0];

  const statsResult = await db.select({
    statId: stats.id,
    name: stats.name,
    slug: stats.slug,
    unit: stats.unit,
    formatType: stats.formatType,
    value: entityStats.value,
    minValue: entityStats.minValue,
    maxValue: entityStats.maxValue,
    source: entityStats.source,
    sourceUrl: entityStats.sourceUrl,
    sourceNote: entityStats.sourceNote
  })
  .from(entityStats)
  .innerJoin(stats, eq(entityStats.statId, stats.id))
  .where(eq(entityStats.entityId, entity.id));

  return {
    ...entity,
    stats: statsResult
  };
};
