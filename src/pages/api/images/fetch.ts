import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { entities } from '../../../lib/db/schema/entities';
import { eq } from 'drizzle-orm';
import fs from 'node:fs';
import path from 'node:path';

async function downloadAndSave(url: string, destPath: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(destPath, buffer);
}

async function getWikipediaImageUrl(name: string): Promise<string | null> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(name)}&prop=pageimages&format=json&piprop=original&pithumbsize=800`;
    const res = await fetch(url, { headers: { 'User-Agent': 'CompairTriviaGame/1.0' } });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.query && data.query.pages) {
      const pageId = Object.keys(data.query.pages)[0];
      if (data.query.pages[pageId].original?.source) {
        return data.query.pages[pageId].original.source.split('?')[0];
      } else if (data.query.pages[pageId].thumbnail?.source) {
        return data.query.pages[pageId].thumbnail.source.split('?')[0];
      }
    }
  } catch (e) {
    console.error(e);
  }
  return null;
}

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

    const sourceUrl = entity.imageUrl ?? await getWikipediaImageUrl(entity.name);
    
    if (!sourceUrl) {
      return new Response(JSON.stringify({ error: 'No source image found' }), { status: 404 });
    }

    let finalPath = sourceUrl;
    try {
      const OUTPUT_DIR = path.resolve('public/images/entities');
      if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      }

      const destPath = path.join(OUTPUT_DIR, `${entity.id}.jpg`);
      await downloadAndSave(sourceUrl, destPath);
      finalPath = `/images/entities/${entity.id}.jpg`;

      await db.update(entities)
        .set({ localImagePath: finalPath, imageUrl: entity.imageUrl ?? sourceUrl })
        .where(eq(entities.id, entity.id));
    } catch (fsErr) {
      console.warn('[images/fetch] Filesystem is read-only (serverless runtime), using remote URL fallback:', fsErr);
      await db.update(entities)
        .set({ imageUrl: entity.imageUrl ?? sourceUrl })
        .where(eq(entities.id, entity.id));
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
