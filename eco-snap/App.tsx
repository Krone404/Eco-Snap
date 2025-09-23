import React, { useState } from "react";
import { StyleSheet, Text, View, Image, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";
import CameraCapture, { CapturedMeta } from "./CameraCapture";

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
    <View style={s.container}>
      <StatusBar style="auto" />
      <Text style={s.title}>Eco Snap</Text>
      <Text style={s.sub}>Explore, snap a species, collect the card.</Text>

      <Pressable style={s.cta} onPress={() => setOpenCamera(true)}>
        <Text style={s.ctaText}>Open Camera</Text>
      </Pressable>

      {last && (
        <View style={s.previewWrap}>
          <Text style={s.previewLabel}>Last capture</Text>
          <Image source={{ uri: last.uri }} style={s.preview} />
          <Text style={s.meta}>
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

const s = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 24,
  },
  title: { fontSize: 32, fontWeight: "900", marginBottom: 8 },
  sub: { fontSize: 14, opacity: 0.7, marginBottom: 24, textAlign: "center" },
  cta: {
    backgroundColor: "#2ecc71",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  ctaText: { color: "#fff", fontWeight: "800" },
  previewWrap: { marginTop: 28, width: "100%", alignItems: "center" },
  previewLabel: { fontWeight: "700", marginBottom: 8 },
  preview: {
    width: "100%",
    height: 280,
    borderRadius: 12,
    resizeMode: "cover",
    backgroundColor: "#eee",
  },
  meta: { marginTop: 8, opacity: 0.8, textAlign: "center" },
});
