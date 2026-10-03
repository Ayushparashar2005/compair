import { eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { categories } from '../db/schema/categories';
import { entities } from '../db/schema/entities';

export const getCategories = async () => {
  return await db.select().from(categories).orderBy(categories.name);
};

export const getCategoryBySlug = async (slug: string) => {
  const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return result[0] || null;
};
