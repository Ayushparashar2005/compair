import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import 'dotenv/config';
import crypto from 'node:crypto';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const genId = () => crypto.randomUUID();

async function main() {
  console.log("Seeding database with expanded data...");

  await db.delete(schema.entityStats);
  await db.delete(schema.gameQuestions);
  await db.delete(schema.gameSessions);
  await db.delete(schema.entities);
  await db.delete(schema.stats);
  await db.delete(schema.categories);

  const categoriesData = [
    { id: genId(), name: "Zoology", slug: "zoology", description: "The animal kingdom", icon: "🐘", color: "oklch(68% 0.20 145)" },
    { id: genId(), name: "Astronomy", slug: "astronomy", description: "Space and the universe", icon: "🪐", color: "oklch(60% 0.22 260)" },
    { id: genId(), name: "Botany", slug: "botany", description: "Plant life", icon: "🌳", color: "oklch(75% 0.20 150)" },
    { id: genId(), name: "Human Body", slug: "human-body", description: "Human anatomy", icon: "🧠", color: "oklch(65% 0.20 20)" },
    { id: genId(), name: "Geography", slug: "geography", description: "Earth's features", icon: "🏔️", color: "oklch(70% 0.15 220)" },
    { id: genId(), name: "History", slug: "history", description: "Human history", icon: "🏛️", color: "oklch(70% 0.15 50)" },
  ];

  await db.insert(schema.categories).values(categoriesData).onConflictDoNothing();

  const statsData = [
    { id: genId(), name: "Weight", slug: "weight", unit: "kg", description: "Mass in kilograms" },
    { id: genId(), name: "Top Speed", slug: "top-speed", unit: "km/h", description: "Maximum speed" },
    { id: genId(), name: "Lifespan", slug: "lifespan", unit: "years", description: "Average lifespan" },
    { id: genId(), name: "Height", slug: "height", unit: "m", description: "Height in meters" },
    { id: genId(), name: "Length", slug: "length", unit: "m", description: "Length in meters" },
    { id: genId(), name: "Age", slug: "age", unit: "years", description: "Estimated age" },
    { id: genId(), name: "Distance from Sun", slug: "distance-from-sun", unit: "M km", description: "Distance in million km" },
    { id: genId(), name: "Temperature", slug: "temperature", unit: "°C", description: "Average temperature" },
    { id: genId(), name: "Depth", slug: "depth", unit: "m", description: "Maximum depth" },
    { id: genId(), name: "Duration", slug: "duration", unit: "years", description: "Duration in years" },
    { id: genId(), name: "Volume", slug: "volume", unit: "cm³", description: "Volume" },
  ];

  await db.insert(schema.stats).values(statsData).onConflictDoNothing();

  const getCatId = (slug: string) => categoriesData.find(c => c.slug === slug)!.id;
  const getStatId = (slug: string) => statsData.find(s => s.slug === slug)!.id;

  const entitiesToSeed = [
    // Zoology (15)
    { name: "African Elephant", slug: "african-elephant", categorySlug: "zoology", emoji: "🐘", stats: [{ s: "weight", v: 6000 }, { s: "top-speed", v: 40 }, { s: "lifespan", v: 65 }] },
    { name: "Blue Whale", slug: "blue-whale", categorySlug: "zoology", emoji: "🐋", stats: [{ s: "weight", v: 140000 }, { s: "length", v: 30 }, { s: "lifespan", v: 85 }] },
    { name: "Cheetah", slug: "cheetah", categorySlug: "zoology", emoji: "🐆", stats: [{ s: "weight", v: 50 }, { s: "top-speed", v: 110 }, { s: "lifespan", v: 11 }] },
    { name: "Human", slug: "human", categorySlug: "zoology", emoji: "🧑", stats: [{ s: "weight", v: 70 }, { s: "top-speed", v: 25 }, { s: "lifespan", v: 75 }] },
    { name: "Ostrich", slug: "ostrich", categorySlug: "zoology", emoji: "🦤", stats: [{ s: "weight", v: 120 }, { s: "top-speed", v: 70 }, { s: "lifespan", v: 40 }] },
    { name: "Lion", slug: "lion", categorySlug: "zoology", emoji: "🦁", stats: [{ s: "weight", v: 190 }, { s: "top-speed", v: 80 }, { s: "lifespan", v: 14 }] },
    { name: "Horse", slug: "horse", categorySlug: "zoology", emoji: "🐎", stats: [{ s: "weight", v: 500 }, { s: "top-speed", v: 88 }, { s: "lifespan", v: 25 }] },
    { name: "Giraffe", slug: "giraffe", categorySlug: "zoology", emoji: "🦒", stats: [{ s: "weight", v: 1190 }, { s: "top-speed", v: 60 }, { s: "lifespan", v: 25 }, { s: "height", v: 5.5 }] },
    { name: "Gorilla", slug: "gorilla", categorySlug: "zoology", emoji: "🦍", stats: [{ s: "weight", v: 160 }, { s: "top-speed", v: 40 }, { s: "lifespan", v: 40 }] },
    { name: "Nile Crocodile", slug: "nile-crocodile", categorySlug: "zoology", emoji: "🐊", stats: [{ s: "weight", v: 410 }, { s: "top-speed", v: 30 }, { s: "lifespan", v: 70 }] },
    { name: "Grizzly Bear", slug: "grizzly-bear", categorySlug: "zoology", emoji: "🐻", stats: [{ s: "weight", v: 270 }, { s: "top-speed", v: 56 }, { s: "lifespan", v: 25 }] },
    { name: "White Rhinoceros", slug: "white-rhinoceros", categorySlug: "zoology", emoji: "🦏", stats: [{ s: "weight", v: 2300 }, { s: "top-speed", v: 50 }, { s: "lifespan", v: 50 }] },
    { name: "Hippopotamus", slug: "hippopotamus", categorySlug: "zoology", emoji: "🦛", stats: [{ s: "weight", v: 1500 }, { s: "top-speed", v: 30 }, { s: "lifespan", v: 40 }] },
    { name: "Peregrine Falcon", slug: "peregrine-falcon", categorySlug: "zoology", emoji: "🦅", stats: [{ s: "weight", v: 1 }, { s: "top-speed", v: 389 }, { s: "lifespan", v: 15 }] },
    { name: "Great White Shark", slug: "great-white-shark", categorySlug: "zoology", emoji: "🦈", stats: [{ s: "weight", v: 1100 }, { s: "top-speed", v: 40 }, { s: "lifespan", v: 70 }] },
    { name: "Three-toed Sloth", slug: "three-toed-sloth", categorySlug: "zoology", emoji: "🦥", stats: [{ s: "weight", v: 4.5 }, { s: "top-speed", v: 0.24 }, { s: "lifespan", v: 25 }] },
    { name: "Galapagos Tortoise", slug: "galapagos-tortoise", categorySlug: "zoology", emoji: "🐢", stats: [{ s: "weight", v: 400 }, { s: "top-speed", v: 0.3 }, { s: "lifespan", v: 175 }] },
    { name: "Emperor Penguin", slug: "emperor-penguin", categorySlug: "zoology", emoji: "🐧", stats: [{ s: "weight", v: 40 }, { s: "top-speed", v: 9 }, { s: "lifespan", v: 20 }, { s: "height", v: 1.1 }] },
    { name: "Domestic Cat", slug: "domestic-cat", categorySlug: "zoology", emoji: "🐈", stats: [{ s: "weight", v: 4.5 }, { s: "top-speed", v: 48 }, { s: "lifespan", v: 15 }] },
    { name: "Polar Bear", slug: "polar-bear", categorySlug: "zoology", emoji: "🐻‍❄️", stats: [{ s: "weight", v: 450 }, { s: "top-speed", v: 40 }, { s: "lifespan", v: 25 }, { s: "height", v: 3 }] },
    { name: "Bluefin Tuna", slug: "bluefin-tuna", categorySlug: "zoology", emoji: "🐟", stats: [{ s: "weight", v: 250 }, { s: "top-speed", v: 70 }, { s: "lifespan", v: 15 }] },
    
    // Astronomy (8)
    { name: "Earth", slug: "earth", categorySlug: "astronomy", emoji: "🌍", stats: [{ s: "distance-from-sun", v: 149.6 }, { s: "temperature", v: 15 }, { s: "age", v: 4500000000 }] },
    { name: "Mars", slug: "mars", categorySlug: "astronomy", emoji: "🪐", stats: [{ s: "distance-from-sun", v: 227.9 }, { s: "temperature", v: -63 }, { s: "age", v: 4600000000 }] },
    { name: "Sun", slug: "sun", categorySlug: "astronomy", emoji: "☀️", stats: [{ s: "temperature", v: 5500 }, { s: "age", v: 4600000000 }] },
    { name: "Jupiter", slug: "jupiter", categorySlug: "astronomy", emoji: "🪐", stats: [{ s: "distance-from-sun", v: 778.5 }, { s: "temperature", v: -110 }, { s: "age", v: 4600000000 }] },
    { name: "Saturn", slug: "saturn", categorySlug: "astronomy", emoji: "🪐", stats: [{ s: "distance-from-sun", v: 1434 }, { s: "temperature", v: -140 }, { s: "age", v: 4500000000 }] },
    { name: "Mercury", slug: "mercury", categorySlug: "astronomy", emoji: "🪐", stats: [{ s: "distance-from-sun", v: 57.9 }, { s: "temperature", v: 167 }, { s: "age", v: 4500000000 }] },
    { name: "Venus", slug: "venus", categorySlug: "astronomy", emoji: "🪐", stats: [{ s: "distance-from-sun", v: 108.2 }, { s: "temperature", v: 464 }, { s: "age", v: 4500000000 }] },
    { name: "Neptune", slug: "neptune", categorySlug: "astronomy", emoji: "🪐", stats: [{ s: "distance-from-sun", v: 4495 }, { s: "temperature", v: -200 }, { s: "age", v: 4500000000 }] },
    { name: "Pluto", slug: "pluto", categorySlug: "astronomy", emoji: "🪐", stats: [{ s: "distance-from-sun", v: 5906 }, { s: "temperature", v: -225 }, { s: "age", v: 4500000000 }] },
    { name: "The Moon", slug: "moon", categorySlug: "astronomy", emoji: "🌕", stats: [{ s: "distance-from-sun", v: 150 }, { s: "temperature", v: -53 }, { s: "age", v: 4500000000 }] },
    { name: "Halley's Comet", slug: "halleys-comet", categorySlug: "astronomy", emoji: "☄️", stats: [{ s: "age", v: 4600000000 }] },

    // Botany (8)
    { name: "Giant Sequoia", slug: "giant-sequoia", categorySlug: "botany", emoji: "🌲", stats: [{ s: "height", v: 85 }, { s: "lifespan", v: 3000 }] },
    { name: "Coast Redwood", slug: "coast-redwood", categorySlug: "botany", emoji: "🌲", stats: [{ s: "height", v: 115 }, { s: "lifespan", v: 2000 }] },
    { name: "Baobab Tree", slug: "baobab-tree", categorySlug: "botany", emoji: "🌳", stats: [{ s: "height", v: 30 }, { s: "lifespan", v: 2000 }] },
    { name: "Bristlecone Pine", slug: "bristlecone-pine", categorySlug: "botany", emoji: "🌲", stats: [{ s: "height", v: 15 }, { s: "lifespan", v: 5000 }] },
    { name: "Bamboo", slug: "bamboo", categorySlug: "botany", emoji: "🎋", stats: [{ s: "height", v: 35 }, { s: "lifespan", v: 120 }] },
    { name: "Oak Tree", slug: "oak-tree", categorySlug: "botany", emoji: "🌳", stats: [{ s: "height", v: 25 }, { s: "lifespan", v: 600 }] },
    { name: "Corpse Flower", slug: "corpse-flower", categorySlug: "botany", emoji: "🌺", stats: [{ s: "height", v: 3 }, { s: "lifespan", v: 40 }] },
    { name: "Amazon Water Lily", slug: "amazon-water-lily", categorySlug: "botany", emoji: "🪷", stats: [{ s: "length", v: 3 }, { s: "lifespan", v: 1 }] },
    { name: "Saguaro Cactus", slug: "saguaro-cactus", categorySlug: "botany", emoji: "🌵", stats: [{ s: "height", v: 12 }, { s: "lifespan", v: 150 }] },
    { name: "Venus Flytrap", slug: "venus-flytrap", categorySlug: "botany", emoji: "🌱", stats: [{ s: "height", v: 0.3 }, { s: "lifespan", v: 20 }] },
    { name: "Giant Kelp", slug: "giant-kelp", categorySlug: "botany", emoji: "🌿", stats: [{ s: "length", v: 45 }, { s: "lifespan", v: 7 }] },

    // Human Body (8)
    { name: "Human Brain", slug: "human-brain", categorySlug: "human-body", emoji: "🧠", stats: [{ s: "weight", v: 1.4 }, { s: "volume", v: 1260 }] },
    { name: "Human Heart", slug: "human-heart", categorySlug: "human-body", emoji: "🫀", stats: [{ s: "weight", v: 0.3 }, { s: "volume", v: 250 }] },
    { name: "Human Liver", slug: "human-liver", categorySlug: "human-body", emoji: "🩸", stats: [{ s: "weight", v: 1.5 }, { s: "volume", v: 1500 }] },
    { name: "Human Lung", slug: "human-lung", categorySlug: "human-body", emoji: "🫁", stats: [{ s: "weight", v: 1.0 }, { s: "volume", v: 3000 }] },
    { name: "Small Intestine", slug: "small-intestine", categorySlug: "human-body", emoji: "🧬", stats: [{ s: "length", v: 7 }, { s: "weight", v: 1.5 }] },
    { name: "Femur Bone", slug: "femur-bone", categorySlug: "human-body", emoji: "🦴", stats: [{ s: "length", v: 0.48 }, { s: "weight", v: 0.26 }] },
    { name: "Human Skin", slug: "human-skin", categorySlug: "human-body", emoji: "🤚", stats: [{ s: "weight", v: 4.5 }, { s: "length", v: 2 }] },
    { name: "Human Eye", slug: "human-eye", categorySlug: "human-body", emoji: "👁️", stats: [{ s: "weight", v: 0.0075 }, { s: "volume", v: 6.5 }] },
    { name: "Human Stomach", slug: "human-stomach", categorySlug: "human-body", emoji: "🤢", stats: [{ s: "volume", v: 1000 }, { s: "weight", v: 0.15 }] },
    { name: "Red Blood Cell", slug: "red-blood-cell", categorySlug: "human-body", emoji: "🩸", stats: [{ s: "lifespan", v: 0.33 }] }, // 120 days
    { name: "Human Tongue", slug: "human-tongue", categorySlug: "human-body", emoji: "👅", stats: [{ s: "length", v: 0.1 }, { s: "weight", v: 0.07 }] },

    // Geography (8)
    { name: "Mount Everest", slug: "mount-everest", categorySlug: "geography", emoji: "🏔️", stats: [{ s: "height", v: 8848.86 }] },
    { name: "Mariana Trench", slug: "mariana-trench", categorySlug: "geography", emoji: "🌊", stats: [{ s: "depth", v: 10984 }] },
    { name: "Nile River", slug: "nile-river", categorySlug: "geography", emoji: "💧", stats: [{ s: "length", v: 6650 }] },
    { name: "Amazon River", slug: "amazon-river", categorySlug: "geography", emoji: "💧", stats: [{ s: "length", v: 6400 }] },
    { name: "Sahara Desert", slug: "sahara-desert", categorySlug: "geography", emoji: "🏜️", stats: [{ s: "length", v: 4800 }] },
    { name: "Pacific Ocean", slug: "pacific-ocean", categorySlug: "geography", emoji: "🌊", stats: [{ s: "depth", v: 10984 }, { s: "volume", v: 710000000 }] },
    { name: "Lake Baikal", slug: "lake-baikal", categorySlug: "geography", emoji: "🏞️", stats: [{ s: "depth", v: 1642 }, { s: "volume", v: 23615 }] },
    { name: "Grand Canyon", slug: "grand-canyon", categorySlug: "geography", emoji: "🏜️", stats: [{ s: "depth", v: 1857 }, { s: "length", v: 446 }] },
    { name: "Burj Khalifa", slug: "burj-khalifa", categorySlug: "geography", emoji: "🏢", stats: [{ s: "height", v: 828 }] },
    { name: "Eiffel Tower", slug: "eiffel-tower", categorySlug: "geography", emoji: "🗼", stats: [{ s: "height", v: 330 }, { s: "weight", v: 10100 }] },
    { name: "Angel Falls", slug: "angel-falls", categorySlug: "geography", emoji: "🌊", stats: [{ s: "height", v: 979 }] },
    { name: "K2", slug: "k2", categorySlug: "geography", emoji: "🏔️", stats: [{ s: "height", v: 8611 }] },
    { name: "Statue of Liberty", slug: "statue-of-liberty", categorySlug: "geography", emoji: "🗽", stats: [{ s: "height", v: 93 }, { s: "weight", v: 204100 }] },

    // History (5)
    { name: "Roman Empire", slug: "roman-empire", categorySlug: "history", emoji: "🏛️", stats: [{ s: "duration", v: 507 }] },
    { name: "Ottoman Empire", slug: "ottoman-empire", categorySlug: "history", emoji: "🕌", stats: [{ s: "duration", v: 623 }] },
    { name: "Byzantine Empire", slug: "byzantine-empire", categorySlug: "history", emoji: "🏰", stats: [{ s: "duration", v: 1123 }] },
    { name: "Ming Dynasty", slug: "ming-dynasty", categorySlug: "history", emoji: "🐉", stats: [{ s: "duration", v: 276 }] },
    { name: "British Empire", slug: "british-empire", categorySlug: "history", emoji: "🇬🇧", stats: [{ s: "duration", v: 390 }] },
    { name: "Han Dynasty", slug: "han-dynasty", categorySlug: "history", emoji: "📜", stats: [{ s: "duration", v: 426 }] },
    { name: "Aztec Empire", slug: "aztec-empire", categorySlug: "history", emoji: "🦅", stats: [{ s: "duration", v: 193 }] },
    { name: "Mongol Empire", slug: "mongol-empire", categorySlug: "history", emoji: "🐎", stats: [{ s: "duration", v: 162 }] },
    { name: "Spanish Empire", slug: "spanish-empire", categorySlug: "history", emoji: "🇪🇸", stats: [{ s: "duration", v: 512 }] },
  ];

  for (const entityDef of entitiesToSeed) {
    const entityId = genId();
    await db.insert(schema.entities).values({
      id: entityId,
      name: entityDef.name,
      slug: entityDef.slug,
      categoryId: getCatId(entityDef.categorySlug),
      emoji: entityDef.emoji,
    }).onConflictDoNothing();

    for (const statDef of entityDef.stats) {
      await db.insert(schema.entityStats).values({
        id: genId(),
        entityId: entityId,
        statId: getStatId(statDef.s),
        value: statDef.v,
      }).onConflictDoNothing();
    }
  }

  console.log("Seeding complete.");
}

main().catch(console.error);
