<div align="center">
  <img src="assets/icon.png" width="120" height="120" alt="Bilgeç Logo">
  <h1>Bilgeç</h1>
  <p><strong>A highly polished, premium Turkish crossword puzzle game built with Expo and React Native.</strong></p>
  
  <p>
    <a href="https://reactnative.dev/"><img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native"></a>
    <a href="https://expo.dev/"><img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo"></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"></a>
    <a href="https://zustand-demo.pmnd.rs/"><img src="https://img.shields.io/badge/Zustand-443E38?style=for-the-badge&logo=react&logoColor=white" alt="Zustand"></a>
  </p>
</div>

<br />

## ✨ Features

- **🧠 Procedural Generation:** An advanced crossword generation engine that builds unique puzzles from a massive database of Turkish questions dynamically.
- **🎨 Premium UI/UX:** A beautifully crafted interface focusing on elegance, legibility, and high-end aesthetic feedback inspired by top-tier iOS applications.
- **🌌 Space Journey Map:** An animated, node-based progression map featuring a custom SVG curved path, floating star particles (60fps Reanimated), and glowing planet milestones.
- **🎙️ Text-to-Speech (TTS):** Integrated native speech synthesis reads clues aloud for maximum accessibility and modern user experience.
- **🏆 Gamification:** Includes a full economy system (Coins/XP), Streaks, Daily Missions, Leaderboards (Leagues), and dynamic progression mechanics.
- **📱 Haptic Feedback:** Deep integration of `expo-haptics` to provide satisfying tactile responses for typing, selection, and progression.

---

## 🛠 Tech Stack

- **Framework:** [React Native](https://reactnative.dev) + [Expo](https://expo.dev) 
- **Routing:** [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Animations:** [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) + Standard `Animated` API
- **Graphics/SVG:** `react-native-svg`
- **Native APIs:** `expo-speech`, `expo-haptics`, `expo-linear-gradient`, `expo-blur`

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed along with the Expo CLI.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Synchex/bilgec.git
   cd bilgec
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Expo development server:
   ```bash
   npx expo start
   ```

4. Press `i` to run on iOS Simulator or `a` to run on Android Emulator. Or scan the QR code with the Expo Go app on your physical device.

---

## 🗺️ App Architecture

- **`app/`**: Contains the Expo Router screen files (Tabs layout, Gameplay screens).
- **`src/engine/`**: The core logic! Question matching, grid placement logic, crossword intersection validation, and puzzle difficulty scoring.
- **`src/components/`**: Reusable modular UI components (e.g., `CengelGrid`, `ClueBar`, Space Map nodes).
- **`src/store/`**: Zustand state slices managing persistent data (`useProgressionStore`, `useEconomyStore`, `useDailyStore`).
- **`src/data/`**: The massive JSON seed files acting as the question/answer database.

---

<div align="center">
  <p>🛠 Built with passion for crosswords and premium UI design.</p>
</div>
