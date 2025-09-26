// App.tsx

import React, { useEffect, useState } from "react";

import {

  Text,

  View,

  Image,

  Pressable,

  ActivityIndicator,

  Alert,

  Modal,

  ScrollView,

  StyleSheet,

} from "react-native";

import { StatusBar } from "expo-status-bar";

import CameraCapture, { CapturedMeta } from "./CameraCapture";

import styles from "./styles";

import CardFace from "./CardFace";

import { analyzeWithVision } from "./vision";

import {

  findSpeciesFromLabels,

  SPECIES_IDS,

  SPECIES_TEMPLATES,

  type SpeciesId,

  type SpeciesTemplate,

  type StatKey,

} from "./species";

import {

  useCardStore,

  describeStatsWithLevel,

  COOLDOWN_MS,

  PARTY_LIMIT,

  getNeededForNextUpgrade,

  type CardInstance,

  type UnlockOutcome,

} from "./cardStore";



const MAX_BATTLE_LOG = 8;

const OPPONENT_NAME = "Eco Snapper Gustavo";



const STAT_KEYS: StatKey[] = [

  "speed",

  "resilience",

  "energy",

  "intelligence",

  "harmony",

];



const STAT_LABELS: Record<StatKey, string> = {

  speed: "Speed",

  resilience: "Resilience",

  energy: "Energy",

  intelligence: "Intelligence",

  harmony: "Harmony",

};



type CardModalPayload = {

  outcome: "new" | "duplicate" | "upgraded";

  template: SpeciesTemplate;

  card: CardInstance;

  neededForNext: number;

  levelsGained?: number;

  bonusPercent: number;

  stats: Record<StatKey, number>;

};



type BattleCard = {

  template: SpeciesTemplate;

  stats: Record<StatKey, number>;

  owner: "player" | "opponent";

  sourceCard?: CardInstance;

};



type BattleState = {

  player: BattleCard[];

  opponent: BattleCard[];

  log: string[];

  turn: "player" | "opponent";

  finished: boolean;

  result?: "win" | "lose";

};



function appendLog(log: string[], entry: string): string[] {

  if (!entry) return log;

  return [entry, ...log].slice(0, MAX_BATTLE_LOG);

}



function createDummyCard(template: SpeciesTemplate): CardInstance {

  const now = Date.now();

  return {

    templateId: template.id,

    level: 0,

    copiesOwned: 0,

    totalCaptured: 1,

    firstCapturedAt: now,

    lastCapturedAt: now,

  };

}



function pickOpponentStat(state: BattleState): StatKey {

  const attacker = state.opponent[0];

  const defender = state.player[0];

  if (!attacker || !defender) {

    return STAT_KEYS[0];

  }

  return STAT_KEYS.reduce((best, current) => {

    const diff = attacker.stats[current] - defender.stats[current];

    const bestDiff = attacker.stats[best] - defender.stats[best];

    return diff > bestDiff ? current : best;

  }, STAT_KEYS[0]);

}

function resolveTurn(

  state: BattleState,

  attacker: "player" | "opponent",

  stat: StatKey

): BattleState {

  const attackerDeck = attacker === "player" ? state.player : state.opponent;

  const defenderDeck = attacker === "player" ? state.opponent : state.player;

  if (attackerDeck.length === 0 || defenderDeck.length === 0) {

    return state;

  }



  const attackerCard = attackerDeck[0];

  const defenderCard = defenderDeck[0];

  const attackerValue = attackerCard.stats[stat];

  const defenderValue = defenderCard.stats[stat];

  const statName = STAT_LABELS[stat];

  const intro =

    attacker === "player"

      ? `You used ${statName} (${attackerValue} vs ${defenderValue}).`

      : `${OPPONENT_NAME} used ${statName} (${attackerValue} vs ${defenderValue}).`;



  let logEntry = intro;

  let newPlayerDeck = [...state.player];

  let newOpponentDeck = [...state.opponent];



  if (attackerValue > defenderValue) {

    logEntry +=

      attacker === "player"

        ? ` Attack was super effective! You captured ${defenderCard.template.commonName}.`

        : ` Attack was super effective! ${OPPONENT_NAME} captured ${attackerCard.template.commonName}.`;



    const attackerRest = attackerDeck.slice(1);

    const defenderRest = defenderDeck.slice(1);

    if (attacker === "player") {

      newPlayerDeck = [

        ...attackerRest,

        attackerCard,

        { ...defenderCard, owner: "player" },

      ];

      newOpponentDeck = defenderRest;

    } else {

      newOpponentDeck = [

        ...attackerRest,

        attackerCard,

        { ...defenderCard, owner: "opponent" },

      ];

      newPlayerDeck = defenderRest;

    }

  } else if (attackerValue < defenderValue) {

    logEntry +=

      attacker === "player"

        ? ` Not very effective! ${OPPONENT_NAME} captured your ${attackerCard.template.commonName}.`

        : ` Not very effective! You turned the tables and captured ${defenderCard.template.commonName}.`;



    const attackerRest = attackerDeck.slice(1);

    const defenderRest = defenderDeck.slice(1);

    if (attacker === "player") {

      newPlayerDeck = attackerRest;

      newOpponentDeck = [

        ...defenderRest,

        defenderCard,

        { ...attackerCard, owner: "opponent" },

      ];

    } else {

      newOpponentDeck = attackerRest;

      newPlayerDeck = [

        ...defenderRest,

        defenderCard,

        { ...attackerCard, owner: "player" },

      ];

    }

  } else {

    logEntry += " It's a stalemate!both cards return to their decks.";

    const attackerRest = attackerDeck.slice(1);

    const defenderRest = defenderDeck.slice(1);

    if (attacker === "player") {

      newPlayerDeck = [...attackerRest, attackerCard];

      newOpponentDeck = [...defenderRest, defenderCard];

    } else {

      newOpponentDeck = [...attackerRest, attackerCard];

      newPlayerDeck = [...defenderRest, defenderCard];

    }

  }



  const finished =

    newPlayerDeck.length === 0 || newOpponentDeck.length === 0;

  const result = finished

    ? newPlayerDeck.length === 0

      ? "lose"

      : "win"

    : state.result;



  let updated: BattleState = {

    player: newPlayerDeck,

    opponent: newOpponentDeck,

    log: appendLog(state.log, logEntry),

    turn: finished

      ? "player"

      : attacker === "player"

      ? "opponent"

      : "player",

    finished,

    result,

  };



  if (finished) {

    const finale =

      result === "win"

        ? `Victory! You cleared ${OPPONENT_NAME}'s deck.`

        : `Defeat! ${OPPONENT_NAME} claimed your last card.`;

    updated = { ...updated, log: appendLog(updated.log, finale) };

  }



  return updated;

}



export default function App() {

  const [openCamera, setOpenCamera] = useState(false);

  const [last, setLast] = useState<CapturedMeta | null>(null);


  const [loading, setLoading] = useState(false);

  const [banner, setBanner] = useState<string | null>(null);

  const [cardModal, setCardModal] = useState<CardModalPayload | null>(null);

  const [deckOpen, setDeckOpen] = useState(false);

  const [battleOpen, setBattleOpen] = useState(false);

  const [battleState, setBattleState] = useState<BattleState | null>(null);

  const [devToolsOpen, setDevToolsOpen] = useState(false);

  const [devSelection, setDevSelection] = useState<SpeciesId | null>(null);



  const speciesList = SPECIES_IDS.map((id) => SPECIES_TEMPLATES[id]);

  const unlockSpecies = useCardStore((state) => state.unlockSpecies);

  const collection = useCardStore((state) => state.collection);

  const party = useCardStore((state) => state.party);

  const addToParty = useCardStore((state) => state.addToParty);

  const removeFromParty = useCardStore((state) => state.removeFromParty);

  const isInParty = useCardStore((state) => state.isInParty);



  const partyCards = (party

    .map((id) => {

      const card = collection[id];

      if (!card) return null;

      const template = SPECIES_TEMPLATES[id];

      const { stats, bonusPercent } = describeStatsWithLevel(template, card);

      return { card, template, stats, bonusPercent };

    })

    .filter(Boolean) as Array<{

      card: CardInstance;

      template: SpeciesTemplate;

      stats: Record<StatKey, number>;

      bonusPercent: number;

    }>);



  const collectionList = (speciesList

    .map((template) => {

      const card = collection[template.id];

      if (!card) return null;

      const { stats, bonusPercent } = describeStatsWithLevel(template, card);

      return { card, template, stats, bonusPercent };

    })

    .filter(Boolean) as Array<{

      card: CardInstance;

      template: SpeciesTemplate;

      stats: Record<StatKey, number>;

      bonusPercent: number;

    }>);



  const partySlotIndices = Array.from({ length: PARTY_LIMIT }, (_, idx) => idx);
  const uniqueCards = Object.keys(collection).length;

  useEffect(() => {
    if (!battleOpen) return;
    if (!battleState || battleState.finished || battleState.turn !== "opponent") {
      return;
    }

    const timer = setTimeout(() => {
      setBattleState((current) => {
        if (!current || current.finished || current.turn !== "opponent") {
          return current;
        }
        const statChoice = pickOpponentStat(current);
        return resolveTurn(current, "opponent", statChoice);
      });
    }, 900);

    return () => clearTimeout(timer);
  }, [battleOpen, battleState]);

  if (openCamera) {
    return (
      <CameraCapture
        onClose={() => setOpenCamera(false)}
        onCaptured={handleCaptured}
      />
    );
  }

  function handleOutcome(template: SpeciesTemplate, outcome: UnlockOutcome) {

    if (outcome.status === "cooldown") {

      setBanner(

        `${template.commonName} is resting. Try again in ${formatMillis(

          outcome.remainingMs

        )}.`

      );

      return;

    }



    const { stats, bonusPercent } = describeStatsWithLevel(

      template,

      outcome.card

    );



    const payload: CardModalPayload = {

      outcome: outcome.status,

      template,

      card: outcome.card,

      neededForNext:

        outcome.status === "new"

          ? outcome.nextThreshold

          : outcome.neededForNext,

      levelsGained:

        outcome.status === "upgraded" ? outcome.levelsGained : undefined,

      bonusPercent,

      stats,

    };



    switch (outcome.status) {

      case "new":

        setBanner(`Unlocked the ${template.commonName} card!`);

        break;

      case "duplicate":

        setBanner(

          `Captured another ${template.commonName}. ${payload.neededForNext} more to upgrade.`

        );

        break;

      case "upgraded":

        setBanner(

          `${template.commonName} leveled up! +${payload.levelsGained} level${

            (payload.levelsGained ?? 1) > 1 ? "s" : ""

          } applied.`

        );

        break;

    }



    setCardModal(payload);

  }



  function handleUnlock(

    template: SpeciesTemplate,

    options?: { bypassCooldown?: boolean }

  ) {

    const existing = collection[template.id];

    const nowOverride =

      options?.bypassCooldown && existing

        ? existing.lastCapturedAt + COOLDOWN_MS + 1000

        : undefined;



    const outcome = unlockSpecies(template, nowOverride);

    handleOutcome(template, outcome);

  }



  async function handleCaptured(meta: CapturedMeta) {

    setOpenCamera(false);

    setLast(meta);

    setBanner(null);

    setCardModal(null);



    try {

      setLoading(true);

      const out = await analyzeWithVision(meta.uri, 6);

      console.log("Vision labels", out);



      const template = findSpeciesFromLabels(out ?? []);

      if (!template) {

        setBanner(

          "No matching species card found. Try a clearer shot or different angle."

        );

        return;

      }



      handleUnlock(template);

    } catch (e: any) {

      console.error(e);

      Alert.alert("Vision error", e?.message ?? "Failed to analyze image");

    } finally {

      setLoading(false);

    }

  }

  function startBattle() {

    if (partyCards.length === 0) {

      setBanner("Add at least one card to your party before starting a battle.");

      return;

    }



    const playerBattle: BattleCard[] = partyCards.map(({ template, stats, card }) => ({

      template,

      stats,

      owner: "player" as const,

      sourceCard: card,

    }));



    const shuffled = [...speciesList].sort(() => Math.random() - 0.5);

    const desiredOpponentCount = Math.max(2, Math.min(2, playerBattle.length));

    const opponentBattle: BattleCard[] = [];

    for (const template of shuffled) {

      if (opponentBattle.length >= desiredOpponentCount) break;

      const dummy = createDummyCard(template);

      const { stats } = describeStatsWithLevel(template, dummy);

      opponentBattle.push({

        template,

        stats,

        owner: "opponent",

        sourceCard: dummy,

      });

    }



    if (opponentBattle.length === 0 && speciesList.length > 0) {

      const template = speciesList[0];

      const dummy = createDummyCard(template);

      const { stats } = describeStatsWithLevel(template, dummy);

      opponentBattle.push({ template, stats, owner: "opponent", sourceCard: dummy });

    }



    const initialState: BattleState = {

      player: playerBattle,

      opponent: opponentBattle,

      log: [`${OPPONENT_NAME} appeared!`],

      turn: "player",

      finished: false,

    };

    setBattleState(initialState);

    setBattleOpen(true);

  }



  function handleBattleStat(stat: StatKey) {

    setBattleState((prev) => {

      if (!prev || prev.finished || prev.turn !== "player") return prev;

      return resolveTurn(prev, "player", stat);

    });

  }

  function closeBattle() {

    setBattleOpen(false);

    setBattleState(null);

  }

  return (

    <View style={styles.container}>

      <StatusBar style="auto" />

      <Text style={styles.title}>Eco Snap</Text>

      <Text style={styles.sub}>

        Explore, snap a species, collect the card.

      </Text>



      <Pressable style={styles.cta} onPress={() => setOpenCamera(true)}>

        <Text style={styles.ctaText}>Open Camera</Text>

      </Pressable>



      {banner && (

        <View style={localStyles.banner}>

          <Text style={localStyles.bannerText}>{banner}</Text>

        </View>

      )}



      <View style={localStyles.deckSummary}>

        <Text style={localStyles.deckTitle}>Deck Overview</Text>

        <Text style={localStyles.deckLine}>

          Unique cards: {uniqueCards} / {speciesList.length}

        </Text>

        <Text style={localStyles.deckLine}>

          Party size: {party.length} / {PARTY_LIMIT}

        </Text>

        <Pressable

          style={localStyles.manageButton}

          onPress={() => setDeckOpen(true)}

        >

          <Text style={localStyles.manageButtonText}>Manage Deck</Text>

        </Pressable>

      </View>



      <Pressable

        style={[

          localStyles.battleButton,

          party.length === 0 && localStyles.battleButtonDisabled,

        ]}

        onPress={startBattle}

        disabled={party.length === 0}

      >

        <Text style={localStyles.battleButtonText}>Eco Battle</Text>

        <Text style={localStyles.battleButtonSub}>

          {party.length === 0

            ? "Add cards to your party to start battling"

            : `Face ${OPPONENT_NAME} with your party`}

        </Text>

      </Pressable>



      {last && (

        <View style={styles.previewWrap}>

          <Text style={styles.previewLabel}>Last capture</Text>

          <Image source={{ uri: last.uri }} style={styles.preview} />

          <Text style={styles.meta}>

            {last.savedToGallery ? "Saved to gallery" : "Saved locally"}

            {" | "}

            {last.location

              ? `${last.location.lat.toFixed(5)}, ${last.location.lon.toFixed(5)}`

              : "no GPS"}

          </Text>



          {loading && (
            <View style={{ marginTop: 12, width: "100%" }}>
              <Text style={{ fontWeight: "600", fontSize: 16, marginBottom: 6 }}>
                Analyzing...
              </Text>
              <ActivityIndicator />
            </View>
          )}

        </View>

      )}

      {cardModal && (

        <Modal

          animationType="slide"

          transparent

          visible={!!cardModal}

          onRequestClose={() => setCardModal(null)}

        >

          <View style={localStyles.modalBackdrop}>

            <View style={localStyles.modalCard}>

              <ScrollView>

                <CardFace

                  template={cardModal.template}

                  stats={cardModal.stats}

                  bonusPercent={cardModal.bonusPercent}

                  copiesOwned={cardModal.card.copiesOwned}

                  style={{ marginBottom: 16 }}

                />



                <View style={localStyles.modalMeta}>

                  <Text style={localStyles.metaLine}>

                    Level {cardModal.card.level} | Total captures {cardModal.card.totalCaptured}

                  </Text>

                  <Text style={localStyles.metaLine}>

                    {cardModal.neededForNext} more capture{cardModal.neededForNext === 1 ? '' : 's'} for next upgrade.

                  </Text>

                  {cardModal.outcome === 'upgraded' ? (

                    <Text style={localStyles.metaHighlight}>

                      Upgraded by {cardModal.levelsGained} level{(cardModal.levelsGained ?? 1) > 1 ? 's' : ''}!

                    </Text>

                  ) : cardModal.outcome === 'duplicate' ? (

                    <Text style={localStyles.metaLine}>

                      Duplicate captured. Progress saved toward the next upgrade.

                    </Text>

                  ) : null}

                </View>

              </ScrollView>



              <View style={localStyles.modalActions}>

                {isInParty(cardModal.template.id) ? (

                  <Pressable

                    style={[localStyles.actionButton, { backgroundColor: "#c0392b" }]}

                    onPress={() => removeFromParty(cardModal.template.id)}

                  >

                    <Text style={localStyles.actionText}>Remove from Party</Text>

                  </Pressable>

                ) : (

                  <Pressable

                    style={localStyles.actionButton}

                    onPress={() => addToParty(cardModal.template.id)}

                    disabled={party.length >= PARTY_LIMIT}

                  >

                    <Text style={localStyles.actionText}>

                      {party.length >= PARTY_LIMIT ? "Party Full" : "Add to Party"}

                    </Text>

                  </Pressable>

                )}



                <Pressable

                  style={[localStyles.actionButton, { backgroundColor: "#34495e" }]}

                  onPress={() => setCardModal(null)}

                >

                  <Text style={localStyles.actionText}>Close</Text>

                </Pressable>

              </View>

            </View>

          </View>

        </Modal>

      )}

      {deckOpen && (

        <Modal

          animationType="slide"

          transparent

          visible={deckOpen}

          onRequestClose={() => setDeckOpen(false)}

        >

          <View style={localStyles.modalBackdrop}>

            <View style={localStyles.deckModal}>

              <ScrollView>

                <Text style={localStyles.modalTitle}>Deck Manager</Text>



                <Text style={localStyles.sectionTitle}>

                  Party ({party.length}/{PARTY_LIMIT})

                </Text>

                <View style={localStyles.partyList}>

                  {partySlotIndices.map((idx) => {

                    const entry = partyCards[idx];

                    if (!entry) {

                      return (

                        <View key={`empty-${idx}`} style={localStyles.partySlotEmpty}>

                          <Text style={localStyles.partyEmptyText}>Empty slot</Text>

                        </View>

                      );

                    }



                    return (

                      <View key={entry.template.id} style={localStyles.partySlot}>

                        <View style={localStyles.partyInfo}>

                          <Text style={localStyles.cardName}>

                            {entry.template.commonName}

                          </Text>

                          <Text style={localStyles.cardMeta}>

                            Lvl {entry.card.level} | +{entry.bonusPercent}%

                          </Text>

                        </View>

                        <Pressable

                          style={[

                            localStyles.actionButton,

                            { backgroundColor: "#c0392b", paddingHorizontal: 12 },

                          ]}

                          onPress={() => removeFromParty(entry.template.id)}

                        >

                          <Text style={localStyles.actionText}>Remove</Text>

                        </Pressable>

                      </View>

                    );

                  })}

                </View>



                <Text style={localStyles.sectionTitle}>Collection</Text>

                <View style={localStyles.collectionList}>

                  {collectionList.length === 0 && (

                    <Text style={localStyles.collectionEmpty}>

                      Capture species to build your collection.

                    </Text>

                  )}



                  {collectionList.map(({ card, template, stats, bonusPercent }) => {

                    const inParty = isInParty(template.id);

                    const partyFull = party.length >= PARTY_LIMIT;

                    const needed = getNeededForNextUpgrade(card);



                    return (

                      <View key={template.id} style={localStyles.collectionCard}>

                        <CardFace

                          template={template}

                          stats={stats}

                          bonusPercent={bonusPercent}

                          copiesOwned={card.copiesOwned}

                          variant="compact"

                          showFunFact={false}

                        />



                        <View style={localStyles.collectionFooter}>

                          <Text style={localStyles.metaLine}>

                            Next upgrade in {needed} capture{needed === 1 ? '' : 's'}.

                          </Text>

                          <Pressable

                            style={[

                              localStyles.actionButton,

                              (inParty || partyFull) && localStyles.actionButtonDisabled,

                            ]}

                            onPress={() => addToParty(template.id)}

                            disabled={inParty || partyFull}

                          >

                            <Text style={localStyles.actionText}>

                              {inParty ? 'In Party' : partyFull ? 'Party Full' : 'Add to Party'}

                            </Text>

                          </Pressable>

                        </View>

                      </View>

                    );

                  })}

                </View>

              </ScrollView>



              <View style={localStyles.modalActions}>

                <Pressable

                  style={[localStyles.actionButton, { backgroundColor: "#34495e" }]}

                  onPress={() => setDeckOpen(false)}

                >

                  <Text style={localStyles.actionText}>Close</Text>

                </Pressable>

              </View>

            </View>

          </View>

        </Modal>

      )}

      {battleOpen && battleState && (
        <Modal
          animationType="slide"
          transparent
          visible={battleOpen}
          onRequestClose={closeBattle}
        >
          <View style={localStyles.modalBackdrop}>
            <View style={localStyles.battleModal}>
              <ScrollView>
                <View style={localStyles.battleHeader}>
                  <Text style={localStyles.modalTitle}>Eco Battle</Text>
                  <Text style={localStyles.battleSubtitle}>
                    {OPPONENT_NAME + " appeared!"}
                  </Text>
                  <Text style={localStyles.battleSubtitle}>
                    {battleState.log[0] ?? "Pick a stat to attack."}
                  </Text>
                </View>

                <View style={localStyles.battleCardsRow}>

                  <View style={localStyles.battleCard}>

                    <Text style={localStyles.battleCardLabel}>You</Text>

                    {battleState.player[0] ? (

                      <>

                        <CardFace

                          template={battleState.player[0].template}

                          stats={battleState.player[0].stats}

                          variant="compact"

                          showFunFact={false}

                        />

                        <Text style={localStyles.cardMeta}>

                          Cards left: {battleState.player.length}

                        </Text>

                      </>

                    ) : (

                      <Text style={localStyles.cardMeta}>No cards remaining.</Text>

                    )}

                  </View>



                  <View style={localStyles.battleCard}>

                    <Text style={localStyles.battleCardLabel}>Opponent</Text>

                    {battleState.opponent[0] ? (

                      <>

                        <CardFace

                          template={battleState.opponent[0].template}

                          stats={battleState.opponent[0].stats}

                          variant="compact"

                          showFunFact={false}

                          titleOverride="Unknown creature"

                          subtitleOverride="Identity unknown"

                          maskStats

                          maskedMessage="Stats hidden until the battle ends."

                          hideRarity

                        />

                        <Text style={localStyles.cardMeta}>

                          Cards left: {battleState.opponent.length}

                        </Text>

                      </>

                    ) : (

                      <Text style={localStyles.cardMeta}>No cards remaining.</Text>

                    )}

                  </View>

                </View>

                <View style={localStyles.battleControls}>
                  {battleState.finished ? (
                    <Text style={localStyles.battleResult}>
                      {battleState.result === "win"
                        ? "Victory! You cleared " + OPPONENT_NAME + "'s deck."
                        : "Defeat! " + OPPONENT_NAME + " claimed your last card."}
                    </Text>
                  ) : (
                    <>
                      <Text style={localStyles.sectionTitle}>Choose your move</Text>
                      <View style={localStyles.battleButtons}>
                        {STAT_KEYS.map((key) => (
                          <Pressable
                            key={key}
                            style={[
                              localStyles.battleActionButton,
                              (battleState.turn !== "player" || !battleState.player[0]) &&
                                localStyles.battleActionButtonDisabled,
                            ]}
                            onPress={() => handleBattleStat(key)}
                            disabled={
                              battleState.turn !== "player" ||
                              battleState.finished ||
                              !battleState.player[0]
                            }
                          >
                            <Text style={localStyles.battleActionText}>
                              {STAT_LABELS[key]}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                      {battleState.turn !== "player" && !battleState.finished && (
                        <Text style={localStyles.battleSubtitle}>
                          {OPPONENT_NAME + " is choosing a move..."}
                        </Text>
                      )}
                    </>
                  )}

                  <View style={localStyles.battleLog}>
                    {battleState.log.map((entry, idx) => (
                      <Text key={idx} style={localStyles.battleLogEntry}>
                        {entry}
                      </Text>
                    ))}
                  </View>
                </View>
              </ScrollView>

              <View style={localStyles.modalActions}>
                {battleState.finished && (
                  <Pressable
                    style={[localStyles.actionButton, { backgroundColor: "#2ecc71" }]}
                    onPress={() => {
                      startBattle();
                    }}
                  >
                    <Text style={localStyles.actionText}>Battle Again</Text>
                  </Pressable>
                )}
                <Pressable
                  style={[localStyles.actionButton, { backgroundColor: "#34495e" }]}
                  onPress={closeBattle}
                >
                  <Text style={localStyles.actionText}>Close</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      <View style={localStyles.devPanel}>

        <Pressable

          style={localStyles.devHeader}

          onPress={() => setDevToolsOpen((prev) => !prev)}

        >

          <Text style={localStyles.devTitle}>Developer Tools</Text>

          <Text style={localStyles.devToggle}>{devToolsOpen ? "-" : "+"}</Text>

        </Pressable>



        {devToolsOpen && (

          <View style={localStyles.devContent}>

            <View style={localStyles.devList}>

              {speciesList.map((template) => {

                const selected = devSelection === template.id;

                return (

                  <Pressable

                    key={template.id}

                    style={[

                      localStyles.devButton,

                      selected && localStyles.devButtonActive,

                    ]}

                    onPress={() => {

                      setDevSelection(template.id);

                      handleUnlock(template, { bypassCooldown: true });

                    }}

                  >

                    <Text style={localStyles.devButtonText}>

                      {template.commonName}

                    </Text>

                  </Pressable>

                );

              })}

            </View>

            <Text style={localStyles.devHint}>

              Instantly unlock cards and bypass cooldown for quick testing.

            </Text>

          </View>

        )}

      </View>

    </View>

  );

}



function formatMillis(ms: number): string {

  const totalSeconds = Math.ceil(ms / 1000);

  const minutes = Math.floor(totalSeconds / 60);

  const seconds = totalSeconds % 60;

  if (minutes > 0) {

    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;

  }

  return `${seconds}s`;

}



const localStyles = StyleSheet.create({

  banner: {

    marginTop: 16,

    backgroundColor: "#e8f5e9",

    borderRadius: 12,

    padding: 12,

    width: "100%",

  },

  bannerText: {

    color: "#2d6a4f",

    textAlign: "center",

    fontWeight: "600",

  },

  deckSummary: {

    marginTop: 20,

    width: "100%",

    backgroundColor: "#f4f6f6",

    borderRadius: 12,

    padding: 12,

  },

  deckTitle: {

    fontWeight: "700",

    marginBottom: 6,

  },

  deckLine: {

    opacity: 0.8,

  },

  manageButton: {

    marginTop: 12,

    alignSelf: "flex-start",

    backgroundColor: "#2ecc71",

    paddingHorizontal: 16,

    paddingVertical: 10,

    borderRadius: 10,

  },

  manageButtonText: {

    color: "#fff",

    fontWeight: "700",

  },

  battleButton: {

    marginTop: 20,

    width: "100%",

    backgroundColor: "#27ae60",

    borderRadius: 14,

    paddingVertical: 16,

    paddingHorizontal: 18,

  },

  battleButtonDisabled: {

    backgroundColor: "#95a5a6",

  },

  battleButtonText: {

    color: "#fff",

    fontWeight: "800",

    fontSize: 16,

    textAlign: "center",

  },

  battleButtonSub: {

    color: "#ecf0f1",

    textAlign: "center",

    marginTop: 4,

    fontSize: 12,

  },

  modalBackdrop: {

    flex: 1,

    backgroundColor: "rgba(0,0,0,0.45)",

    justifyContent: "center",

    alignItems: "center",

    padding: 16,

  },

  modalCard: {

    width: "100%",

    maxHeight: "85%",

    backgroundColor: "#fff",

    borderRadius: 16,

    padding: 20,

  },

  modalTitle: {

    fontSize: 24,

    fontWeight: "800",

  },

  modalSubtitle: {

    marginTop: 2,

    opacity: 0.6,

  },

  modalRarity: {

    marginTop: 10,

    fontWeight: "600",

  },

  metaLine: {
    marginTop: 6,
    color: "#2d3436",
    fontSize: 12,
  },

  modalMeta: {
    gap: 8,
    alignItems: "center",
  },

  metaHighlight: {

    marginTop: 10,

    fontWeight: "700",

    color: "#27ae60",

  },

  modalActions: {

    marginTop: 16,

    gap: 8,

  },

  actionButton: {

    backgroundColor: "#2ecc71",

    paddingVertical: 12,

    borderRadius: 10,

    alignItems: "center",

  },

  actionButtonDisabled: {
    backgroundColor: "#95a5a6",
    opacity: 0.7,
  },

  actionText: {

    color: "#fff",

    fontWeight: "700",

  },

  deckModal: {

    width: "100%",

    maxHeight: "85%",

    backgroundColor: "#fff",

    borderRadius: 16,

    padding: 20,

  },

  sectionTitle: {

    marginTop: 16,

    fontWeight: "700",

    fontSize: 18,

  },

  partyList: {

    marginTop: 12,

    gap: 8,

  },

  partySlot: {

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    backgroundColor: "#d4efdf",

    borderRadius: 10,

    padding: 12,

  },

  partySlotEmpty: {

    padding: 12,

    borderRadius: 10,

    backgroundColor: "#eceff1",

    alignItems: "center",

  },

  partyEmptyText: {

    color: "#7f8c8d",

  },

  partyInfo: {

    flex: 1,

    marginRight: 12,

  },

  cardInfo: {

    marginBottom: 8,

  },

  cardName: {

    fontWeight: "800",

    fontSize: 16,

  },

  cardMeta: {

    marginTop: 2,

    fontSize: 12,

    color: "#636e72",

  },

  collectionList: {

    marginTop: 12,

    gap: 12,

  },

  collectionCard: {
    gap: 12,
  },

  collectionFooter: {
    marginTop: 8,
    gap: 8,
  },

  collectionEmpty: {

    marginTop: 12,

    color: "#7f8c8d",

  },

  battleModal: {

    width: "100%",

    maxHeight: "85%",

    backgroundColor: "#fff",

    borderRadius: 16,

    padding: 20,

  },

  battleHeader: {

    alignItems: "center",

    gap: 6,

  },

  battleSubtitle: {

    color: "#636e72",

    fontSize: 12,

    textAlign: "center",

  },

  battleCardsRow: {

    flexDirection: "row",

    gap: 12,

    marginTop: 16,

  },

  battleCard: {
    flex: 1,
    gap: 10,
  },

  battleCardLabel: {

    fontSize: 12,

    fontWeight: "700",

    color: "#2d3436",

  },

battleStatText: {

    fontSize: 12,

    color: "#2d3436",

  },

  battleControls: {

    marginTop: 16,

    gap: 10,

  },

  battleButtons: {

    flexDirection: "row",

    flexWrap: "wrap",

    gap: 8,

  },

  battleActionButton: {

    flexBasis: "48%",

    backgroundColor: "#2980b9",

    paddingVertical: 10,

    borderRadius: 8,

    alignItems: "center",

  },

  battleActionButtonDisabled: {

    backgroundColor: "#95a5a6",

  },

  battleActionText: {

    color: "#fff",

    fontWeight: "700",

  },

  battleLog: {

    marginTop: 8,

    gap: 4,

  },

  battleLogEntry: {

    fontSize: 12,

    color: "#2d3436",

  },

  battleResult: {

    fontSize: 16,

    fontWeight: "700",

    textAlign: "center",

  },

  devPanel: {

    marginTop: 24,

    width: "100%",

    borderRadius: 12,

    backgroundColor: "#f0f4f8",

    overflow: "hidden",

  },

  devHeader: {

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    paddingHorizontal: 16,

    paddingVertical: 12,

  },

  devTitle: {

    fontWeight: "700",

    fontSize: 16,

  },

  devToggle: {

    fontSize: 20,

    fontWeight: "700",

  },

  devContent: {

    paddingHorizontal: 16,

    paddingBottom: 16,

  },

  devList: {

    flexDirection: "row",

    flexWrap: "wrap",

    gap: 8,

    marginTop: 8,

  },

  devButton: {

    backgroundColor: "#dce6f7",

    paddingHorizontal: 12,

    paddingVertical: 8,

    borderRadius: 8,

  },

  devButtonActive: {

    backgroundColor: "#74b9ff",

  },

  devButtonText: {

    fontWeight: "700",

    color: "#2d3436",

  },

  devHint: {

    marginTop: 10,

    fontSize: 12,

    color: "#607080",

  },

});

