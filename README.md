# Focus — Native Android Pomodoro & Task Flow

A native Android application built with **Kotlin** and **Jetpack Compose**, featuring a brutalist Swiss-grid editorial aesthetic ("Paper & Ink"), smooth spring-physics interactions, audio soundscapes with seamless ping-pong crossfading, Vivo Origin Island / live timer notifications, Room persistence, and Strict Mode with system Do Not Disturb integration.

---

## 🛠 Tech Stack & Architecture

- **Language & Runtime:** Kotlin 2.0.21 on Java 17
- **UI Toolkit:** Jetpack Compose (Compose BOM `2024.10.01`), Material 3, Accompanist / Custom Spring Animations
- **Typography:** Clash Display, Panchang, Styro (custom vector paths), Orbitron
- **Architecture:** Clean MVVM + Repository Pattern
- **Persistence:** Room SQLite Database (`focus_native.db`, v3) + DataStore Preferences
- **Concurrency:** Kotlin Coroutines (`StateFlow`, `SharedFlow`, `immediate` dispatchers)
- **Audio Engine:** Dual-alternating `MediaPlayer` instances with mathematical sinusoidal crossfade for seamless looping
- **Optimization:** R8 Code Shrinking, Resource Pruning, AndroidX Baseline Profiles (`:baselineprofile`)

---

## 🚀 Building & Running

### Prerequisites
- Android Studio Ladybug (2024.2+) or newer
- Android SDK 36 (compileSdk 36, targetSdk 35, minSdk 26)
- JDK 17+

### Command Line
```bash
# Debug build
./gradlew assembleDebug

# Release build (minified & shrunk)
./gradlew assembleRelease

# Install directly to connected device / emulator
./gradlew installDebug
```

---

## 📁 Repository Structure

```
.
├── app/
│   ├── src/main/java/com/yazri/focus/
│   │   ├── data/           # Room DB, DAOs, Entities, DataStore, Repository
│   │   ├── service/        # TimerEngine, ForegroundService, SoundEngine, Haptics
│   │   ├── ui/             # Compose Screens (Tasks, Timer, Reports, Profile, Nav)
│   │   ├── FocusApp.kt     # Application class
│   │   └── MainActivity.kt # Single Activity entry point
│   ├── src/main/res/       # Fonts, vectors, layout, drawables, raw audio
│   └── build.gradle        # App module Gradle configuration
├── baselineprofile/        # AndroidX Baseline Profile generator module
├── gradle/                 # Gradle wrapper
├── build.gradle            # Root Gradle configuration
├── settings.gradle         # Project settings (:app, :baselineprofile)
└── gradle.properties       # JVM args and compiler flags
```

---

## 📄 License
MIT License. Created by [Muhamad Yazri](https://github.com/MuhamadYazri).
