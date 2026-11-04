package com.yazri.focus.data.preferences

import androidx.compose.runtime.Immutable
import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import org.json.JSONObject
import java.time.LocalDate

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "focus_settings")

@Immutable
data class AppSettings(
    val workDuration: Int = 25,
    val shortBreakDuration: Int = 5,
    val longBreakDuration: Int = 15,
    val longBreakInterval: Int = 4,
    val autoStartBreaks: Boolean = true,
    val autoStartPomodoros: Boolean = false,
    val soundscape: String = "rain", // none, rain, forest, waves, cafe, clock
    val soundVolume: Float = 0.6f,
    val strictMode: Boolean = false,
    val keepAwake: Boolean = true,
    val dailyGoalHours: Float = 4.0f,
    val liveNotification: Boolean = true,
    val seeded: Boolean = false,
    val dailyGoalsHistoryJson: String = "{}",
    val themeMode: String = "system" // system, light, dark
) {
    private val parsedGoalsMap: Map<String, Float> by lazy {
        try {
            val obj = JSONObject(dailyGoalsHistoryJson)
            val map = HashMap<String, Float>(obj.length())
            val keys = obj.keys()
            while (keys.hasNext()) {
                val k = keys.next()
                map[k] = obj.optDouble(k, dailyGoalHours.toDouble()).toFloat()
            }
            map
        } catch (_: Exception) {
            emptyMap()
        }
    }

    fun getDailyGoalForDate(dateStr: String): Float {
        return parsedGoalsMap[dateStr] ?: dailyGoalHours
    }
}

class SettingsDataStore(private val context: Context) {
    private object Keys {
        val WORK_DURATION = intPreferencesKey("work_duration")
        val SHORT_BREAK_DURATION = intPreferencesKey("short_break_duration")
        val LONG_BREAK_DURATION = intPreferencesKey("long_break_duration")
        val LONG_BREAK_INTERVAL = intPreferencesKey("long_break_interval")
        val AUTO_START_BREAKS = booleanPreferencesKey("auto_start_breaks")
        val AUTO_START_POMODOROS = booleanPreferencesKey("auto_start_pomodoros")
        val SOUNDSCAPE = stringPreferencesKey("soundscape")
        val SOUND_VOLUME = floatPreferencesKey("sound_volume")
        val STRICT_MODE = booleanPreferencesKey("strict_mode")
        val KEEP_AWAKE = booleanPreferencesKey("keep_awake")
        val DAILY_GOAL_HOURS = floatPreferencesKey("daily_goal_hours")
        val LIVE_NOTIFICATION = booleanPreferencesKey("live_notification")
        val SEEDED = booleanPreferencesKey("seeded")
        val DAILY_GOALS_HISTORY = stringPreferencesKey("daily_goals_history")
        val THEME_MODE = stringPreferencesKey("theme_mode")
        val LAST_ROLLOVER_DATE = stringPreferencesKey("last_rollover_date")
    }

    val settingsFlow: Flow<AppSettings> = context.dataStore.data.map { prefs ->
        AppSettings(
            workDuration = prefs[Keys.WORK_DURATION] ?: 25,
            shortBreakDuration = prefs[Keys.SHORT_BREAK_DURATION] ?: 5,
            longBreakDuration = prefs[Keys.LONG_BREAK_DURATION] ?: 15,
            longBreakInterval = prefs[Keys.LONG_BREAK_INTERVAL] ?: 4,
            autoStartBreaks = prefs[Keys.AUTO_START_BREAKS] ?: true,
            autoStartPomodoros = prefs[Keys.AUTO_START_POMODOROS] ?: false,
            soundscape = prefs[Keys.SOUNDSCAPE] ?: "rain",
            soundVolume = prefs[Keys.SOUND_VOLUME] ?: 0.6f,
            strictMode = prefs[Keys.STRICT_MODE] ?: false,
            keepAwake = prefs[Keys.KEEP_AWAKE] ?: true,
            dailyGoalHours = prefs[Keys.DAILY_GOAL_HOURS] ?: 4.0f,
            liveNotification = prefs[Keys.LIVE_NOTIFICATION] ?: true,
            seeded = prefs[Keys.SEEDED] ?: false,
            dailyGoalsHistoryJson = prefs[Keys.DAILY_GOALS_HISTORY] ?: "{}",
            themeMode = prefs[Keys.THEME_MODE] ?: "system"
        )
    }

    suspend fun getSettingsOnce(): AppSettings = settingsFlow.first()

    suspend fun updateSettings(transform: (AppSettings) -> AppSettings) {
        val current = getSettingsOnce()
        val updated = transform(current)
        saveSettings(updated)
    }

    suspend fun saveSettings(settings: AppSettings) {
        val todayStr = LocalDate.now().toString()
        val updatedHist = try {
            val obj = JSONObject(settings.dailyGoalsHistoryJson)
            obj.put(todayStr, settings.dailyGoalHours.toDouble())
            obj.toString()
        } catch (_: Exception) {
            "{\"$todayStr\":${settings.dailyGoalHours}}"
        }

        setCachedThemeMode(context, settings.themeMode)
        context.dataStore.edit { prefs ->
            prefs[Keys.WORK_DURATION] = settings.workDuration
            prefs[Keys.SHORT_BREAK_DURATION] = settings.shortBreakDuration
            prefs[Keys.LONG_BREAK_DURATION] = settings.longBreakDuration
            prefs[Keys.LONG_BREAK_INTERVAL] = settings.longBreakInterval
            prefs[Keys.AUTO_START_BREAKS] = settings.autoStartBreaks
            prefs[Keys.AUTO_START_POMODOROS] = settings.autoStartPomodoros
            prefs[Keys.SOUNDSCAPE] = settings.soundscape
            prefs[Keys.SOUND_VOLUME] = settings.soundVolume
            prefs[Keys.STRICT_MODE] = settings.strictMode
            prefs[Keys.KEEP_AWAKE] = settings.keepAwake
            prefs[Keys.DAILY_GOAL_HOURS] = settings.dailyGoalHours
            prefs[Keys.LIVE_NOTIFICATION] = settings.liveNotification
            prefs[Keys.SEEDED] = true
            prefs[Keys.DAILY_GOALS_HISTORY] = updatedHist
            prefs[Keys.THEME_MODE] = settings.themeMode
        }
    }

    suspend fun getLastRolloverDate(): String? {
        return context.dataStore.data.first()[Keys.LAST_ROLLOVER_DATE]
    }

    suspend fun setLastRolloverDate(dateStr: String) {
        context.dataStore.edit { prefs ->
            prefs[Keys.LAST_ROLLOVER_DATE] = dateStr
        }
    }

    suspend fun markSeeded() {
        val todayStr = LocalDate.now().toString()
        context.dataStore.edit { prefs ->
            prefs[Keys.SEEDED] = true
            prefs[Keys.LAST_ROLLOVER_DATE] = todayStr
        }
    }

    companion object {
        private const val PREFS_THEME_CACHE = "focus_theme_cache"
        private const val KEY_THEME_MODE = "theme_mode"

        fun getCachedThemeMode(context: Context): String {
            return context.getSharedPreferences(PREFS_THEME_CACHE, Context.MODE_PRIVATE)
                .getString(KEY_THEME_MODE, "system") ?: "system"
        }

        fun setCachedThemeMode(context: Context, themeMode: String) {
            context.getSharedPreferences(PREFS_THEME_CACHE, Context.MODE_PRIVATE)
                .edit()
                .putString(KEY_THEME_MODE, themeMode)
                .apply()
        }
    }
}
