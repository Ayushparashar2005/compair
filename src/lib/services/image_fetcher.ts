import { db } from '../db';
import { entities } from '../db/schema/entities';
import { eq } from 'drizzle-orm';
import fs from 'node:fs';
import path from 'node:path';

export async function downloadAndSave(url: string, destPath: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(destPath, buffer);
}

export async function getWikipediaImageUrl(name: string): Promise<string | null> {
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

export async function fetchAndCacheEntityImage(entityId: string, entityName: string, existingImageUrl: string | null): Promise<string | null> {
    if (existingImageUrl) return existingImageUrl;

    const sourceUrl = await getWikipediaImageUrl(entityName);
    
    if (!sourceUrl) {
      return null;
    }

    let finalPath = sourceUrl;
    try {
      const OUTPUT_DIR = path.resolve('public/images/entities');
      if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      }

      const destPath = path.join(OUTPUT_DIR, `${entityId}.jpg`);
      await downloadAndSave(sourceUrl, destPath);
      finalPath = `/images/entities/${entityId}.jpg`;

      await db.update(entities)
        .set({ localImagePath: finalPath, imageUrl: sourceUrl })
        .where(eq(entities.id, entityId));
    } catch (fsErr) {
      console.warn('[image_fetcher] Filesystem is read-only (serverless runtime), using remote URL fallback:', fsErr);
      await db.update(entities)
        .set({ imageUrl: sourceUrl })
        .where(eq(entities.id, entityId));
    }

    return finalPath;
}
