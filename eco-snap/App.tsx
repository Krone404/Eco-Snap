// App.tsx
import React, { useState } from "react";
import {
  Text,
  View,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import CameraCapture, { CapturedMeta } from "./CameraCapture";
import styles from "./styles";
import { analyzeWithVision, VisionLabel } from "./vision";

export default function App() {
  const [openCamera, setOpenCamera] = useState(false);
  const [last, setLast] = useState<CapturedMeta | null>(null);
  const [labels, setLabels] = useState<VisionLabel[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCaptured(meta: CapturedMeta) {
    setOpenCamera(false);
    setLast(meta);
    setLabels(null);
    try {
      setLoading(true);
      const out = await analyzeWithVision(meta.uri, 6);
      setLabels(out);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Vision error", e?.message ?? "Failed to analyze image");
    } finally {
      setLoading(false);
    }
  }

  if (openCamera) {
    return (
      <CameraCapture
        onClose={() => setOpenCamera(false)}
        onCaptured={handleCaptured}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>Eco Snap</Text>
      <Text style={styles.sub}>Explore, snap a species, collect the card.</Text>

      <Pressable style={styles.cta} onPress={() => setOpenCamera(true)}>
        <Text style={styles.ctaText}>Open Camera</Text>
      </Pressable>

      {last && (
        <View style={styles.previewWrap}>
          <Text style={styles.previewLabel}>Last capture</Text>
          <Image source={{ uri: last.uri }} style={styles.preview} />
          <Text style={styles.meta}>
            {last.savedToGallery
              ? "✅ Saved to gallery"
              : "📁 Saved locally / not in Photos"}
            {" • "}
            {last.location
              ? `📍 ${last.location.lat.toFixed(
                  5
                )}, ${last.location.lon.toFixed(5)}`
              : "📍 no GPS"}
          </Text>

          {/* Vision labels */}
          <View style={{ marginTop: 12, width: "100%" }}>
            <Text style={{ fontWeight: "600", fontSize: 16, marginBottom: 6 }}>
              {loading ? "Analyzing…" : "Detected labels"}
            </Text>
            {loading && <ActivityIndicator />}
            {!loading && labels && labels.length > 0 && (
              <View style={{ gap: 4 }}>
                {labels.map((l, i) => (
                  <Text key={i}>
                    • {l.description} ({(l.score * 100).toFixed(1)}%)
                  </Text>
                ))}
              </View>
            )}
            {!loading && (!labels || labels.length === 0) && (
              <Text>— no labels —</Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
