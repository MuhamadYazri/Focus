package com.yazri.focus.ui.timer

import android.content.res.Configuration
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.BoundsTransform
import androidx.compose.animation.ExperimentalSharedTransitionApi
import androidx.compose.animation.SharedTransitionLayout
import androidx.compose.animation.SharedTransitionScope
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.yazri.focus.data.local.entities.TaskEntity
import com.yazri.focus.service.SoundEngine
import com.yazri.focus.ui.components.RollingTwoDigits
import com.yazri.focus.ui.theme.*
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlin.math.roundToInt

data class SoundscapeOption(
    val id: String,
    val label: String,
    val icon: ImageVector,
)

val SOUNDSCAPE_OPTIONS =
    listOf(
        SoundscapeOption("none", "Silent", Icons.Outlined.VolumeOff),
        SoundscapeOption("forest", "Forest", Icons.Outlined.Park),
        SoundscapeOption("rain", "Rain", Icons.Outlined.WaterDrop),
        SoundscapeOption("waves", "Waves", Icons.Outlined.Waves),
        SoundscapeOption("cafe", "Cafe", Icons.Outlined.LocalCafe),
        SoundscapeOption("clock", "Ticking", Icons.Outlined.Schedule),
    )

private val MODE_TABS =
    listOf(
        "work" to "Focus",
        "shortBreak" to "Short",
        "longBreak" to "Long",
    )

@OptIn(ExperimentalSharedTransitionApi::class)
@Composable
fun TimerScreen(
    mode: String,
    timeLeft: Int,
    totalTime: Int,
    isRunning: Boolean,
    cycleCount: Int,
    longBreakInterval: Int,
    currentSound: String,
    soundVolume: Float,
    strictMode: Boolean,
    isNavHidden: Boolean,
    activeTask: TaskEntity? = null,
    tasks: List<TaskEntity> = emptyList(),
    soundEngine: SoundEngine,
    onTogglePlay: (String?) -> Unit,
    onReset: () -> Unit,
    onSkip: () -> Unit,
    onModeChange: (String) -> Unit,
    onSelectSound: (String) -> Unit,
    onChangeVolume: (Float) -> Unit,
    onToggleStrictMode: () -> Unit,
    onToggleNav: () -> Unit,
    onSelectActiveTask: ((TaskEntity?) -> Unit)? = null,
) {
    var showSoundModal by remember { mutableStateOf(false) }
    var showTaskPicker by remember { mutableStateOf(false) }
    var previewMode by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(isRunning, mode) {
        if (!isRunning) {
            previewMode = null
        }
    }

    val activeTabMode = previewMode ?: mode
    val isPreviewingDifferentMode = isRunning && previewMode != null && previewMode != mode
    val activeModeIdx = MODE_TABS.indexOfFirst { it.first == activeTabMode }.coerceAtLeast(0)
    val isTaskSelected = activeTask != null
    val currentTask = tasks.find { it.id == activeTask?.id } ?: activeTask
    val totalCycles =
        if (isTaskSelected && currentTask != null) {
            currentTask.estimatedPomos.coerceAtLeast(1)
        } else {
            longBreakInterval.coerceAtLeast(1)
        }
    val currentSessionNumber =
        if (isTaskSelected && currentTask != null) {
            currentTask.completedPomos
        } else {
            (cycleCount % totalCycles) + 1
        }
    val m = timeLeft / 60
    val s = timeLeft % 60

    val isDarkTheme = LocalFocusColors.current.isDark
    val timerDividerColor = BorderHairline
    val timerMinColor = if (isDarkTheme) Color(0xFFA8A8A2) else Color(0xFF8F908C)
    val timerSecColor = if (isDarkTheme) Color(0xFFF2F2EE) else Color(0xFF050505)
    val canvasBg = LocalFocusColors.current.canvas
    val navBarBottom = WindowInsets.navigationBars.asPaddingValues().calculateBottomPadding()

    val today = remember { LocalDate.now() }
    val dayOfWeekShort =
        remember {
            today.format(DateTimeFormatter.ofPattern("EEE,", Locale.US))
        }
    val dayMonthShort =
        remember {
            today.format(DateTimeFormatter.ofPattern("d MMM", Locale.US))
        }

    // Format multi-line editorial task title (no 'Focus,' prefix line)
    val editorialLines =
        remember(activeTask, mode) {
            if (activeTask != null && activeTask.title.isNotBlank()) {
                val words = activeTask.title.trim().split(Regex("\\s+"))
                when {
                    words.size <= 2 -> {
                        listOf(words.joinToString(" "))
                    }

                    words.size == 3 -> {
                        listOf("${words[0]} ${words[1]}", words[2])
                    }

                    else -> {
                        val mid = (words.size + 1) / 2
                        listOf(
                            words.take(mid).joinToString(" "),
                            words.drop(mid).joinToString(" "),
                        )
                    }
                }
            } else {
                when (mode) {
                    "work" -> listOf("Focus", "Session")
                    "shortBreak" -> listOf("Short", "Break")
                    else -> listOf("Long", "Break")
                }
            }
        }

    Box(
        modifier =
            Modifier
                .fillMaxSize()
                .background(CanvasBg)
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null,
                ) {
                    if (isRunning && !isNavHidden) {
                        onToggleNav()
                    }
                },
    ) {
        SharedTransitionLayout {
            val timerBoundsTransform = remember {
                BoundsTransform { _, _ ->
                    spring(
                        dampingRatio = 0.85f,
                        stiffness = Spring.StiffnessMediumLow,
                    )
                }
            }
            val timerScaleResizeMode = remember {
                SharedTransitionScope.ResizeMode.ScaleToBounds()
            }

            AnimatedContent(
                targetState = isNavHidden,
                transitionSpec = {
                    fadeIn(animationSpec = tween(220)) togetherWith
                        fadeOut(animationSpec = tween(220))
                },
                label = "TimerScreenModeTransition",
            ) { isFullscreen ->
                if (!isFullscreen) {
                    // ── STANDARD EDITORIAL TIMER VIEW ──
                    Column(
                        modifier =
                            Modifier
                                .fillMaxSize()
                                .widthIn(max = 440.dp)
                                .padding(horizontal = 24.dp)
                                .padding(top = 54.dp, bottom = 140.dp + navBarBottom),
                    ) {
                        Column(modifier = Modifier.fillMaxWidth()) {
                            // ── TOP BAR: Strict/Sound Circular Toggles on Left + Mode Pill Switcher on Right ──
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                    Row(
                                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                    ) {
                                        // Strict Mode Circle Button (40dp)
                                        Box(
                                            modifier =
                                                Modifier
                                                    .size(40.dp)
                                                    .then(
                                                        if (strictMode) {
                                                            Modifier.raisedDark(CircleShape, InkDark, elevation = 6.dp)
                                                        } else {
                                                            Modifier.raised(CircleShape, SurfaceWhite, elevation = 7.dp)
                                                        },
                                                    ).clickable { onToggleStrictMode() },
                                            contentAlignment = Alignment.Center,
                                        ) {
                                            Icon(
                                                imageVector = if (strictMode) Icons.Outlined.Lock else Icons.Outlined.LockOpen,
                                                contentDescription = "Toggle strict mode",
                                                tint = if (strictMode) TextOnDark else InkDark,
                                                modifier = Modifier.size(16.dp),
                                            )
                                        }

                                        // Soundscape Circle Button (40dp)
                                        val isSoundActive = currentSound != "none"
                                        Box(
                                            modifier =
                                                Modifier
                                                    .size(40.dp)
                                                    .then(
                                                        if (isSoundActive) {
                                                            Modifier.raisedDark(CircleShape, InkDark, elevation = 6.dp)
                                                        } else {
                                                            Modifier.raised(CircleShape, SurfaceWhite, elevation = 7.dp)
                                                        },
                                                    ).clickable { showSoundModal = true },
                                            contentAlignment = Alignment.Center,
                                        ) {
                                            Icon(
                                                imageVector = Icons.Outlined.Headphones,
                                                contentDescription = "Soundscape & Volume",
                                                tint = if (isSoundActive) TextOnDark else InkDark,
                                                modifier = Modifier.size(16.dp),
                                            )
                                        }
                                    }

                                    // Reference 1 '12h | 24h' style Mode Switcher Pill (Focus | Short | Long)
                                    BoxWithConstraints(
                                        modifier =
                                            Modifier
                                                .width(196.dp)
                                                .height(38.dp)
                                                .inset(CircleShape, SurfaceSubtle, depth = 5.dp)
                                                .padding(3.dp),
                                    ) {
                                        val segmentWidth = maxWidth / 3f
                                        val pillOffset by animateDpAsState(
                                            targetValue = segmentWidth * activeModeIdx,
                                            animationSpec =
                                                spring(
                                                    dampingRatio = 0.85f,
                                                    stiffness = Spring.StiffnessMedium,
                                                ),
                                            label = "ModeSwitcherPill",
                                        )

                                        val isDark = FocusTheme.colors.isDark
                                        val pillBg = if (isPreviewingDifferentMode) {
                                            if (isDark) Color(0xFF2C2C28) else Color(0xFF3E3E3B)
                                        } else {
                                            InkDark
                                        }

                                        Box(
                                            modifier =
                                                Modifier
                                                    .offset(x = pillOffset)
                                                    .width(segmentWidth)
                                                    .fillMaxHeight()
                                                    .raisedDark(
                                                        CircleShape,
                                                        pillBg,
                                                        elevation = 5.dp,
                                                    ),
                                        )

                                        Row(
                                            modifier = Modifier.fillMaxSize(),
                                            verticalAlignment = Alignment.CenterVertically,
                                        ) {
                                            MODE_TABS.forEach { (key, label) ->
                                                val isSelected = activeTabMode == key
                                                Box(
                                                    modifier =
                                                        Modifier
                                                            .weight(1f)
                                                            .fillMaxHeight()
                                                            .clip(CircleShape)
                                                            .clickable(
                                                                interactionSource = remember { MutableInteractionSource() },
                                                                indication = null,
                                                            ) {
                                                                if (isRunning) {
                                                                    previewMode = if (key == mode) null else key
                                                                } else {
                                                                    previewMode = null
                                                                    onModeChange(key)
                                                                }
                                                            },
                                                    contentAlignment = Alignment.Center,
                                                ) {
                                                    val selectedTextColor = if (isPreviewingDifferentMode && isDark) {
                                                        Color(0xFFFFFFFF)
                                                    } else {
                                                        TextOnDark
                                                    }
                                                    Text(
                                                        text = label,
                                                        fontSize = 12.sp,
                                                        fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                                                        color = if (isSelected) selectedTextColor else InkDark,
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }

                            Spacer(modifier = Modifier.height(30.dp))

                            // ── HERO BLOCK: Monumental Stacked Digits + Adjacent Date & Cycle Wheel ──
                            Row(
                                modifier =
                                    Modifier
                                        .fillMaxWidth()
                                        .clickable(
                                            interactionSource = remember { MutableInteractionSource() },
                                            indication = null,
                                        ) { onToggleNav() },
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                // Left: Stacked Filmstrip Numerals with tight architectural boundary lines
                                Column(
                                    modifier = Modifier.width(IntrinsicSize.Min),
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                ) {
                                    // Top line tight with minutes
                                    HorizontalDivider(
                                        thickness = 1.dp,
                                        color = timerDividerColor,
                                        modifier = Modifier.sharedBounds(
                                            rememberSharedContentState(key = "timer_divider_top"),
                                            animatedVisibilityScope = this@AnimatedContent,
                                            boundsTransform = timerBoundsTransform,
                                            resizeMode = timerScaleResizeMode,
                                        ),
                                    )

                                    // TIER 1: Minutes (Clash Display Bold #8F908C with "min" tag, cropped 30% from below)
                                    Box(modifier = Modifier.width(IntrinsicSize.Min).height(95.dp)) {
                                        RollingTwoDigits(
                                            value = m,
                                            height = 135.dp,
                                            clipHeight = 95.dp,
                                            fontSize = 128.sp,
                                            lineHeight = 128.sp,
                                            letterSpacing = (-10).sp,
                                            color = timerMinColor,
                                            fontWeight = FontWeight.Bold,
                                            fontFamily = ClashDisplayFontFamily,
                                            verticalShift = (-6).dp,
                                            strokeColor = canvasBg,
                                            strokeWidth = 8.dp,
                                            digitSpacing = (-26).dp,
                                            modifier = Modifier
                                                .padding(end = 26.dp)
                                                .sharedBounds(
                                                    rememberSharedContentState(key = "timer_digits_minutes"),
                                                    animatedVisibilityScope = this@AnimatedContent,
                                                    boundsTransform = timerBoundsTransform,
                                                    resizeMode = timerScaleResizeMode,
                                                ),
                                        )
                                        Text(
                                            text = "min",
                                            fontFamily = ClashDisplayFontFamily,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = timerMinColor,
                                            modifier =
                                                Modifier
                                                    .align(Alignment.TopEnd)
                                                    .padding(top = 8.dp)
                                                    .sharedBounds(
                                                        rememberSharedContentState(key = "timer_unit_min"),
                                                        animatedVisibilityScope = this@AnimatedContent,
                                                        boundsTransform = timerBoundsTransform,
                                                        resizeMode = timerScaleResizeMode,
                                                    ),
                                        )
                                    }

                                    // Middle line between Minutes and Seconds
                                    HorizontalDivider(
                                        thickness = 1.dp,
                                        color = timerDividerColor,
                                        modifier = Modifier.sharedBounds(
                                            rememberSharedContentState(key = "timer_divider_mid"),
                                            animatedVisibilityScope = this@AnimatedContent,
                                            boundsTransform = timerBoundsTransform,
                                            resizeMode = timerScaleResizeMode,
                                        ),
                                    )

                                    // TIER 2: Seconds (Clash Display Bold #050505 with "sec" tag)
                                    Box(modifier = Modifier.width(IntrinsicSize.Min).height(136.dp)) {
                                        RollingTwoDigits(
                                            value = s,
                                            height = 136.dp,
                                            clipHeight = 136.dp,
                                            fontSize = 128.sp,
                                            lineHeight = 128.sp,
                                            letterSpacing = (-10).sp,
                                            color = timerSecColor,
                                            fontWeight = FontWeight.Bold,
                                            fontFamily = ClashDisplayFontFamily,
                                            verticalShift = (-6).dp,
                                            strokeColor = canvasBg,
                                            strokeWidth = 8.dp,
                                            digitSpacing = (-26).dp,
                                            modifier = Modifier
                                                .padding(end = 26.dp)
                                                .sharedBounds(
                                                    rememberSharedContentState(key = "timer_digits_seconds"),
                                                    animatedVisibilityScope = this@AnimatedContent,
                                                    boundsTransform = timerBoundsTransform,
                                                    resizeMode = timerScaleResizeMode,
                                                ),
                                        )
                                        Text(
                                            text = "sec",
                                            fontFamily = ClashDisplayFontFamily,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = timerSecColor,
                                            modifier =
                                                Modifier
                                                    .align(Alignment.TopEnd)
                                                    .padding(top = 8.dp)
                                                    .sharedBounds(
                                                        rememberSharedContentState(key = "timer_unit_sec"),
                                                        animatedVisibilityScope = this@AnimatedContent,
                                                        boundsTransform = timerBoundsTransform,
                                                        resizeMode = timerScaleResizeMode,
                                                    ),
                                        )
                                    }

                                    // Bottom line tight with seconds
                                    HorizontalDivider(
                                        thickness = 1.dp,
                                        color = timerDividerColor,
                                        modifier = Modifier.sharedBounds(
                                            rememberSharedContentState(key = "timer_divider_bot"),
                                            animatedVisibilityScope = this@AnimatedContent,
                                            boundsTransform = timerBoundsTransform,
                                            resizeMode = timerScaleResizeMode,
                                        ),
                                    )
                                }

                                Spacer(modifier = Modifier.width(24.dp))

                                // Right: Real Date aligned with top + Real Cycle Roller aligned with bottom
                                Column(
                                    modifier = Modifier.height(231.dp),
                                    verticalArrangement = Arrangement.Bottom,
                                    horizontalAlignment = Alignment.End,
                                ) {
                                    // Top: Real Date ("Sun,\n18 Oct")

                                    // Bottom: Pomodoro Cycle Drum (for task: completed pomos / target pomos; for free focus: session cycle / long break interval)
                                    val prevCycle =
                                        if (isTaskSelected) {
                                            if (currentSessionNumber > 0) currentSessionNumber - 1 else totalCycles
                                        } else {
                                            if (currentSessionNumber > 1) currentSessionNumber - 1 else totalCycles
                                        }
                                    val nextCycle =
                                        if (isTaskSelected) {
                                            if (currentSessionNumber < totalCycles) currentSessionNumber + 1 else 0
                                        } else {
                                            if (currentSessionNumber < totalCycles) currentSessionNumber + 1 else 1
                                        }
                                    Column(
                                        modifier = Modifier.padding(bottom = 12.dp),
                                        horizontalAlignment = Alignment.Start,
                                        verticalArrangement = Arrangement.spacedBy((-4).dp),
                                    ) {
                                        Text(
                                            text = String.format(Locale.US, "%02d", prevCycle),
                                            fontSize = 28.sp,
                                            lineHeight = 28.sp,
                                            letterSpacing = (-1).sp,
                                            fontWeight = FontWeight.Medium,
                                            color = InkDark.copy(alpha = 0.16f),
                                        )
                                        Row(
                                            verticalAlignment = Alignment.Bottom,
                                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                                        ) {
                                            Text(
                                                text = String.format(Locale.US, "%02d", currentSessionNumber),
                                                fontSize = 42.sp,
                                                lineHeight = 42.sp,
                                                letterSpacing = (-1.5).sp,
                                                fontWeight = FontWeight.SemiBold,
                                                color = InkDark,
                                            )
                                            Text(
                                                text = "/${String.format(Locale.US, "%02d", totalCycles)}",
                                                fontSize = 13.sp,
                                                fontWeight = FontWeight.Medium,
                                                color = SoftSage,
                                                modifier = Modifier.padding(bottom = 6.dp),
                                            )
                                        }
                                        Text(
                                            text = String.format(Locale.US, "%02d", nextCycle),
                                            fontSize = 28.sp,
                                            lineHeight = 28.sp,
                                            letterSpacing = (-1).sp,
                                            fontWeight = FontWeight.Medium,
                                            color = InkDark.copy(alpha = 0.16f),
                                        )
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(28.dp))

                            // ── EDITORIAL TASK TITLE BLOCK ──
                            Column(
                                modifier =
                                    Modifier
                                        .fillMaxWidth()
                                        .clickable(
                                            interactionSource = remember { MutableInteractionSource() },
                                            indication = null,
                                            enabled = onSelectActiveTask != null && !isNavHidden,
                                        ) {
                                            showTaskPicker = true
                                        },
                            ) {
                                editorialLines.forEachIndexed { idx, lineText ->
                                    Text(
                                        text = if (idx < editorialLines.lastIndex) "$lineText," else lineText,
                                        fontSize = 44.sp,
                                        lineHeight = 48.sp,
                                        letterSpacing = (-1.4).sp,
                                        fontWeight = FontWeight.Normal,
                                        color = InkDark,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                        modifier = Modifier.fillMaxWidth(),
                                    )
                                }
                                if (!isNavHidden && onSelectActiveTask != null) {
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                                    ) {
                                        val durationTag = if (activeTask?.durationMinutes != null && activeTask.durationMinutes > 0) {
                                            "${activeTask.durationMinutes}m focus"
                                        } else {
                                            "Default ${totalTime / 60}m"
                                        }
                                        Text(
                                            text = if (activeTask != null) "Tap to change task • $durationTag" else "Tap to choose task • $durationTag",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = SoftSage,
                                        )
                                        Icon(
                                            imageVector = Icons.Outlined.KeyboardArrowDown,
                                            contentDescription = null,
                                            tint = SoftSage,
                                            modifier = Modifier.size(14.dp),
                                        )
                                    }
                                }
                            }
                        }

                        Spacer(modifier = Modifier.weight(1f))

                        // ── MIDDLE TRANSPORT CONTROLS: "Restart" (text) | Play/Pause (circle) | "Skip" (text) ──
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(38.dp, Alignment.CenterHorizontally),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                text = "Restart",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Medium,
                                letterSpacing = (-0.2).sp,
                                color = MossSecondary,
                                modifier =
                                    Modifier
                                        .clickable(
                                            interactionSource = remember { MutableInteractionSource() },
                                            indication = null,
                                        ) { onReset() }
                                        .padding(horizontal = 8.dp, vertical = 10.dp),
                            )

                            Box(
                                modifier =
                                    Modifier
                                        .size(62.dp)
                                        .raisedDark(CircleShape, InkDark, elevation = 14.dp)
                                        .clickable {
                                            val targetPreview = previewMode
                                            previewMode = null
                                            onTogglePlay(targetPreview)
                                        },
                                contentAlignment = Alignment.Center,
                            ) {
                                Icon(
                                    imageVector =
                                        if (isRunning && !isPreviewingDifferentMode) {
                                            Icons.Filled.Pause
                                        } else {
                                            Icons.Filled.PlayArrow
                                        },
                                    contentDescription = if (isRunning) "Pause timer" else "Start timer",
                                    tint = TextOnDark,
                                    modifier = Modifier.size(26.dp),
                                )
                            }

                            Text(
                                text = "Skip",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Medium,
                                letterSpacing = (-0.2).sp,
                                color = MossSecondary,
                                modifier =
                                    Modifier
                                        .clickable(
                                            interactionSource = remember { MutableInteractionSource() },
                                            indication = null,
                                        ) { onSkip() }
                                        .padding(horizontal = 8.dp, vertical = 10.dp),
                            )
                        }

                        Spacer(modifier = Modifier.weight(1f))
                    }
                } else {
                    val configuration = LocalConfiguration.current
                    val isLandscape = configuration.orientation == Configuration.ORIENTATION_LANDSCAPE

                    if (isLandscape) {
                        // ── FULLSCREEN HORIZONTAL IMMERSIVE TIMER (Option 2: 2-Tier Stacked 100% Viewport Desk Clock) ──
                        BoxWithConstraints(
                            modifier =
                                Modifier
                                    .fillMaxSize()
                                    .background(CanvasBg)
                                    .clickable(
                                        interactionSource = remember { MutableInteractionSource() },
                                        indication = null,
                                    ) { onToggleNav() },
                        ) {
                            val availableHeight = maxHeight
                            // 2 hairline dividers: middle and bottom (1dp each)
                            val usableHeight = (availableHeight - 2.dp).coerceAtLeast(100.dp)
                            // Ratio based on Los Angeles Clock 30% crop spec: Minutes 145dp, Seconds 210dp (145 + 210 = 355dp)
                            val minutesSlotHeight = usableHeight * (145f / 355f)
                            val secondsSlotHeight = usableHeight * (210f / 355f)
                            val scale = (secondsSlotHeight / 210.dp).coerceIn(0.4f, 2.5f)
                            val bleedScale = scale * 1.12f

                            val digitFontSize = (210 * bleedScale).sp
                            val digitLineHeight = (210 * bleedScale).sp
                            val digitLetterSpacing = (-7 * bleedScale).sp
                            val strokeWidth = (12 * bleedScale).dp
                            val digitSpacing = (-44 * bleedScale).dp
                            val verticalShiftMin = (-12 * scale).dp
                            val verticalShiftSec = (-20 * scale).dp
                            val unitFontSize = (14 * scale).coerceAtLeast(10f).sp
                            val unitTopPad = (6 * scale).dp

                            val cutoutInsets = WindowInsets.displayCutout.asPaddingValues()
                            val leftPad = (28 * scale).coerceAtLeast(16f).dp + cutoutInsets.calculateStartPadding(LayoutDirection.Ltr)
                            val unitEndPad = (24 * scale).coerceAtLeast(12f).dp + cutoutInsets.calculateEndPadding(LayoutDirection.Ltr)

                            Column(
                                modifier = Modifier.fillMaxSize(),
                                verticalArrangement = Arrangement.Top,
                            ) {
                                // TIER 1: Minutes (Clash Display Bold #8F908C with "min" tag, cropped 30% from below)
                                Box(
                                    modifier =
                                        Modifier
                                            .fillMaxWidth()
                                            .weight(145f),
                                ) {
                                    RollingTwoDigits(
                                        value = m,
                                        height = secondsSlotHeight,
                                        clipHeight = minutesSlotHeight,
                                        fontSize = digitFontSize,
                                        lineHeight = digitLineHeight,
                                        letterSpacing = digitLetterSpacing,
                                        color = timerMinColor,
                                        fontWeight = FontWeight.Bold,
                                        fontFamily = ClashDisplayFontFamily,
                                        verticalShift = verticalShiftMin,
                                        strokeColor = canvasBg,
                                        strokeWidth = strokeWidth,
                                        digitSpacing = digitSpacing,
                                        modifier =
                                            Modifier
                                                .padding(start = leftPad)
                                                .sharedBounds(
                                                    rememberSharedContentState(key = "timer_digits_minutes"),
                                                    animatedVisibilityScope = this@AnimatedContent,
                                                    boundsTransform = timerBoundsTransform,
                                                    resizeMode = timerScaleResizeMode,
                                                ),
                                    )
                                    Text(
                                        text = "min",
                                        fontFamily = ClashDisplayFontFamily,
                                        fontSize = unitFontSize,
                                        fontWeight = FontWeight.SemiBold,
                                        color = timerMinColor,
                                        modifier =
                                            Modifier
                                                .align(Alignment.TopEnd)
                                                .padding(top = unitTopPad, end = unitEndPad)
                                                .sharedBounds(
                                                    rememberSharedContentState(key = "timer_unit_min"),
                                                    animatedVisibilityScope = this@AnimatedContent,
                                                    boundsTransform = timerBoundsTransform,
                                                    resizeMode = timerScaleResizeMode,
                                                ),
                                    )
                                }

                                // Middle line full width edge-to-edge (slices off bottom 30% of Minutes)
                                HorizontalDivider(
                                    thickness = 1.dp,
                                    color = timerDividerColor,
                                    modifier =
                                        Modifier
                                            .fillMaxWidth()
                                            .sharedBounds(
                                                rememberSharedContentState(key = "timer_divider_mid"),
                                                animatedVisibilityScope = this@AnimatedContent,
                                                boundsTransform = timerBoundsTransform,
                                                resizeMode = timerScaleResizeMode,
                                            ),
                                )

                                // TIER 2: Seconds (Clash Display Bold #050505 with "sec" tag)
                                Box(
                                    modifier =
                                        Modifier
                                            .fillMaxWidth()
                                            .weight(210f),
                                ) {
                                    RollingTwoDigits(
                                        value = s,
                                        height = secondsSlotHeight,
                                        clipHeight = secondsSlotHeight,
                                        fontSize = digitFontSize,
                                        lineHeight = digitLineHeight,
                                        letterSpacing = digitLetterSpacing,
                                        color = timerSecColor,
                                        fontWeight = FontWeight.Bold,
                                        fontFamily = ClashDisplayFontFamily,
                                        verticalShift = verticalShiftSec,
                                        strokeColor = canvasBg,
                                        strokeWidth = strokeWidth,
                                        digitSpacing = digitSpacing,
                                        modifier =
                                            Modifier
                                                .padding(start = leftPad)
                                                .sharedBounds(
                                                    rememberSharedContentState(key = "timer_digits_seconds"),
                                                    animatedVisibilityScope = this@AnimatedContent,
                                                    boundsTransform = timerBoundsTransform,
                                                    resizeMode = timerScaleResizeMode,
                                                ),
                                    )
                                    Text(
                                        text = "sec",
                                        fontFamily = ClashDisplayFontFamily,
                                        fontSize = unitFontSize,
                                        fontWeight = FontWeight.SemiBold,
                                        color = timerSecColor,
                                        modifier =
                                            Modifier
                                                .align(Alignment.TopEnd)
                                                .padding(top = unitTopPad, end = unitEndPad)
                                                .sharedBounds(
                                                    rememberSharedContentState(key = "timer_unit_sec"),
                                                    animatedVisibilityScope = this@AnimatedContent,
                                                    boundsTransform = timerBoundsTransform,
                                                    resizeMode = timerScaleResizeMode,
                                                ),
                                    )
                                }

                                // Bottom line full width edge-to-edge
                                HorizontalDivider(
                                    thickness = 1.dp,
                                    color = timerDividerColor,
                                    modifier =
                                        Modifier
                                            .fillMaxWidth()
                                            .sharedBounds(
                                                rememberSharedContentState(key = "timer_divider_bot"),
                                                animatedVisibilityScope = this@AnimatedContent,
                                                boundsTransform = timerBoundsTransform,
                                                resizeMode = timerScaleResizeMode,
                                            ),
                                )
                            }
                        }
                    } else {
                        // ── PORTRAIT FULLSCREEN IMMERSIVE MODE (Reference 2 Right Screen Architectural Grid) ──
                        Column(
                        modifier =
                            Modifier
                                .fillMaxSize()
                                .background(CanvasBg)
                                .clickable(
                                    interactionSource = remember { MutableInteractionSource() },
                                    indication = null,
                                ) { onToggleNav() }
                                .statusBarsPadding()
                                .navigationBarsPadding()
                                .padding(horizontal = 24.dp, vertical = 24.dp),
                        verticalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                text =
                                    when (mode) {
                                        "shortBreak" -> {
                                            "Short Break"
                                        }

                                        "longBreak" -> {
                                            "Long Break"
                                        }

                                        else -> {
                                            if (activeTask != null &&
                                                activeTask.title.isNotBlank()
                                            ) {
                                                val title = activeTask.title.trim()
                                                if (title.length > 10) "${title.take(10).trimEnd()}..." else title
                                            } else {
                                                "Focus Session"
                                            }
                                        }
                                    },
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Normal,
                                letterSpacing = (-0.4).sp,
                                color = InkDark,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                modifier = Modifier.weight(1f),
                            )
                            Text(
                                text = "TAP TO EXIT",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.4.sp,
                                color = SoftSage,
                            )
                        }

                        Column(
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            // Top line full width
                            HorizontalDivider(
                                thickness = 1.dp,
                                color = timerDividerColor,
                                modifier = Modifier.sharedBounds(
                                    rememberSharedContentState(key = "timer_divider_top"),
                                    animatedVisibilityScope = this@AnimatedContent,
                                    boundsTransform = timerBoundsTransform,
                                    resizeMode = timerScaleResizeMode,
                                ),
                            )

                            // TIER 1: Minutes (Clash Display Bold #8F908C with "min" tag, cropped 30% from below)
                            Box(modifier = Modifier.fillMaxWidth().height(145.dp)) {
                                RollingTwoDigits(
                                    value = m,
                                    height = 210.dp,
                                    clipHeight = 145.dp,
                                    fontSize = 210.sp,
                                    lineHeight = 210.sp,
                                    letterSpacing = (-6).sp,
                                    color = timerMinColor,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = ClashDisplayFontFamily,
                                    verticalShift = (-4).dp,
                                    strokeColor = canvasBg,
                                    strokeWidth = 12.dp,
                                    digitSpacing = (-42).dp,
                                    modifier = Modifier.sharedBounds(
                                        rememberSharedContentState(key = "timer_digits_minutes"),
                                        animatedVisibilityScope = this@AnimatedContent,
                                        boundsTransform = timerBoundsTransform,
                                        resizeMode = timerScaleResizeMode,
                                    ),
                                )
                                Text(
                                    text = "min",
                                    fontFamily = ClashDisplayFontFamily,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = timerMinColor,
                                    modifier =
                                        Modifier
                                            .align(Alignment.TopEnd)
                                            .padding(top = 10.dp, end = 4.dp)
                                            .sharedBounds(
                                                rememberSharedContentState(key = "timer_unit_min"),
                                                animatedVisibilityScope = this@AnimatedContent,
                                                boundsTransform = timerBoundsTransform,
                                                resizeMode = timerScaleResizeMode,
                                            ),
                                )
                            }

                            // Middle line full width (slices off bottom 30% of Minutes)
                            HorizontalDivider(
                                thickness = 1.dp,
                                color = timerDividerColor,
                                modifier = Modifier.sharedBounds(
                                    rememberSharedContentState(key = "timer_divider_mid"),
                                    animatedVisibilityScope = this@AnimatedContent,
                                    boundsTransform = timerBoundsTransform,
                                    resizeMode = timerScaleResizeMode,
                                ),
                            )

                            // TIER 2: Seconds (Clash Display Bold #050505 with "sec" tag)
                            Box(modifier = Modifier.fillMaxWidth().height(210.dp)) {
                                RollingTwoDigits(
                                    value = s,
                                    height = 210.dp,
                                    clipHeight = 210.dp,
                                    fontSize = 210.sp,
                                    lineHeight = 210.sp,
                                    letterSpacing = (-6).sp,
                                    color = timerSecColor,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = ClashDisplayFontFamily,
                                    verticalShift = 0.dp,
                                    strokeColor = canvasBg,
                                    strokeWidth = 12.dp,
                                    digitSpacing = (-42).dp,
                                    modifier = Modifier.sharedBounds(
                                        rememberSharedContentState(key = "timer_digits_seconds"),
                                        animatedVisibilityScope = this@AnimatedContent,
                                        boundsTransform = timerBoundsTransform,
                                        resizeMode = timerScaleResizeMode,
                                    ),
                                )
                                Text(
                                    text = "sec",
                                    fontFamily = ClashDisplayFontFamily,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = timerSecColor,
                                    modifier =
                                        Modifier
                                            .align(Alignment.TopEnd)
                                            .padding(top = 10.dp, end = 4.dp)
                                            .sharedBounds(
                                                rememberSharedContentState(key = "timer_unit_sec"),
                                                animatedVisibilityScope = this@AnimatedContent,
                                                boundsTransform = timerBoundsTransform,
                                                resizeMode = timerScaleResizeMode,
                                            ),
                                )
                            }

                            // Bottom line full width
                            HorizontalDivider(
                                thickness = 1.dp,
                                color = timerDividerColor,
                                modifier = Modifier.sharedBounds(
                                    rememberSharedContentState(key = "timer_divider_bot"),
                                    animatedVisibilityScope = this@AnimatedContent,
                                    boundsTransform = timerBoundsTransform,
                                    resizeMode = timerScaleResizeMode,
                                ),
                            )
                        }

                        Row(
                            modifier =
                                Modifier
                                    .fillMaxWidth()
                                    .padding(bottom = 12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                text = if (isRunning) "PAUSE" else "RESUME",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 2.sp,
                                color = InkDark,
                                modifier =
                                    Modifier
                                        .clickable { onTogglePlay(null) }
                                        .padding(8.dp),
                            )

                            Text(
                                text = if (isTaskSelected) "POMO $currentSessionNumber / $totalCycles" else "CYCLE $currentSessionNumber / $totalCycles",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Medium,
                                letterSpacing = 1.2.sp,
                                color = SoftSage,
                            )

                            Text(
                                text = "END",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 2.sp,
                                color = InkDark,
                                modifier =
                                    Modifier
                                        .clickable { onSkip() }
                                        .padding(8.dp),
                            )
                        }
                    }
                }
            }
        }
    }
}

    // ── SOUNDSCAPE & VOLUME MODAL ──
    if (showSoundModal) {
        Dialog(onDismissRequest = { showSoundModal = false }) {
            Column(
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(24.dp))
                        .background(SurfaceWhite)
                        .border(1.dp, BorderHairline, RoundedCornerShape(24.dp))
                        .padding(22.dp),
                verticalArrangement = Arrangement.spacedBy(18.dp),
            ) {
                Text(
                    text = "Soundscape & Volume",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = (-0.4).sp,
                    color = InkDark,
                )

                // Volume Card with Inset Groove
                Column(
                    modifier =
                        Modifier
                            .fillMaxWidth()
                            .inset(RoundedCornerShape(18.dp), CanvasBg, depth = 3.dp)
                            .padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    var localVolume by remember(soundVolume) { mutableFloatStateOf(soundVolume) }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.VolumeUp,
                                contentDescription = null,
                                tint = InkDark,
                                modifier = Modifier.size(16.dp),
                            )
                            Text(
                                text = "Ambient Volume",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = InkDark,
                            )
                        }
                        Box(
                            modifier =
                                Modifier
                                    .raised(RoundedCornerShape(8.dp), SurfaceWhite, elevation = 2.dp)
                                    .padding(horizontal = 8.dp, vertical = 2.dp),
                        ) {
                            Text(
                                text = "${(localVolume * 100).roundToInt()}%",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = InkDark,
                            )
                        }
                    }

                    Slider(
                        value = localVolume,
                        onValueChange = { v ->
                            localVolume = v
                            soundEngine.setVolume(v)
                        },
                        onValueChangeFinished = {
                            onChangeVolume(localVolume)
                        },
                        valueRange = 0f..1f,
                        colors =
                            SliderDefaults.colors(
                                thumbColor = InkDark,
                                activeTrackColor = InkDark,
                                inactiveTrackColor = TrackGroove,
                            ),
                    )
                }

                // Soundscape Options List
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    SOUNDSCAPE_OPTIONS.forEach { option ->
                        val isActive = option.id == currentSound
                        Row(
                            modifier =
                                Modifier
                                    .fillMaxWidth()
                                    .then(
                                        if (isActive) {
                                            Modifier.raisedDark(RoundedCornerShape(14.dp), InkDark, elevation = 4.dp)
                                        } else {
                                            Modifier.raised(RoundedCornerShape(14.dp), SurfaceWhite, elevation = 2.dp)
                                        },
                                    ).clickable {
                                        onSelectSound(option.id)
                                        if (option.id == "none") {
                                            soundEngine.stop()
                                        } else {
                                            soundEngine.play(option.id, soundVolume)
                                        }
                                        showSoundModal = false
                                    }.padding(horizontal = 14.dp, vertical = 12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                            ) {
                                Icon(
                                    imageVector = option.icon,
                                    contentDescription = null,
                                    tint = if (isActive) TextOnDark else InkDark,
                                    modifier = Modifier.size(18.dp),
                                )
                                Text(
                                    text = option.label,
                                    fontSize = 14.sp,
                                    fontWeight = if (isActive) FontWeight.SemiBold else FontWeight.Medium,
                                    color = if (isActive) TextOnDark else InkDark,
                                )
                            }
                            if (isActive) {
                                Icon(
                                    imageVector = Icons.Filled.Check,
                                    contentDescription = "Selected",
                                    tint = TextOnDark,
                                    modifier = Modifier.size(16.dp),
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // ── TASK SELECTOR MODAL ──
    if (showTaskPicker) {
        Dialog(onDismissRequest = { showTaskPicker = false }) {
            Column(
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(24.dp))
                        .background(SurfaceWhite)
                        .border(1.dp, BorderHairline, RoundedCornerShape(24.dp))
                        .padding(22.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                // Modal Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column {
                        Text(
                            text = "Focus Target",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = (-0.4).sp,
                            color = InkDark,
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "Select a task or focus freely",
                            fontSize = 12.sp,
                            color = MossSecondary,
                        )
                    }
                    Box(
                        modifier =
                            Modifier
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(SurfaceSubtle)
                                .clickable { showTaskPicker = false },
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.Close,
                            contentDescription = "Close",
                            tint = InkDark,
                            modifier = Modifier.size(16.dp),
                        )
                    }
                }

                HorizontalDivider(thickness = 1.dp, color = BorderHairline.copy(alpha = 0.6f))

                // Scrollable Task Options
                Column(
                    modifier =
                        Modifier
                            .fillMaxWidth()
                            .heightIn(max = 340.dp)
                            .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    // Option 1: Free Focus (No Task)
                    val isFreeFocus = activeTask == null
                    Row(
                        modifier =
                            Modifier
                                .fillMaxWidth()
                                .raised(RoundedCornerShape(14.dp), if (isFreeFocus) CanvasBg else SurfaceWhite, elevation = 2.dp)
                                .clickable {
                                    onSelectActiveTask?.invoke(null)
                                    showTaskPicker = false
                                }.padding(horizontal = 14.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                        ) {
                            Box(
                                modifier =
                                    Modifier
                                        .size(10.dp)
                                        .clip(CircleShape)
                                        .background(MossSecondary),
                            )
                            Text(
                                text = "Free Focus (No Task)",
                                fontSize = 14.sp,
                                fontWeight = if (isFreeFocus) FontWeight.Bold else FontWeight.Medium,
                                color = InkDark,
                            )
                        }
                        if (isFreeFocus) {
                            Icon(
                                imageVector = Icons.Filled.Check,
                                contentDescription = null,
                                tint = InkDark,
                                modifier = Modifier.size(16.dp),
                            )
                        }
                    }

                    // Task Options
                    val pendingTasks = tasks.filter { !it.completed }
                    if (pendingTasks.isNotEmpty()) {
                        Text(
                            text = "ACTIVE TASKS",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp,
                            color = SoftSage,
                            modifier = Modifier.padding(top = 6.dp),
                        )
                        pendingTasks.forEach { task ->
                            val isSelected = activeTask?.id == task.id
                            Row(
                                modifier =
                                    Modifier
                                        .fillMaxWidth()
                                        .raised(RoundedCornerShape(14.dp), if (isSelected) CanvasBg else SurfaceWhite, elevation = 2.dp)
                                        .clickable {
                                            onSelectActiveTask?.invoke(task)
                                            showTaskPicker = false
                                        }.padding(horizontal = 14.dp, vertical = 12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = task.title,
                                        fontSize = 14.sp,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                        color = InkDark,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                    )
                                    val durLabel = if (task.durationMinutes != null && task.durationMinutes > 0) {
                                        " • ${task.durationMinutes}m"
                                    } else {
                                        " • Default"
                                    }
                                    Text(
                                        text = "${task.completedPomos}/${task.estimatedPomos} pomodoros$durLabel",
                                        fontSize = 11.sp,
                                        color = MossSecondary,
                                    )
                                }
                                if (isSelected) {
                                    Icon(
                                        imageVector = Icons.Filled.Check,
                                        contentDescription = null,
                                        tint = InkDark,
                                        modifier = Modifier.size(16.dp),
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
