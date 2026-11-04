package com.yazri.focus.service

import android.content.Context
import android.os.PowerManager
import com.yazri.focus.data.local.entities.SessionEntity
import com.yazri.focus.data.local.entities.TaskEntity
import com.yazri.focus.data.preferences.AppSettings
import com.yazri.focus.data.repository.FocusRepository
import com.yazri.focus.ui.timer.CelebrationItem
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import java.time.Instant
import java.time.LocalDate
import java.util.Locale
import kotlin.math.roundToInt

/**
 * Application-scoped background countdown engine that survives Activity destruction
 * and Recent Apps task dismissal.
 */
class TimerEngine(
    private val appContext: Context,
    private val repository: FocusRepository,
    private val soundEngine: SoundEngine,
    private val hapticManager: HapticManager
) {
    private val engineScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private val prefs = appContext.getSharedPreferences("focus_timer_engine_state", Context.MODE_PRIVATE)

    private val powerManager = appContext.getSystemService(Context.POWER_SERVICE) as? PowerManager
    private var wakeLock: PowerManager.WakeLock? = null

    val settings: StateFlow<AppSettings> = repository.settingsFlow
        .stateIn(engineScope, SharingStarted.Eagerly, AppSettings())

    val projects = repository.projectsFlow
        .stateIn(engineScope, SharingStarted.Eagerly, emptyList())

    private val _timerMode = MutableStateFlow("work") // "work", "shortBreak", "longBreak"
    val timerMode: StateFlow<String> = _timerMode.asStateFlow()

    private val _timeLeft = MutableStateFlow(25 * 60)
    val timeLeft: StateFlow<Int> = _timeLeft.asStateFlow()

    private val _isRunning = MutableStateFlow(false)
    val isRunning: StateFlow<Boolean> = _isRunning.asStateFlow()

    private val _cycleCount = MutableStateFlow(0)
    val cycleCount: StateFlow<Int> = _cycleCount.asStateFlow()

    private val _activeTask = MutableStateFlow<TaskEntity?>(null)
    val activeTask: StateFlow<TaskEntity?> = _activeTask.asStateFlow()

    private val _isNavHidden = MutableStateFlow(false)
    val isNavHidden: StateFlow<Boolean> = _isNavHidden.asStateFlow()

    private val _strictModalOpen = MutableStateFlow(false)
    val strictModalOpen: StateFlow<Boolean> = _strictModalOpen.asStateFlow()

    private val _celebrations = MutableStateFlow<List<CelebrationItem>>(emptyList())
    val celebrations: StateFlow<List<CelebrationItem>> = _celebrations.asStateFlow()

    private var tickerJob: Job? = null
    private var lastTickWallMs: Long = 0L
    private var notificationSessionActive: Boolean = false

    private var prevWorkDur = 25
    private var prevShortDur = 5
    private var prevLongDur = 15

    init {
        restoreState()

        // Listen for Origin Island / Notification action buttons (Restart, Pause/Resume, Skip)
        engineScope.launch {
            TimerForegroundService.remoteActions.collect { action ->
                when (action) {
                    TimerForegroundService.REMOTE_ACTION_RESTART -> resetTimer(fromNotification = true)
                    TimerForegroundService.REMOTE_ACTION_TOGGLE_PLAY -> togglePlay(null)
                    TimerForegroundService.REMOTE_ACTION_SKIP -> skipSession(fromNotification = true)
                }
            }
        }

        // Sync duration changes when timer is not running
        engineScope.launch {
            settings.collect { s ->
                val durChanged = s.workDuration != prevWorkDur ||
                    s.shortBreakDuration != prevShortDur ||
                    s.longBreakDuration != prevLongDur
                if (!_isRunning.value && durChanged) {
                    _timeLeft.value = when (_timerMode.value) {
                        "work" -> s.workDuration * 60
                        "shortBreak" -> s.shortBreakDuration * 60
                        else -> s.longBreakDuration * 60
                    }
                    if (notificationSessionActive) {
                        syncForegroundNotification(forceKeep = true)
                    }
                }
                prevWorkDur = s.workDuration
                prevShortDur = s.shortBreakDuration
                prevLongDur = s.longBreakDuration
            }
        }

        // Sync active task with changes from Room database (e.g. daily rollover, edits)
        engineScope.launch {
            repository.tasksFlow.collect { taskList ->
                val curId = _activeTask.value?.id ?: prefs.getString("active_task_id", null)
                if (curId != null) {
                    val fresh = taskList.find { it.id == curId }
                    if (fresh != null && fresh != _activeTask.value) {
                        _activeTask.value = fresh
                    }
                }
            }
        }
    }

    private fun acquireWakeLock() {
        try {
            if (wakeLock == null) {
                wakeLock = powerManager?.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Focus::TimerEngineWakeLock")
            }
            if (wakeLock?.isHeld == false) {
                wakeLock?.acquire(3 * 60 * 60 * 1000L) // 3-hour fail-safe
            }
        } catch (_: Exception) {}
    }

    private fun releaseWakeLock() {
        try {
            if (wakeLock?.isHeld == true) {
                wakeLock?.release()
            }
        } catch (_: Exception) {}
    }

    private fun persistState() {
        val targetEndWallMs = if (_isRunning.value) System.currentTimeMillis() + _timeLeft.value * 1000L else 0L
        prefs.edit()
            .putBoolean("is_running", _isRunning.value)
            .putLong("target_end_wall_ms", targetEndWallMs)
            .putInt("time_left", _timeLeft.value)
            .putString("timer_mode", _timerMode.value)
            .putInt("cycle_count", _cycleCount.value)
            .putString("active_task_id", _activeTask.value?.id)
            .putBoolean("notification_session_active", notificationSessionActive)
            .apply()
    }

    private fun restoreState() {
        val wasRunning = prefs.getBoolean("is_running", false)
        val savedMode = prefs.getString("timer_mode", "work") ?: "work"
        val savedCycles = prefs.getInt("cycle_count", 0)
        val targetEndWallMs = prefs.getLong("target_end_wall_ms", 0L)
        val savedTimeLeft = prefs.getInt("time_left", 25 * 60)
        notificationSessionActive = prefs.getBoolean("notification_session_active", false)

        _timerMode.value = savedMode
        _cycleCount.value = savedCycles

        if (wasRunning && targetEndWallMs > 0L) {
            val now = System.currentTimeMillis()
            val remainingSecs = ((targetEndWallMs - now) / 1000L).toInt()
            if (remainingSecs > 0) {
                _timeLeft.value = remainingSecs
                _isRunning.value = true
                _isNavHidden.value = true
                startTicker()
                syncForegroundNotification(forceKeep = true)
            } else {
                // Completed while process was dead
                val elapsedOverdue = (-remainingSecs).coerceAtLeast(1)
                _timeLeft.value = 0
                _isRunning.value = true
                advanceTime(savedTimeLeft + elapsedOverdue)
            }
        } else {
            _timeLeft.value = savedTimeLeft
            _isRunning.value = false
        }
    }

    fun getTotalTimeForMode(mode: String = _timerMode.value): Int {
        val s = settings.value
        return when (mode) {
            "work" -> s.workDuration * 60
            "shortBreak" -> s.shortBreakDuration * 60
            "longBreak" -> s.longBreakDuration * 60
            else -> 25 * 60
        }
    }

    fun selectMode(mode: String) {
        if (!_isRunning.value) {
            _isNavHidden.value = false
            soundEngine.stop()
            _timerMode.value = mode
            _timeLeft.value = getTotalTimeForMode(mode)
            persistState()
            if (notificationSessionActive) {
                syncForegroundNotification(forceKeep = true)
            }
        }
    }

    fun toggleNavHidden() {
        _isNavHidden.value = !_isNavHidden.value
    }

    fun setActiveTask(task: TaskEntity?) {
        _activeTask.value = task
        persistState()
    }

    fun onTaskUpdated(task: TaskEntity) {
        if (_activeTask.value?.id == task.id) {
            _activeTask.value = task
            persistState()
        }
    }

    fun onTaskDeleted(taskId: String) {
        if (_activeTask.value?.id == taskId) {
            _activeTask.value = null
            persistState()
        }
    }

    fun resetAll() {
        resetTimer()
        _activeTask.value = null
        _cycleCount.value = 0
        persistState()
    }

    fun startPomodoroForTask(task: TaskEntity) {
        val curActive = _activeTask.value
        val curRunning = _isRunning.value
        val curMode = _timerMode.value

        if (curActive != null && curActive.id == task.id && curRunning) {
            togglePlay("work")
            return
        }

        if (curActive != null && curActive.id == task.id && !curRunning) {
            if (curMode != "work") {
                _timerMode.value = "work"
                _timeLeft.value = getTotalTimeForMode("work")
            }
            return
        }

        if (curRunning && curMode == "work") {
            val elapsedSecs = (settings.value.workDuration * 60 - _timeLeft.value).coerceAtLeast(0)
            saveFocusProgress(elapsedSecs)
        }

        _activeTask.value = task
        _timerMode.value = "work"
        _timeLeft.value = getTotalTimeForMode("work")
        persistState()
    }

    fun togglePlay(targetMode: String? = null) {
        val curMode = _timerMode.value
        val curRunning = _isRunning.value
        val curSettings = settings.value
        val effectiveMode = targetMode ?: curMode

        // Switching to a different mode while running
        if (curRunning && targetMode != null && targetMode != curMode) {
            if (curMode == "work") {
                val elapsedSecs = (curSettings.workDuration * 60 - _timeLeft.value).coerceAtLeast(0)
                saveFocusProgress(elapsedSecs)
                _cycleCount.value += 1
            }
            _timerMode.value = effectiveMode
            _timeLeft.value = getTotalTimeForMode(effectiveMode)
            _isRunning.value = true
            _isNavHidden.value = true
            notificationSessionActive = true
            persistState()
            startTicker()
            if (curSettings.soundscape != "none") {
                soundEngine.play(curSettings.soundscape, curSettings.soundVolume)
            }
            syncForegroundNotification(forceKeep = true)
            return
        }

        val nextRunning = !curRunning
        _isRunning.value = nextRunning
        _isNavHidden.value = nextRunning
        notificationSessionActive = true

        persistState()

        if (nextRunning) {
            startTicker()
            if (curSettings.soundscape != "none") {
                soundEngine.play(curSettings.soundscape, curSettings.soundVolume)
            }
            syncForegroundNotification(forceKeep = true)
        } else {
            stopTicker()
            soundEngine.stop()
            syncForegroundNotification(forceKeep = true)
        }
    }

    fun resetTimer(fromNotification: Boolean = false) {
        _isRunning.value = false
        _isNavHidden.value = false
        stopTicker()
        soundEngine.stop()
        _timeLeft.value = getTotalTimeForMode(_timerMode.value)
        persistState()

        if (fromNotification && notificationSessionActive) {
            syncForegroundNotification(forceKeep = true)
        } else {
            notificationSessionActive = false
            TimerForegroundService.stop(appContext)
        }
    }

    fun skipSession(fromNotification: Boolean = false) {
        soundEngine.stop()
        val curMode = _timerMode.value
        val curSettings = settings.value

        if (curMode == "work") {
            val elapsedSecs = (curSettings.workDuration * 60 - _timeLeft.value).coerceAtLeast(0)
            saveFocusProgress(elapsedSecs)

            val nextCycle = _cycleCount.value + 1
            _cycleCount.value = nextCycle
            val isLong = nextCycle % curSettings.longBreakInterval.coerceAtLeast(1) == 0
            val nextMode = if (isLong) "longBreak" else "shortBreak"
            val nextDuration = getTotalTimeForMode(nextMode)

            _timerMode.value = nextMode
            _timeLeft.value = nextDuration
            val shouldAuto = curSettings.autoStartBreaks
            _isRunning.value = shouldAuto
            _isNavHidden.value = shouldAuto
            persistState()

            if (shouldAuto) {
                notificationSessionActive = true
                startTicker()
                syncForegroundNotification(forceKeep = true)
            } else {
                stopTicker()
                if (fromNotification || notificationSessionActive) {
                    syncForegroundNotification(forceKeep = true)
                } else {
                    TimerForegroundService.stop(appContext)
                }
            }
        } else {
            _timerMode.value = "work"
            val nextDuration = getTotalTimeForMode("work")
            _timeLeft.value = nextDuration
            val shouldAuto = curSettings.autoStartPomodoros
            _isRunning.value = shouldAuto
            _isNavHidden.value = shouldAuto
            persistState()

            if (shouldAuto) {
                notificationSessionActive = true
                startTicker()
                syncForegroundNotification(forceKeep = true)
            } else {
                stopTicker()
                if (fromNotification || notificationSessionActive) {
                    syncForegroundNotification(forceKeep = true)
                } else {
                    TimerForegroundService.stop(appContext)
                }
            }
        }
    }

    private fun startTicker() {
        tickerJob?.cancel()
        acquireWakeLock()
        lastTickWallMs = System.currentTimeMillis()
        tickerJob = engineScope.launch {
            while (isActive && _isRunning.value) {
                delay(250L)
                val now = System.currentTimeMillis()
                val deltaSecs = ((now - lastTickWallMs) / 1000L).toInt()
                if (deltaSecs >= 1) {
                    lastTickWallMs += deltaSecs * 1000L
                    advanceTime(deltaSecs)
                }
            }
        }
    }

    private fun stopTicker() {
        tickerJob?.cancel()
        tickerJob = null
        releaseWakeLock()
    }

    fun syncOnResume() {
        if (_isRunning.value && lastTickWallMs > 0L) {
            val now = System.currentTimeMillis()
            val deltaSecs = ((now - lastTickWallMs) / 1000L).toInt()
            if (deltaSecs >= 1) {
                lastTickWallMs += deltaSecs * 1000L
                advanceTime(deltaSecs)
            }
        }
    }

    fun onAppBackgrounded() {
        if (_isRunning.value && settings.value.strictMode && _timerMode.value == "work") {
            _isRunning.value = false
            _isNavHidden.value = false
            stopTicker()
            soundEngine.stop()
            TimerForegroundService.stop(appContext)
            hapticManager.strictModeAlert()
            _strictModalOpen.value = true
            persistState()
        }
    }

    fun dismissStrictModal(reset: Boolean) {
        _strictModalOpen.value = false
        if (reset) {
            resetTimer()
        }
    }

    private fun advanceTime(deltaSecs: Int) {
        if (deltaSecs <= 0 || !_isRunning.value) return

        var remaining = deltaSecs
        var curMode = _timerMode.value
        var curTimeLeft = _timeLeft.value
        var curRunning = _isRunning.value
        var curCycles = _cycleCount.value
        val curSettings = settings.value
        val curTask = _activeTask.value
        val curProjects = projects.value

        val sessionsToAdd = mutableListOf<SessionEntity>()
        var pomosEarned = 0
        val newCelebrations = mutableListOf<CelebrationItem>()

        while (remaining > 0 && curRunning) {
            if (remaining < curTimeLeft) {
                curTimeLeft -= remaining
                remaining = 0
            } else {
                remaining -= curTimeLeft

                if (curMode == "work") {
                    pomosEarned += 1
                    curCycles += 1

                    sessionsToAdd.add(
                        SessionEntity(
                            id = "sess-${System.currentTimeMillis()}-${sessionsToAdd.size}",
                            projectId = curTask?.projectId ?: curProjects.firstOrNull()?.id ?: "proj-1",
                            duration = curSettings.workDuration,
                            completedAt = Instant.now().toString(),
                            dateStr = LocalDate.now().toString()
                        )
                    )

                    newCelebrations.add(
                        CelebrationItem(
                            id = System.currentTimeMillis() + newCelebrations.size,
                            type = "work",
                            title = "Session $curCycles Completed",
                            subtitle = "Great focus! Enjoy a moment of calm.",
                            durationMins = curSettings.workDuration,
                            autoStarted = curSettings.autoStartBreaks
                        )
                    )

                    val isLong = curCycles % curSettings.longBreakInterval.coerceAtLeast(1) == 0
                    curMode = if (isLong) "longBreak" else "shortBreak"
                    curTimeLeft = (if (isLong) curSettings.longBreakDuration else curSettings.shortBreakDuration) * 60

                    if (!curSettings.autoStartBreaks) {
                        curRunning = false
                        remaining = 0
                    }
                } else {
                    newCelebrations.add(
                        CelebrationItem(
                            id = System.currentTimeMillis() + newCelebrations.size,
                            type = "break",
                            title = "Break Completed",
                            subtitle = "Refreshed? Ready to focus again?",
                            durationMins = if (curMode == "longBreak") curSettings.longBreakDuration else curSettings.shortBreakDuration,
                            autoStarted = curSettings.autoStartPomodoros
                        )
                    )

                    curMode = "work"
                    curTimeLeft = curSettings.workDuration * 60

                    if (!curSettings.autoStartPomodoros) {
                        curRunning = false
                        remaining = 0
                    }
                }
            }
        }

        if (sessionsToAdd.isNotEmpty()) {
            engineScope.launch {
                repository.recordSessions(sessionsToAdd, pomosEarned, curTask?.id)
            }
            if (curTask != null) {
                _activeTask.value = curTask.copy(completedPomos = curTask.completedPomos + pomosEarned)
            }
        }

        if (newCelebrations.isNotEmpty()) {
            soundEngine.stop()
            soundEngine.playChime()
            hapticManager.sessionCompleted()
            newCelebrations.forEach { enqueueCelebration(it) }
        }

        _timeLeft.value = curTimeLeft
        _timerMode.value = curMode
        _cycleCount.value = curCycles
        _isRunning.value = curRunning
        persistState()

        if (!curRunning) {
            _isNavHidden.value = false
            stopTicker()
            TimerForegroundService.stop(appContext)
        } else {
            syncForegroundNotification()
        }
    }

    private fun saveFocusProgress(elapsedSecs: Int) {
        if (elapsedSecs < 30) return
        val elapsedMins = (elapsedSecs / 60f).roundToInt().coerceAtLeast(1)
        val curTask = _activeTask.value
        val curProjects = projects.value
        val sess = SessionEntity(
            id = "sess-${System.currentTimeMillis()}",
            projectId = curTask?.projectId ?: curProjects.firstOrNull()?.id ?: "proj-1",
            duration = elapsedMins,
            completedAt = Instant.now().toString(),
            dateStr = LocalDate.now().toString()
        )
        engineScope.launch {
            repository.recordSessions(listOf(sess), 1, curTask?.id)
        }
    }

    private fun syncForegroundNotification(forceKeep: Boolean = false) {
        val s = settings.value
        if (!s.liveNotification || (!_isRunning.value && !forceKeep && !notificationSessionActive)) {
            TimerForegroundService.stop(appContext)
            return
        }
        val secs = _timeLeft.value
        val mins = secs / 60
        val rem = secs % 60
        val timeText = String.format(Locale.US, "%02d:%02d", mins, rem)
        val title = when (_timerMode.value) {
            "work" -> "Focus Session"
            "shortBreak" -> "Short Break"
            else -> "Long Break"
        }
        val sub = _activeTask.value?.title ?: "Focusing on your priority"
        TimerForegroundService.updateOrStart(
            context = appContext,
            title = title,
            timeText = timeText,
            subtitle = sub,
            isRunning = _isRunning.value,
            remainingSeconds = secs,
            totalSeconds = getTotalTimeForMode(_timerMode.value)
        )
    }

    fun enqueueCelebration(item: CelebrationItem) {
        _celebrations.value = _celebrations.value + item
    }

    fun dismissCelebration(id: Long) {
        _celebrations.value = _celebrations.value.filterNot { it.id == id }
    }

    fun handleCelebrationPrimaryAction(item: CelebrationItem) {
        dismissCelebration(item.id)
        if (item.autoStarted) {
            if (!_isRunning.value) {
                togglePlay()
            }
            return
        }
        if (item.type == "work") {
            val s = settings.value
            val isLong = _cycleCount.value > 0 && _cycleCount.value % s.longBreakInterval.coerceAtLeast(1) == 0
            val nextMode = if (isLong) "longBreak" else "shortBreak"
            _timerMode.value = nextMode
            _timeLeft.value = getTotalTimeForMode(nextMode)
            togglePlay()
        } else if (item.type == "break") {
            _timerMode.value = "work"
            _timeLeft.value = getTotalTimeForMode("work")
            togglePlay()
        }
    }
}
