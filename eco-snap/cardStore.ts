import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  type SpeciesId,
  type SpeciesTemplate,
  type StatBlock,
  type StatKey,
} from "./species";

export const COOLDOWN_MS = 5 * 60 * 1000;
const UPGRADE_BASE_THRESHOLD = 3;
const UPGRADE_INCREMENT = 2;
const UPGRADE_INCREMENT_STEPS = [0.1, 0.07, 0.05, 0.04, 0.03, 0.02];
const MAX_STAT_VALUE = 150;
export const PARTY_LIMIT = 6;

export type CardInstance = {
  templateId: SpeciesId;
  level: number;
  copiesOwned: number;
  totalCaptured: number;
  firstCapturedAt: number;
  lastCapturedAt: number;
};

export type UnlockOutcome =
  | {
      status: "cooldown";
      template: SpeciesTemplate;
      card: CardInstance;
      remainingMs: number;
    }
  | {
      status: "new";
      template: SpeciesTemplate;
      card: CardInstance;
      nextThreshold: number;
    }
  | {
      status: "duplicate";
      template: SpeciesTemplate;
      card: CardInstance;
      neededForNext: number;
    }
  | {
      status: "upgraded";
      template: SpeciesTemplate;
      card: CardInstance;
      levelsGained: number;
      neededForNext: number;
    };

export type CardState = {
  collection: Partial<Record<SpeciesId, CardInstance>>;
  party: SpeciesId[];
  unlockSpecies: (
    template: SpeciesTemplate,
    now?: number
  ) => UnlockOutcome;
  addToParty: (templateId: SpeciesId) => void;
  removeFromParty: (templateId: SpeciesId) => void;
  isInParty: (templateId: SpeciesId) => boolean;
  cooldownRemaining: (templateId: SpeciesId, now?: number) => number;
  resetAll: () => void;
};

function upgradeThreshold(level: number): number {
  return UPGRADE_BASE_THRESHOLD + level * UPGRADE_INCREMENT;
}

function cumulativeBonus(level: number): number {
  let bonus = 0;
  for (let i = 0; i < level; i += 1) {
    const step =
      UPGRADE_INCREMENT_STEPS[i] ??
      UPGRADE_INCREMENT_STEPS[UPGRADE_INCREMENT_STEPS.length - 1];
    bonus += step;
  }
  return bonus;
}

export function computeEffectiveStats(
  template: SpeciesTemplate,
  level: number
): StatBlock {
  const bonus = cumulativeBonus(level);
  const block: Partial<StatBlock> = {};
  (Object.keys(template.baseStats) as StatKey[]).forEach((key) => {
    const base = template.baseStats[key];
    const boosted = Math.round(base * (1 + bonus));
    block[key] = Math.min(MAX_STAT_VALUE, boosted);
  });
  return block as StatBlock;
}

function cloneCard(card: CardInstance): CardInstance {
  return { ...card };
}

export const useCardStore = create<CardState>()(
  persist(
    (set, get) => ({
      collection: {},
      party: [],
      unlockSpecies: (template, nowArg) => {
        const now = nowArg ?? Date.now();
        let outcome: UnlockOutcome | null = null;

        set((state) => {
          const collection = { ...state.collection } as Partial<
            Record<SpeciesId, CardInstance>
          >;
          const existing = collection[template.id];

          if (existing) {
            const remaining = COOLDOWN_MS - (now - existing.lastCapturedAt);
            if (remaining > 0) {
              outcome = {
                status: "cooldown",
                template,
                card: cloneCard(existing),
                remainingMs: remaining,
              };
              return state;
            }

            const updated: CardInstance = {
              ...existing,
              copiesOwned: existing.copiesOwned + 1,
              totalCaptured: existing.totalCaptured + 1,
              lastCapturedAt: now,
            };

            let levelsGained = 0;
            let threshold = upgradeThreshold(updated.level);
            while (updated.copiesOwned >= threshold) {
              updated.copiesOwned -= threshold;
              updated.level += 1;
              levelsGained += 1;
              threshold = upgradeThreshold(updated.level);
            }

            collection[template.id] = updated;

            if (levelsGained > 0) {
              outcome = {
                status: "upgraded",
                template,
                card: cloneCard(updated),
                levelsGained,
                neededForNext: threshold - updated.copiesOwned,
              };
            } else {
              outcome = {
                status: "duplicate",
                template,
                card: cloneCard(updated),
                neededForNext: threshold - updated.copiesOwned,
              };
            }

            return { ...state, collection };
          }

          const created: CardInstance = {
            templateId: template.id,
            level: 0,
            copiesOwned: 0,
            totalCaptured: 1,
            firstCapturedAt: now,
            lastCapturedAt: now,
          };

          collection[template.id] = created;

          outcome = {
            status: "new",
            template,
            card: cloneCard(created),
            nextThreshold: upgradeThreshold(created.level) - created.copiesOwned,
          };

          const party = state.party.includes(template.id)
            ? state.party
            : state.party.length < PARTY_LIMIT
            ? [...state.party, template.id]
            : state.party;

          return { ...state, collection, party };
        });

        if (!outcome) {
          throw new Error("Unlock outcome missing");
        }

        return outcome;
      },
      addToParty: (templateId) => {
        set((state) => {
          if (state.party.includes(templateId) || state.party.length >= PARTY_LIMIT) {
            return state;
          }
          return { ...state, party: [...state.party, templateId] };
        });
      },
      removeFromParty: (templateId) => {
        set((state) => ({
          ...state,
          party: state.party.filter((id) => id !== templateId),
        }));
      },
      isInParty: (templateId) => get().party.includes(templateId),
      cooldownRemaining: (templateId, nowArg) => {
        const now = nowArg ?? Date.now();
        const card = get().collection[templateId];
        if (!card) return 0;
        return Math.max(0, COOLDOWN_MS - (now - card.lastCapturedAt));
      },
      resetAll: () => set({ collection: {}, party: [] }),
    }),
    {
      name: "eco-snap-card-store",
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        collection: state.collection,
        party: state.party,
      }),
    }
  )
);

export function getNeededForNextUpgrade(card: CardInstance): number {
  return upgradeThreshold(card.level) - card.copiesOwned;
}

export function describeStatsWithLevel(
  template: SpeciesTemplate,
  card: CardInstance
): { stats: StatBlock; bonusPercent: number } {
  const bonus = cumulativeBonus(card.level);
  const stats = computeEffectiveStats(template, card.level);
  return { stats, bonusPercent: Math.round(bonus * 100) };
}
