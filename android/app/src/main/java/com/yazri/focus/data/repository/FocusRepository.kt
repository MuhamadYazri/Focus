package com.yazri.focus.data.repository

import com.yazri.focus.data.local.FocusDatabase
import com.yazri.focus.data.local.entities.ProjectEntity
import com.yazri.focus.data.local.entities.SessionEntity
import com.yazri.focus.data.local.entities.SubtaskItem
import com.yazri.focus.data.local.entities.TaskEntity
import com.yazri.focus.data.preferences.AppSettings
import com.yazri.focus.data.preferences.SettingsDataStore
import kotlinx.coroutines.flow.Flow
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant
import java.time.LocalDate

class FocusRepository(
    private val db: FocusDatabase,
    private val settingsDataStore: SettingsDataStore
) {
    private val taskDao = db.taskDao()
    private val projectDao = db.projectDao()
    private val sessionDao = db.sessionDao()

    val tasksFlow: Flow<List<TaskEntity>> = taskDao.getAllTasks()
    val projectsFlow: Flow<List<ProjectEntity>> = projectDao.getAllProjects()
    val sessionsFlow: Flow<List<SessionEntity>> = sessionDao.getAllSessions()
    val settingsFlow: Flow<AppSettings> = settingsDataStore.settingsFlow

    suspend fun ensureSeededAndRollover() {
        val settings = settingsDataStore.getSettingsOnce()
        if (!settings.seeded) {
            val defaultProjects = listOf(
                ProjectEntity(id = "proj-1", name = "01 // STUDY", color = "#41493F", icon = "BookOpen", pomodoros = 1010),
                ProjectEntity(id = "proj-2", name = "02 // PERSONAL_APP_DEV", color = "#667463", icon = "Code", pomodoros = 18),
                ProjectEntity(id = "proj-3", name = "03 // SYS_ARCHITECTURE", color = "#8B9E87", icon = "Database", pomodoros = 32)
            )
            val nowIso = Instant.now().toString()
            val todayStr = LocalDate.now().toString()
            val tomorrowStr = LocalDate.now().plusDays(1).toString()

            val defaultTasks = listOf(
                TaskEntity(
                    id = "task-1",
                    title = "Refactor Auth Backend API",
                    projectId = "proj-1",
                    priority = "P1",
                    estimatedPomos = 4,
                    completedPomos = 2,
                    completed = false,
                    scheduleType = "today",
                    scheduledDate = todayStr,
                    subtasksJson = TaskEntity.serializeSubtasks(
                        listOf(
                            SubtaskItem("sub-1", "Migrate JWT validator to middleware", true),
                            SubtaskItem("sub-2", "Implement refresh token rotation", true),
                            SubtaskItem("sub-3", "Write integration test suite", false)
                        )
                    ),
                    createdAt = nowIso
                ),
                TaskEntity(
                    id = "task-2",
                    title = "Optimize WebGL Canvas Performance",
                    projectId = "proj-2",
                    priority = "P2",
                    estimatedPomos = 2,
                    completedPomos = 1,
                    completed = false,
                    scheduleType = "today",
                    scheduledDate = todayStr,
                    subtasksJson = TaskEntity.serializeSubtasks(
                        listOf(
                            SubtaskItem("sub-4", "Profile shader execution time in DevTools", true),
                            SubtaskItem("sub-5", "Reduce draw calls by batching meshes", false)
                        )
                    ),
                    createdAt = nowIso
                ),
                TaskEntity(
                    id = "task-3",
                    title = "Review System Data Models",
                    projectId = "proj-3",
                    priority = "P3",
                    estimatedPomos = 1,
                    completedPomos = 0,
                    completed = false,
                    scheduleType = "date",
                    scheduledDate = tomorrowStr,
                    subtasksJson = "[]",
                    createdAt = nowIso
                )
            )

            projectDao.insertAll(defaultProjects)
            taskDao.insertAll(defaultTasks)
            settingsDataStore.markSeeded()
        } else {
            performDailyRolloverIfNeeded()
        }
    }

    private fun uncheckSubtasksJson(subtasksJson: String): String {
        if (subtasksJson.isBlank() || subtasksJson == "[]") return "[]"
        return try {
            val arr = JSONArray(subtasksJson)
            val list = mutableListOf<SubtaskItem>()
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                list.add(
                    SubtaskItem(
                        id = obj.optString("id", "sub-$i"),
                        title = obj.optString("title", ""),
                        completed = false
                    )
                )
            }
            TaskEntity.serializeSubtasks(list)
        } catch (_: Exception) {
            subtasksJson
        }
    }

    suspend fun performDailyRolloverIfNeeded(): Boolean {
        val todayStr = LocalDate.now().toString()
        val lastRolloverDate = settingsDataStore.getLastRolloverDate()
        if (lastRolloverDate == todayStr) {
            return false // Already rolled over today
        }

        val currentDayOfWeek = LocalDate.now().dayOfWeek.value % 7
        val allTasks = taskDao.getAllTasksOnce()
        val updatedTasks = mutableListOf<TaskEntity>()

        allTasks.forEach { task ->
            if (task.completed) {
                // Completed recurring tasks rollover to incomplete on new day
                val compDate = task.completedDateStr ?: task.completedAt?.substringBefore("T")
                val shouldRollover = when (task.scheduleType) {
                    "daily" -> true
                    "weekly" -> task.weeklyDays.contains(currentDayOfWeek)
                    else -> false
                }
                if (shouldRollover && compDate != null && compDate != todayStr) {
                    updatedTasks.add(
                        task.copy(
                            completed = false,
                            completedPomos = 0,
                            completedDateStr = null,
                            completedAt = null,
                            subtasksJson = uncheckSubtasksJson(task.subtasksJson)
                        )
                    )
                }
            } else {
                // Unfinished tasks: reset completed pomodoros and uncheck subtasks each new day
                val hasCompletedPomos = task.completedPomos > 0
                val hasCheckedSubtasks = task.subtasks.any { it.completed }
                if (hasCompletedPomos || hasCheckedSubtasks) {
                    updatedTasks.add(
                        task.copy(
                            completedPomos = 0,
                            subtasksJson = uncheckSubtasksJson(task.subtasksJson)
                        )
                    )
                }
            }
        }

        if (updatedTasks.isNotEmpty()) {
            taskDao.insertAll(updatedTasks)
        }

        settingsDataStore.setLastRolloverDate(todayStr)
        return true
    }

    suspend fun saveTask(task: TaskEntity) = taskDao.insertTask(task)
    suspend fun deleteTask(id: String) = taskDao.deleteTaskById(id)

    suspend fun saveProject(project: ProjectEntity) = projectDao.insertProject(project)
    suspend fun deleteProject(id: String) {
        val remaining = projectDao.getAllProjectsOnce().filterNot { it.id == id }
        val fallbackId = remaining.firstOrNull()?.id ?: "proj-1"
        taskDao.reassignTasksProject(deletedProjectId = id, fallbackProjectId = fallbackId)
        projectDao.deleteProjectById(id)
    }

    suspend fun recordSessions(
        sessions: List<SessionEntity>,
        pomosEarned: Int,
        activeTaskId: String?
    ) {
        if (sessions.isEmpty()) return
        performDailyRolloverIfNeeded()
        sessionDao.insertAll(sessions)
        val primaryProjId = sessions.first().projectId
        projectDao.incrementPomodoros(primaryProjId, pomosEarned)

        if (activeTaskId != null) {
            val tasks = taskDao.getAllTasksOnce()
            val target = tasks.find { it.id == activeTaskId }
            if (target != null) {
                val updatedPomos = target.completedPomos + pomosEarned
                val isDone = updatedPomos >= target.estimatedPomos
                val todayStr = LocalDate.now().toString()
                taskDao.updateTask(
                    target.copy(
                        completedPomos = updatedPomos,
                        completed = isDone,
                        completedDateStr = if (isDone) todayStr else target.completedDateStr,
                        completedAt = if (isDone) Instant.now().toString() else target.completedAt
                    )
                )
            }
        }
    }

    suspend fun updateSettings(settings: AppSettings) = settingsDataStore.saveSettings(settings)

    suspend fun resetAllData() {
        taskDao.deleteAllTasks()
        sessionDao.deleteAllSessions()
        projectDao.deleteAllProjects()
        projectDao.insertProject(
            ProjectEntity(
                id = "proj-1",
                name = "Personal",
                color = "#41493F",
                icon = "folder",
                pomodoros = 0
            )
        )
        settingsDataStore.saveSettings(AppSettings(seeded = true))
    }

    suspend fun exportBackupJson(): String {
        val root = JSONObject()
        root.put("version", 1)
        root.put("exportedAt", Instant.now().toString())

        val projectsArr = JSONArray()
        projectDao.getAllProjectsOnce().forEach { p ->
            projectsArr.put(JSONObject().apply {
                put("id", p.id)
                put("name", p.name)
                put("color", p.color)
                put("icon", p.icon)
                put("pomodoros", p.pomodoros)
            })
        }
        root.put("projects", projectsArr)

        val tasksArr = JSONArray()
        taskDao.getAllTasksOnce().forEach { t ->
            tasksArr.put(JSONObject().apply {
                put("id", t.id)
                put("title", t.title)
                put("projectId", t.projectId)
                put("estimatedPomos", t.estimatedPomos)
                put("completedPomos", t.completedPomos)
                put("completed", t.completed)
                put("completedDateStr", t.completedDateStr)
                put("completedAt", t.completedAt)
                put("priority", t.priority)
                put("scheduleType", t.scheduleType)
                put("scheduledDate", t.scheduledDate)
                put("weeklyDays", JSONArray(t.weeklyDays))
                put("subtasks", JSONArray(t.subtasksJson))
                put("createdAt", t.createdAt)
                if (t.durationMinutes != null && t.durationMinutes > 0) {
                    put("durationMinutes", t.durationMinutes)
                }
            })
        }
        root.put("tasks", tasksArr)

        val sessionsArr = JSONArray()
        sessionDao.getAllSessionsOnce().forEach { s ->
            sessionsArr.put(JSONObject().apply {
                put("id", s.id)
                put("projectId", s.projectId)
                put("duration", s.duration)
                put("completedAt", s.completedAt)
                put("dateStr", s.dateStr)
            })
        }
        root.put("sessions", sessionsArr)

        val s = settingsDataStore.getSettingsOnce()
        root.put("settings", JSONObject().apply {
            put("workDuration", s.workDuration)
            put("shortBreakDuration", s.shortBreakDuration)
            put("longBreakDuration", s.longBreakDuration)
            put("longBreakInterval", s.longBreakInterval)
            put("autoStartBreaks", s.autoStartBreaks)
            put("autoStartPomodoros", s.autoStartPomodoros)
            put("soundscape", s.soundscape)
            put("soundVolume", s.soundVolume.toDouble())
            put("strictMode", s.strictMode)
            put("keepAwake", s.keepAwake)
            put("dailyGoalHours", s.dailyGoalHours.toDouble())
            put("liveNotification", s.liveNotification)
        })
        root.put("dailyGoalsHistory", JSONObject(s.dailyGoalsHistoryJson))
        return root.toString(2)
    }

    suspend fun importBackupJson(jsonStr: String) {
        val root = JSONObject(jsonStr)
        if (root.optInt("version", 1) != 1) {
            throw IllegalArgumentException("Invalid backup format")
        }

        root.optJSONArray("projects")?.let { arr ->
            val list = mutableListOf<ProjectEntity>()
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                list.add(
                    ProjectEntity(
                        id = obj.optString("id", "proj-${i + 1}"),
                        name = obj.optString("name", "Category"),
                        color = obj.optString("color", "#41493F"),
                        icon = obj.optString("icon", "folder"),
                        pomodoros = obj.optInt("pomodoros", 0)
                    )
                )
            }
            projectDao.deleteAllProjects()
            projectDao.insertAll(list)
        }

        root.optJSONArray("tasks")?.let { arr ->
            val list = mutableListOf<TaskEntity>()
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                val wkArr = obj.optJSONArray("weeklyDays")
                val wkDays = mutableListOf<Int>()
                if (wkArr != null) {
                    for (j in 0 until wkArr.length()) wkDays.add(wkArr.optInt(j))
                }
                val subArr = obj.optJSONArray("subtasks")
                list.add(
                    TaskEntity(
                        id = obj.optString("id", "task-${i + 1}"),
                        title = obj.optString("title", "Untitled"),
                        projectId = obj.optString("projectId", "proj-1"),
                        estimatedPomos = obj.optInt("estimatedPomos", 1),
                        completedPomos = obj.optInt("completedPomos", 0),
                        completed = obj.optBoolean("completed", false),
                        completedDateStr = obj.optString("completedDateStr").takeIf { it.isNotBlank() && it != "null" },
                        completedAt = obj.optString("completedAt").takeIf { it.isNotBlank() && it != "null" },
                        priority = obj.optString("priority", "NONE"),
                        scheduleType = obj.optString("scheduleType", "today"),
                        scheduledDate = obj.optString("scheduledDate").takeIf { it.isNotBlank() && it != "null" },
                        weeklyDaysCsv = wkDays.joinToString(","),
                        subtasksJson = subArr?.toString() ?: "[]",
                        createdAt = obj.optString("createdAt", Instant.now().toString()),
                        durationMinutes = if (obj.has("durationMinutes")) obj.optInt("durationMinutes").takeIf { it > 0 } else null
                    )
                )
            }
            taskDao.deleteAllTasks()
            taskDao.insertAll(list)
        }

        root.optJSONArray("sessions")?.let { arr ->
            val list = mutableListOf<SessionEntity>()
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                val compAt = obj.optString("completedAt", Instant.now().toString())
                list.add(
                    SessionEntity(
                        id = obj.optString("id", "sess-$i"),
                        projectId = obj.optString("projectId", "proj-1"),
                        duration = obj.optInt("duration", 25),
                        completedAt = compAt,
                        dateStr = obj.optString("dateStr", compAt.substringBefore("T"))
                    )
                )
            }
            sessionDao.deleteAllSessions()
            sessionDao.insertAll(list)
        }

        root.optJSONObject("settings")?.let { sObj ->
            val histObj = root.optJSONObject("dailyGoalsHistory")
            settingsDataStore.saveSettings(
                AppSettings(
                    workDuration = sObj.optInt("workDuration", 25),
                    shortBreakDuration = sObj.optInt("shortBreakDuration", 5),
                    longBreakDuration = sObj.optInt("longBreakDuration", 15),
                    longBreakInterval = sObj.optInt("longBreakInterval", 4),
                    autoStartBreaks = sObj.optBoolean("autoStartBreaks", true),
                    autoStartPomodoros = sObj.optBoolean("autoStartPomodoros", false),
                    soundscape = sObj.optString("soundscape", "none"),
                    soundVolume = sObj.optDouble("soundVolume", 0.6).toFloat(),
                    strictMode = sObj.optBoolean("strictMode", false),
                    keepAwake = sObj.optBoolean("keepAwake", true),
                    dailyGoalHours = sObj.optDouble("dailyGoalHours", 4.0).toFloat(),
                    liveNotification = sObj.optBoolean("liveNotification", true),
                    seeded = true,
                    dailyGoalsHistoryJson = histObj?.toString() ?: "{}"
                )
            )
        }
    }
}
