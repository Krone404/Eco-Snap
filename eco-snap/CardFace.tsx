import React from "react";
import { View, Text, StyleSheet, Image, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { SpeciesTemplate, StatKey, StatBlock } from "./species";

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

type CardFaceVariant = "full" | "compact";

type CardFaceProps = {
  template: SpeciesTemplate;
  stats: StatBlock;
  bonusPercent?: number;
  copiesOwned?: number;
  variant?: CardFaceVariant;
  showFunFact?: boolean;
  style?: ViewStyle;
  titleOverride?: string;
  subtitleOverride?: string;
  maskStats?: boolean;
  maskedMessage?: string;
  hideRarity?: boolean;
};

export default function CardFace({
  template,
  stats,
  bonusPercent,
  copiesOwned,
  variant = "full",
  showFunFact = variant === "full",
  style,
  titleOverride,
  subtitleOverride,
  maskStats = false,
  maskedMessage = "Stats hidden",
  hideRarity = false,
}: CardFaceProps) {
  const gradient = template.gradient ?? ["#2c3e50", "#4ca1af"];
  const displayName = titleOverride ?? template.commonName;
  const displaySubtitle = subtitleOverride ?? template.scientificName;

  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.base, variant === "compact" ? styles.compact : styles.full, style]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleColumn}>
          <Text style={styles.commonName}>{displayName}</Text>
          <Text style={styles.scientific}>{displaySubtitle}</Text>
        </View>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons
            name={template.icon as any}
            size={variant === "compact" ? 32 : 42}
            color={template.accentColor}
          />
        </View>
      </View>

      {!hideRarity && <View style={styles.rarityRow}>{renderRarity(template.rarity)}</View>}

      {typeof bonusPercent === "number" || typeof copiesOwned === "number" ? (
        <View style={styles.metaRow}>
          {typeof bonusPercent === "number" && (
            <Text style={styles.metaText}>Bonus +{bonusPercent}%</Text>
          )}
          {typeof copiesOwned === "number" && (
            <Text style={styles.metaText}>Copies {copiesOwned}</Text>
          )}
        </View>
      ) : null}

      {template.image && (
        <Image source={{ uri: template.image }} style={styles.image} resizeMode="cover" />
      )}

      <View style={styles.statList}>
        {maskStats ? (
          <Text style={styles.maskedText}>{maskedMessage}</Text>
        ) : (
          STAT_KEYS.map((key) => (
            <StatBar
              key={key}
              label={STAT_LABELS[key]}
              value={stats[key]}
              accent={template.accentColor}
              compact={variant === "compact"}
            />
          ))
        )}
      </View>

      {showFunFact && (
        <View style={[styles.funFactBox, { backgroundColor: withOpacity(template.accentColor, 0.2) }]}>
          <Text style={styles.funFactLabel}>Fun fact</Text>
          <Text style={styles.funFactText}>{template.funFact}</Text>
        </View>
      )}
    </LinearGradient>
  );
}

type StatBarProps = {
  label: string;
  value: number;
  accent: string;
  compact?: boolean;
};

function StatBar({ label, value, accent, compact }: StatBarProps) {
  const percentage = Math.min(150, Math.max(0, value)) / 150;
  return (
    <View style={styles.statRow}>
      <Text style={[styles.statLabel, compact && styles.statLabelCompact]}>{label}</Text>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              width: `${Math.max(0.1, percentage) * 100}%`,
              backgroundColor: accent,
            },
          ]}
        />
      </View>
      <Text style={[styles.statValue, compact && styles.statValueCompact]}>{value}</Text>
    </View>
  );
}

function renderRarity(rarity: number) {
  return Array.from({ length: 5 }, (_, idx) => {
    const filled = idx < rarity;
    return (
      <MaterialCommunityIcons
        key={idx}
        name={filled ? "star" : "star-outline"}
        size={18}
        color={filled ? "#FFD166" : "rgba(255,255,255,0.5)"}
        style={styles.rarityIcon}
      />
    );
  });
}

function withOpacity(hex: string, opacity: number) {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return hex;
  }
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    padding: 18,
    width: "100%",
    overflow: "hidden",
  },
  full: {
    gap: 12,
  },
  compact: {
    gap: 8,
    padding: 14,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleColumn: {
    flex: 1,
    paddingRight: 12,
  },
  commonName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  scientific: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 2,
  },
  iconWrap: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 32,
    padding: 8,
  },
  rarityRow: {
    flexDirection: "row",
  },
  rarityIcon: {
    marginRight: 2,
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
  },
  metaText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "600",
  },
  image: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    marginTop: 6,
  },
  statList: {
    gap: 6,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    width: 78,
  },
  statLabelCompact: {
    fontSize: 11,
    width: 68,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 10,
  },
  statValue: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    width: 36,
    textAlign: "right",
  },
  statValueCompact: {
    fontSize: 11,
    width: 32,
  },
  maskedText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    textAlign: "center",
  },
  funFactBox: {
    borderRadius: 12,
    padding: 10,
  },
  funFactLabel: {
    color: "rgba(0,0,0,0.6)",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
    fontWeight: "700",
  },
  funFactText: {
    color: "rgba(0,0,0,0.75)",
    fontSize: 12,
    lineHeight: 16,
  },
});

