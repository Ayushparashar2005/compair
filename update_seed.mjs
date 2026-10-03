import fs from 'node:fs';

const seedFile = 'src/lib/db/seed.ts';
let seedContent = fs.readFileSync(seedFile, 'utf-8');
const images = JSON.parse(fs.readFileSync('wiki_images.json', 'utf-8'));

for (const [slug, url] of Object.entries(images)) {
  const regex = new RegExp(`({ name: "[^"]+", slug: "${slug}", categorySlug: "[^"]+", emoji: "[^"]+")(, stats: \\[)`);
  seedContent = seedContent.replace(regex, `$1, imageUrl: "${url}"$2`);
}

// Also update the db.insert statement
seedContent = seedContent.replace(
  /emoji: entityDef\.emoji,\s+\}\)\.onConflictDoNothing\(\);/,
  `emoji: entityDef.emoji,\n      imageUrl: (entityDef as any).imageUrl ?? null,\n    }).onConflictDoNothing();`
);

fs.writeFileSync(seedFile, seedContent);
console.log("Updated seed.ts");
