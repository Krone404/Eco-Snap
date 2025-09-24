import React, { useState } from "react";
import { StyleSheet, Text, View, Image, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";
import CameraCapture, { CapturedMeta } from "./CameraCapture";
import styles from "./styles";

export default function App() {
  const [openCamera, setOpenCamera] = useState(false);
  const [last, setLast] = useState<CapturedMeta | null>(null);

  if (openCamera) {
    return (
      <CameraCapture
        onClose={() => setOpenCamera(false)}
        onCaptured={(meta) => {
          setLast(meta);
          setOpenCamera(false);
        }}
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
        </View>
      )}
    </View>
  );
}
