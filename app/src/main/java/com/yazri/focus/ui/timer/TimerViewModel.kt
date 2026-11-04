package com.yazri.focus.ui.timer

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.yazri.focus.data.local.entities.ProjectEntity
import com.yazri.focus.data.local.entities.SessionEntity
import com.yazri.focus.data.local.entities.TaskEntity
import com.yazri.focus.data.preferences.AppSettings
import com.yazri.focus.data.preferences.SettingsDataStore
import com.yazri.focus.data.repository.FocusRepository
import com.yazri.focus.service.HapticManager
import com.yazri.focus.service.SoundEngine
import com.yazri.focus.service.TimerEngine
import com.yazri.focus.service.TimerForegroundService
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import java.util.Locale
import kotlin.math.roundToInt

import androidx.compose.runtime.Immutable

data class CelebrationItem(
    val id: Long,
    val type: String, // "work" | "break" | "goal"
    val title: String,
    val subtitle: String,
    val durationMins: Int = 25,
    val autoStarted: Boolean = false
)

@Immutable
data class UndoToastItem(
    val id: Long,
    val message: String,
    val onUndo: suspend () -> Unit
)

class TimerViewModel(
    private val appContext: Context,
    private val repository: FocusRepository,
    val soundEngine: SoundEngine,
    val hapticManager: HapticManager,
    val timerEngine: TimerEngine
) : ViewModel() {

    val tasks: StateFlow<List<TaskEntity>> = repository.tasksFlow
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val projects: StateFlow<List<ProjectEntity>> = repository.projectsFlow
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val sessions: StateFlow<List<SessionEntity>> = repository.sessionsFlow
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val settings: StateFlow<AppSettings> = repository.settingsFlow
        .stateIn(
            viewModelScope,
            SharingStarted.WhileSubscribed(5000),
            AppSettings(themeMode = SettingsDataStore.getCachedThemeMode(appContext))
        )

    private val _activeTab = MutableStateFlow("home")
    val activeTab: StateFlow<String> = _activeTab.asStateFlow()

    val timerMode: StateFlow<String> = timerEngine.timerMode
    val timeLeft: StateFlow<Int> = timerEngine.timeLeft
    val isRunning: StateFlow<Boolean> = timerEngine.isRunning
    val cycleCount: StateFlow<Int> = timerEngine.cycleCount
    val activeTask: StateFlow<TaskEntity?> = timerEngine.activeTask
    val isNavHidden: StateFlow<Boolean> = timerEngine.isNavHidden
    val strictModalOpen: StateFlow<Boolean> = timerEngine.strictModalOpen
    val celebrations: StateFlow<List<CelebrationItem>> = timerEngine.celebrations

    private val _toast = MutableStateFlow<UndoToastItem?>(null)
    val toast: StateFlow<UndoToastItem?> = _toast.asStateFlow()

    private var goalMetToday: Boolean? = null

    init {
        viewModelScope.launch {
            repository.ensureSeededAndRollover()
        }

        // Celebrate once when today's focus time crosses daily goal
        viewModelScope.launch {
            combine(sessions, settings) { sessList, s ->
                val todayStr = LocalDate.now().toString()
                val todayMins = sessList.filter { it.dateStr == todayStr }.sumOf { it.duration }
                val goalMins = (s.dailyGoalHours * 60f).roundToInt()
                Pair(todayMins >= goalMins && goalMins > 0, s.dailyGoalHours)
            }.collect { (met, goalHours) ->
                if (goalMetToday == false && met) {
                    timerEngine.enqueueCelebration(
                        CelebrationItem(
                            id = System.currentTimeMillis(),
                            type = "goal",
                            title = "Daily goal reached!",
                            subtitle = "${String.format(Locale.US, "%.1f", goalHours)}h of focus completed today"
                        )
                    )
                    hapticManager.sessionCompleted()
                }
                goalMetToday = met
            }
        }
    }

    fun selectTab(tab: String) {
        if (_activeTab.value == tab) return
        hapticManager.tap()
        if (timerEngine.isNavHidden.value) {
            timerEngine.toggleNavHidden()
        }
        _activeTab.value = tab
    }

    fun toggleNavHidden() {
        timerEngine.toggleNavHidden()
    }

    fun getTotalTimeForMode(mode: String = timerEngine.timerMode.value): Int =
        timerEngine.getTotalTimeForMode(mode)

    fun selectMode(mode: String) = timerEngine.selectMode(mode)

    fun togglePlay(targetMode: String? = null) = timerEngine.togglePlay(targetMode)

    fun resetTimer(fromNotification: Boolean = false) = timerEngine.resetTimer(fromNotification)

    fun skipSession(fromNotification: Boolean = false) = timerEngine.skipSession(fromNotification)

    fun startPomodoroForTask(task: TaskEntity) {
        timerEngine.startPomodoroForTask(task)
        selectTab("timer")
    }

    fun syncOnResume() {
        viewModelScope.launch {
            repository.performDailyRolloverIfNeeded()
        }
        timerEngine.syncOnResume()
    }

    fun onAppBackgrounded() = timerEngine.onAppBackgrounded()

    fun dismissStrictModal(reset: Boolean) = timerEngine.dismissStrictModal(reset)

    fun dismissCelebration(id: Long) = timerEngine.dismissCelebration(id)

    fun handleCelebrationPrimaryAction(item: CelebrationItem) =
        timerEngine.handleCelebrationPrimaryAction(item)

    // Task & Project Actions
    fun toggleTaskComplete(task: TaskEntity) {
        val nextCompleted = !task.completed
        val todayStr = LocalDate.now().toString()
        val updated = task.copy(
            completed = nextCompleted,
            completedDateStr = if (nextCompleted) todayStr else null,
            completedAt = if (nextCompleted) Instant.now().toString() else null
        )
        viewModelScope.launch {
            repository.saveTask(updated)
        }
        if (nextCompleted) {
            hapticManager.taskCompleted()
            showUndoToast("Task completed") {
                repository.saveTask(task)
            }
        }
    }

    fun saveTask(task: TaskEntity) {
        viewModelScope.launch {
            repository.saveTask(task)
            timerEngine.onTaskUpdated(task)
        }
    }

    fun selectActiveTask(task: TaskEntity?) {
        timerEngine.setActiveTask(task)
    }

    fun deleteTask(task: TaskEntity) {
        viewModelScope.launch {
            repository.deleteTask(task.id)
            timerEngine.onTaskDeleted(task.id)
        }
        showUndoToast("Task deleted") {
            repository.saveTask(task)
        }
    }

    fun saveProject(project: ProjectEntity) {
        viewModelScope.launch {
            repository.saveProject(project)
        }
    }

    fun deleteProject(projectId: String) {
        viewModelScope.launch {
            repository.deleteProject(projectId)
        }
    }

    fun updateSettings(newSettings: AppSettings) {
        val prev = settings.value
        if (newSettings.soundscape != prev.soundscape) {
            if (timerEngine.isRunning.value) {
                if (newSettings.soundscape == "none") soundEngine.stop()
                else soundEngine.play(newSettings.soundscape, newSettings.soundVolume)
            }
        }
        if (newSettings.soundVolume != prev.soundVolume) {
            soundEngine.setVolume(newSettings.soundVolume)
        }
        viewModelScope.launch {
            repository.updateSettings(newSettings)
        }
    }

    fun resetAllData() {
        timerEngine.resetAll()
        viewModelScope.launch {
            repository.resetAllData()
        }
    }

    private fun showUndoToast(message: String, onUndo: suspend () -> Unit) {
        val id = System.currentTimeMillis()
        _toast.value = UndoToastItem(id, message, onUndo)
        viewModelScope.launch {
            delay(4000L)
            if (_toast.value?.id == id) {
                _toast.value = null
            }
        }
    }

    fun triggerUndo() {
        val current = _toast.value ?: return
        _toast.value = null
        viewModelScope.launch {
            current.onUndo()
        }
    }

    fun dismissToast() {
        _toast.value = null
    }

    suspend fun exportBackupJson(): String = repository.exportBackupJson()
    suspend fun importBackupJson(json: String) = repository.importBackupJson(json)

    class Factory(
        private val appContext: Context,
        private val repository: FocusRepository,
        private val soundEngine: SoundEngine,
        private val hapticManager: HapticManager,
        private val timerEngine: TimerEngine
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return TimerViewModel(appContext, repository, soundEngine, hapticManager, timerEngine) as T
        }
    }
}
