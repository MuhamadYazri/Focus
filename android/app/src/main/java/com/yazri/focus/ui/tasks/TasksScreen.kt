package com.yazri.focus.ui.tasks

import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material.icons.outlined.Replay
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yazri.focus.data.local.entities.SessionEntity
import com.yazri.focus.data.local.entities.TaskEntity
import com.yazri.focus.data.preferences.AppSettings
import com.yazri.focus.ui.components.DailyGoalHero
import com.yazri.focus.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlin.math.roundToInt

private val FILTER_TABS = listOf("Today", "Planned", "Done")

@Composable
fun TasksScreen(
    tasks: List<TaskEntity>,
    sessions: List<SessionEntity>,
    settings: AppSettings,
    activeTaskId: String?,
    isTimerRunning: Boolean,
    onAddTask: () -> Unit,
    onEditTask: (TaskEntity) -> Unit,
    onToggleComplete: (TaskEntity) -> Unit,
    onStartPomodoro: (TaskEntity) -> Unit,
    onDeleteTask: (TaskEntity) -> Unit
) {
    var filterTab by remember { mutableStateOf("Today") }
    var justCompletedId by remember { mutableStateOf<String?>(null) }
    val coroutineScope = rememberCoroutineScope()

    val today = remember { LocalDate.now() }
    val todayStr = remember { today.toString() }
    val todayDayOfWeek = remember { today.dayOfWeek.value % 7 } // 0 = Sun, 1 = Mon...
    val dateFormatted = remember {
        today.format(DateTimeFormatter.ofPattern("EEE, d MMM", Locale.US))
    }

    // Daily Focus Hours Calculation
    val todayMinutes = remember(sessions, todayStr) {
        sessions.filter { it.dateStr == todayStr }.sumOf { it.duration }
    }
    val rawHours = todayMinutes / 60f
    val targetHours = settings.dailyGoalHours.coerceAtLeast(0.5f)
    val progressPercent = ((rawHours / targetHours) * 100f).roundToInt().coerceIn(0, 100)

    val filteredTasks = remember(tasks, filterTab, todayStr, todayDayOfWeek, justCompletedId) {
        tasks.filter { task ->
            val isExitingComplete = justCompletedId == task.id
            if (filterTab == "Done") {
                return@filter task.completed
            }
            if (task.completed && !isExitingComplete) return@filter false

            val st = task.scheduleType.ifBlank { "today" }
            when (filterTab) {
                "Today" -> {
                    when (st) {
                        "daily", "today" -> true
                        "date" -> task.scheduledDate != null && task.scheduledDate <= todayStr
                        "weekly" -> task.weeklyDays.isEmpty() || task.weeklyDays.contains(todayDayOfWeek)
                        else -> false
                    }
                }
                "Planned" -> {
                    when (st) {
                        "date" -> task.scheduledDate != null && task.scheduledDate > todayStr
                        "weekly" -> task.weeklyDays.isNotEmpty() && !task.weeklyDays.contains(todayDayOfWeek)
                        else -> false
                    }
                }
                else -> true
            }
        }
    }

    val activeFilterIdx = FILTER_TABS.indexOf(filterTab).coerceAtLeast(0)
    val effectiveActiveId = activeTaskId ?: filteredTasks.firstOrNull { !it.completed }?.id

    val navBarBottom = WindowInsets.navigationBars.asPaddingValues().calculateBottomPadding()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(CanvasBg)
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .widthIn(max = 440.dp)
                .padding(horizontal = 24.dp),
            contentPadding = PaddingValues(top = 54.dp, bottom = 140.dp + navBarBottom),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // ── TOP BAR: Editorial Title on Left + Circular '+' Button on Right ──
            item(key = "tasks_top_bar") {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = dateFormatted.uppercase(Locale.US),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium,
                            letterSpacing = 1.2.sp,
                            color = MossSecondary
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "Focus Tasks",
                            fontSize = 32.sp,
                            lineHeight = 38.sp,
                            fontWeight = FontWeight.Normal,
                            letterSpacing = (-0.8).sp,
                            color = InkDark
                        )
                    }

                    // Reference 1 Top-Right '+' Circle Button
                    Box(
                        modifier = Modifier
                            .size(42.dp)
                            .raised(CircleShape, SurfaceWhite, elevation = 7.dp)
                            .clickable { onAddTask() },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Add,
                            contentDescription = "Add new focus task",
                            tint = InkDark,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
                Spacer(modifier = Modifier.height(18.dp))
            }

            // ── DAILY GOAL PROGRESS HERO ──
            item(key = "daily_goal_hero") {
                DailyGoalHero(
                    todayHours = rawHours,
                    targetHours = targetHours,
                    progressPercent = progressPercent
                )
                Spacer(modifier = Modifier.height(16.dp))
            }

            // ── FILTER PILL SWITCHER (Reference 1 '12h | 24h' pill style) ──
            item(key = "filter_pill_switcher") {
                BoxWithConstraints(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(38.dp)
                        .inset(CircleShape, SurfaceSubtle, depth = 5.dp)
                        .padding(3.dp)
                ) {
                    val tabWidth = maxWidth / FILTER_TABS.size
                    val pillOffset by animateDpAsState(
                        targetValue = tabWidth * activeFilterIdx,
                        animationSpec = spring(
                            dampingRatio = 0.85f,
                            stiffness = Spring.StiffnessMedium
                        ),
                        label = "TaskFilterPillOffset"
                    )

                    Box(
                        modifier = Modifier
                            .offset(x = pillOffset)
                            .width(tabWidth)
                            .fillMaxHeight()
                            .raisedDark(CircleShape, InkDark, elevation = 5.dp)
                    )

                    Row(
                        modifier = Modifier.fillMaxSize(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        FILTER_TABS.forEach { tab ->
                            val isSelected = filterTab == tab
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxHeight()
                                    .clip(CircleShape)
                                    .clickable(
                                        interactionSource = remember { MutableInteractionSource() },
                                        indication = null
                                    ) { filterTab = tab },
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = tab,
                                    fontSize = 12.sp,
                                    fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                                    color = if (isSelected) TextOnDark else InkDark
                                )
                            }
                        }
                    }
                }
                Spacer(modifier = Modifier.height(6.dp))
            }

            // ── TASK CARDS LIST (Virtual recycled items) ──
            if (filteredTasks.isEmpty()) {
                item(key = "empty_tasks_state") {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 48.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "No tasks in ${filterTab.lowercase(Locale.US)}",
                            fontSize = 13.sp,
                            color = SoftSage,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            } else {
                items(
                    items = filteredTasks,
                    key = { it.id }
                ) { task ->
                    val isCurrentFocus = effectiveActiveId == task.id && !task.completed
                    val isJustCompleted = justCompletedId == task.id
                    val toggleComplete: () -> Unit = {
                        if (!task.completed && filterTab != "Done") {
                            justCompletedId = task.id
                            onToggleComplete(task)
                            coroutineScope.launch {
                                delay(520)
                                if (justCompletedId == task.id) {
                                    justCompletedId = null
                                }
                            }
                        } else {
                            onToggleComplete(task)
                        }
                    }
                    SwipeActionRow(
                        rightIcon = if (task.completed) Icons.Outlined.Replay else Icons.Filled.Check,
                        rightColor = InkDark,
                        rightIconTint = TextOnDark,
                        leftIcon = Icons.Outlined.DeleteOutline,
                        leftColor = ErrorRed,
                        leftIconTint = Color.White,
                        onSwipeRight = toggleComplete,
                        onSwipeLeft = { onDeleteTask(task) },
                        modifier = Modifier.animateItem()
                    ) {
                        TaskItemRow(
                            task = task,
                            isCurrentFocus = isCurrentFocus,
                            isPlaying = isCurrentFocus && isTimerRunning,
                            isJustCompleted = isJustCompleted,
                            onToggleComplete = toggleComplete,
                            onEditTask = { onEditTask(task) },
                            onStartPomodoro = { onStartPomodoro(task) }
                        )
                    }
                }
            }
        }
    }
}
