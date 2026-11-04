# ⏳ Focus — Minimalist Focus Timer & Daily Tasks

> A quiet, brutalist editorial Pomodoro timer and task companion for Android. Designed to help you get into deep work with zero distractions, soothing background sounds, and elegant Swiss typography.

---

## ✨ Why Focus?

Most timer apps are cluttered with popups, subscriptions, and distracting animations. **Focus** takes the opposite approach:
- **100% Free & Open Source:** No ads, no trackers, no accounts, and works completely offline.
- **Paper & Ink Aesthetic:** High-contrast editorial design inspired by Swiss brutalism and the Los Angeles clock layout.
- **Gentle Soundscapes:** Continuous background audio (rain, café, forest, ocean waves, clock) without annoying loop gaps.
- **Distraction Shield (Strict Mode):** Hides status bars and silences notifications with system Do Not Disturb so you can stay in your zone.

---

## 🎯 Key Features at a Glance

| Feature | What it does |
| :--- | :--- |
| ⏱ **Editorial Timer** | Bold, oversized minutes and seconds display. Tap to switch between standard view and full-screen focus mode. |
| 🌿 **Seamless Soundscapes** | Dual-player audio engine with smooth crossfades so you never hear sudden sound cuts or clicks when audio loops. |
| 📋 **Task & Project Flow** | Organize tasks by project (Work, Study, Personal), set estimated Pomodoro intervals, and check off subtasks with haptic feedback. |
| 📊 **Visual Progress** | Track your daily focus streaks and total hours using clean 7-day capsule charts and monthly heatmaps. |
| 🏝 **Live Floating Timer** | Interactive notification with pause, restart, and skip controls, compatible with Android 16+ Origin Island capsules. |

---

## 📥 How to Install on Your Android Phone (For Everyone)

You do **not** need to know any programming to use Focus on your device!

1. Go to the [Releases](https://github.com/MuhamadYazri/Focus/releases) page of this repository.
2. Download the latest **`app-release.apk`** file onto your Android phone.
3. Tap the downloaded file to install it.
   - *If prompted, allow your browser to "Install unknown apps" (this is standard for apps downloaded outside Google Play).*
4. Open **Focus** and enjoy distraction-free flow!

---

## 🛠 For Developers

If you want to build or modify the app yourself:

### Requirements
- **Android Studio:** Ladybug (2024.2+) or newer
- **Android SDK:** API 36 (Minimum SDK: 26, Target SDK: 35)
- **JDK:** 17+

### Quick Build Commands
```bash
# Clone the repository
git clone git@github.com:MuhamadYazri/Focus.git
cd Focus

# Build debug APK
./gradlew assembleDebug

# Build release APK (optimized with R8 shrinking)
./gradlew assembleRelease

# Install directly to connected device
./gradlew installDebug
```

---

## 🎨 Credits & Attributions

### 🔊 Ambient Soundscapes
Recorded and published by **Joseph SARDIN** on [BigSoundBank.com](https://bigsoundbank.com) under the **Creative Commons 0 (CC0 / Public Domain)** license:
- ⏱ **Clock**: [Stopwatch 2 (ID 2138)](https://bigsoundbank.com/stopwatch-2-s2138.html)
- ☕ **Café**: [Atmosphere bar 2 (ID 0481)](https://bigsoundbank.com/atmosphere-bar-2-s0481.html)
- 🌊 **Waves**: [Sea waves and seagulls (ID 0267)](https://bigsoundbank.com/sea-waves-and-seagulls-s0267.html)
- 🌧 **Rain**: [Rain and storm (ID 0124)](https://bigsoundbank.com/rain-and-storm-s0124.html)
- 🌲 **Forest**: [Forest (ID 0100)](https://bigsoundbank.com/forest-s0100.html)

*The session completion chime is synthesized directly in code using pure mathematical sine wave harmonics.*

### 🐱 Mascot Peek Animation
- **Cat Mascot ("Le Petit Chat Noir")**: Animated by **Tom Fabre** on [LottieFiles](https://lottiefiles.com) (Lottie Simple License). Used for the playful edge-peeking focus companion.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).  
Created with care by **[Muhamad Yazri](https://github.com/MuhamadYazri)**.
