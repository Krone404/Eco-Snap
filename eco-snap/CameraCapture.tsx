import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

export default function App() {
  const [perm, requestPermission] = useCameraPermissions();
  const camRef = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!perm) return;
    if (!perm.granted) requestPermission();
  }, [perm]);

  if (!perm) return null;

  if (!perm.granted) {
    return (
      <View style={s.center}>
        <Text style={s.title}>Camera permission needed</Text>
        <Pressable onPress={requestPermission} style={s.btn}>
          <Text style={s.btnText}>Grant</Text>
        </Pressable>
      </View>
    );
  }

  async function snap() {
    try {
      const r = await camRef.current?.takePictureAsync({ quality: 0.9, skipProcessing: true, exif: true });
      Alert.alert("Captured", r?.uri ?? "no uri");
    } catch (e: any) {
      Alert.alert("Snap error", e?.message ?? String(e));
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <CameraView
        ref={camRef}
        style={{ flex: 1 }}          // <- no absolute, no overlays
        facing="back"
        mode="picture"
        animateShutter
        onCameraReady={() => setReady(true)}
        onMountError={(e: unknown) => Alert.alert("Mount error", String((e as any)?.message ?? e))}
      />
      <View style={s.footer}>
        <Pressable onPress={snap} style={s.shutter} />
        {!ready && <Text style={s.hint}>Opening camera…</Text>}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  btn: { backgroundColor: "#2ecc71", paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10 },
  btnText: { color: "#fff", fontWeight: "700" },
  footer: { position: "absolute", bottom: 40, width: "100%", alignItems: "center" },
  shutter: { width: 74, height: 74, borderRadius: 37, borderWidth: 6, borderColor: "white", backgroundColor: "rgba(255,255,255,0.2)" },
  hint: { color: "#fff", marginTop: 8 },
});
