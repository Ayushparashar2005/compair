import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { entities } from '../../../lib/db/schema/entities';
import { eq } from 'drizzle-orm';
import { fetchAndCacheEntityImage } from '../../../lib/services/image_fetcher';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { entityId } = body;
    
    if (!entityId) {
      return new Response(JSON.stringify({ error: 'entityId required' }), { status: 400 });
    }

    const entityResult = await db.select().from(entities).where(eq(entities.id, entityId)).limit(1);
    
    if (entityResult.length === 0) {
      return new Response(JSON.stringify({ error: 'entity not found' }), { status: 404 });
    }
    
    const entity = entityResult[0];
    
    if (entity.localImagePath) {
      return new Response(JSON.stringify({ success: true, path: entity.localImagePath }), { status: 200 });
    }

    const finalPath = await fetchAndCacheEntityImage(entity.id, entity.name, entity.imageUrl);
    
    if (!finalPath) {
      return new Response(JSON.stringify({ error: 'No source image found' }), { status: 404 });
    }

    return new Response(JSON.stringify({ success: true, path: finalPath }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};
