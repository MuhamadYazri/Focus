package com.yazri.focus.ui.profile

import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
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
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.layout
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.yazri.focus.data.local.entities.ProjectEntity
import com.yazri.focus.data.preferences.AppSettings
import com.yazri.focus.ui.components.FOCUS_VECTOR_HEIGHT
import com.yazri.focus.ui.components.FOCUS_VECTOR_WIDTH
import com.yazri.focus.ui.components.FocusVectorPath
import com.yazri.focus.ui.theme.*
import com.yazri.focus.ui.timer.SOUNDSCAPE_OPTIONS
import java.util.Locale
import kotlin.math.roundToInt

val PROJECT_SWATCHES = listOf(
    "#41493F", "#667463", "#8B9E87", "#B1C9AC",
    "#4E6E58", "#2E4F4F", "#D4A373", "#E07A5F",
    "#3D5A80", "#725AC1", "#B56576", "#6D6875"
)

data class CategoryIconOption(
    val name: String,
    val icon: ImageVector
)

val CATEGORY_ICONS = listOf(
    CategoryIconOption("Briefcase", Icons.Outlined.WorkOutline),
    CategoryIconOption("BookOpen", Icons.Outlined.MenuBook),
    CategoryIconOption("Heart", Icons.Outlined.FavoriteBorder),
    CategoryIconOption("Rocket", Icons.Outlined.RocketLaunch),
    CategoryIconOption("Code", Icons.Outlined.Code),
    CategoryIconOption("Star", Icons.Outlined.StarBorder),
    CategoryIconOption("Target", Icons.Outlined.TrackChanges),
    CategoryIconOption("Zap", Icons.Outlined.Bolt),
    CategoryIconOption("Coffee", Icons.Outlined.LocalCafe),
    CategoryIconOption("Music", Icons.Outlined.MusicNote)
)

fun getCategoryIcon(iconName: String): ImageVector {
    return CATEGORY_ICONS.find { it.name.equals(iconName, ignoreCase = true) }?.icon
        ?: Icons.Outlined.WorkOutline
}

@Composable
fun ProfileScreen(
    settings: AppSettings,
    projects: List<ProjectEntity>,
    backupStatusMessage: String,
    onUpdateSettings: (AppSettings) -> Unit,
    onSaveProject: (ProjectEntity) -> Unit,
    onDeleteProject: (String) -> Unit,
    onExportBackup: () -> Unit,
    onImportBackup: () -> Unit,
    onResetAllData: () -> Unit
) {
    var showProjectDialog by remember { mutableStateOf(false) }
    var projectToEdit by remember { mutableStateOf<ProjectEntity?>(null) }
    var projectToDelete by remember { mutableStateOf<ProjectEntity?>(null) }
    var showResetConfirm by remember { mutableStateOf(false) }
    var customDurationModal by remember { mutableStateOf<String?>(null) } // "work", "short", "long", "goal"
    var customValueNum by remember { mutableFloatStateOf(25f) }
    var customInputText by remember { mutableStateOf("25") }
    val uriHandler = LocalUriHandler.current

    val navBarBottom = WindowInsets.navigationBars.asPaddingValues().calculateBottomPadding()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(CanvasBg)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp)
            .padding(top = 52.dp, bottom = 148.dp + navBarBottom),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // ── Profile & Settings Header ──
        Column {
            Text(
                text = "PREFERENCES",
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium,
                letterSpacing = 1.2.sp,
                color = MossSecondary
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = "Settings",
                fontSize = 32.sp,
                lineHeight = 38.sp,
                fontWeight = FontWeight.Normal,
                letterSpacing = (-0.8).sp,
                color = InkDark
            )
        }

        // ── 0. APPEARANCE & THEME ──
        SectionCard(title = "APPEARANCE", icon = Icons.Outlined.Palette) {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "Theme Mode",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    color = InkDark
                )

                val themes = listOf(
                    Triple("system", "System", Icons.Outlined.BrightnessAuto),
                    Triple("light", "Light", Icons.Outlined.LightMode),
                    Triple("dark", "Dark", Icons.Outlined.DarkMode)
                )

                BoxWithConstraints(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(38.dp)
                        .inset(CircleShape, SurfaceSubtle, depth = 4.dp)
                        .padding(3.dp)
                ) {
                    val activeIdx = themes.indexOfFirst { it.first == settings.themeMode }.coerceAtLeast(0)
                    val tabWidth = maxWidth / themes.size
                    val pillOffset by animateDpAsState(
                        targetValue = tabWidth * activeIdx,
                        animationSpec = spring(
                            dampingRatio = 0.85f,
                            stiffness = Spring.StiffnessMedium
                        ),
                        label = "ThemePillOffset"
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
                        themes.forEach { (key, label, icon) ->
                            val isSelected = settings.themeMode == key
                            Row(
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxHeight()
                                    .clip(CircleShape)
                                    .clickable(
                                        interactionSource = remember { MutableInteractionSource() },
                                        indication = null
                                    ) { onUpdateSettings(settings.copy(themeMode = key)) },
                                horizontalArrangement = Arrangement.Center,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = icon,
                                    contentDescription = label,
                                    tint = if (isSelected) TextOnDark else MossSecondary,
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = label,
                                    fontSize = 11.sp,
                                    fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                                    color = if (isSelected) TextOnDark else MossSecondary
                                )
                            }
                        }
                    }
                }
            }
        }

        // ── 1. TIMER DURATIONS & SETUP ──
        SectionCard(title = "TIMER DURATIONS", icon = Icons.Outlined.Schedule) {
            DurationPresetRow(
                label = "Focus Session",
                currentVal = settings.workDuration,
                presets = listOf(20, 25, 45, 50, 60),
                unit = "m",
                onSelect = { onUpdateSettings(settings.copy(workDuration = it)) },
                onOpenCustom = {
                    customValueNum = settings.workDuration.toFloat()
                    customInputText = settings.workDuration.toString()
                    customDurationModal = "work"
                }
            )

            DurationPresetRow(
                label = "Short Break",
                currentVal = settings.shortBreakDuration,
                presets = listOf(3, 5, 10, 15),
                unit = "m",
                onSelect = { onUpdateSettings(settings.copy(shortBreakDuration = it)) },
                onOpenCustom = {
                    customValueNum = settings.shortBreakDuration.toFloat()
                    customInputText = settings.shortBreakDuration.toString()
                    customDurationModal = "short"
                }
            )

            DurationPresetRow(
                label = "Long Break",
                currentVal = settings.longBreakDuration,
                presets = listOf(15, 20, 30, 45),
                unit = "m",
                onSelect = { onUpdateSettings(settings.copy(longBreakDuration = it)) },
                onOpenCustom = {
                    customValueNum = settings.longBreakDuration.toFloat()
                    customInputText = settings.longBreakDuration.toString()
                    customDurationModal = "long"
                }
            )

            // Long Break Interval Cycles with Sliding Pill
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Long Break Interval", fontSize = 12.sp, fontWeight = FontWeight.Medium, color = InkDark)
                    Text(
                        "Every ${settings.longBreakInterval} sessions",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = InkDark
                    )
                }
                val cyclePresets = listOf(2, 3, 4, 5)
                val activeCycleIdx = cyclePresets.indexOf(settings.longBreakInterval).coerceAtLeast(0)
                BoxWithConstraints(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(34.dp)
                        .inset(CircleShape, SurfaceSubtle, depth = 5.dp)
                        .padding(4.dp)
                ) {
                    val slotWidth = maxWidth / cyclePresets.size
                    val pillOffset by animateDpAsState(
                        targetValue = slotWidth * activeCycleIdx,
                        animationSpec = spring(stiffness = 420f, dampingRatio = 0.85f),
                        label = "CyclePillOffset"
                    )
                    Box(
                        modifier = Modifier
                            .offset(x = pillOffset)
                            .width(slotWidth)
                            .fillMaxHeight()
                            .raisedDark(CircleShape, InkDark, elevation = 5.dp)
                    )
                    Row(
                        modifier = Modifier.fillMaxSize(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        cyclePresets.forEach { count ->
                            val isActive = settings.longBreakInterval == count
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxHeight()
                                    .clip(CircleShape)
                                    .clickable(
                                        interactionSource = remember { MutableInteractionSource() },
                                        indication = null
                                    ) { onUpdateSettings(settings.copy(longBreakInterval = count)) },
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "$count cycles",
                                    fontSize = 11.sp,
                                    fontWeight = if (isActive) FontWeight.Bold else FontWeight.Medium,
                                    color = if (isActive) TextOnDark else MossSecondary
                                )
                            }
                        }
                    }
                }
            }

            // Daily Target Goal with Sliding Pill
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Daily Target Goal", fontSize = 12.sp, fontWeight = FontWeight.Medium, color = InkDark)
                    Text(
                        "${String.format(Locale.US, "%.1f", settings.dailyGoalHours)}h / day",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = InkDark
                    )
                }
                val goalPresets = listOf(2.0f, 4.0f, 6.0f, 8.0f)
                val isCustomGoal = goalPresets.none { it == settings.dailyGoalHours }
                val activeGoalIdx = if (isCustomGoal) goalPresets.size else goalPresets.indexOf(settings.dailyGoalHours)
                val totalSlots = goalPresets.size + 1

                BoxWithConstraints(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(34.dp)
                        .inset(CircleShape, SurfaceSubtle, depth = 5.dp)
                        .padding(4.dp)
                ) {
                    val slotWidth = maxWidth / totalSlots
                    val pillOffset by animateDpAsState(
                        targetValue = slotWidth * activeGoalIdx,
                        animationSpec = spring(stiffness = 420f, dampingRatio = 0.85f),
                        label = "GoalPillOffset"
                    )
                    Box(
                        modifier = Modifier
                            .offset(x = pillOffset)
                            .width(slotWidth)
                            .fillMaxHeight()
                            .raisedDark(CircleShape, InkDark, elevation = 5.dp)
                    )
                    Row(
                        modifier = Modifier.fillMaxSize(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        goalPresets.forEach { h ->
                            val isActive = settings.dailyGoalHours == h
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxHeight()
                                    .clip(CircleShape)
                                    .clickable(
                                        interactionSource = remember { MutableInteractionSource() },
                                        indication = null
                                    ) { onUpdateSettings(settings.copy(dailyGoalHours = h)) },
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "${h.toInt()}h",
                                    fontSize = 11.sp,
                                    fontWeight = if (isActive) FontWeight.Bold else FontWeight.Medium,
                                    color = if (isActive) TextOnDark else MossSecondary
                                )
                            }
                        }
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxHeight()
                                .clip(CircleShape)
                                .clickable(
                                    interactionSource = remember { MutableInteractionSource() },
                                    indication = null
                                ) {
                                    customValueNum = settings.dailyGoalHours
                                    customInputText = settings.dailyGoalHours.toString()
                                    customDurationModal = "goal"
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = if (isCustomGoal) "${settings.dailyGoalHours}h" else "Custom",
                                fontSize = 11.sp,
                                fontWeight = if (isCustomGoal) FontWeight.Bold else FontWeight.Medium,
                                color = if (isCustomGoal) TextOnDark else MossSecondary
                            )
                        }
                    }
                }
            }
        }

        // ── 2. FOCUS RULES & BEHAVIOR ──
        SectionCard(title = "FOCUS RULES & BEHAVIOR", icon = Icons.Outlined.Shield) {
            SettingToggleRow(
                title = "Strict Focus Mode",
                subtitle = "Syncs with timer toggle; alerts and pauses on app exit",
                checked = settings.strictMode,
                onCheckedChange = { onUpdateSettings(settings.copy(strictMode = it)) }
            )
            HorizontalDivider(thickness = 1.dp, color = BorderHairline.copy(alpha = 0.5f))
            SettingToggleRow(
                title = "Auto-Start Breaks",
                subtitle = "Begin break countdown automatically when focus ends",
                checked = settings.autoStartBreaks,
                onCheckedChange = { onUpdateSettings(settings.copy(autoStartBreaks = it)) }
            )
            HorizontalDivider(thickness = 1.dp, color = BorderHairline.copy(alpha = 0.5f))
            SettingToggleRow(
                title = "Auto-Start Focus",
                subtitle = "Begin next focus session automatically when break ends",
                checked = settings.autoStartPomodoros,
                onCheckedChange = { onUpdateSettings(settings.copy(autoStartPomodoros = it)) }
            )
            HorizontalDivider(thickness = 1.dp, color = BorderHairline.copy(alpha = 0.5f))
            SettingToggleRow(
                title = "Keep Screen Awake",
                subtitle = "Prevent display from sleeping during active sessions",
                checked = settings.keepAwake,
                onCheckedChange = { onUpdateSettings(settings.copy(keepAwake = it)) }
            )
            HorizontalDivider(thickness = 1.dp, color = BorderHairline.copy(alpha = 0.5f))
            SettingToggleRow(
                title = "Live Notification",
                subtitle = "Display ongoing timer progress in notification tray",
                checked = settings.liveNotification,
                onCheckedChange = { onUpdateSettings(settings.copy(liveNotification = it)) }
            )
        }

        // ── 3. SOUND & ATMOSPHERE ──
        SectionCard(title = "SOUND & ATMOSPHERE", icon = Icons.Outlined.Headphones) {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                SOUNDSCAPE_OPTIONS.chunked(3).forEach { rowItems ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        rowItems.forEach { opt ->
                            val isSelected = settings.soundscape == opt.id
                            Row(
                                modifier = Modifier
                                    .weight(1f)
                                    .height(38.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(if (isSelected) InkDark else CanvasBg)
                                    .border(
                                        1.dp,
                                        if (isSelected) InkDark else BorderHairline.copy(alpha = 0.7f),
                                        RoundedCornerShape(12.dp)
                                    )
                                    .clickable { onUpdateSettings(settings.copy(soundscape = opt.id)) },
                                horizontalArrangement = Arrangement.Center,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = opt.icon,
                                    contentDescription = null,
                                    tint = if (isSelected) TextOnDark else MossSecondary,
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = opt.label,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = if (isSelected) TextOnDark else MossSecondary
                                )
                            }
                        }
                    }
                }
            }

            var localVolume by remember(settings.soundVolume) { mutableFloatStateOf(settings.soundVolume) }
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Icon(
                    imageVector = Icons.Outlined.VolumeOff,
                    contentDescription = null,
                    tint = SoftSage,
                    modifier = Modifier.size(16.dp)
                )
                Slider(
                    value = localVolume,
                    onValueChange = { localVolume = it },
                    onValueChangeFinished = {
                        onUpdateSettings(settings.copy(soundVolume = localVolume))
                    },
                    valueRange = 0f..1f,
                    modifier = Modifier.weight(1f),
                    colors = SliderDefaults.colors(
                        thumbColor = InkDark,
                        activeTrackColor = InkDark,
                        inactiveTrackColor = SurfaceSubtle
                    )
                )
                Icon(
                    imageVector = Icons.Outlined.VolumeUp,
                    contentDescription = null,
                    tint = MossSecondary,
                    modifier = Modifier.size(16.dp)
                )
                Text(
                    text = "${(localVolume * 100).roundToInt()}%",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = InkDark,
                    modifier = Modifier.width(36.dp),
                    textAlign = TextAlign.End
                )
            }
        }

        // ── 4. FOCUS CATEGORIES / PROJECTS ──
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .raised(RoundedCornerShape(18.dp), SurfaceWhite, elevation = 11.dp)
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "FOCUS CATEGORIES",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.ExtraBold,
                    letterSpacing = 1.2.sp,
                    color = SoftSage
                )
                Row(
                    modifier = Modifier
                        .clickable {
                            projectToEdit = null
                            showProjectDialog = true
                        }
                        .padding(4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        imageVector = Icons.Filled.Add,
                        contentDescription = "Add Category",
                        tint = InkDark,
                        modifier = Modifier.size(14.dp)
                    )
                    Text(
                        text = "Add",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = InkDark
                    )
                }
            }

            HorizontalDivider(thickness = 1.dp, color = BorderHairline.copy(alpha = 0.6f))

            projects.forEach { proj ->
                val projColor = parseHexColor(proj.color)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .inset(RoundedCornerShape(12.dp), CanvasBg, depth = 4.dp)
                        .padding(horizontal = 14.dp),
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
                                .size(10.dp)
                                .clip(CircleShape)
                                .background(projColor)
                        )
                        Text(
                            text = proj.displayName,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = InkDark,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .clip(CircleShape)
                                .background(SurfaceWhite)
                                .border(1.dp, BorderHairline.copy(alpha = 0.6f), CircleShape)
                                .clickable {
                                    projectToEdit = proj
                                    showProjectDialog = true
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.Edit,
                                contentDescription = "Edit category",
                                tint = MossSecondary,
                                modifier = Modifier.size(13.dp)
                            )
                        }
                        if (projects.size > 1) {
                            Box(
                                modifier = Modifier
                                    .size(28.dp)
                                    .clip(CircleShape)
                                    .background(SurfaceWhite)
                                    .border(1.dp, BorderHairline.copy(alpha = 0.6f), CircleShape)
                                    .clickable { projectToDelete = proj },
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Outlined.DeleteOutline,
                                    contentDescription = "Delete category",
                                    tint = ErrorRed,
                                    modifier = Modifier.size(14.dp)
                                )
                            }
                        }
                    }
                }
            }
        }

        // ── 5. DATA MANAGEMENT (BACKUP / RESTORE / RESET) ──
        SectionCard(title = "DATA MANAGEMENT", icon = Icons.Outlined.Storage) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = onExportBackup,
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = InkDark),
                    modifier = Modifier
                        .weight(1f)
                        .height(40.dp)
                ) {
                    Icon(
                        imageVector = Icons.Outlined.FileDownload,
                        contentDescription = null,
                        tint = TextOnDark,
                        modifier = Modifier.size(15.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Export", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = TextOnDark)
                }

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(40.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(CanvasBg)
                        .border(1.dp, BorderHairline.copy(alpha = 0.8f), RoundedCornerShape(12.dp))
                        .clickable { onImportBackup() },
                    contentAlignment = Alignment.Center
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.FileUpload,
                            contentDescription = null,
                            tint = InkDark,
                            modifier = Modifier.size(15.dp)
                        )
                        Text("Restore", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = InkDark)
                    }
                }
            }

            if (backupStatusMessage.isNotBlank()) {
                Text(
                    text = backupStatusMessage,
                    fontSize = 11.sp,
                    color = if (backupStatusMessage.startsWith("Error")) ErrorRed else ActivityGreen,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            }

            HorizontalDivider(thickness = 1.dp, color = BorderHairline.copy(alpha = 0.6f))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Wipe All Data", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = InkDark)
                    Text("Delete all tasks and telemetry", fontSize = 10.sp, color = SoftSage)
                }

                Box(
                    modifier = Modifier
                        .height(28.dp)
                        .clip(CircleShape)
                        .background(ErrorRed.copy(alpha = 0.1f))
                        .border(1.dp, ErrorRed.copy(alpha = 0.25f), CircleShape)
                        .clickable { showResetConfirm = true }
                        .padding(horizontal = 14.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "RESET",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp,
                        color = ErrorRed
                    )
                }
            }
        }

        // ── App Version & Credit Footer (matching ProfileView.jsx) ──
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 28.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = buildAnnotatedString {
                    append("Focus 1.0.2 by ")
                    withStyle(SpanStyle(color = InkDark, fontWeight = FontWeight.Bold)) {
                        append("Muhamad Yazri")
                    }
                },
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium,
                color = MossSecondary
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = "Make for smooth flowwwwwwwwwwwwwww.",
                fontSize = 10.sp,
                color = SoftSage
            )
            Spacer(modifier = Modifier.height(14.dp))
            Row(
                horizontalArrangement = Arrangement.spacedBy(18.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // GitHub
                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .clip(CircleShape)
                        .clickable { runCatching { uriHandler.openUri("https://github.com/muhamadyazri") } },
                    contentAlignment = Alignment.Center
                ) {
                    SocialSvgIcon(type = "github", tint = SoftSage, modifier = Modifier.size(16.dp))
                }
                // Instagram
                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .clip(CircleShape)
                        .clickable { runCatching { uriHandler.openUri("https://www.instagram.com/Yqzriii") } },
                    contentAlignment = Alignment.Center
                ) {
                    SocialSvgIcon(type = "instagram", tint = SoftSage, modifier = Modifier.size(16.dp))
                }
                // LinkedIn
                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .clip(CircleShape)
                        .clickable { runCatching { uriHandler.openUri("https://www.linkedin.com/in/muhamad-yazri-165b4b34b") } },
                    contentAlignment = Alignment.Center
                ) {
                    SocialSvgIcon(type = "linkedin", tint = SoftSage, modifier = Modifier.size(16.dp))
                }
            }

            Spacer(modifier = Modifier.height(28.dp))

            // ── Full-Width 3D Brutalist "FOCUS" Banner at Very Bottom (Pure Vector) ──
            // Uses exact vector curves from Styro font; perfectly centered and scaled to full phone width
            val isDark = FocusTheme.colors.isDark

            // High contrast brutalist depth colors tailored specifically for dark and light canvases
            val bevelTopColor = if (isDark) Color(0xFF42423E) else Color(0xFFC8C6BD)
            val bevelMidColor = if (isDark) Color(0xFF242420) else Color(0xFF9E9C92)
            val bevelBottomColor = if (isDark) Color(0xFF10100E) else Color(0xFF5A5852)
            val fakeShadowColor = if (isDark) Color(0xFF000000).copy(alpha = 0.95f) else Color(0xFF1E1E1C).copy(alpha = 0.55f)

            // The Canvas lives inside the 20.dp page padding. Rather than fighting layout constraints
            // (which caused an off-center shift), it simply draws past its own bounds by exactly that
            // padding so the vector is measured against the true full screen width.
            Canvas(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(152.dp)
            ) {
                val pagePaddingPx = 20.dp.toPx()
                val screenWidthPx = size.width + pagePaddingPx * 2f

                // Vector coordinates: 0..2160 width, 0..735 height
                // Equal 16.dp margins on both phone edges, measured against the real screen width.
                val sideMarginPx = 16.dp.toPx()
                val availableWidth = (screenWidthPx - sideMarginPx * 2f).coerceAtLeast(1f)
                val scale = availableWidth / FOCUS_VECTOR_WIDTH
                val scaledHeight = FOCUS_VECTOR_HEIGHT * scale

                // Screen-centered horizontally (canvas origin sits `pagePaddingPx` inside the screen)
                val targetX = sideMarginPx - pagePaddingPx
                val targetY = (size.height - scaledHeight) / 2f

                // Layer 1: 3D Extrusion Deep Shadow (Pitch Carbon)
                drawContext.canvas.save()
                drawContext.canvas.translate(targetX, targetY + 9f)
                drawContext.canvas.scale(scale, scale)
                drawPath(path = FocusVectorPath, color = fakeShadowColor)
                drawContext.canvas.restore()

                // Layer 2: 3D Extrusion Intermediate Rim
                drawContext.canvas.save()
                drawContext.canvas.translate(targetX, targetY + 4.5f)
                drawContext.canvas.scale(scale, scale)
                drawPath(path = FocusVectorPath, color = bevelBottomColor)
                drawContext.canvas.restore()

                // Layer 3: Top Beveled Face (High-contrast vertical gradient)
                drawContext.canvas.save()
                drawContext.canvas.translate(targetX, targetY)
                drawContext.canvas.scale(scale, scale)
                drawPath(
                    path = FocusVectorPath,
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            bevelTopColor,
                            bevelMidColor,
                            bevelBottomColor
                        ),
                        startY = 0f,
                        endY = FOCUS_VECTOR_HEIGHT
                    )
                )
                drawContext.canvas.restore()
            }
        }
    }

    // ── Project Create/Edit Modal (matching ProjectModal.jsx) ──
    if (showProjectDialog) {
        ProjectCategoryDialog(
            projectToEdit = projectToEdit,
            onDismiss = { showProjectDialog = false },
            onSave = { saved ->
                onSaveProject(saved)
                showProjectDialog = false
            }
        )
    }

    // ── Delete Category Confirmation Modal (Apple Alert Style) ──
    projectToDelete?.let { target ->
        Dialog(onDismissRequest = { projectToDelete = null }) {
            Column(
                modifier = Modifier
                    .width(310.dp)
                    .clip(RoundedCornerShape(22.dp))
                    .background(SurfaceWhite)
                    .border(1.dp, BorderHairline, RoundedCornerShape(22.dp)),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Column(
                    modifier = Modifier.padding(horizontal = 24.dp, vertical = 22.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(52.dp)
                            .clip(CircleShape)
                            .background(ErrorRed.copy(alpha = 0.1f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.DeleteOutline,
                            contentDescription = null,
                            tint = ErrorRed,
                            modifier = Modifier.size(24.dp)
                        )
                    }

                    Text(
                        text = "Delete \"${target.displayName}\"?",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = (-0.4).sp,
                        color = InkDark,
                        textAlign = TextAlign.Center,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )

                    Text(
                        text = "This category will be permanently removed and any active tasks will be reassigned to your primary category.",
                        fontSize = 13.sp,
                        lineHeight = 18.sp,
                        color = MossSecondary,
                        textAlign = TextAlign.Center
                    )
                }

                HorizontalDivider(thickness = 0.8.dp, color = BorderHairline)

                // Apple Alert Action Row (Side by side with vertical divider)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                            .clickable { projectToDelete = null },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Cancel",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Normal,
                            color = InkDark
                        )
                    }

                    Box(
                        modifier = Modifier
                            .width(0.8.dp)
                            .fillMaxHeight()
                            .background(BorderHairline)
                    )

                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                            .clickable {
                                onDeleteProject(target.id)
                                projectToDelete = null
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Delete",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = ErrorRed
                        )
                    }
                }
            }
        }
    }

    // ── Custom Duration / Goal Stepper Dialog (matching ProfileView.jsx) ──
    customDurationModal?.let { modalKey ->
        val isGoal = modalKey == "goal"
        val title = when (modalKey) {
            "work" -> "Focus Session"
            "short" -> "Short Break"
            "long" -> "Long Break"
            else -> "Daily Target Goal"
        }
        val unit = if (isGoal) "h" else "m"
        val minVal = if (isGoal) 0.5f else 1f
        val maxVal = when (modalKey) {
            "work" -> 180f
            "short" -> 60f
            "long" -> 90f
            else -> 16f
        }
        val stepVal = if (isGoal) 0.5f else if (modalKey == "work") 5f else 1f

        Dialog(onDismissRequest = { customDurationModal = null }) {
            Column(
                modifier = Modifier
                    .width(280.dp)
                    .clip(RoundedCornerShape(28.dp))
                    .background(SurfaceWhite)
                    .border(1.dp, BorderHairline, RoundedCornerShape(28.dp))
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(18.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Column {
                        Text(
                            text = "CUSTOM VALUE",
                            fontSize = 9.sp,
                            fontWeight = FontWeight.ExtraBold,
                            letterSpacing = 1.5.sp,
                            color = SoftSage
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = title,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.ExtraBold,
                            letterSpacing = (-0.3).sp,
                            color = InkDark
                        )
                    }
                    Box(
                        modifier = Modifier
                            .size(28.dp)
                            .clip(CircleShape)
                            .background(SurfaceSubtle)
                            .clickable { customDurationModal = null },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.Close,
                            contentDescription = "Close",
                            tint = MossSecondary,
                            modifier = Modifier.size(14.dp)
                        )
                    }
                }

                // Stepper Row (- | Editable 30sp value + unit | +)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(CircleShape)
                            .background(SurfaceSubtle)
                            .clickable {
                                val next = ((customValueNum - stepVal) * 10f).roundToInt() / 10f
                                val clamped = next.coerceIn(minVal, maxVal)
                                customValueNum = clamped
                                customInputText = if (isGoal) clamped.toString() else clamped.toInt().toString()
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Text("−", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = InkDark)
                    }

                    Row(
                        verticalAlignment = Alignment.Bottom,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        BasicTextField(
                            value = customInputText,
                            onValueChange = { txt ->
                                customInputText = txt
                                txt.toFloatOrNull()?.let { customValueNum = it }
                            },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            textStyle = TextStyle(
                                fontSize = 30.sp,
                                fontWeight = FontWeight.ExtraBold,
                                letterSpacing = (-1).sp,
                                color = InkDark,
                                textAlign = TextAlign.Center
                            ),
                            modifier = Modifier
                                .width(84.dp)
                                .border(width = 1.dp, color = Color.Transparent)
                        )
                        Text(
                            text = unit,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = SoftSage,
                            modifier = Modifier.padding(bottom = 4.dp)
                        )
                    }

                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(CircleShape)
                            .background(SurfaceSubtle)
                            .clickable {
                                val next = ((customValueNum + stepVal) * 10f).roundToInt() / 10f
                                val clamped = next.coerceIn(minVal, maxVal)
                                customValueNum = clamped
                                customInputText = if (isGoal) clamped.toString() else clamped.toInt().toString()
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Add,
                            contentDescription = "Increase",
                            tint = InkDark,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(40.dp)
                        .clip(CircleShape)
                        .background(InkDark)
                        .clickable {
                            val parsed = customInputText.toFloatOrNull() ?: customValueNum
                            val clamped = parsed.coerceIn(minVal, maxVal)
                            when (modalKey) {
                                "work" -> onUpdateSettings(settings.copy(workDuration = clamped.roundToInt()))
                                "short" -> onUpdateSettings(settings.copy(shortBreakDuration = clamped.roundToInt()))
                                "long" -> onUpdateSettings(settings.copy(longBreakDuration = clamped.roundToInt()))
                                "goal" -> onUpdateSettings(
                                    settings.copy(dailyGoalHours = (clamped * 2f).roundToInt() / 2f)
                                )
                            }
                            customDurationModal = null
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Text("Save", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextOnDark)
                }
            }
        }
    }

    // ── Reset Confirmation Dialog (Apple Alert Style) ──
    if (showResetConfirm) {
        Dialog(onDismissRequest = { showResetConfirm = false }) {
            Column(
                modifier = Modifier
                    .width(310.dp)
                    .clip(RoundedCornerShape(22.dp))
                    .background(SurfaceWhite)
                    .border(1.dp, BorderHairline, RoundedCornerShape(22.dp)),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Column(
                    modifier = Modifier.padding(horizontal = 24.dp, vertical = 22.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(52.dp)
                            .clip(CircleShape)
                            .background(ErrorRed.copy(alpha = 0.1f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.WarningAmber,
                            contentDescription = null,
                            tint = ErrorRed,
                            modifier = Modifier.size(24.dp)
                        )
                    }

                    Text(
                        text = "Reset All Data?",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = (-0.4).sp,
                        color = InkDark,
                        textAlign = TextAlign.Center
                    )

                    Text(
                        text = "All tasks, completed sessions, and focus metrics will be permanently erased. This action cannot be reversed.",
                        fontSize = 13.sp,
                        lineHeight = 18.sp,
                        color = MossSecondary,
                        textAlign = TextAlign.Center
                    )
                }

                HorizontalDivider(thickness = 0.8.dp, color = BorderHairline)

                // Apple Alert Action Row (Side by side with vertical divider)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                            .clickable { showResetConfirm = false },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Cancel",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Normal,
                            color = InkDark
                        )
                    }

                    Box(
                        modifier = Modifier
                            .width(0.8.dp)
                            .fillMaxHeight()
                            .background(BorderHairline)
                    )

                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                            .clickable {
                                showResetConfirm = false
                                onResetAllData()
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Reset",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = ErrorRed
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ProjectCategoryDialog(
    projectToEdit: ProjectEntity?,
    onDismiss: () -> Unit,
    onSave: (ProjectEntity) -> Unit
) {
    var projName by remember(projectToEdit) {
        mutableStateOf(projectToEdit?.displayName ?: "")
    }
    var projColor by remember(projectToEdit) {
        mutableStateOf(projectToEdit?.color ?: PROJECT_SWATCHES.first())
    }
    val projIcon = projectToEdit?.icon?.takeIf { it.isNotBlank() } ?: "Briefcase"

    Dialog(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(24.dp))
                .background(SurfaceWhite)
                .border(1.dp, BorderHairline, RoundedCornerShape(24.dp))
                .padding(22.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Apple Modal Header: Title + Close Icon
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = if (projectToEdit != null) "Edit Category" else "New Category",
                        fontSize = 19.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = (-0.4).sp,
                        color = InkDark
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "Customize category details and color theme.",
                        fontSize = 13.sp,
                        lineHeight = 17.sp,
                        color = MossSecondary
                    )
                }
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(SurfaceSubtle)
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

            // Apple Inset Grouped: Category Name Field
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    text = "CATEGORY NAME",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 0.8.sp,
                    color = MossSecondary
                )
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(CanvasBg)
                        .padding(horizontal = 14.dp, vertical = 13.dp),
                    contentAlignment = Alignment.CenterStart
                ) {
                    BasicTextField(
                        value = projName,
                        onValueChange = { projName = it },
                        singleLine = true,
                        textStyle = TextStyle(
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Medium,
                            color = InkDark
                        ),
                        cursorBrush = androidx.compose.ui.graphics.SolidColor(InkDark),
                        decorationBox = { innerTextField ->
                            if (projName.isEmpty()) {
                                Text(
                                    text = "e.g., Design, Coding, Reading...",
                                    fontSize = 15.sp,
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

            // Apple Color Swatches Palette (Concentric ring selection)
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    text = "COLOR THEME",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 0.8.sp,
                    color = MossSecondary
                )
                PROJECT_SWATCHES.chunked(6).forEach { rowColors ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        rowColors.forEach { hex ->
                            val isSel = projColor.equals(hex, ignoreCase = true)
                            Box(
                                modifier = Modifier
                                    .size(38.dp)
                                    .then(
                                        if (isSel) {
                                            Modifier
                                                .border(2.dp, InkDark, CircleShape)
                                                .padding(3.dp)
                                        } else {
                                            Modifier.padding(3.dp)
                                        }
                                    )
                                    .clip(CircleShape)
                                    .background(parseHexColor(hex))
                                    .clickable { projColor = hex },
                                contentAlignment = Alignment.Center
                            ) {
                                if (isSel) {
                                    Icon(
                                        imageVector = Icons.Filled.Check,
                                        contentDescription = null,
                                        tint = SurfaceWhite,
                                        modifier = Modifier.size(14.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Apple Action Buttons: Side-by-side rounded pill buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(46.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(SurfaceSubtle)
                        .clickable { onDismiss() },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Cancel",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = InkDark
                    )
                }

                val canSave = projName.isNotBlank()
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(46.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(if (canSave) InkDark else SurfaceSubtle)
                        .clickable(enabled = canSave) {
                            onSave(
                                ProjectEntity(
                                    id = projectToEdit?.id ?: "proj-${System.currentTimeMillis()}",
                                    name = projName.trim(),
                                    color = projColor,
                                    icon = projIcon,
                                    pomodoros = projectToEdit?.pomodoros ?: 0
                                )
                            )
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = if (projectToEdit != null) "Save" else "Create",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (canSave) TextOnDark else SoftSage
                    )
                }
            }
        }
    }
}

@Composable
private fun SectionCard(
    title: String,
    icon: ImageVector,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .raised(RoundedCornerShape(18.dp), SurfaceWhite, elevation = 11.dp)
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = title,
                fontSize = 11.sp,
                fontWeight = FontWeight.ExtraBold,
                letterSpacing = 1.2.sp,
                color = SoftSage
            )
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MossSecondary,
                modifier = Modifier.size(15.dp)
            )
        }
        HorizontalDivider(thickness = 1.dp, color = BorderHairline.copy(alpha = 0.6f))
        content()
    }
}

@Composable
private fun DurationPresetRow(
    label: String,
    currentVal: Int,
    presets: List<Int>,
    unit: String,
    onSelect: (Int) -> Unit,
    onOpenCustom: () -> Unit
) {
    val isCustom = !presets.contains(currentVal)
    val activeIdx = if (isCustom) presets.size else presets.indexOf(currentVal)
    val totalSlots = presets.size + 1

    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(label, fontSize = 12.sp, fontWeight = FontWeight.Medium, color = InkDark)
            Text("$currentVal$unit", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = InkDark)
        }

        BoxWithConstraints(
            modifier = Modifier
                .fillMaxWidth()
                .height(34.dp)
                .inset(CircleShape, SurfaceSubtle, depth = 5.dp)
                .padding(4.dp)
        ) {
            val slotWidth = maxWidth / totalSlots
            val pillOffset by animateDpAsState(
                targetValue = slotWidth * activeIdx,
                animationSpec = spring(stiffness = 420f, dampingRatio = 0.85f),
                label = "DurationPillOffset"
            )

            Box(
                modifier = Modifier
                    .offset(x = pillOffset)
                    .width(slotWidth)
                    .fillMaxHeight()
                    .raisedDark(CircleShape, InkDark, elevation = 5.dp)
            )

            Row(
                modifier = Modifier.fillMaxSize(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                presets.forEach { p ->
                    val isActive = currentVal == p
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                            .clip(CircleShape)
                            .clickable(
                                interactionSource = remember { MutableInteractionSource() },
                                indication = null
                            ) { onSelect(p) },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "$p$unit",
                            fontSize = 11.sp,
                            fontWeight = if (isActive) FontWeight.Bold else FontWeight.Medium,
                            color = if (isActive) TextOnDark else MossSecondary
                        )
                    }
                }
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight()
                        .clip(CircleShape)
                        .clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication = null
                        ) { onOpenCustom() },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = if (isCustom) "$currentVal$unit" else "Custom",
                        fontSize = 11.sp,
                        fontWeight = if (isCustom) FontWeight.Bold else FontWeight.Medium,
                        color = if (isCustom) TextOnDark else MossSecondary
                    )
                }
            }
        }
    }
}

@Composable
private fun SettingToggleRow(
    title: String,
    subtitle: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    val thumbOffset by animateDpAsState(
        targetValue = if (checked) 22.dp else 2.dp,
        animationSpec = spring(
            stiffness = Spring.StiffnessMedium,
            dampingRatio = 0.8f
        ),
        label = "CustomSwitchThumb"
    )

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(
            modifier = Modifier
                .weight(1f)
                .padding(end = 14.dp),
            verticalArrangement = Arrangement.spacedBy(1.dp)
        ) {
            Text(
                text = title,
                fontSize = 15.sp,
                lineHeight = 18.sp,
                letterSpacing = (-0.35).sp,
                fontWeight = FontWeight.SemiBold,
                color = InkDark
            )
            Text(
                text = subtitle,
                fontSize = 12.sp,
                lineHeight = 15.sp,
                letterSpacing = (-0.15).sp,
                color = SoftSage
            )
        }

        // Custom 44x24dp switch matching ProfileView.jsx
        Box(
            modifier = Modifier
                .width(44.dp)
                .height(24.dp)
                .inset(CircleShape, if (checked) InkDark else TrackGroove, depth = 3.dp)
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null
                ) { onCheckedChange(!checked) },
            contentAlignment = Alignment.CenterStart
        ) {
            Box(
                modifier = Modifier
                    .offset(x = thumbOffset)
                    .size(20.dp)
                    .raised(CircleShape, SurfaceWhite, elevation = 4.dp)
            )
        }
    }
}

@Composable
private fun SocialSvgIcon(
    type: String,
    tint: Color,
    modifier: Modifier = Modifier
) {
    Canvas(modifier = modifier) {
        val sx = size.width / 24f
        val sy = size.height / 24f
        val stroke = Stroke(width = 1.8f * sx, cap = StrokeCap.Round, join = StrokeJoin.Round)

        when (type) {
            "github" -> {
                // Official GitHub Octocat silhouette
                val p = Path().apply {
                    moveTo(12f * sx, 2f * sy)
                    cubicTo(6.477f * sx, 2f * sy, 2f * sx, 6.484f * sy, 2f * sx, 12.017f * sy)
                    cubicTo(2f * sx, 16.447f * sy, 4.871f * sx, 20.198f * sy, 8.855f * sx, 21.528f * sy)
                    cubicTo(9.355f * sx, 21.621f * sy, 9.537f * sx, 21.311f * sy, 9.537f * sx, 21.045f * sy)
                    cubicTo(9.537f * sx, 20.803f * sy, 9.528f * sx, 20.161f * sy, 9.524f * sx, 19.313f * sy)
                    cubicTo(6.742f * sx, 19.917f * sy, 6.155f * sx, 17.973f * sy, 6.155f * sx, 17.973f * sy)
                    cubicTo(5.7f * sx, 16.818f * sy, 5.044f * sx, 16.51f * sy, 5.044f * sx, 16.51f * sy)
                    cubicTo(4.136f * sx, 15.889f * sy, 5.113f * sx, 15.902f * sy, 5.113f * sx, 15.902f * sy)
                    cubicTo(6.117f * sx, 15.973f * sy, 6.645f * sx, 16.935f * sy, 6.645f * sx, 16.935f * sy)
                    cubicTo(7.538f * sx, 18.463f * sy, 8.986f * sx, 18.022f * sy, 9.556f * sx, 17.766f * sy)
                    cubicTo(9.647f * sx, 17.119f * sy, 9.905f * sx, 16.678f * sy, 10.191f * sx, 16.428f * sy)
                    cubicTo(7.971f * sx, 16.176f * sy, 5.637f * sx, 15.318f * sy, 5.637f * sx, 11.488f * sy)
                    cubicTo(5.637f * sx, 10.397f * sy, 6.027f * sx, 9.505f * sy, 6.666f * sx, 8.807f * sy)
                    cubicTo(6.563f * sx, 8.555f * sy, 6.22f * sx, 7.538f * sy, 6.764f * sy, 6.162f * sy)
                    cubicTo(6.764f * sx, 6.162f * sy, 7.603f * sx, 5.893f * sy, 9.512f * sy, 7.186f * sy)
                    cubicTo(10.309f * sx, 6.964f * sy, 11.155f * sx, 6.854f * sy, 12f * sx, 6.85f * sy)
                    cubicTo(12.845f * sx, 6.854f * sy, 13.691f * sx, 6.964f * sy, 14.489f * sx, 7.186f * sy)
                    cubicTo(16.397f * sx, 5.893f * sy, 17.234f * sx, 6.162f * sy, 17.234f * sx, 6.162f * sy)
                    cubicTo(17.779f * sx, 7.538f * sy, 17.437f * sx, 8.555f * sy, 17.334f * sx, 8.807f * sy)
                    cubicTo(17.975f * sx, 9.505f * sy, 18.361f * sx, 10.397f * sy, 18.361f * sx, 11.488f * sy)
                    cubicTo(18.361f * sx, 15.328f * sy, 16.023f * sx, 16.172f * sy, 13.796f * sx, 16.42f * sy)
                    cubicTo(14.154f * sx, 16.729f * sy, 14.473f * sx, 17.339f * sy, 14.473f * sx, 18.271f * sy)
                    cubicTo(14.473f * sx, 19.617f * sy, 14.46f * sx, 20.704f * sy, 14.46f * sy, 21.045f * sy)
                    cubicTo(14.46f * sx, 21.314f * sy, 14.64f * sx, 21.627f * sy, 15.149f * sx, 21.527f * sy)
                    cubicTo(19.129f * sx, 20.194f * sy, 22f * sx, 16.445f * sy, 22f * sx, 12.017f * sy)
                    cubicTo(22f * sx, 6.484f * sy, 17.523f * sy, 2f * sy, 12f * sx, 2f * sy)
                    close()
                }
                drawPath(path = p, color = tint)
            }
            "instagram" -> {
                drawRoundRect(
                    color = tint,
                    topLeft = Offset(2f * sx, 2f * sy),
                    size = Size(20f * sx, 20f * sy),
                    cornerRadius = CornerRadius(5f * sx, 5f * sy),
                    style = stroke
                )
                drawCircle(
                    color = tint,
                    radius = 4f * sx,
                    center = Offset(12f * sx, 12f * sy),
                    style = stroke
                )
                drawCircle(
                    color = tint,
                    radius = 1.2f * sx,
                    center = Offset(17.5f * sx, 6.5f * sy)
                )
            }
            "linkedin" -> {
                drawRoundRect(
                    color = tint,
                    topLeft = Offset(2f * sx, 2f * sy),
                    size = Size(20f * sx, 20f * sy),
                    cornerRadius = CornerRadius(4f * sx, 4f * sy),
                    style = stroke
                )
                drawLine(
                    color = tint,
                    start = Offset(8f * sx, 11f * sy),
                    end = Offset(8f * sx, 16f * sy),
                    strokeWidth = 1.8f * sx,
                    cap = StrokeCap.Round
                )
                drawCircle(
                    color = tint,
                    radius = 1.2f * sx,
                    center = Offset(8f * sx, 8f * sy)
                )
                val path = Path().apply {
                    moveTo(12f * sx, 16f * sy)
                    lineTo(12f * sx, 11f * sy)
                    lineTo(16f * sx, 11f * sy)
                    lineTo(16f * sx, 16f * sy)
                }
                drawPath(path = path, color = tint, style = stroke)
            }
        }
    }
}
