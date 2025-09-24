import React, { useRef, useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Text, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import * as Location from "expo-location";

export type CapturedMeta = {
  uri: string;
  savedToGallery: boolean;
  location?: {
    lat: number;
    lon: number;
  };
};

type Props = {
  onCaptured: (meta: CapturedMeta) => void;
  onClose: () => void;
};

export default function CameraCapture({ onCaptured, onClose }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState<"off" | "on">("off");
  const camRef = useRef<CameraView>(null);

  useEffect(() => {
    (async () => {
      if (!permission?.granted) {
        await requestPermission();
      }
      await MediaLibrary.requestPermissionsAsync();
      await Location.requestForegroundPermissionsAsync();
    })();
  }, []);

  async function snap() {
    try {
      if (!camRef.current) return;

      const photo = await camRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: true,
      });
      if (!photo?.uri) throw new Error("Failed to capture photo");

      // Save to gallery
      let savedToGallery = false;
      try {
        await MediaLibrary.saveToLibraryAsync(photo.uri);
        savedToGallery = true;
      } catch {
        savedToGallery = false;
      }

      // Get GPS location
      let coords: { lat: number; lon: number } | undefined = undefined;
      try {
        const loc = await Location.getCurrentPositionAsync({});
        coords = { lat: loc.coords.latitude, lon: loc.coords.longitude };
      } catch {
        coords = undefined;
      }

      onCaptured({ uri: photo.uri, savedToGallery, location: coords });
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", "Failed to capture photo");
    }
  }

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text>No access to camera</Text>
        <Pressable onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </Pressable>
        <Pressable onPress={onClose} style={[styles.button, { backgroundColor: "gray" }]}>
          <Text style={styles.buttonText}>Close</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={camRef}
        style={styles.camera}
        facing="back"
        flash={flash}
      >
        <View style={styles.controls}>
          <Pressable
            style={[styles.controlButton, { backgroundColor: flash === "on" ? "orange" : "black" }]}
            onPress={() => setFlash(flash === "off" ? "on" : "off")}
          >
            <Text style={styles.controlText}>⚡</Text>
          </Pressable>

          <Pressable style={styles.captureButton} onPress={snap}>
            <View style={styles.innerCircle} />
          </Pressable>

          <Pressable style={styles.controlButton} onPress={onClose}>
            <Text style={styles.controlText}>✖</Text>
          </Pressable>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  camera: { flex: 1 },
  controls: {
    position: "absolute",
    bottom: 40,
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    alignItems: "center",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  innerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  controlText: {
    color: "white",
    fontSize: 22,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    marginTop: 16,
    backgroundColor: "#28a745",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
});
