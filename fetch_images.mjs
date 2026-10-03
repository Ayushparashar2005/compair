import fs from 'node:fs';

const entitiesToSeed = [
    // Zoology
    { name: "African elephant", slug: "african-elephant" },
    { name: "Blue whale", slug: "blue-whale" },
    { name: "Cheetah", slug: "cheetah" },
    { name: "Human", slug: "human" },
    { name: "Common ostrich", slug: "ostrich" },
    { name: "Lion", slug: "lion" },
    { name: "Horse", slug: "horse" },
    { name: "Giraffe", slug: "giraffe" },
    { name: "Gorilla", slug: "gorilla" },
    { name: "Nile crocodile", slug: "nile-crocodile" },
    { name: "Grizzly bear", slug: "grizzly-bear" },
    { name: "White rhinoceros", slug: "white-rhinoceros" },
    { name: "Hippopotamus", slug: "hippopotamus" },
    { name: "Peregrine falcon", slug: "peregrine-falcon" },
    { name: "Great white shark", slug: "great-white-shark" },
    { name: "Brown-throated sloth", slug: "three-toed-sloth" },
    { name: "Galapagos tortoise", slug: "galapagos-tortoise" },
    { name: "Emperor penguin", slug: "emperor-penguin" },
    { name: "Cat", slug: "domestic-cat" },
    { name: "Polar bear", slug: "polar-bear" },
    { name: "Atlantic bluefin tuna", slug: "bluefin-tuna" },
    
    // Astronomy
    { name: "Earth", slug: "earth" },
    { name: "Mars", slug: "mars" },
    { name: "Sun", slug: "sun" },
    { name: "Jupiter", slug: "jupiter" },
    { name: "Saturn", slug: "saturn" },
    { name: "Mercury (planet)", slug: "mercury" },
    { name: "Venus", slug: "venus" },
    { name: "Neptune", slug: "neptune" },
    { name: "Pluto", slug: "pluto" },
    { name: "Moon", slug: "moon" },
    { name: "Halley's Comet", slug: "halleys-comet" },

    // Botany
    { name: "Sequoiadendron giganteum", slug: "giant-sequoia" },
    { name: "Sequoia sempervirens", slug: "coast-redwood" },
    { name: "Adansonia", slug: "baobab-tree" },
    { name: "Pinus longaeva", slug: "bristlecone-pine" },
    { name: "Bamboo", slug: "bamboo" },
    { name: "Oak", slug: "oak-tree" },
    { name: "Amorphophallus titanum", slug: "corpse-flower" },
    { name: "Victoria amazonica", slug: "amazon-water-lily" },
    { name: "Saguaro", slug: "saguaro-cactus" },
    { name: "Venus flytrap", slug: "venus-flytrap" },
    { name: "Macrocystis pyrifera", slug: "giant-kelp" },

    // Human Body
    { name: "Human brain", slug: "human-brain" },
    { name: "Heart", slug: "human-heart" },
    { name: "Liver", slug: "human-liver" },
    { name: "Lung", slug: "human-lung" },
    { name: "Small intestine", slug: "small-intestine" },
    { name: "Femur", slug: "femur-bone" },
    { name: "Human skin", slug: "human-skin" },
    { name: "Human eye", slug: "human-eye" },
    { name: "Stomach", slug: "human-stomach" },
    { name: "Red blood cell", slug: "red-blood-cell" },
    { name: "Tongue", slug: "human-tongue" },

    // Geography
    { name: "Mount Everest", slug: "mount-everest" },
    { name: "Mariana Trench", slug: "mariana-trench" },
    { name: "Nile", slug: "nile-river" },
    { name: "Amazon River", slug: "amazon-river" },
    { name: "Sahara", slug: "sahara-desert" },
    { name: "Pacific Ocean", slug: "pacific-ocean" },
    { name: "Lake Baikal", slug: "lake-baikal" },
    { name: "Grand Canyon", slug: "grand-canyon" },
    { name: "Burj Khalifa", slug: "burj-khalifa" },
    { name: "Eiffel Tower", slug: "eiffel-tower" },
    { name: "Angel Falls", slug: "angel-falls" },
    { name: "K2", slug: "k2" },
    { name: "Statue of Liberty", slug: "statue-of-liberty" },

    // History
    { name: "Roman Empire", slug: "roman-empire" },
    { name: "Ottoman Empire", slug: "ottoman-empire" },
    { name: "Byzantine Empire", slug: "byzantine-empire" },
    { name: "Ming dynasty", slug: "ming-dynasty" },
    { name: "British Empire", slug: "british-empire" },
    { name: "Han dynasty", slug: "han-dynasty" },
    { name: "Aztec Empire", slug: "aztec-empire" },
    { name: "Mongol Empire", slug: "mongol-empire" },
    { name: "Spanish Empire", slug: "spanish-empire" }
];

async function fetchWikiImage(name) {
  const url = 'https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(name);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'CompairTriviaGame/1.0 (test@example.com)' } });
    if (res.ok) {
        const data = await res.json();
        if (data.originalimage?.source) {
            return data.originalimage.source;
        } else if (data.thumbnail?.source) {
            return data.thumbnail.source;
        }
    } else {
        console.log("Failed", name, res.status);
    }
  } catch (e) {
    console.error("Failed for", name, e.message);
  }
  return null;
}

async function main() {
  const results = {};
  for (const entity of entitiesToSeed) {
    const url = await fetchWikiImage(entity.name);
    if (url) {
        results[entity.slug] = url;
    }
    await new Promise(resolve => setTimeout(resolve, 500)); // sleep 500ms
  }
  fs.writeFileSync('wiki_images.json', JSON.stringify(results, null, 2));
  console.log("Done");
}

main();
