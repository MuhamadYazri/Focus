package com.yazri.focus.ui.tasks

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yazri.focus.data.local.entities.ProjectEntity
import com.yazri.focus.data.local.entities.SubtaskItem
import com.yazri.focus.data.local.entities.TaskEntity
import com.yazri.focus.ui.profile.ProjectCategoryDialog
import com.yazri.focus.ui.theme.*
import java.time.Instant
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskModalBottomSheet(
    taskToEdit: TaskEntity?,
    projects: List<ProjectEntity>,
    defaultWorkDuration: Int = 25,
    onDismiss: () -> Unit,
    onSave: (TaskEntity) -> Unit,
    onDelete: ((TaskEntity) -> Unit)? = null,
    onCreateProject: (ProjectEntity) -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    var title by remember(taskToEdit) { mutableStateOf(taskToEdit?.title ?: "") }
    var projectId by remember(taskToEdit) {
        mutableStateOf(taskToEdit?.projectId ?: projects.firstOrNull()?.id ?: "proj-1")
    }
    var showNewCategoryDialog by remember { mutableStateOf(false) }
    var pomoTotal by remember(taskToEdit) { mutableIntStateOf(taskToEdit?.estimatedPomos ?: 1) }
    var useCustomDuration by remember(taskToEdit) {
        mutableStateOf(taskToEdit?.durationMinutes != null && taskToEdit.durationMinutes > 0)
    }
    var customDurationMinutes by remember(taskToEdit, defaultWorkDuration) {
        mutableIntStateOf(taskToEdit?.durationMinutes ?: defaultWorkDuration)
    }
    var showTags by remember { mutableStateOf(false) }
    var subtasks by remember(taskToEdit) { mutableStateOf(taskToEdit?.subtasks ?: emptyList()) }
    var newSubtaskTitle by remember { mutableStateOf("") }
    var showSubtasks by remember(taskToEdit) {
        mutableStateOf((taskToEdit?.subtasks?.isNotEmpty()) == true)
    }
    var scheduleType by remember(taskToEdit) { mutableStateOf(taskToEdit?.scheduleType ?: "today") }
    var scheduledDate by remember(taskToEdit) {
        mutableStateOf(taskToEdit?.scheduledDate ?: LocalDate.now().toString())
    }
    var weeklyDays by remember(taskToEdit) { mutableStateOf(taskToEdit?.weeklyDays ?: emptyList()) }

    val selectedProject = projects.find { it.id == projectId }
        ?: projects.firstOrNull()
        ?: ProjectEntity("proj-1", "Personal", "#41493F")

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = SurfaceWhite,
        dragHandle = null,
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp)
                .padding(top = 14.dp, bottom = 36.dp),
            verticalArrangement = Arrangement.spacedBy(22.dp)
        ) {
            // Tactile Drag Handle Pill
            Box(
                modifier = Modifier.fillMaxWidth(),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .width(42.dp)
                        .height(5.dp)
                        .clip(CircleShape)
                        .background(SoftSage.copy(alpha = 0.45f))
                )
            }

            // Header: Title + Action Buttons (Delete & Close)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = if (taskToEdit != null) "Edit Task" else "New Task",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = (-0.6).sp,
                    color = InkDark
                )

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (taskToEdit != null && onDelete != null) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .raised(CircleShape, SurfaceWhite, elevation = 4.dp)
                                .clickable {
                                    onDelete(taskToEdit)
                                    onDismiss()
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.DeleteOutline,
                                contentDescription = "Delete task",
                                tint = ErrorRed,
                                modifier = Modifier.size(17.dp)
                            )
                        }
                    }

                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .raised(CircleShape, SurfaceWhite, elevation = 4.dp)
                            .clickable { onDismiss() },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.Close,
                            contentDescription = "Close",
                            tint = InkDark,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }

            // ── TASK TITLE INPUT ──
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "TASK TITLE",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 1.2.sp,
                    color = MossSecondary
                )
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .inset(RoundedCornerShape(16.dp), CanvasBg, depth = 3.dp)
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    contentAlignment = Alignment.CenterStart
                ) {
                    BasicTextField(
                        value = title,
                        onValueChange = { title = it },
                        singleLine = true,
                        textStyle = TextStyle(
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Medium,
                            color = InkDark
                        ),
                        cursorBrush = SolidColor(InkDark),
                        decorationBox = { innerTextField ->
                            if (title.isEmpty()) {
                                Text(
                                    text = "What needs to be done?",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Normal,
                                    color = SoftSage
                                )
                            }
                            innerTextField()
                        },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            // ── CATEGORY SELECTOR ──
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "CATEGORY",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 1.2.sp,
                    color = MossSecondary
                )
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .raised(RoundedCornerShape(16.dp), SurfaceWhite, elevation = 4.dp)
                        .clickable { showTags = !showTags }
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(12.dp)
                                .clip(CircleShape)
                                .background(parseHexColor(selectedProject.color))
                        )
                        Text(
                            text = selectedProject.displayName,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = InkDark
                        )
                    }
                    Icon(
                        imageVector = if (showTags) Icons.Outlined.KeyboardArrowUp else Icons.Outlined.KeyboardArrowDown,
                        contentDescription = null,
                        tint = MossSecondary,
                        modifier = Modifier.size(20.dp)
                    )
                }

                if (showTags) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .raised(RoundedCornerShape(16.dp), SurfaceWhite, elevation = 5.dp)
                            .clip(RoundedCornerShape(16.dp))
                    ) {
                        projects.forEachIndexed { idx, proj ->
                            val isSel = proj.id == selectedProject.id
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(if (isSel) CanvasBg else SurfaceWhite)
                                    .clickable {
                                        projectId = proj.id
                                        showTags = false
                                    }
                                    .padding(horizontal = 16.dp, vertical = 13.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(10.dp)
                                            .clip(CircleShape)
                                            .background(parseHexColor(proj.color))
                                    )
                                    Text(
                                        text = proj.displayName,
                                        fontSize = 14.sp,
                                        fontWeight = if (isSel) FontWeight.Bold else FontWeight.Medium,
                                        color = InkDark
                                    )
                                }
                                if (isSel) {
                                    Icon(
                                        imageVector = Icons.Filled.Check,
                                        contentDescription = null,
                                        tint = InkDark,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            }
                            if (idx < projects.lastIndex) {
                                HorizontalDivider(thickness = 1.dp, color = BorderHairline.copy(alpha = 0.5f))
                            }
                        }
                        HorizontalDivider(thickness = 1.dp, color = BorderHairline)
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(SurfaceSubtle.copy(alpha = 0.6f))
                                .clickable {
                                    showTags = false
                                    showNewCategoryDialog = true
                                }
                                .padding(vertical = 12.dp),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Add,
                                contentDescription = null,
                                tint = InkDark,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "New Category",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = InkDark
                            )
                        }
                    }
                }
            }

            // ── SCHEDULE SELECTOR ──
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "SCHEDULE",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 1.2.sp,
                    color = MossSecondary
                )
                val scheduleOptions = listOf(
                    "today" to "Today",
                    "daily" to "Every Day",
                    "weekly" to "Custom",
                    "date" to "Date"
                )
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .inset(CircleShape, SurfaceSubtle, depth = 4.dp)
                        .padding(4.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    scheduleOptions.forEach { (id, label) ->
                        val isSelected = scheduleType == id
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .then(
                                    if (isSelected) Modifier.raised(CircleShape, SurfaceWhite, elevation = 4.dp)
                                    else Modifier
                                )
                                .clip(CircleShape)
                                .clickable(
                                    interactionSource = remember { MutableInteractionSource() },
                                    indication = null
                                ) { scheduleType = id }
                                .padding(vertical = 9.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = label,
                                fontSize = 12.sp,
                                fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Medium,
                                color = if (isSelected) InkDark else MossSecondary
                            )
                        }
                    }
                }

                if (scheduleType == "weekly") {
                    val days = listOf(
                        1 to "M",
                        2 to "T",
                        3 to "W",
                        4 to "T",
                        5 to "F",
                        6 to "S",
                        0 to "S"
                    )
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        days.forEach { (dayInt, dayLabel) ->
                            val isSel = weeklyDays.contains(dayInt)
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .then(
                                        if (isSel) Modifier.raisedDark(CircleShape, InkDark, elevation = 5.dp)
                                        else Modifier.raised(CircleShape, SurfaceWhite, elevation = 3.dp)
                                    )
                                    .clip(CircleShape)
                                    .clickable {
                                        weeklyDays = if (isSel) weeklyDays - dayInt else weeklyDays + dayInt
                                    },
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = dayLabel,
                                    fontSize = 13.sp,
                                    fontWeight = if (isSel) FontWeight.Bold else FontWeight.Medium,
                                    color = if (isSel) TextOnDark else InkDark
                                )
                            }
                        }
                    }
                } else if (scheduleType == "date") {
                    val context = LocalContext.current
                    val parsedDate = remember(scheduledDate) {
                        try {
                            LocalDate.parse(scheduledDate)
                        } catch (_: Exception) {
                            LocalDate.now()
                        }
                    }
                    val dateFormatted = remember(parsedDate) {
                        parsedDate.format(DateTimeFormatter.ofPattern("EEE, d MMM yyyy", Locale.US))
                    }

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .raised(RoundedCornerShape(14.dp), SurfaceWhite, elevation = 2.dp)
                            .clickable {
                                android.app.DatePickerDialog(
                                    context,
                                    { _, year, month, dayOfMonth ->
                                        val picked = LocalDate.of(year, month + 1, dayOfMonth)
                                        scheduledDate = picked.toString()
                                    },
                                    parsedDate.year,
                                    parsedDate.monthValue - 1,
                                    parsedDate.dayOfMonth
                                ).show()
                            }
                            .padding(horizontal = 16.dp, vertical = 14.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Outlined.CalendarToday,
                                    contentDescription = null,
                                    tint = InkDark,
                                    modifier = Modifier.size(18.dp)
                                )
                                Text(
                                    text = dateFormatted,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = InkDark
                                )
                            }
                            Text(
                                text = "Select",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = MossSecondary
                            )
                        }
                    }
                }
            }

            // ── POMODOROS PLANNED STEPPER ──
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    text = "POMODOROS PLANNED",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 1.2.sp,
                    color = MossSecondary
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Box(
                        modifier = Modifier
                            .size(50.dp)
                            .raised(RoundedCornerShape(16.dp), SurfaceWhite, elevation = 5.dp)
                            .clickable { pomoTotal = (pomoTotal - 1).coerceAtLeast(1) },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "−",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            color = InkDark
                        )
                    }

                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = pomoTotal.toString(),
                            fontSize = 36.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = (-1).sp,
                            color = InkDark
                        )
                        Text(
                            text = if (pomoTotal == 1) "SESSION" else "SESSIONS",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.SemiBold,
                            letterSpacing = 1.5.sp,
                            color = MossSecondary
                        )
                    }

                    Box(
                        modifier = Modifier
                            .size(50.dp)
                            .raised(RoundedCornerShape(16.dp), SurfaceWhite, elevation = 5.dp)
                            .clickable { pomoTotal = (pomoTotal + 1).coerceAtMost(12) },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Add,
                            contentDescription = "Increase Pomodoros",
                            tint = InkDark,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }

                // 12-segment progress bar with tactile styling
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(6.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    for (i in 0 until 12) {
                        val isFilled = i < pomoTotal
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxHeight()
                                .clip(CircleShape)
                                .background(if (isFilled) InkDark else SurfaceSubtle)
                        )
                    }
                }
            }

            // ── SESSION DURATION (TIMER) ──
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "SESSION DURATION",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        letterSpacing = 1.2.sp,
                        color = MossSecondary
                    )
                    Text(
                        text = if (useCustomDuration) "$customDurationMinutes MIN" else "DEFAULT ($defaultWorkDuration MIN)",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (useCustomDuration) InkDark else MossSecondary
                    )
                }

                // Segmented Pill Selector: Default vs Custom
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(44.dp)
                        .inset(RoundedCornerShape(14.dp), SurfaceSubtle, depth = 2.dp)
                        .padding(3.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    // Default Option
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                            .then(
                                if (!useCustomDuration) {
                                    Modifier
                                        .raised(RoundedCornerShape(11.dp), SurfaceWhite, elevation = 2.dp)
                                        .clip(RoundedCornerShape(11.dp))
                                } else {
                                    Modifier
                                        .clip(RoundedCornerShape(11.dp))
                                        .clickable { useCustomDuration = false }
                                }
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Default (${defaultWorkDuration}m)",
                            fontSize = 13.sp,
                            fontWeight = if (!useCustomDuration) FontWeight.Bold else FontWeight.Medium,
                            color = if (!useCustomDuration) InkDark else MossSecondary
                        )
                    }

                    // Custom Option
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                            .then(
                                if (useCustomDuration) {
                                    Modifier
                                        .raised(RoundedCornerShape(11.dp), SurfaceWhite, elevation = 2.dp)
                                        .clip(RoundedCornerShape(11.dp))
                                } else {
                                    Modifier
                                        .clip(RoundedCornerShape(11.dp))
                                        .clickable { useCustomDuration = true }
                                }
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Custom",
                            fontSize = 13.sp,
                            fontWeight = if (useCustomDuration) FontWeight.Bold else FontWeight.Medium,
                            color = if (useCustomDuration) InkDark else MossSecondary
                        )
                    }
                }

                if (useCustomDuration) {
                    // Quick Presets: 15m, 20m, 25m, 30m, 45m, 60m
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        listOf(15, 20, 25, 30, 45, 60).forEach { mins ->
                            val isSel = customDurationMinutes == mins
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .height(36.dp)
                                    .then(
                                        if (isSel) {
                                            Modifier
                                                .raisedDark(RoundedCornerShape(10.dp), InkDark, elevation = 3.dp)
                                                .clip(RoundedCornerShape(10.dp))
                                        } else {
                                            Modifier
                                                .raised(RoundedCornerShape(10.dp), SurfaceWhite, elevation = 2.dp)
                                                .clip(RoundedCornerShape(10.dp))
                                                .clickable { customDurationMinutes = mins }
                                        }
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "${mins}m",
                                    fontSize = 12.sp,
                                    fontWeight = if (isSel) FontWeight.Bold else FontWeight.Medium,
                                    color = if (isSel) TextOnDark else InkDark
                                )
                            }
                        }
                    }

                    // Stepper: - 5m / + 5m
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Box(
                            modifier = Modifier
                                .size(46.dp)
                                .raised(RoundedCornerShape(14.dp), SurfaceWhite, elevation = 4.dp)
                                .clickable {
                                    customDurationMinutes = (customDurationMinutes - 5).coerceAtLeast(5)
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "−5",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = InkDark
                            )
                        }

                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = "$customDurationMinutes",
                                fontSize = 32.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = (-1).sp,
                                color = InkDark
                            )
                            Text(
                                text = "MINUTES",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.SemiBold,
                                letterSpacing = 1.5.sp,
                                color = MossSecondary
                            )
                        }

                        Box(
                            modifier = Modifier
                                .size(46.dp)
                                .raised(RoundedCornerShape(14.dp), SurfaceWhite, elevation = 4.dp)
                                .clickable {
                                    customDurationMinutes = (customDurationMinutes + 5).coerceAtMost(180)
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "+5",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = InkDark
                            )
                        }
                    }
                }
            }

            // ── SUBTASKS EXPANDABLE ──
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showSubtasks = !showSubtasks }
                        .padding(vertical = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "SUBTASKS",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            letterSpacing = 1.2.sp,
                            color = MossSecondary
                        )
                        if (subtasks.isNotEmpty()) {
                            Box(
                                modifier = Modifier
                                    .clip(CircleShape)
                                    .background(SurfaceSubtle)
                                    .padding(horizontal = 7.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = "${subtasks.count { it.completed }}/${subtasks.size}",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = InkDark
                                )
                            }
                        }
                    }
                    Icon(
                        imageVector = if (showSubtasks) Icons.Outlined.KeyboardArrowUp else Icons.Outlined.KeyboardArrowDown,
                        contentDescription = null,
                        tint = MossSecondary,
                        modifier = Modifier.size(20.dp)
                    )
                }

                if (showSubtasks) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .inset(RoundedCornerShape(16.dp), CanvasBg, depth = 3.dp)
                            .padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .raised(RoundedCornerShape(12.dp), SurfaceWhite, elevation = 2.dp)
                                    .padding(horizontal = 14.dp, vertical = 10.dp)
                            ) {
                                BasicTextField(
                                    value = newSubtaskTitle,
                                    onValueChange = { newSubtaskTitle = it },
                                    singleLine = true,
                                    textStyle = TextStyle(
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = InkDark
                                    ),
                                    cursorBrush = SolidColor(InkDark),
                                    decorationBox = { innerTextField ->
                                        if (newSubtaskTitle.isEmpty()) {
                                            Text("Add a subtask...", fontSize = 13.sp, color = SoftSage)
                                        }
                                        innerTextField()
                                    },
                                    modifier = Modifier.fillMaxWidth()
                                )
                            }

                            Box(
                                modifier = Modifier
                                    .raisedDark(RoundedCornerShape(12.dp), InkDark, elevation = 4.dp)
                                    .clickable {
                                        if (newSubtaskTitle.isNotBlank()) {
                                            subtasks = subtasks + SubtaskItem(
                                                id = "sub-${System.currentTimeMillis()}",
                                                title = newSubtaskTitle.trim(),
                                                completed = false
                                            )
                                            newSubtaskTitle = ""
                                        }
                                    }
                                    .padding(horizontal = 16.dp, vertical = 10.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("Add", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextOnDark)
                            }
                        }

                        subtasks.forEach { sub ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .raised(RoundedCornerShape(12.dp), SurfaceWhite, elevation = 3.dp)
                                    .clickable {
                                        subtasks = subtasks.map {
                                            if (it.id == sub.id) it.copy(completed = !it.completed) else it
                                        }
                                    }
                                    .padding(horizontal = 12.dp, vertical = 10.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(18.dp)
                                            .then(
                                                if (sub.completed) Modifier.raisedDark(CircleShape, InkDark, elevation = 2.dp)
                                                else Modifier.inset(CircleShape, SurfaceSubtle, depth = 2.dp)
                                            ),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        if (sub.completed) {
                                            Icon(
                                                imageVector = Icons.Filled.Check,
                                                contentDescription = null,
                                                tint = SurfaceWhite,
                                                modifier = Modifier.size(12.dp)
                                            )
                                        }
                                    }
                                    Text(
                                        text = sub.title,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = if (sub.completed) SoftSage else InkDark,
                                        textDecoration = if (sub.completed) TextDecoration.LineThrough else TextDecoration.None
                                    )
                                }
                                IconButton(
                                    onClick = { subtasks = subtasks.filterNot { it.id == sub.id } },
                                    modifier = Modifier.size(24.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Outlined.Close,
                                        contentDescription = "Remove subtask",
                                        tint = MossSecondary,
                                        modifier = Modifier.size(14.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // ── CONFIRM CTA BUTTON ──
            val isEnabled = title.isNotBlank()
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(54.dp)
                    .then(
                        if (isEnabled) {
                            Modifier
                                .raisedDark(CircleShape, InkDark, elevation = 8.dp)
                                .clickable {
                                    val saved = TaskEntity(
                                        id = taskToEdit?.id ?: "task-${System.currentTimeMillis()}",
                                        title = title.trim(),
                                        projectId = selectedProject.id,
                                        estimatedPomos = pomoTotal,
                                        completedPomos = taskToEdit?.completedPomos ?: 0,
                                        completed = taskToEdit?.completed ?: false,
                                        completedDateStr = taskToEdit?.completedDateStr,
                                        completedAt = taskToEdit?.completedAt,
                                        priority = taskToEdit?.priority ?: "NONE",
                                        scheduleType = scheduleType,
                                        scheduledDate = if (scheduleType == "date") scheduledDate else null,
                                        weeklyDaysCsv = if (scheduleType == "weekly") TaskEntity.serializeWeeklyDays(weeklyDays) else "",
                                        subtasksJson = TaskEntity.serializeSubtasks(subtasks),
                                        createdAt = taskToEdit?.createdAt ?: Instant.now().toString(),
                                        durationMinutes = if (useCustomDuration) customDurationMinutes else null
                                    )
                                    onSave(saved)
                                    onDismiss()
                                }
                        } else {
                            Modifier.inset(CircleShape, SurfaceSubtle, depth = 2.dp)
                        }
                    ),
                contentAlignment = Alignment.Center
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = if (taskToEdit != null) Icons.Filled.Check else Icons.Filled.Add,
                        contentDescription = null,
                        tint = if (isEnabled) TextOnDark else SoftSage,
                        modifier = Modifier.size(18.dp)
                    )
                    Text(
                        text = if (taskToEdit != null) "Save changes" else "Create Task",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = if (isEnabled) TextOnDark else SoftSage
                    )
                }
            }
        }
    }

    if (showNewCategoryDialog) {
        ProjectCategoryDialog(
            projectToEdit = null,
            onDismiss = { showNewCategoryDialog = false },
            onSave = { newProj ->
                onCreateProject(newProj)
                projectId = newProj.id
                showNewCategoryDialog = false
            }
        )
    }
}
