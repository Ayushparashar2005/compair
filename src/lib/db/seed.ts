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
    { name: "African Elephant", slug: "african-elephant", categorySlug: "zoology", emoji: "🐘", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/bf/African_Elephant_%28Loxodonta_africana%29_male_%2817289351322%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "weight", v: 6000 }, { s: "top-speed", v: 40 }, { s: "lifespan", v: 65 }] },
    { name: "Blue Whale", slug: "blue-whale", categorySlug: "zoology", emoji: "🐋", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/1c/Anim1754_-_Flickr_-_NOAA_Photo_Library.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "weight", v: 140000 }, { s: "length", v: 30 }, { s: "lifespan", v: 85 }] },
    { name: "Cheetah", slug: "cheetah", categorySlug: "zoology", emoji: "🐆", imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/92/Male_cheetah_facing_left_in_South_Africa.jpg/3840px-Male_cheetah_facing_left_in_South_Africa.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail", stats: [{ s: "weight", v: 50 }, { s: "top-speed", v: 110 }, { s: "lifespan", v: 11 }] },
    { name: "Human", slug: "human", categorySlug: "zoology", emoji: "🧑", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/68/Akha_cropped_hires.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "weight", v: 70 }, { s: "top-speed", v: 25 }, { s: "lifespan", v: 75 }] },
    { name: "Ostrich", slug: "ostrich", categorySlug: "zoology", emoji: "🦤", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Struthio_camelus_-_Etosha_2014_%283%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "weight", v: 120 }, { s: "top-speed", v: 70 }, { s: "lifespan", v: 40 }] },
    { name: "Lion", slug: "lion", categorySlug: "zoology", emoji: "🦁", imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a6/020_The_lion_king_Snyggve_in_the_Serengeti_National_Park_Photo_by_Giles_Laurent.jpg/3840px-020_The_lion_king_Snyggve_in_the_Serengeti_National_Park_Photo_by_Giles_Laurent.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail", stats: [{ s: "weight", v: 190 }, { s: "top-speed", v: 80 }, { s: "lifespan", v: 14 }] },
    { name: "Horse", slug: "horse", categorySlug: "zoology", emoji: "🐎", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/de/Nokota_Horses_cropped.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "weight", v: 500 }, { s: "top-speed", v: 88 }, { s: "lifespan", v: 25 }] },
    { name: "Giraffe", slug: "giraffe", categorySlug: "zoology", emoji: "🦒", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9e/Giraffe_Mikumi_National_Park.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "weight", v: 1190 }, { s: "top-speed", v: 60 }, { s: "lifespan", v: 25 }, { s: "height", v: 5.5 }] },
    { name: "Gorilla", slug: "gorilla", categorySlug: "zoology", emoji: "🦍", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/bb/Gorille_des_plaines_de_l%27ouest_%C3%A0_l%27Espace_Zoologique.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "weight", v: 160 }, { s: "top-speed", v: 40 }, { s: "lifespan", v: 40 }] },
    { name: "Nile Crocodile", slug: "nile-crocodile", categorySlug: "zoology", emoji: "🐊", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/81/NileCrocodile.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "weight", v: 410 }, { s: "top-speed", v: 30 }, { s: "lifespan", v: 70 }] },
    { name: "Grizzly Bear", slug: "grizzly-bear", categorySlug: "zoology", emoji: "🐻", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a9/GrizzlyBearJeanBeaufort.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "weight", v: 270 }, { s: "top-speed", v: 56 }, { s: "lifespan", v: 25 }] },
    { name: "White Rhinoceros", slug: "white-rhinoceros", categorySlug: "zoology", emoji: "🦏", imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/28/109_Male_White_rhinoceros_walking_in_the_Kalahari_Desert_of_Namibia_Photo_by_Giles_Laurent.jpg/3840px-109_Male_White_rhinoceros_walking_in_the_Kalahari_Desert_of_Namibia_Photo_by_Giles_Laurent.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail", stats: [{ s: "weight", v: 2300 }, { s: "top-speed", v: 50 }, { s: "lifespan", v: 50 }] },
    { name: "Hippopotamus", slug: "hippopotamus", categorySlug: "zoology", emoji: "🦛", imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f2/Portrait_Hippopotamus_in_the_water.jpg/3840px-Portrait_Hippopotamus_in_the_water.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail", stats: [{ s: "weight", v: 1500 }, { s: "top-speed", v: 30 }, { s: "lifespan", v: 40 }] },
    { name: "Peregrine Falcon", slug: "peregrine-falcon", categorySlug: "zoology", emoji: "🦅", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Falco_peregrinus_m_Humber_Bay_Park_Toronto.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "weight", v: 1 }, { s: "top-speed", v: 389 }, { s: "lifespan", v: 15 }] },
    { name: "Great White Shark", slug: "great-white-shark", categorySlug: "zoology", emoji: "🦈", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/56/White_shark.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "weight", v: 1100 }, { s: "top-speed", v: 40 }, { s: "lifespan", v: 70 }] },
    { name: "Three-toed Sloth", slug: "three-toed-sloth", categorySlug: "zoology", emoji: "🦥", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/18/Bradypus.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "weight", v: 4.5 }, { s: "top-speed", v: 0.24 }, { s: "lifespan", v: 25 }] },
    { name: "Galapagos Tortoise", slug: "galapagos-tortoise", categorySlug: "zoology", emoji: "🐢", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/42/Galapagos_giant_tortoise_Geochelone_elephantopus.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "weight", v: 400 }, { s: "top-speed", v: 0.3 }, { s: "lifespan", v: 175 }] },
    { name: "Emperor Penguin", slug: "emperor-penguin", categorySlug: "zoology", emoji: "🐧", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a3/Aptenodytes_forsteri_-Snow_Hill_Island%2C_Antarctica_-adults_and_juvenile-8.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "weight", v: 40 }, { s: "top-speed", v: 9 }, { s: "lifespan", v: 20 }, { s: "height", v: 1.1 }] },
    { name: "Domestic Cat", slug: "domestic-cat", categorySlug: "zoology", emoji: "🐈", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/25/Siam_lilacpoint.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "weight", v: 4.5 }, { s: "top-speed", v: 48 }, { s: "lifespan", v: 15 }] },
    { name: "Polar Bear", slug: "polar-bear", categorySlug: "zoology", emoji: "🐻‍❄️", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/66/Polar_Bear_-_Alaska_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "weight", v: 450 }, { s: "top-speed", v: 40 }, { s: "lifespan", v: 25 }, { s: "height", v: 3 }] },
    { name: "Bluefin Tuna", slug: "bluefin-tuna", categorySlug: "zoology", emoji: "🐟", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/18/Bluefin-big.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "weight", v: 250 }, { s: "top-speed", v: 70 }, { s: "lifespan", v: 15 }] },
    
    // Astronomy (8)
    { name: "Earth", slug: "earth", categorySlug: "astronomy", emoji: "🌍", imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2d/Meteosat-12-fci-march-equinox-2025-noon.jpg/3840px-Meteosat-12-fci-march-equinox-2025-noon.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail", stats: [{ s: "distance-from-sun", v: 149.6 }, { s: "temperature", v: 15 }, { s: "age", v: 4500000000 }] },
    { name: "Mars", slug: "mars", categorySlug: "astronomy", emoji: "🪐", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/0/0c/Mars_-_August_30_2021_-_Flickr_-_Kevin_M._Gill.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "distance-from-sun", v: 227.9 }, { s: "temperature", v: -63 }, { s: "age", v: 4600000000 }] },
    { name: "Sun", slug: "sun", categorySlug: "astronomy", emoji: "☀️", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/83/The_Sun_in_white_light.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "temperature", v: 5500 }, { s: "age", v: 4600000000 }] },
    { name: "Jupiter", slug: "jupiter", categorySlug: "astronomy", emoji: "🪐", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e2/Jupiter_OPAL_2024.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "distance-from-sun", v: 778.5 }, { s: "temperature", v: -110 }, { s: "age", v: 4600000000 }] },
    { name: "Saturn", slug: "saturn", categorySlug: "astronomy", emoji: "🪐", imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/43/Saturn_global_view_from_Cassini%2C_rings_open_Better_Colour.png/3840px-Saturn_global_view_from_Cassini%2C_rings_open_Better_Colour.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail", stats: [{ s: "distance-from-sun", v: 1434 }, { s: "temperature", v: -140 }, { s: "age", v: 4500000000 }] },
    { name: "Mercury", slug: "mercury", categorySlug: "astronomy", emoji: "🪐", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Mercury_in_true_color.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "distance-from-sun", v: 57.9 }, { s: "temperature", v: 167 }, { s: "age", v: 4500000000 }] },
    { name: "Venus", slug: "venus", categorySlug: "astronomy", emoji: "🪐", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/0/08/Venus_from_Mariner_10.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "distance-from-sun", v: 108.2 }, { s: "temperature", v: 464 }, { s: "age", v: 4500000000 }] },
    { name: "Neptune", slug: "neptune", categorySlug: "astronomy", emoji: "🪐", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b9/Neptune_Voyager2_color_calibrated.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "distance-from-sun", v: 4495 }, { s: "temperature", v: -200 }, { s: "age", v: 4500000000 }] },
    { name: "Pluto", slug: "pluto", categorySlug: "astronomy", emoji: "🪐", imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/ca/Pluto_in_True_Color_-_High-Res.png/3840px-Pluto_in_True_Color_-_High-Res.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail", stats: [{ s: "distance-from-sun", v: 5906 }, { s: "temperature", v: -225 }, { s: "age", v: 4500000000 }] },
    { name: "The Moon", slug: "moon", categorySlug: "astronomy", emoji: "🌕", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e1/FullMoon2010.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "distance-from-sun", v: 150 }, { s: "temperature", v: -53 }, { s: "age", v: 4500000000 }] },
    { name: "Halley's Comet", slug: "halleys-comet", categorySlug: "astronomy", emoji: "☄️", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Lspn_comet_halley.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "age", v: 4600000000 }] },

    // Botany (8)
    { name: "Giant Sequoia", slug: "giant-sequoia", categorySlug: "botany", emoji: "🌲", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/1c/Grizzly_Giant_Mariposa_Grove.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "height", v: 85 }, { s: "lifespan", v: 3000 }] },
    { name: "Coast Redwood", slug: "coast-redwood", categorySlug: "botany", emoji: "🌲", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/0/03/US_199_Redwood_Highway.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "height", v: 115 }, { s: "lifespan", v: 2000 }] },
    { name: "Baobab Tree", slug: "baobab-tree", categorySlug: "botany", emoji: "🌳", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/3/36/Baobab_Adansonia_digitata.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "height", v: 30 }, { s: "lifespan", v: 2000 }] },
    { name: "Bristlecone Pine", slug: "bristlecone-pine", categorySlug: "botany", emoji: "🌲", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/58/Big_bristlecone_pine_Pinus_longaeva.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "height", v: 15 }, { s: "lifespan", v: 5000 }] },
    { name: "Bamboo", slug: "bamboo", categorySlug: "botany", emoji: "🎋", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/f/f3/Bamboo_forest.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "height", v: 35 }, { s: "lifespan", v: 120 }] },
    { name: "Oak Tree", slug: "oak-tree", categorySlug: "botany", emoji: "🌳", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/a/af/Quercus_robur.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "height", v: 25 }, { s: "lifespan", v: 600 }] },
    { name: "Corpse Flower", slug: "corpse-flower", categorySlug: "botany", emoji: "🌺", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Amorphophallus_titanum_%28corpse_flower%29_-_2.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "height", v: 3 }, { s: "lifespan", v: 40 }] },
    { name: "Amazon Water Lily", slug: "amazon-water-lily", categorySlug: "botany", emoji: "🪷", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b4/Victoria_amazonica_edit_1.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "length", v: 3 }, { s: "lifespan", v: 1 }] },
    { name: "Saguaro Cactus", slug: "saguaro-cactus", categorySlug: "botany", emoji: "🌵", imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cd/Carnegiea_gigantea_in_Saguaro_National_Park_near_Tucson%2C_Arizona_during_November_%2858%29.jpg/1920px-Carnegiea_gigantea_in_Saguaro_National_Park_near_Tucson%2C_Arizona_during_November_%2858%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail", stats: [{ s: "height", v: 12 }, { s: "lifespan", v: 150 }] },
    { name: "Venus Flytrap", slug: "venus-flytrap", categorySlug: "botany", emoji: "🌱", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/3/37/Venus_Flytrap_showing_trigger_hairs.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "height", v: 0.3 }, { s: "lifespan", v: 20 }] },
    { name: "Giant Kelp", slug: "giant-kelp", categorySlug: "botany", emoji: "🌿", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9a/Giantkelp2_300.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "length", v: 45 }, { s: "lifespan", v: 7 }] },

    // Human Body (8)
    { name: "Human Brain", slug: "human-brain", categorySlug: "human-body", emoji: "🧠", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/89/Brain_autopsy_lateral_view.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "weight", v: 1.4 }, { s: "volume", v: 1260 }] },
    { name: "Human Heart", slug: "human-heart", categorySlug: "human-body", emoji: "🫀", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/1b/Heart_anterior_exterior_view.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "weight", v: 0.3 }, { s: "volume", v: 250 }] },
    { name: "Human Liver", slug: "human-liver", categorySlug: "human-body", emoji: "🩸", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/15/Anatomy_Abdomen_Tiesworks.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "weight", v: 1.5 }, { s: "volume", v: 1500 }] },
    { name: "Human Lung", slug: "human-lung", categorySlug: "human-body", emoji: "🫁", imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a1/Lungs_diagram_detailed.svg/960px-Lungs_diagram_detailed.svg.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail", stats: [{ s: "weight", v: 1.0 }, { s: "volume", v: 3000 }] },
    { name: "Small Intestine", slug: "small-intestine", categorySlug: "human-body", emoji: "🧬", imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d4/Tractus_intestinalis_intestinum_tenue.svg/500px-Tractus_intestinalis_intestinum_tenue.svg.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail", stats: [{ s: "length", v: 7 }, { s: "weight", v: 1.5 }] },
    { name: "Femur Bone", slug: "femur-bone", categorySlug: "human-body", emoji: "🦴", imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8f/Femur_-_anterior_view2.png/3840px-Femur_-_anterior_view2.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail", stats: [{ s: "length", v: 0.48 }, { s: "weight", v: 0.26 }] },
    { name: "Human Skin", slug: "human-skin", categorySlug: "human-body", emoji: "🤚", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/13/Human_skin_structure.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "weight", v: 4.5 }, { s: "length", v: 2 }] },
    { name: "Human Eye", slug: "human-eye", categorySlug: "human-body", emoji: "👁️", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Human_eye_with_blood_vessels.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "weight", v: 0.0075 }, { s: "volume", v: 6.5 }] },
    { name: "Human Stomach", slug: "human-stomach", categorySlug: "human-body", emoji: "🤢", imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/31/Gray1046.svg/1280px-Gray1046.svg.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail", stats: [{ s: "volume", v: 1000 }, { s: "weight", v: 0.15 }] },
    { name: "Red Blood Cell", slug: "red-blood-cell", categorySlug: "human-body", emoji: "🩸", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/3/39/Blausen_0761_RedBloodCells.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "lifespan", v: 0.33 }] }, // 120 days
    { name: "Human Tongue", slug: "human-tongue", categorySlug: "human-body", emoji: "👅", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b8/%D8%B2%D8%A8%D8%A7%D9%86_tongue.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "length", v: 0.1 }, { s: "weight", v: 0.07 }] },

    // Geography (8)
    { name: "Mount Everest", slug: "mount-everest", categorySlug: "geography", emoji: "🏔️", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/15/Mt._Everest_from_Gokyo_Ri_November_5%2C_2012.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "height", v: 8848.86 }] },
    { name: "Mariana Trench", slug: "mariana-trench", categorySlug: "geography", emoji: "🌊", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/1b/Marianatrenchmap.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "depth", v: 10984 }] },
    { name: "Nile River", slug: "nile-river", categorySlug: "geography", emoji: "💧", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Beautiful_nature_along_Nile_River_01.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "length", v: 6650 }] },
    { name: "Amazon River", slug: "amazon-river", categorySlug: "geography", emoji: "💧", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/f/f8/Amazon_River_ESA387332.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "length", v: 6400 }] },
    { name: "Sahara Desert", slug: "sahara-desert", categorySlug: "geography", emoji: "🏜️", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Sahara_real_color.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "length", v: 4800 }] },
    { name: "Pacific Ocean", slug: "pacific-ocean", categorySlug: "geography", emoji: "🌊", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/f/f6/Pacific_Ocean_-_en.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "depth", v: 10984 }, { s: "volume", v: 710000000 }] },
    { name: "Lake Baikal", slug: "lake-baikal", categorySlug: "geography", emoji: "🏞️", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/6a/Baikal.A2001296.0420.250m-NASA.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "depth", v: 1642 }, { s: "volume", v: 23615 }] },
    { name: "Grand Canyon", slug: "grand-canyon", categorySlug: "geography", emoji: "🏜️", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/3/31/Canyon_River_Tree_%28165872763%29.jpeg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "depth", v: 1857 }, { s: "length", v: 446 }] },
    { name: "Burj Khalifa", slug: "burj-khalifa", categorySlug: "geography", emoji: "🏢", imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/90/Burj_Khalifa_%28worlds_tallest_building%29_and_the_Dubai_skyline_%2825781049892%29.jpg/3840px-Burj_Khalifa_%28worlds_tallest_building%29_and_the_Dubai_skyline_%2825781049892%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail", stats: [{ s: "height", v: 828 }] },
    { name: "Eiffel Tower", slug: "eiffel-tower", categorySlug: "geography", emoji: "🗼", imageUrl: "https://thumb.wikimedia.org/wikipedia/en/thumb/b/ba/Eiffel_Tower_logo.svg/330px-Eiffel_Tower_logo.svg.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail", stats: [{ s: "height", v: 330 }, { s: "weight", v: 10100 }] },
    { name: "Angel Falls", slug: "angel-falls", categorySlug: "geography", emoji: "🌊", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e9/SaltoAngel1.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "height", v: 979 }] },
    { name: "K2", slug: "k2", categorySlug: "geography", emoji: "🏔️", imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c9/Chogori.jpg/3840px-Chogori.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail", stats: [{ s: "height", v: 8611 }] },
    { name: "Statue of Liberty", slug: "statue-of-liberty", categorySlug: "geography", emoji: "🗽", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/89/Front_view_of_Statue_of_Liberty_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "height", v: 93 }, { s: "weight", v: 204100 }] },

    // History (5)
    { name: "Roman Empire", slug: "roman-empire", categorySlug: "history", emoji: "🏛️", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/0/00/Roman_Empire_Trajan_117AD.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "duration", v: 507 }] },
    { name: "Ottoman Empire", slug: "ottoman-empire", categorySlug: "history", emoji: "🕌", imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8e/Flag_of_the_Ottoman_Empire_%281844%E2%80%931922%29.svg/1280px-Flag_of_the_Ottoman_Empire_%281844%E2%80%931922%29.svg.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail", stats: [{ s: "duration", v: 623 }] },
    { name: "Byzantine Empire", slug: "byzantine-empire", categorySlug: "history", emoji: "🏰", imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/47/Eastern_Roman_Empire_565_CE.svg/1280px-Eastern_Roman_Empire_565_CE.svg.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail", stats: [{ s: "duration", v: 1123 }] },
    { name: "Ming Dynasty", slug: "ming-dynasty", categorySlug: "history", emoji: "🐉", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/bc/Map_of_Ming_Chinese_empire_1415_%28cropped_2%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "duration", v: 276 }] },
    { name: "British Empire", slug: "british-empire", categorySlug: "history", emoji: "🇬🇧", imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f2/Flag_of_Great_Britain_%281707%E2%80%931800%29.svg/1280px-Flag_of_Great_Britain_%281707%E2%80%931800%29.svg.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail", stats: [{ s: "duration", v: 390 }] },
    { name: "Han Dynasty", slug: "han-dynasty", categorySlug: "history", emoji: "📜", imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/96/Han_Dynasty_2_BC_%28cropped%29.svg/960px-Han_Dynasty_2_BC_%28cropped%29.svg.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail", stats: [{ s: "duration", v: 426 }] },
    { name: "Aztec Empire", slug: "aztec-empire", categorySlug: "history", emoji: "🦅", imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/de/Aztec_Empire_ME_%28orthographic_projection%29.svg/960px-Aztec_Empire_ME_%28orthographic_projection%29.svg.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail", stats: [{ s: "duration", v: 193 }] },
    { name: "Mongol Empire", slug: "mongol-empire", categorySlug: "history", emoji: "🐎", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/62/Expansion_of_the_Mongol_Empire_1206%E2%80%931294.gif?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", stats: [{ s: "duration", v: 162 }] },
    { name: "Spanish Empire", slug: "spanish-empire", categorySlug: "history", emoji: "🇪🇸", imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f5/Flag_of_Cross_of_Burgundy.svg/960px-Flag_of_Cross_of_Burgundy.svg.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail", stats: [{ s: "duration", v: 512 }] },
  ];

  for (const entityDef of entitiesToSeed) {
    const entityId = genId();
    await db.insert(schema.entities).values({
      id: entityId,
      name: entityDef.name,
      slug: entityDef.slug,
      categoryId: getCatId(entityDef.categorySlug),
      emoji: entityDef.emoji,
      imageUrl: (entityDef as any).imageUrl ?? null,
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
