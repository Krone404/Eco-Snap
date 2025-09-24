import "dotenv/config";

export default {
  expo: {
    name: "eco-snap",
    slug: "eco-snap",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription:
          "Eco Snap needs access to your camera to take species photos.",
        NSLocationWhenInUseUsageDescription:
          "Eco Snap uses your location to suggest nearby species.",
        NSPhotoLibraryAddUsageDescription:
          "Eco Snap saves your captured photos to your gallery.",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: ["expo-router"],
    extra: {
      googleVisionApiKey: process.env.GOOGLE_VISION_API_KEY,
    },
  },
};
