import "dotenv/config";
import { isNull, eq } from "drizzle-orm";
import { entities } from "../src/lib/db/schema";
import { db } from "../src/lib/db";

const isBadImage = (url: string) => {
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('.svg') || 
         lowerUrl.includes('map') || 
         lowerUrl.includes('flag') || 
         lowerUrl.includes('logo') || 
         lowerUrl.includes('icon') ||
         lowerUrl.includes('coat_of_arms') ||
         lowerUrl.includes('seal_of');
};

async function getImageUrl(q: string): Promise<string | null> {
  try {
    const restRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`);
    if (restRes.ok) {
      const restData = await restRes.json();
      if (restData.originalimage?.source && !isBadImage(restData.originalimage.source)) {
        return restData.originalimage.source;
      }
    }
  } catch (e) {
    // ignore
  }

  try {
    const ddgRes = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json`);
    if (ddgRes.ok) {
      const ddgData = await ddgRes.json();
      if (ddgData.Image && !isBadImage(ddgData.Image)) {
        return ddgData.Image.startsWith('http') ? ddgData.Image : `https://duckduckgo.com${ddgData.Image}`;
      }
    }
  } catch (e) {
    // ignore
  }

  return null;
}

async function run() {
  console.log("Fetching entities missing images...");
  const missingImages = await db.select().from(entities).where(isNull(entities.imageUrl));
  
  console.log(`Found ${missingImages.length} entities missing images.`);
  
  let successCount = 0;
  
  for (let i = 0; i < missingImages.length; i++) {
    const entity = missingImages[i];
    const url = await getImageUrl(entity.name);
    
    if (url) {
      await db.update(entities)
        .set({ imageUrl: url })
        .where(eq(entities.id, entity.id));
      successCount++;
      if (i % 10 === 0) console.log(`Processed ${i}/${missingImages.length} - found image for ${entity.name}`);
    } else {
      if (i % 10 === 0) console.log(`Processed ${i}/${missingImages.length} - no image for ${entity.name}`);
    }
    
    // Rate limit ourselves nicely
    await new Promise(r => setTimeout(r, 100));
  }
  
  console.log(`Finished! Updated ${successCount} entities with real images.`);
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
