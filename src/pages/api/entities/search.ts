import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { entities } from '../../../lib/db/schema/entities';
import { categories } from '../../../lib/db/schema/categories';
import { and, eq, ilike } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
  const q = url.searchParams.get('q') ?? '';
  const categoryName = url.searchParams.get('categoryName') ?? '';
  
  // We'll limit to 48 for now, enough for a big grid without pagination
  const pageSize = 48;

  try {
    let whereClause = undefined;
    
    if (q && categoryName) {
      whereClause = and(ilike(entities.name, `%${q}%`), eq(categories.name, categoryName));
    } else if (q) {
      whereClause = ilike(entities.name, `%${q}%`);
    } else if (categoryName) {
      whereClause = eq(categories.name, categoryName);
    }

    const results = await db
      .select({
        id: entities.id,
        name: entities.name,
        slug: entities.slug,
        emoji: entities.emoji,
        categoryName: categories.name,
        categoryColor: categories.color,
      })
      .from(entities)
      .innerJoin(categories, eq(entities.categoryId, categories.id))
      .where(whereClause)
      .orderBy(entities.name)
      .limit(pageSize);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error("Search error:", error);
    return new Response(JSON.stringify({ error: 'Search failed' }), { status: 500 });
  }
};
