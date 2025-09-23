import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Pressable, Text, Platform } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import * as Location from "expo-location";
import Constants from "expo-constants";

export type CapturedMeta = {
  uri: string;
  savedToGallery: boolean;
  location?: { lat: number; lon: number; accuracy?: number };
};

type Props = {
  onClose: () => void;
  onCaptured: (meta: CapturedMeta) => void;
};

export default function CameraCapture({ onClose, onCaptured }: Props) {
  const camRef = useRef<CameraView>(null);
  const [camPerm, requestCamPerm] = useCameraPermissions();
  const [libPerm, requestLibPerm] = MediaLibrary.usePermissions();

  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [torch, setTorch] = useState(false); // <- use enableTorch with CameraView

  const isExpoGo = Constants.appOwnership === "expo";

  // Ask permissions on mount
  useEffect(() => {
    (async () => {
      if (!camPerm?.granted) await requestCamPerm();
      if (!libPerm?.granted) await requestLibPerm();
      await Location.requestForegroundPermissionsAsync();
      if (Platform.OS === "android") {
        try {
          await Location.enableNetworkProviderAsync();
        } catch {}
      }
    })();
  }, []);

  if (!camPerm) return null;

  if (!camPerm.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerText}>Camera permission needed</Text>
        <Pressable style={styles.pill} onPress={requestCamPerm}>
          <Text style={styles.pillText}>Grant</Text>
        </Pressable>
        <Pressable style={[styles.pill, { marginTop: 8 }]} onPress={onClose}>
          <Text style={styles.pillText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  async function getBestEffortLocation() {
    try {
      const last = await Location.getLastKnownPositionAsync();
      if (last) {
        return {
          lat: last.coords.latitude,
          lon: last.coords.longitude,
          accuracy: last.coords.accuracy ?? undefined,
        };
      }
    } catch {}
    try {
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return {
        lat: current.coords.latitude,
        lon: current.coords.longitude,
        accuracy: current.coords.accuracy ?? undefined,
      };
    } catch {
      return undefined;
    }
  }

  async function saveToGallery(uri: string) {
    // In Expo Go on Android, full save to Photos is limited; we'll still try, but expect false
    try {
      if (libPerm?.granted && !(isExpoGo && Platform.OS === "android")) {
        await MediaLibrary.saveToLibraryAsync(uri);
        return true;
      }
    } catch {}
    return false;
  }

  async function snap() {
    if (busy) return;
    setBusy(true);
    try {
      const [loc, pic] = await Promise.all([
        getBestEffortLocation(),
        camRef.current?.takePictureAsync({
          quality: 0.9,
          skipProcessing: true,
          exif: true,
        }),
      ]);
      if (!pic?.uri) throw new Error("No URI from camera");

      const saved = await saveToGallery(pic.uri);

      onCaptured({
        uri: pic.uri,
        savedToGallery: !!saved,
        location: loc,
      });
    } catch (e) {
      console.error("Capture failed", e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <CameraView
        ref={camRef}
        style={{ flex: 1 }}
        facing="back"
        mode="picture"
        animateShutter
        enableTorch={torch} // ✅ correct prop for CameraView
        onCameraReady={() => setReady(true)}
        onMountError={(e: unknown) =>
          console.error("Camera mount error", (e as any)?.message ?? e)
        }
      />

      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable style={styles.pill} onPress={onClose}>
          <Text style={styles.pillText}>Close</Text>
        </Pressable>

        <View style={{ flex: 1 }} />

        <Pressable
          style={[styles.pill, { marginLeft: 8 }]}
          onPress={() => setTorch((t) => !t)}
        >
          <Text style={styles.pillText}>
            {torch ? "Flash: ON" : "Flash: OFF"}
          </Text>
        </Pressable>
      </View>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <Pressable
          onPress={snap}
          style={[styles.shutter, busy && { opacity: 0.5 }]}
        />
        {!ready && <Text style={styles.hint}>Opening camera…</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    padding: 24,
  },
  centerText: { color: "#fff", marginBottom: 8 },
  pill: {
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  pillText: { color: "white", fontWeight: "700" },
  topBar: {
    position: "absolute",
    top: 40,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  bottomBar: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center",
  },
  shutter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 6,
    borderColor: "white",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  hint: { color: "#fff", marginTop: 8 },
});
