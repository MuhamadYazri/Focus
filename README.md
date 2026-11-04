<p align="center">
  <img src="assets/icon.png" width="108" height="108" alt="Focus App Icon" style="border-radius: 26px;" />
</p>

<h1 align="center">Focus</h1>

<p align="center">
  <strong>A distraction-free, brutalist editorial Pomodoro timer & daily task companion for Android.</strong>
  <br />
  <em>Crafted with 100% Kotlin & Jetpack Compose. Zero ads. Zero tracking. 100% Offline.</em>
</p>

<p align="center">
  <a href="https://github.com/MuhamadYazri/Focus/releases"><img src="https://img.shields.io/badge/Release-v1.0.2-111111?style=for-the-badge&logo=android" alt="Release" /></a>
  <a href="https://kotlinlang.org"><img src="https://img.shields.io/badge/Kotlin-2.0.21-7F52FF?style=for-the-badge&logo=kotlin&logoColor=white" alt="Kotlin" /></a>
  <a href="https://developer.android.com/jetpack/compose"><img src="https://img.shields.io/badge/Jetpack_Compose-2024.10.01-4285F4?style=for-the-badge&logo=jetpackcompose&logoColor=white" alt="Compose" /></a>
  <a href="https://developer.android.com/about/dashboards"><img src="https://img.shields.io/badge/Android-8.0+_(API_26--36)-34A853?style=for-the-badge&logo=android" alt="Android API" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-E6E3DC?style=for-the-badge&labelColor=111111&color=52504C" alt="License" /></a>
</p>

---

## 💡 The Problem & The Philosophy

Most productivity and timer apps today are bloated with paywalls, invasive tracking, intrusive popups, and chaotic neon animations that disrupt the very focus they claim to protect.

**Focus** takes a fundamentally different path:
- **Paper & Ink Brutalism:** High-contrast editorial typography inspired by Swiss design and the Los Angeles clock specification.
- **Deep Flow, Zero Distractions:** No user accounts, no analytics, no external servers. Your data stays entirely in a fast, local SQLite database on your device.
- **Engineered for Fluidity:** Hardware-accelerated 120 FPS animations, sub-16ms touch responses, and seamless audio transitions that keep you anchored in deep work.

---

## ⚡ Key Highlights

### ⏱ Los Angeles Editorial Clock
- Oversized, tabular numerals rendered in **Clash Display** typography.
- Precision 30% horizontal bottom crop along boundary hairline dividers for an architectural, tactile poster layout.
- Apple-grade fluid spring morph between compact view and edge-to-edge Fullscreen Focus Mode.

### 🌿 Seamless Ambient Soundscapes
- Built with a specialized **dual-alternating audio engine** that applies mathematical sinusoidal crossfading between loops.
- Eliminates the audible gaps, popping noises, and buffer pauses typical of standard looping audio players.
- Includes 5 calming soundscapes: *Rain, Ocean Waves, Cozy Café, Forest, and Mechanical Clock*.

### 🛡 Distraction Shield (Strict Mode)
- One tap activates full distraction protection.
- Automatically hides status bars and switches system notifications into **Android Do Not Disturb (DND)** priority mode until your focus session ends.

### 🏝 Live Notification & Origin Island
- Background `mediaPlayback` foreground service keeps ticking reliably even when the app is swiped away.
- **Android 16+ (API 36 / Vivo OriginOS 6)**: renders as an interactive dynamic capsule pill (**Origin Island**) in your status bar with instant *Restart*, *Pause/Resume*, and *Skip* controls.

### 📋 Task & Habit Flow
- Plan your daily workload with custom project categories, priority indicators, and estimated Pomodoro counts.
- **Automatic Midnight Rollover**: Tasks and subtasks automatically reset and roll over on date transitions, keeping your list fresh every morning.

### 📊 Clean Analytics & Heatmaps
- Glanceable 7-day capsule charts with dynamic daily target indicators.
- Year-at-a-glance habit heatmaps with luminance-aware contrast, letting you celebrate streaks without visual clutter.

---

## 📥 Quick Download (For Everyone)

You do **not** need to be a programmer to use Focus!

1. Go to the [**Latest Releases**](https://github.com/MuhamadYazri/Focus/releases) page.
2. Download **`app-release.apk`** directly to your Android device.
3. Tap the file in your downloads to install it *(enable "Install from this source" if prompted by your browser)*.
4. Open **Focus** and enter your flow state!

---

## 🛠 Tech Stack & Architecture (For Engineers & Recruiters)

Built following modern Android application architecture recommendations, ensuring high testability, memory efficiency, and rapid rendering performance.

| Layer | Technologies Used | Architectural Role |
| :--- | :--- | :--- |
| **Language** | Kotlin 2.0.21 (JVM 17 Target) | Coroutines, Flow, Strict Null Safety, Lambdas |
| **UI Toolkit** | Jetpack Compose (BOM 2024.10.01) | Declarative UI, Shared Bounds Transitions, GraphicsLayers |
| **Design System** | Custom Brutalist "Paper & Ink" | Luminance-aware palettes, GPU-accelerated depth shaders |
| **State Management**| MVVM + Kotlin `StateFlow` | Unidirectional Data Flow, `collectAsStateWithLifecycle` |
| **Persistence** | Room SQLite v3 + DataStore Preferences | Sub-millisecond aggregation queries, composite indexing |
| **Audio Pipeline** | Dual-Stream `MediaPlayer` Ping-Pong | Sinusoidal overlapping crossfade, zero CPU buffer underruns |
| **System Services** | Foreground Service + MediaSession | Dynamic live notifications, Android 16+ Origin Island |
| **Optimization** | R8 Shrinking + AndroidX Baseline Profiles | Ahead-of-Time (AOT) DEX compilation, dead-code stripping |

<details>
<summary><strong>🔍 Click to view Performance Benchmarks & Code Shrinking Impact</strong></summary>

<br />

| Metric | Before Optimization | After R8 & Baseline Profiles | Improvement |
| :--- | :--- | :--- | :--- |
| **APK File Size** | 21.33 MB | **2.14 MB** | **-89.98%** |
| **Cold Start Latency** | 1260.8 ms | **352.6 ms** | **-72.03%** |
| **99th Percentile Frame Latency** | 61.0 ms | **28.0 ms** | **-54.10%** (Locked 120 FPS) |
| **Tab Switching Delay** | ~48 ms | **< 16 ms** (1 frame) | Pre-warmed GPU layer cache |

</details>

---

## 💻 Developer Setup & Local Build

### Prerequisites
- **Android Studio:** Ladybug (2024.2+) or newer
- **Java Development Kit (JDK):** Version 17+
- **Android SDK:** Platform API 36 (compileSdk: 36, minSdk: 26, targetSdk: 35)

### Build Commands

```bash
# 1. Clone the repository
git clone git@github.com:MuhamadYazri/Focus.git
cd Focus

# 2. Assemble Debug APK
./gradlew assembleDebug

# 3. Assemble Optimized Release APK (R8 minified)
./gradlew assembleRelease

# 4. Install directly to connected physical device or emulator
./gradlew installDebug
```

<details>
<summary><strong>📁 Click to view Repository File Tree</strong></summary>

```
Focus/
├── app/                              # Primary Android Application Module
│   ├── src/main/java/com/yazri/focus/
│   │   ├── data/
│   │   │   ├── local/               # Room Database, DAOs, Entities
│   │   │   ├── preferences/         # Jetpack DataStore preferences
│   │   │   └── repository/          # Repository data orchestrator
│   │   ├── service/                 # TimerEngine, ForegroundService, SoundEngine, Haptics
│   │   ├── ui/
│   │   │   ├── tasks/               # Task management & SwipeActionRow
│   │   │   ├── timer/               # 2-Tier Clash Display Clock & Fullscreen mode
│   │   │   ├── analytics/           # Capsule charts & Activity heatmaps
│   │   │   ├── profile/             # Preferences, categories & audio credits dialog
│   │   │   ├── navigation/          # 1:1 PagerSwipeController & macOS tactile dock
│   │   │   └── theme/               # Brutalist Color, Depth, Typography & Shapes
│   │   ├── FocusApp.kt              # Application-scoped dependency container
│   │   └── MainActivity.kt          # Single Activity root container
│   ├── src/main/res/                # Vectors, custom typography & raw audio loops
│   ├── build.gradle                 # Application build rules & R8 optimization
│   └── proguard-rules.pro           # ProGuard / R8 keep rules
├── baselineprofile/                  # AndroidX Baseline Profile generator module
├── gradle/                          # Gradle wrapper files
├── build.gradle                     # Top-level project Gradle configuration
├── settings.gradle                  # Subproject declarations (:app, :baselineprofile)
├── gradle.properties                # Build environment performance properties
└── README.md                        # Documentation
```

</details>

---

## 🎨 Credits & Attributions

We believe in honoring and supporting independent creators who make open-source software and open media possible:

### 🔊 Ambient Soundscapes
Recorded and published by **Joseph SARDIN** on [BigSoundBank.com](https://bigsoundbank.com) under the **Creative Commons 0 (CC0 / Public Domain)** license:
- ⏱ **Clock**: [Stopwatch 2 (ID 2138)](https://bigsoundbank.com/stopwatch-2-s2138.html)
- ☕ **Café**: [Atmosphere bar 2 (ID 0481)](https://bigsoundbank.com/atmosphere-bar-2-s0481.html)
- 🌊 **Waves**: [Sea waves and seagulls (ID 0267)](https://bigsoundbank.com/sea-waves-and-seagulls-s0267.html)
- 🌧 **Rain**: [Rain and storm (ID 0124)](https://bigsoundbank.com/rain-and-storm-s0124.html)
- 🌲 **Forest**: [Forest (ID 0100)](https://bigsoundbank.com/forest-s0100.html)

*The harmonic completion chime is synthesized directly in code via pure mathematical sine wave harmonics.*

### 🐱 Mascot Peek Animation
- **Cat Mascot ("Le Petit Chat Noir")**: Motion design by **Tom Fabre** on [LottieFiles](https://lottiefiles.com) (Lottie Simple License). Used for the playful edge-peeking focus companion.

---

## 🤝 Contributing

Contributions, feature suggestions, and feedback are always welcome!

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feat/amazing-feature`).
3. Commit your Changes (`git commit -m "feat: add amazing feature"`).
4. Push to the Branch (`git push origin feat/amazing-feature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

<p align="center">
  Crafted with care by <strong><a href="https://github.com/MuhamadYazri">Muhamad Yazri</a></strong>
</p>
