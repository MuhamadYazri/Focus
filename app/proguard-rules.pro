# Hide source file attributes
-renamesourcefileattribute SourceFile
-keepattributes SourceFile,LineNumberTable

# Keep Android entry points referenced in AndroidManifest
-keep public class com.yazri.focus.FocusApp { *; }
-keep public class com.yazri.focus.MainActivity { *; }
-keep public class com.yazri.focus.service.TimerForegroundService { *; }

# Room Database and SQLite
-keep class * extends androidx.room.RoomDatabase
-dontwarn androidx.room.paging.**
-keep class com.yazri.focus.data.local.entities.** { *; }
-keep interface com.yazri.focus.data.local.dao.** { *; }

# Lottie animation
-keep class com.airbnb.lottie.** { *; }

# MediaSession / Notification compat
-keep class androidx.media.** { *; }
