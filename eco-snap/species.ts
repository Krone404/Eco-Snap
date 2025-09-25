import type { VisionLabel } from "./vision";

export type SpeciesId =
  | "grey-squirrel"
  | "european-robin"
  | "common-hedgehog"
  | "english-oak"
  | "silver-birch";

export type SpeciesType = "mammal" | "bird" | "tree";

export type StatKey =
  | "speed"
  | "resilience"
  | "energy"
  | "intelligence"
  | "harmony";

export type StatBlock = Record<StatKey, number>;

export type SpeciesTemplate = {
  id: SpeciesId;
  commonName: string;
  scientificName: string;
  type: SpeciesType;
  rarity: 1 | 2 | 3 | 4 | 5;
  baseStats: StatBlock;
  funFact: string;
  aliases: string[];
  image?: string;
};

const templates: Record<SpeciesId, SpeciesTemplate> = {
  "grey-squirrel": {
    id: "grey-squirrel",
    commonName: "Grey Squirrel",
    scientificName: "Sciurus carolinensis",
    type: "mammal",
    rarity: 2,
    baseStats: {
      speed: 72,
      resilience: 55,
      energy: 82,
      intelligence: 60,
      harmony: 58,
    },
    funFact:
      "Grey squirrels cache more acorns than they retrieve, planting future oaks by accident.",
    aliases: [
      "grey squirrel",
      "gray squirrel",
      "eastern gray squirrel",
      "eastern grey squirrel",
      "sciurus carolinensis",
      "squirrel",
    ],
  },
  "european-robin": {
    id: "european-robin",
    commonName: "European Robin",
    scientificName: "Erithacus rubecula",
    type: "bird",
    rarity: 2,
    baseStats: {
      speed: 65,
      resilience: 48,
      energy: 70,
      intelligence: 57,
      harmony: 62,
    },
    funFact:
      "Robins defend tiny territories year-round and sing loudly even through winter mornings.",
    aliases: [
      "european robin",
      "robin",
      "robin redbreast",
      "erithacus rubecula",
    ],
  },
  "common-hedgehog": {
    id: "common-hedgehog",
    commonName: "Common Hedgehog",
    scientificName: "Erinaceus europaeus",
    type: "mammal",
    rarity: 3,
    baseStats: {
      speed: 18,
      resilience: 74,
      energy: 35,
      intelligence: 52,
      harmony: 70,
    },
    funFact:
      "A hungry hedgehog can eat its own body weight in insects during a single night of foraging.",
    aliases: [
      "common hedgehog",
      "western european hedgehog",
      "erinaceus europaeus",
      "hedgehog",
    ],
  },
  "english-oak": {
    id: "english-oak",
    commonName: "English Oak",
    scientificName: "Quercus robur",
    type: "tree",
    rarity: 2,
    baseStats: {
      speed: 5,
      resilience: 95,
      energy: 20,
      intelligence: 15,
      harmony: 92,
    },
    funFact:
      "A mature oak can support more than 2,000 other UK species from insects to lichens and birds.",
    aliases: [
      "english oak",
      "common oak",
      "pedunculate oak",
      "quercus robur",
      "oak tree",
    ],
  },
  "silver-birch": {
    id: "silver-birch",
    commonName: "Silver Birch",
    scientificName: "Betula pendula",
    type: "tree",
    rarity: 3,
    baseStats: {
      speed: 4,
      resilience: 82,
      energy: 18,
      intelligence: 14,
      harmony: 88,
    },
    funFact:
      "Historically, people used peeling birch bark as a natural waterproof writing material.",
    aliases: [
      "silver birch",
      "betula pendula",
      "birch tree",
      "birch",
    ],
  },
};

const aliasMap: Record<string, SpeciesId> = Object.values(templates).reduce(
  (acc, template) => {
    template.aliases.forEach((alias) => {
      acc[alias.toLowerCase()] = template.id;
    });
    return acc;
  },
  {} as Record<string, SpeciesId>
);

export const SPECIES_TEMPLATES = templates;
export const SPECIES_IDS = Object.keys(templates) as SpeciesId[];

function normalize(label: string | undefined | null): string {
  return (label ?? "").trim().toLowerCase();
}

export function findSpeciesFromLabels(
  labels: VisionLabel[]
): SpeciesTemplate | null {
  for (const label of labels) {
    const key = normalize(label.description);
    if (!key) continue;
    const direct = aliasMap[key];
    if (direct) {
      return templates[direct];
    }
  }
  return null;
}

export function getSpeciesTemplate(id: SpeciesId): SpeciesTemplate {
  return templates[id];
}
