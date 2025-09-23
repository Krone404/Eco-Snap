import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import { CameraView, useCameraPermissions } from "expo-camera";

/** -------- Home + Routerless flow --------
 *  Home -> Open Camera -> Take Photo -> Preview -> Back to Home
 */
export default function App() {
  const [openCamera, setOpenCamera] = useState(false);
  const [lastPhoto, setLastPhoto] = useState<string | null>(null);

  if (openCamera) {
    return (
      <CameraScreen
        onClose={() => setOpenCamera(false)}
        onCaptured={(uri) => {
          setLastPhoto(uri);
          setOpenCamera(false);
        }}
      />
    );
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>Eco Snap</Text>
      <Text style={s.sub}>Explore, snap a species, collect the card.</Text>

      <Pressable style={s.cta} onPress={() => setOpenCamera(true)}>
        <Text style={s.ctaText}>Open Camera</Text>
      </Pressable>

      {lastPhoto && (
        <View style={s.previewWrap}>
          <Text style={s.previewLabel}>Last capture</Text>
          <Image source={{ uri: lastPhoto }} style={s.preview} />
          <View style={{ height: 12 }} />
          <Pressable style={s.secondary} onPress={() => setLastPhoto(null)}>
            <Text style={s.secondaryText}>Clear</Text>
          </Pressable>
        </View>
      )}

      <StatusBar style="auto" />
    </View>
  );
}

/** -------- Camera Screen (inlined to avoid import issues) -------- */
type CamProps = {
  onClose: () => void;
  onCaptured: (uri: string) => void;
};

function CameraScreen({ onClose, onCaptured }: CamProps) {
  const [perm, requestPermission] = useCameraPermissions();
  const camRef = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!perm) return;
    if (!perm.granted) requestPermission();
  }, [perm]);

  if (!perm) return null;

  if (!perm.granted) {
    return (
      <View style={cs.center}>
        <Text style={cs.title}>Camera permission needed</Text>
        <Pressable onPress={requestPermission} style={cs.primary}>
          <Text style={cs.primaryText}>Grant</Text>
        </Pressable>
        <Pressable onPress={onClose} style={cs.secondary}>
          <Text style={cs.secondaryText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  async function snap() {
    if (busy) return;
    try {
      setBusy(true);
      const r = await camRef.current?.takePictureAsync({
        quality: 0.9,
        skipProcessing: true,
        exif: true,
      });
      if (r?.uri) onCaptured(r.uri);
    } catch (e: any) {
      console.error("Snap error", e?.message ?? e);
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <CameraView
        ref={camRef}
        style={{ flex: 1 }} // most reliable on Android
        facing="back"
        mode="picture"
        animateShutter
        onCameraReady={() => setReady(true)}
        onMountError={(e: unknown) =>
          console.error("Mount error", (e as any)?.message ?? e)
        }
      />

      {/* Top-left Close */}
      <View style={cs.topBar}>
        <Pressable onPress={onClose} style={cs.pill}>
          <Text style={cs.pillText}>Close</Text>
        </Pressable>
      </View>

      {/* Shutter */}
      <View style={cs.bottomBar}>
        <Pressable
          onPress={snap}
          style={[cs.shutter, busy && { opacity: 0.5 }]}
        />
        {!ready && <Text style={cs.hint}>Opening camera…</Text>}
      </View>
    </View>
  );
}

/** -------- Styles -------- */
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
  secondary: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderColor: "#ddd",
    borderWidth: 1,
  },
  secondaryText: { fontWeight: "700" },
});

const cs = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#000",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  primary: {
    backgroundColor: "#2ecc71",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  primaryText: { color: "#fff", fontWeight: "800" },
  secondary: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  secondaryText: { color: "#fff", fontWeight: "700" },
  topBar: {
    position: "absolute",
    top: 40,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  pill: {
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  pillText: { color: "#fff", fontWeight: "700" },
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
