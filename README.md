## 📄 `README.md`

# Eco Snap 🌱📸

A mobile game built with **React Native (Expo)** and the **iNaturalist API**.  
Players explore the real world, snap photos of plants & animals, and earn collectible **eco-cards** with stats, abilities, and fun facts.  
Think *Pokémon Go* meets *CUE Cards*, powered by real biodiversity data.  

---

## ⚡ Quick Start (for teammates)

1. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Run in tunnel mode** (always use tunnel so QR works everywhere)

   ```bash
   npx expo start --tunnel --clear
   ```

3. **Scan QR in Expo Go**

   * Install [Expo Go (Android)](https://play.google.com/store/apps/details?id=host.exp.exponent) or [Expo Go (iOS)](https://apps.apple.com/app/expo-go/id982107779).
   * Open Expo Go → Scan QR code from your terminal.
   * App will load and show **“Eco Snap is running 🎉”**.

---

## 🚀 Features (MVP)

* 📸 Take a picture with your camera + capture location
* 🔍 Get species suggestions from iNaturalist
* 🃏 Generate a collectible card (Power, Energy, Abilities, Fun Facts)
* 📚 View your deck of collected cards
* ⚔️ Simple battle mode (compare Power/Energy, team-ups)

---

## 🛠 Tech Stack

* **React Native (Expo, TypeScript)**
* **Expo Router** – navigation
* **Zustand** – local state management
* **React Query** – API caching & retries
* **Expo Camera & Location** – photo + GPS
* **AsyncStorage** – local persistence
* **iNaturalist API** – species data & images

---

## 📦 Getting Started

### 1. Clone repo

```bash
git clone https://github.com/<your-org-or-username>/eco-snap.git
cd eco-snap
```

### 2. Install dependencies

```bash
npm install --legacy-peer-deps
```

---

## 📱 Running on Expo Go (Native Only)

### Prerequisites

* Install **Expo Go** app on your phone

  * [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)
  * [iOS](https://apps.apple.com/app/expo-go/id982107779)

### Steps

1. Start Metro in **tunnel mode** (works even if laptop & phone are on different networks):

   ```bash
   npx expo start --tunnel --clear
   ```

2. A QR code will appear in your terminal.

3. Open **Expo Go** on your phone and scan the QR code.

4. The app bundle will download, and you should see:
   **"Eco Snap is running 🎉"** on screen.

> ⚠️ Only use **tunnel mode** unless you are 100% sure your phone and laptop are on the same Wi-Fi and allow LAN connections.

---

## 📂 Project Structure

```
eco-snap/
  app/                  # expo-router pages (future)
  App.tsx               # entry point for native app
  src/                  # components, services, logic
  assets/               # fonts, icons
```

---

## 🌍 iNaturalist API Usage

* `/observations/species_counts` – nearby species suggestions
* `/taxa/autocomplete` – search by name
* `/taxa` – taxon details (images, Wikipedia link, IUCN status)
* All images require **proper license + attribution** (shown on cards)

---

## 👩‍💻 Team

Hackathon project by **\[Team Name]**

* Cameron – Developer
* \[Add teammates here]

---

## 📜 License

This project is for **educational & hackathon purposes only**.
All species data and images courtesy of **[iNaturalist](https://www.inaturalist.org/)** and licensed contributors.

---

## 🧰 Troubleshooting (Expo Go)

**“Failed to download remote update” (Android)**

* Use tunnel mode:

  ```bash
  npx expo start --tunnel --clear
  ```
* Ensure **Expo Go** is up to date (Play Store / App Store).
* If on campus/work Wi-Fi, firewalls may block LAN. Prefer **Tunnel**.

**Nothing loads / white screen**

* Clear Metro cache and restart:

  ```bash
  npx expo start --clear
  ```
* Kill any other Metro instances (`Ctrl+C` in old terminals).
* Make sure you edited **`App.tsx`** (entry point) and the file compiles.

**Can’t open Expo Dev Tools**

* Metro runs on port `8081` (JSON view). The dashboard is usually at `http://localhost:19002`.
* If it doesn’t open, start directly in tunnel mode (no dashboard needed):

  ```bash
  npx expo start --tunnel
  ```

**Dependency conflicts (Windows / npm)**

* Install with relaxed peer deps (safe for native-only):

  ```bash
  npm install --legacy-peer-deps
  ```
* If you ever need to clean install:

  ```powershell
  Remove-Item -Recurse -Force node_modules
  Remove-Item -Force package-lock.json
  npm install --legacy-peer-deps
  ```

**Accidentally installed web deps**

* For native-only you don’t need `react-dom` / `react-native-web`. If they slip in:

  ```bash
  npm uninstall react-dom react-native-web --force
  ```

**Stuck on LAN IP / QR won’t connect**

* Ensure phone + laptop on same Wi-Fi **and** the network allows device-to-device.
* Easiest fix: **always use Tunnel**.

**Android: old bundle cached**

* In Expo Go: Shake → “Reload” (or `r` in terminal).
* If still stuck: Clear Expo Go cache (App info → Storage → Clear cache).

**iOS: permissions**

* If camera/location prompts don’t appear later, ensure `app.json` includes:

  ```json
  "ios": {
    "infoPlist": {
      "NSCameraUsageDescription": "Eco Snap needs camera access to take species photos.",
      "NSLocationWhenInUseUsageDescription": "Eco Snap uses location to suggest nearby species."
    }
  }
  ```

**Firewall / VPN**

* Windows Defender can block Metro; allow Node.js through firewall.
* Turn off VPN or use **Tunnel**.
