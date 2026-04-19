<div align="center">
  <img src="assets/images/icon.png" width="120" height="120" alt="RepBook Logo" />
  <h1>RepBook</h1>
  <p><strong>A no-nonsense, simple open-source workout tracker.</strong></p>

  <p>
    <a href="https://github.com/expo/expo" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" /></a>
    <a href="https://reactnative.dev/" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" /></a>
    <a href="https://tamagui.dev/" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/badge/Tamagui-151515?style=for-the-badge&logo=react&logoColor=FFD166" alt="Tamagui" /></a>
    <a href="https://www.sqlite.org/" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" /></a>
  </p>
  <p>
    <a href="https://github.com/goldenryu2000/RepBook/releases/latest" target="_blank" rel="noopener noreferrer">
      <img src="https://img.shields.io/badge/Download_APK-green?style=for-the-badge&logo=android&logoColor=white" alt="Download APK" />
    </a>
  </p>
</div>

<br />

**RepBook** was built out of frustration with modern fitness apps. There are no subscriptions, no required accounts, no cloud syncing issues, and no bloat. Just a lightning-fast tool to log your workouts and get out of your way.

## ✨ Philosophy

- **Zero friction:** Open the app and start logging immediately.
- **Local Data:** Your data belongs to you. It lives locally on your device in a SQLite database.
- **No subscriptions:** Fitness tracking shouldn't cost $10/month.
- **Privacy first:** No tracking, no accounts, no server uploads.

## 🚀 Features

- **Guided Focus Mode:** A step-by-step workout player that guides you through weight, sets, reps, and rest.
- **Smart Targets:** Automatically surfaces your previous session data (weight/reps) while you log.
- **Ad-Hoc & Template Workouts:** Start a random workout on the fly, or build reusable templates.
- **Smart Scheduling:** Assign templates to specific days of the week or calendar dates.
- **Dynamic Template Creation:** Finished an ad-hoc workout? Save it as a new template with a single tap.
- **Premium Haptics:** Physical feedback for every interaction, powered by Expo Haptics.
- **Progress Analytics:** Visualise your volume and strength over time with interactive charts.
- **Dark Mode:** A sleek, high-contrast dark theme powered by [Tamagui](https://tamagui.dev).

## 🗺️ Roadmap (Upcoming Features)

- [x] Custom App Logo & Branding
- [x] Rest Timer for active workouts
- [ ] Data Export & Import (JSON/CSV backups)
- [ ] Support for Supersets & Dropsets
- [ ] Muscle Group Heatmaps
- [ ] Persistence for mid-workout session state

## 🛠️ Tech Stack

RepBook is built on the modern React Native ecosystem:

- **Framework:** <a href="https://expo.dev" target="_blank" rel="noopener noreferrer">Expo</a> (SDK 54) & Expo Router
- **UI & Styling:** <a href="https://tamagui.dev" target="_blank" rel="noopener noreferrer">Tamagui</a>
- **State Management:** <a href="https://zustand-demo.pmnd.rs/" target="_blank" rel="noopener noreferrer">Zustand</a>
- **Database:** `expo-sqlite` (Synchronous SQLite running in WAL mode)
- **Testing:** Jest + `jest-expo`
- **Code Quality:** ESLint, Prettier, Husky, lint-staged

## 💻 Getting Started

Want to run RepBook locally or contribute? It's easy to get started.

### Prerequisites

- Node.js ≥ 20
- Expo CLI
- iOS Simulator or Android Emulator (or a physical device with the Expo Go app)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/RepBook.git
cd RepBook

# 2. Install dependencies
npm install

# 3. Start the development server
npm run start:clear
```

Press `a` to open in Android, or `i` to open in iOS.

## 🗄️ Database Architecture

The entire app is powered by a robust, local SQLite database (`repbook.db`). We use strict schema migrations to ensure your data is never lost during app updates.

- `workouts`: Core session data.
- `exercises`: Exercises tied to a specific workout.
- `sets`: Individual sets (reps, weight, unit).
- `templates`: Reusable workout routines.
- `template_exercises`: Exercises mapped to a template.
- `settings`: Key/value store for user profile and preferences.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  <i>Made with the help of Antigravity 🚀</i>
</p>
