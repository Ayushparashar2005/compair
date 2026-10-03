import fs from 'node:fs';

const seedFile = 'src/lib/db/seed.ts';
let seedContent = fs.readFileSync(seedFile, 'utf-8');

const subtypeMapping = {
    "african-elephant": "mammal",
    "blue-whale": "marine_mammal",
    "cheetah": "mammal",
    "human": "mammal",
    "ostrich": "bird",
    "lion": "mammal",
    "horse": "mammal",
    "giraffe": "mammal",
    "gorilla": "mammal",
    "nile-crocodile": "reptile",
    "grizzly-bear": "mammal",
    "white-rhinoceros": "mammal",
    "hippopotamus": "mammal",
    "peregrine-falcon": "bird",
    "great-white-shark": "fish",
    "three-toed-sloth": "mammal",
    "galapagos-tortoise": "reptile",
    "emperor-penguin": "bird",
    "domestic-cat": "mammal",
    "polar-bear": "mammal",
    "bluefin-tuna": "fish",

    "earth": "planet",
    "mars": "planet",
    "sun": "star",
    "jupiter": "planet",
    "saturn": "planet",
    "mercury": "planet",
    "venus": "planet",
    "neptune": "planet",
    "pluto": "dwarf_planet",
    "moon": "moon",
    "halleys-comet": "comet",

    "giant-sequoia": "tree",
    "coast-redwood": "tree",
    "baobab-tree": "tree",
    "bristlecone-pine": "tree",
    "bamboo": "grass",
    "oak-tree": "tree",
    "corpse-flower": "flower",
    "amazon-water-lily": "flower",
    "saguaro-cactus": "cactus",
    "venus-flytrap": "plant",
    "giant-kelp": "algae",

    "human-brain": "organ",
    "human-heart": "organ",
    "human-liver": "organ",
    "human-lung": "organ",
    "small-intestine": "organ",
    "femur-bone": "bone",
    "human-skin": "organ",
    "human-eye": "organ",
    "human-stomach": "organ",
    "red-blood-cell": "cell",
    "human-tongue": "organ",

    "mount-everest": "mountain",
    "mariana-trench": "trench",
    "nile-river": "river",
    "amazon-river": "river",
    "sahara-desert": "desert",
    "pacific-ocean": "ocean",
    "lake-baikal": "lake",
    "grand-canyon": "canyon",
    "burj-khalifa": "landmark",
    "eiffel-tower": "landmark",
    "angel-falls": "waterfall",
    "k2": "mountain",
    "statue-of-liberty": "landmark",

    "roman-empire": "empire",
    "ottoman-empire": "empire",
    "byzantine-empire": "empire",
    "ming-dynasty": "empire",
    "british-empire": "empire",
    "han-dynasty": "empire",
    "aztec-empire": "empire",
    "mongol-empire": "empire",
    "spanish-empire": "empire"
};

for (const [slug, subType] of Object.entries(subtypeMapping)) {
  const regex = new RegExp(`({ name: "[^"]+", slug: "${slug}", categorySlug: "[^"]+", emoji: "[^"]+", imageUrl: "[^"]+")(, stats: \\[)`);
  seedContent = seedContent.replace(regex, `$1, subType: "${subType}"$2`);
}

seedContent = seedContent.replace(
  /imageUrl: \(entityDef as any\)\.imageUrl \?\? null,/,
  `imageUrl: (entityDef as any).imageUrl ?? null,\n      subType: (entityDef as any).subType ?? null,`
);

fs.writeFileSync(seedFile, seedContent);
console.log("Updated seed.ts with subTypes");
