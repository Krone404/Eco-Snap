import { StyleSheet } from "react-native";

export default StyleSheet.create({
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
  hint: { color: "#fff", marginTop: 8 }
});