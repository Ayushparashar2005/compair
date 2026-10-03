import type { Card, CharacterCard, EffectCard } from './types';

// 46 character cards themed around Compair's world: animals, countries, elements, landmarks.
// Each has 4 sides (top/right/bottom/left), values 1–7.
// Sum of all 4 sides per card is balanced between 14–20.
const CHARACTERS: CharacterCard[] = [
  // Animals
  { id: 1,  kind: 'character', name: 'Eagle',       emoji: '🦅', top: 6, right: 3, bottom: 2, left: 5, color: 'blue'   },
  { id: 2,  kind: 'character', name: 'Shark',       emoji: '🦈', top: 4, right: 6, bottom: 3, left: 3, color: 'cyan'   },
  { id: 3,  kind: 'character', name: 'Tiger',       emoji: '🐯', top: 5, right: 5, bottom: 3, left: 3, color: 'orange' },
  { id: 4,  kind: 'character', name: 'Wolf',        emoji: '🐺', top: 4, right: 4, bottom: 4, left: 4, color: 'purple' },
  { id: 5,  kind: 'character', name: 'Bear',        emoji: '🐻', top: 7, right: 2, bottom: 3, left: 4, color: 'red'    },
  { id: 6,  kind: 'character', name: 'Dolphin',     emoji: '🐬', top: 3, right: 5, bottom: 4, left: 5, color: 'cyan'   },
  { id: 7,  kind: 'character', name: 'Lion',        emoji: '🦁', top: 6, right: 4, bottom: 2, left: 5, color: 'yellow' },
  { id: 8,  kind: 'character', name: 'Elephant',    emoji: '🐘', top: 3, right: 3, bottom: 6, left: 5, color: 'green'  },
  { id: 9,  kind: 'character', name: 'Falcon',      emoji: '🦆', top: 7, right: 3, bottom: 1, left: 5, color: 'blue'   },
  { id: 10, kind: 'character', name: 'Crocodile',   emoji: '🐊', top: 2, right: 6, bottom: 5, left: 3, color: 'green'  },
  // Countries / Landmarks
  { id: 11, kind: 'character', name: 'Fuji',        emoji: '🗻', top: 5, right: 3, bottom: 4, left: 5, color: 'pink'   },
  { id: 12, kind: 'character', name: 'Amazon',      emoji: '🌿', top: 3, right: 5, bottom: 6, left: 2, color: 'green'  },
  { id: 13, kind: 'character', name: 'Everest',     emoji: '🏔️', top: 7, right: 4, bottom: 1, left: 4, color: 'blue'   },
  { id: 14, kind: 'character', name: 'Nile',        emoji: '🏞️', top: 4, right: 4, bottom: 4, left: 5, color: 'cyan'   },
  { id: 15, kind: 'character', name: 'Sahara',      emoji: '🏜️', top: 2, right: 6, bottom: 4, left: 5, color: 'yellow' },
  { id: 16, kind: 'character', name: 'Aurora',      emoji: '🌌', top: 5, right: 5, bottom: 3, left: 4, color: 'purple' },
  { id: 17, kind: 'character', name: 'Mariana',     emoji: '🌊', top: 1, right: 5, bottom: 7, left: 4, color: 'cyan'   },
  { id: 18, kind: 'character', name: 'Kilimanjaro', emoji: '🏔️', top: 6, right: 3, bottom: 3, left: 5, color: 'green'  },
  { id: 19, kind: 'character', name: 'Vesuvius',    emoji: '🌋', top: 7, right: 5, bottom: 1, left: 3, color: 'red'    },
  { id: 20, kind: 'character', name: 'Patagonia',   emoji: '🌄', top: 3, right: 6, bottom: 4, left: 4, color: 'blue'   },
  // Elements / Forces
  { id: 21, kind: 'character', name: 'Thunder',     emoji: '⚡', top: 7, right: 1, bottom: 5, left: 3, color: 'yellow' },
  { id: 22, kind: 'character', name: 'Blizzard',    emoji: '❄️', top: 4, right: 6, bottom: 4, left: 3, color: 'cyan'   },
  { id: 23, kind: 'character', name: 'Typhoon',     emoji: '🌀', top: 3, right: 5, bottom: 5, left: 4, color: 'blue'   },
  { id: 24, kind: 'character', name: 'Quake',       emoji: '💥', top: 5, right: 4, bottom: 5, left: 3, color: 'orange' },
  { id: 25, kind: 'character', name: 'Ember',       emoji: '🔥', top: 6, right: 2, bottom: 4, left: 5, color: 'red'    },
  { id: 26, kind: 'character', name: 'Gale',        emoji: '💨', top: 4, right: 7, bottom: 2, left: 4, color: 'green'  },
  { id: 27, kind: 'character', name: 'Torrent',     emoji: '🌊', top: 3, right: 4, bottom: 6, left: 5, color: 'cyan'   },
  { id: 28, kind: 'character', name: 'Vortex',      emoji: '🌪️', top: 5, right: 5, bottom: 4, left: 3, color: 'purple' },
  { id: 29, kind: 'character', name: 'Flare',       emoji: '☀️', top: 6, right: 4, bottom: 3, left: 4, color: 'yellow' },
  { id: 30, kind: 'character', name: 'Frost',       emoji: '🧊', top: 4, right: 3, bottom: 5, left: 6, color: 'cyan'   },
  // Space / Cosmos
  { id: 31, kind: 'character', name: 'Nova',        emoji: '💫', top: 7, right: 3, bottom: 3, left: 4, color: 'purple' },
  { id: 32, kind: 'character', name: 'Pulsar',      emoji: '⭐', top: 5, right: 6, bottom: 2, left: 4, color: 'yellow' },
  { id: 33, kind: 'character', name: 'Nebula',      emoji: '🌠', top: 3, right: 5, bottom: 5, left: 5, color: 'blue'   },
  { id: 34, kind: 'character', name: 'Comet',       emoji: '☄️', top: 6, right: 6, bottom: 1, left: 4, color: 'orange' },
  { id: 35, kind: 'character', name: 'Eclipse',     emoji: '🌑', top: 4, right: 4, bottom: 6, left: 4, color: 'purple' },
  { id: 36, kind: 'character', name: 'Quasar',      emoji: '🔆', top: 7, right: 2, bottom: 4, left: 4, color: 'yellow' },
  { id: 37, kind: 'character', name: 'Singularity', emoji: '⚫', top: 3, right: 7, bottom: 3, left: 4, color: 'red'    },
  { id: 38, kind: 'character', name: 'Photon',      emoji: '🌟', top: 5, right: 4, bottom: 4, left: 5, color: 'blue'   },
  // Ancient / Mythic
  { id: 39, kind: 'character', name: 'Sphinx',      emoji: '🦁', top: 4, right: 5, bottom: 5, left: 4, color: 'yellow' },
  { id: 40, kind: 'character', name: 'Colossus',    emoji: '🗿', top: 6, right: 3, bottom: 5, left: 3, color: 'green'  },
  { id: 41, kind: 'character', name: 'Hydra',       emoji: '🐉', top: 3, right: 6, bottom: 4, left: 5, color: 'red'    },
  { id: 42, kind: 'character', name: 'Phoenix',     emoji: '🔥', top: 7, right: 3, bottom: 2, left: 5, color: 'orange' },
  { id: 43, kind: 'character', name: 'Leviathan',   emoji: '🌊', top: 2, right: 5, bottom: 7, left: 3, color: 'cyan'   },
  { id: 44, kind: 'character', name: 'Golem',       emoji: '🪨', top: 5, right: 3, bottom: 5, left: 5, color: 'green'  },
  { id: 45, kind: 'character', name: 'Wraith',      emoji: '👻', top: 4, right: 6, bottom: 4, left: 3, color: 'purple' },
  { id: 46, kind: 'character', name: 'Oracle',      emoji: '🔮', top: 5, right: 5, bottom: 5, left: 2, color: 'pink'   },
];

const EFFECTS: EffectCard[] = [
  { id: 101, kind: 'effect', name: 'Boulder',  emoji: '🪨', effect: 'BOULDER', description: 'Remove a card + every card in its row and column (unfrozen only)' },
  { id: 102, kind: 'effect', name: 'Flip',     emoji: '🔄', effect: 'FLIP',    description: 'Flip the entire board — every card changes sides' },
  { id: 103, kind: 'effect', name: 'Freeze',   emoji: '❄️',  effect: 'FREEZE',  description: 'Freeze one of your cards permanently — it cannot be captured, attack, or be removed' },
  { id: 104, kind: 'effect', name: 'Recruit',  emoji: '🤝', effect: 'RECRUIT', description: 'Steal an unfrozen enemy card and place it as yours on any empty tile' },
  { id: 105, kind: 'effect', name: 'Swap',     emoji: '🔀', effect: 'SWAP',    description: 'Exchange hands with your opponent' },
];

export const FULL_DECK: Card[] = [...CHARACTERS, ...EFFECTS];

export function getCardById(id: number): Card | undefined {
  return FULL_DECK.find(c => c.id === id);
}

export function shuffleDeck(deck: Card[], seed?: number): Card[] {
  const arr = [...deck];
  // Simple seeded Fisher-Yates
  let s = seed ?? Math.floor(Math.random() * 999999);
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
