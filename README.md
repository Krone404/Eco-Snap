## 📄 `README.md`

# Eco Snap 🌱📸

A mobile game built with **React Native (Expo)** and the **iNaturalist API**.  
Players explore the real world, snap photos of plants & animals, and earn collectible **eco-cards** with stats, abilities, and fun facts.  
Think *Pokémon Go* meets *CUE Cards*, powered by real biodiversity data.  

---

## 🚀 Features (MVP)
- 📸 Take a picture with your camera + capture location  
- 🔍 Get species suggestions from iNaturalist  
- 🃏 Generate a collectible card (Power, Energy, Abilities, Fun Facts)  
- 📚 View your deck of collected cards  
- ⚔️ Simple battle mode (compare Power/Energy, team-ups)  

---

## 🛠 Tech Stack
- **React Native (Expo, TypeScript)**
- **Expo Router** – navigation
- **Zustand** – local state management
- **React Query** – API caching & retries
- **Expo Camera & Location** – photo + GPS
- **AsyncStorage** – local persistence
- **iNaturalist API** – species data & images

---

## 📦 Getting Started

### 1. Clone repo
```bash
git clone https:https://github.com/Krone404/Eco-Snap.git
cd eco-snap
````

### 2. Install dependencies

```bash
npm install
```

### 3. Run in development

```bash
npx expo start
```

* Press `i` to open iOS simulator
* Press `a` to open Android emulator
* Scan QR code with the **Expo Go** app (iOS/Android)

---

## 📂 Project Structure

```
eco-snap/
  app/                  # expo-router pages
    _layout.tsx         # global providers
    index.tsx           # Home (map + snap button)
    confirm.tsx         # Confirm species
    deck.tsx            # Card collection
    battle.tsx          # Battle view
  src/
    components/         # UI building blocks
    logic/              # Card stats + abilities
    services/           # iNaturalist API client
    store/              # Zustand stores
    utils/              # helpers
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
