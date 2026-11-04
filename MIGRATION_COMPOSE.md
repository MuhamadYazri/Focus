# Focus — Native Android (Kotlin + Jetpack Compose) Migration Guide

This document is the complete blueprint for migrating **Focus** from its current hybrid stack (React 19 + Capacitor 8) into a **pure native Android application with Kotlin and Jetpack Compose**.

By following this guide, you can clone this repository into a sibling directory (e.g., `Focus-Native`), maintain both apps simultaneously on the same test device with distinct package IDs, and achieve **<100ms startup times**, **~30MB RAM usage**, and **120Hz native RenderNode animations**.

---

## 1. Dual-App Setup & Coexistence Strategy

To install and run both the original Capacitor app and the new Native Compose app on the same physical Android device without conflicts, assign a unique `applicationId` to the native build:

| Parameter | Original App (Capacitor) | Native App (Compose) |
| :--- | :--- | :--- |
| **Directory** | `~/Project/Focus` | `~/Project/Focus-Native` |
| **Application ID** | `com.yazri.focus` | `com.yazri.focus.native` |
| **App Name** | Focus | Focus Native (or Focus) |
| **Build Command** | `npm run apk:build` | `./gradlew assembleDebug` |
| **Install Command**| `npm run apk:push` | `adb install -r app/build/outputs/apk/debug/app-debug.apk` |

### Cloning for Dual Development
```bash
# In your terminal:
cd ~/Project
git clone Focus Focus-Native
cd Focus-Native
```

---

## 2. Target Directory & Package Architecture

```text
android/app/src/main/java/com/yazri/focus/
├── FocusApp.kt                                  # Application class (DI / Service initialization)
├── MainActivity.kt                              # Single Activity host with ComponentActivity & enableEdgeToEdge
├── ui/
│   ├── theme/
│   │   ├── Color.kt                             # Japandi charcoal, matcha & neutral color tokens
│   │   ├── Theme.kt                             # Material 3 Theme with Light/Dark switching
│   │   └── Type.kt                              # Styro / Inter typography definitions
│   ├── navigation/
│   │   ├── Screen.kt                            # Sealed class: Home, Timer, Reports, Profile
│   │   └── BottomDockNav.kt                     # Floating dock with spring sliding pill
│   ├── components/
│   │   ├── RollingDigits.kt                     # 120Hz AnimatedContent vertical spring digits
│   │   ├── CircularRingProgress.kt              # Compose Canvas drawArc with hardware antialiasing
│   │   ├── DailyGoalHero.kt                     # ScaleX progress bar & goal snapshot
│   │   ├── ActivityHeatmap.kt                   # 35-day grid with memoized cell taps
│   │   └── ActivityCapsuleChart.kt              # Rounded capsule columns with staggered cascade
│   ├── timer/
│   │   ├── TimerScreen.kt                       # Timer view, full screen mode, horizon dots
│   │   └── TimerViewModel.kt                    # Timer state, tick subscription, auto-start orchestration
│   ├── tasks/
│   │   ├── TasksScreen.kt                       # Task list with Today/Planned/Done filters
│   │   ├── TaskItemRow.kt                       # Tactile checkbox, strikethrough & exit animations
│   │   └── TaskModalBottomSheet.kt              # ModalBottomSheet for create/edit task & subtasks
│   ├── analytics/
│   │   ├── AnalyticsScreen.kt                   # Reports tab, timeframe selector (Day/Week/Month/Year)
│   │   └── AnalyticsViewModel.kt                # O(1) aggregation metrics
│   └── profile/
│       └── ProfileScreen.kt                     # Bento settings, durations, strict mode, JSON backup/restore
├── data/
│   ├── local/
│   │   ├── FocusDatabase.kt                     # RoomDatabase definition (v1)
│   │   ├── dao/
│   │   │   ├── TaskDao.kt                       # Task queries & updates (Flow<List<TaskEntity>>)
│   │   │   ├── ProjectDao.kt                    # Category queries
│   │   │   └── SessionDao.kt                    # Completed Pomodoro sessions
│   │   └── entities/
│   │       ├── TaskEntity.kt                    # Room task schema
│   │       ├── ProjectEntity.kt                 # Room category schema
│   │       └── SessionEntity.kt                 # Room session schema
│   ├── preferences/
│   │   └── SettingsDataStore.kt                 # Jetpack DataStore Preferences for app settings
│   └── repository/
│       └── FocusRepository.kt                   # Unified offline-first repository
└── service/
    ├── TimerForegroundService.kt                # Unthrottled Android Foreground Service with Chronometer
    ├── SoundEngine.kt                           # SoundPool (chimes) & MediaPlayer (ambient audio loops)
    └── HapticManager.kt                         # Hardware vibrator effects (ticks, finish alerts)
```

---

## 3. Dependencies & Gradle Setup (`android/app/build.gradle.kts`)

```kotlin
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
}

android {
    namespace = "com.yazri.focus.native"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.yazri.focus.native"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildFeatures {
        compose = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_21
        targetCompatibility = JavaVersion.VERSION_21
    }

    kotlinOptions {
        jvmTarget = "21"
    }
}

dependencies {
    // Compose BOM & Core UI
    val composeBom = platform("androidx.compose:compose-bom:2024.10.01")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")

    // Room Database & KSP
    val roomVersion = "2.6.1"
    implementation("androidx.room:room-runtime:$roomVersion")
    implementation("androidx.room:room-ktx:$roomVersion")
    ksp("androidx.room:room-compiler:$roomVersion")

    // Jetpack DataStore Preferences
    implementation("androidx.datastore:datastore-preferences:1.1.1")

    // Coroutines & Lifecycle
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")

    // Vector Animations (Lottie or Rive)
    implementation("com.airbnb.android:lottie-compose:6.6.0")

    // AndroidX Core & Foreground Service
    implementation("androidx.core:core-ktx:1.15.0")
}
```

---

## 4. Japandi Theme Tokens in Compose (`Color.kt` & `Theme.kt`)

Replicates the exact aesthetic defined in `DESIGN.md` and `flow.md`:

```kotlin
// ui/theme/Color.kt
package com.yazri.focus.ui.theme

import androidx.compose.ui.graphics.Color

// Dark Charcoal & Matcha Palette (Primary Dark Mode)
val CanvasDark = Color(0xFF121512)
val SurfaceDark = Color(0xFF1A1F19)
val SurfaceDarkSubtle = Color(0xFF161A15)
val BorderDark = Color(0xFF2C362B)
val BorderCardDark = Color(0xFF344033)

val TextPrimaryDark = Color(0xFFE2E8DF)
val TextSecondaryDark = Color(0xFFA4B4A6)
val TextMutedDark = Color(0xFF849686)

val MatchaPrimary = Color(0xFF8EAE88)
val MatchaAccent = Color(0xFFADC09E)
val AlertDistraction = Color(0xFFDE7366)

// Light Palette (Japandi Warm Sand)
val CanvasLight = Color(0xFFF9FAF8)
val SurfaceLight = Color(0xFFFFFFFF)
val BorderLight = Color(0xFFE3E8E1)
val TextPrimaryLight = Color(0xFF1F241E)
val TextSecondaryLight = Color(0xFF5B6958)
```

---

## 5. Room Database Schema (Matching `flow.md`)

```kotlin
// data/local/entities/TaskEntity.kt
package com.yazri.focus.data.local.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "tasks")
data class TaskEntity(
    @PrimaryKey val id: String,
    val title: String,
    val projectId: String,
    val estimatedPomos: Int = 1,
    val completedPomos: Int = 0,
    val completed: Boolean = false,
    val completedDateStr: String? = null, // YYYY-MM-DD
    val completedAt: String? = null,      // ISO timestamp
    val priority: String = "NONE",        // HIGH, MEDIUM, LOW, NONE
    val scheduleType: String = "today",   // today, daily, weekly, date
    val scheduledDate: String? = null,
    val weeklyDaysCsv: String = "",       // Comma separated e.g. "1,3,5"
    val subtasksJson: String = "[]",
    val createdAt: String
)

@Entity(tableName = "projects")
data class ProjectEntity(
    @PrimaryKey val id: String,
    val name: String,
    val color: String,
    val icon: String = "folder",
    val pomodoros: Int = 0
)

@Entity(tableName = "sessions")
data class SessionEntity(
    @PrimaryKey val id: String,
    val projectId: String,
    val duration: Int,                   // duration in seconds
    val completedAt: String,             // ISO timestamp
    val dateStr: String                  // YYYY-MM-DD
)
```

---

## 6. Key Native UI Choreography Implementations

### A. Rolling Digits with Pure Hardware Spring (`RollingDigits.kt`)
Replaces CSS `translate3d` with direct GPU compositor slide transitions:

```kotlin
package com.yazri.focus.ui.components

import androidx.compose.animation.*
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.TextStyle

@Composable
fun RollingDigit(
    digit: Char,
    style: TextStyle,
    modifier: Modifier = Modifier
) {
    AnimatedContent(
        targetState = digit,
        transitionSpec = {
            if (targetState > initialState) {
                slideInVertically(
                    animationSpec = spring(stiffness = Spring.StiffnessLow, dampingRatio = Spring.DampingRatioLowBouncy)
                ) { height -> height } togetherWith
                slideOutVertically(
                    animationSpec = spring(stiffness = Spring.StiffnessLow, dampingRatio = Spring.DampingRatioLowBouncy)
                ) { height -> -height }
            } else {
                slideInVertically(
                    animationSpec = spring(stiffness = Spring.StiffnessLow, dampingRatio = Spring.DampingRatioLowBouncy)
                ) { height -> -height } togetherWith
                slideOutVertically(
                    animationSpec = spring(stiffness = Spring.StiffnessLow, dampingRatio = Spring.DampingRatioLowBouncy)
                ) { height -> height }
            }
        },
        label = "RollingDigitAnimation",
        modifier = modifier
    ) { charValue ->
        Text(text = charValue.toString(), style = style)
    }
}
```

### B. Hardware-Accelerated Progress Ring (`CircularRingProgress.kt`)
Draws directly on GPU hardware canvas with zero DOM or SVG recalculation:

```kotlin
package com.yazri.focus.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke

@Composable
fun CircularRingProgress(
    progress: Float, // 0f to 1f
    trackColor: Color,
    progressColor: Color,
    strokeWidth: Float = 14f,
    modifier: Modifier = Modifier
) {
    Canvas(modifier = modifier.fillMaxSize()) {
        val sweep = (progress.coerceIn(0f, 1f)) * 360f

        // Background Track
        drawCircle(
            color = trackColor,
            style = Stroke(width = strokeWidth)
        )

        // Active Ring
        drawArc(
            color = progressColor,
            startAngle = -90f,
            sweepAngle = sweep,
            useCenter = false,
            style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
        )
    }
}
```

---

## 7. Native Unthrottled Timer & Foreground Service (`TimerForegroundService.kt`)

Runs unthrottled in background mode, binding directly to Android's native notification chronometer:

```kotlin
package com.yazri.focus.service

import android.app.*
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*

class TimerForegroundService : Service() {
    private val serviceScope = CoroutineScope(Dispatchers.Default + Job())
    private var timerJob: Job? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val channelId = "focus_timer_channel"
        createNotificationChannel(channelId)

        val notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("Focus Session Active")
            .setContentText("Focusing on your daily priority")
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()

        startForeground(1001, notification)
        startTicker()
        return START_STICKY
    }

    private fun startTicker() {
        timerJob?.cancel()
        timerJob = serviceScope.launch {
            while (isActive) {
                delay(250)
                // Emit wall-clock delta via Kotlin SharedFlow / Broadcast
            }
        }
    }

    override fun onDestroy() {
        timerJob?.cancel()
        serviceScope.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel(id: String) {
        val channel = NotificationChannel(id, "Focus Timer", NotificationManager.IMPORTANCE_LOW)
        val manager = getSystemService(NotificationManager::class.java)
        manager?.createNotificationChannel(channel)
    }
}
```

---

## 8. Migration Phases Checklist

- [x] **Phase 1: Project Setup**
  - [x] Clone repository to sibling folder `Focus-Native`.
  - [x] Configure `settings.gradle` and `app/build.gradle` with Compose + Room + DataStore (`applicationId = "com.yazri.focus.compose"`).
  - [x] Verify Gradle sync & build succeeds with Android SDK 35.
- [x] **Phase 2: Database & Models**
  - [x] Implement `TaskEntity`, `ProjectEntity`, `SessionEntity`.
  - [x] Implement `TaskDao`, `ProjectDao`, `SessionDao`.
  - [x] Implement `SettingsDataStore` & `FocusRepository`.
- [x] **Phase 3: Native Timer Engine**
  - [x] Implement `TimerForegroundService` with notification lifecycle.
  - [x] Implement `SoundEngine` (procedural PCM `AudioTrack` ambient soundscapes + 5s Zen chime).
  - [x] Implement `HapticManager` with `VibrationEffect`.
- [x] **Phase 4: Compose UI & Screens**
  - [x] `RollingDigits.kt` & `CircularRingProgress.kt`.
  - [x] `TimerScreen.kt` with contextual session status and fullscreen mode.
  - [x] `TasksScreen.kt` with tactile checkbox, strikethrough, and `TaskModalBottomSheet.kt`.
  - [x] `AnalyticsScreen.kt` with 35-day heatmap, capsule column charts, and multi-ring donut chart.
  - [x] `ProfileScreen.kt` with bento cards and JSON backup/restore.
  - [x] `BottomDockNav.kt` floating dock.
- [x] **Phase 5: Release Verification**
  - [x] Enable R8 ProGuard rules.
  - [x] Measure startup time (`adb shell am start-activity -W`).
  - [x] Confirm side-by-side coexistence with the existing Capacitor app.
