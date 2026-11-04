package com.yazri.focus.ui.analytics

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
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.outlined.KeyboardArrowRight
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yazri.focus.data.local.entities.ProjectEntity
import com.yazri.focus.data.local.entities.SessionEntity
import com.yazri.focus.data.preferences.AppSettings
import com.yazri.focus.ui.components.ActivityCapsuleChart
import com.yazri.focus.ui.components.ActivityHeatmap
import com.yazri.focus.ui.theme.*
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import java.time.temporal.TemporalAdjusters

private val PERIOD_TABS = listOf("All", "Daily", "Weekly", "Monthly", "Yearly")

@Composable
fun AnalyticsScreen(
    projects: List<ProjectEntity>,
    sessions: List<SessionEntity>,
    settings: AppSettings
) {
    var period by remember { mutableStateOf("Daily") }
    var offset by remember { mutableIntStateOf(0) }

    val sessionCache = remember(sessions) {
        AnalyticsCalculator.aggregate(sessions)
    }

    val metrics = remember(sessionCache, projects, settings, period, offset) {
        AnalyticsCalculator.compute(sessionCache, projects, settings, period, offset)
    }

    val activePeriodIdx = PERIOD_TABS.indexOf(period).coerceAtLeast(0)
    val navBarBottom = WindowInsets.navigationBars.asPaddingValues().calculateBottomPadding()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(CanvasBg)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp)
            .padding(top = 54.dp, bottom = 140.dp + navBarBottom),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // ── EDITORIAL HEADER ──
        Column {
            Text(
                text = "ANALYTICS",
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium,
                letterSpacing = 1.2.sp,
                color = MossSecondary
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = "Focus Reports",
                fontSize = 32.sp,
                lineHeight = 38.sp,
                fontWeight = FontWeight.Normal,
                letterSpacing = (-0.8).sp,
                color = InkDark
            )
        }

        // ── TIMEFRAME HEADER & SEGMENTED SWITCHER (Reference 1 '12h | 24h' pill style) ──
        Column(
            modifier = Modifier.padding(top = 4.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            BoxWithConstraints(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(38.dp)
                    .inset(CircleShape, SurfaceSubtle, depth = 5.dp)
                    .padding(3.dp)
            ) {
                val tabWidth = maxWidth / PERIOD_TABS.size
                val pillOffset by animateDpAsState(
                    targetValue = tabWidth * activePeriodIdx,
                    animationSpec = spring(
                        stiffness = 500f,
                        dampingRatio = 0.85f
                    ),
                    label = "TimeframePillOffset"
                )

                Box(
                    modifier = Modifier
                        .graphicsLayer { translationX = pillOffset.toPx() }
                        .width(tabWidth)
                        .fillMaxHeight()
                        .raisedDark(CircleShape, InkDark, elevation = 5.dp)
                )

                Row(
                    modifier = Modifier.fillMaxSize(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    PERIOD_TABS.forEach { tab ->
                        val isSelected = period == tab
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxHeight()
                                .clip(CircleShape)
                                .clickable(
                                    interactionSource = remember { MutableInteractionSource() },
                                    indication = null
                                ) {
                                    period = tab
                                    offset = 0
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = tab,
                                fontSize = 11.sp,
                                fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                                color = if (isSelected) TextOnDark else InkDark
                            )
                        }
                    }
                }
            }

            // Date Range Navigation Row
            val isAll = period == "All"
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(30.dp)
                    .alpha(if (isAll) 0.4f else 1f),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .raised(CircleShape, SurfaceWhite, elevation = 3.dp)
                        .clickable(enabled = !isAll) {
                            offset -= 1
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Outlined.KeyboardArrowLeft,
                        contentDescription = "Previous",
                        tint = InkDark,
                        modifier = Modifier.size(18.dp)
                    )
                }

                Text(
                    text = metrics.dateRangeLabel,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = (-0.2).sp,
                    color = InkDark
                )

                val canGoNext = !isAll && offset < 0
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .raised(CircleShape, SurfaceWhite, elevation = 3.dp)
                        .alpha(if (canGoNext) 1f else 0.35f)
                        .clickable(enabled = canGoNext) {
                            if (offset < 0) offset += 1
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Outlined.KeyboardArrowRight,
                        contentDescription = "Next",
                        tint = InkDark,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }

        // ── DUAL KPI CARDS: FOCUS TIME & SESSIONS ──
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Focus Time Card (Inverted Black Active Card Style from Reference 1)
            Column(
                modifier = Modifier
                    .weight(1f)
                    .height(124.dp)
                    .raisedDark(RoundedCornerShape(22.dp), InkDark, elevation = 8.dp)
                    .padding(18.dp),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "FOCUS TIME",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp,
                        color = SoftSage
                    )
                    Box(
                        modifier = Modifier
                            .size(7.dp)
                            .clip(CircleShape)
                            .background(AccentAmber)
                    )
                }

                Column {
                    Text(
                        text = metrics.displayHours,
                        fontSize = 28.sp,
                        lineHeight = 34.sp,
                        fontWeight = FontWeight.Medium,
                        letterSpacing = (-1).sp,
                        color = TextOnDark
                    )
                    Text(
                        text = metrics.displaySubToday,
                        fontSize = 11.sp,
                        color = SoftSage
                    )
                }
            }

            // Sessions Card
            Column(
                modifier = Modifier
                    .weight(1f)
                    .height(124.dp)
                    .raised(RoundedCornerShape(22.dp), SurfaceWhite, elevation = 7.dp)
                    .padding(18.dp),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "SESSIONS",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp,
                        color = SoftSage
                    )
                    Icon(
                        imageVector = Icons.Outlined.CheckCircle,
                        contentDescription = null,
                        tint = InkDark,
                        modifier = Modifier.size(15.dp)
                    )
                }

                Column {
                    Text(
                        text = metrics.displayPomos.toString(),
                        fontSize = 28.sp,
                        lineHeight = 34.sp,
                        fontWeight = FontWeight.Medium,
                        letterSpacing = (-1).sp,
                        color = InkDark
                    )
                    Text(
                        text = metrics.displaySubDays,
                        fontSize = 11.sp,
                        color = MossSecondary
                    )
                }
            }
        }

        // ── 35-DAY ACTIVITY HEATMAP GRID CARD ──
        ActivityHeatmap(
            heatmapTitleDate = metrics.heatmapTitleDate,
            grid = metrics.heatmapGrid,
            period = period,
            onCellClick = { cell ->
                val today = LocalDate.now()
                val cellDate = try {
                    LocalDate.parse(cell.dateStr)
                } catch (_: Exception) {
                    return@ActivityHeatmap
                }
                when (period) {
                    "Daily" -> {
                        offset = ChronoUnit.DAYS.between(today, cellDate).toInt()
                    }
                    "Weekly" -> {
                        val curMon = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                        val cellMon = cellDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                        offset = ChronoUnit.WEEKS.between(curMon, cellMon).toInt()
                    }
                    "Monthly" -> {
                        offset = (cellDate.year - today.year) * 12 + (cellDate.monthValue - today.monthValue)
                    }
                }
            }
        )

        // ── TOTAL PER DAY / PERIOD CAPSULE CHART CARD ──
        ActivityCapsuleChart(
            chartTitle = metrics.chartTitle,
            chartSubLabel = metrics.chartSubLabel,
            chartPeakLabel = metrics.chartPeakLabel,
            slots = metrics.chartSlots,
            onSlotClick = { slot ->
                slot.targetOffset?.let { offset = it }
            }
        )

        // ── FOCUS DISTRIBUTION UNIFIED SINGLE DONUT RING & LEGEND CARD ──
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .raised(RoundedCornerShape(22.dp), SurfaceWhite, elevation = 7.dp)
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "FOCUS DISTRIBUTION",
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.2.sp,
                color = SoftSage
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(20.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier.size(136.dp),
                    contentAlignment = Alignment.Center
                ) {
                    val isDark = FocusTheme.colors.isDark
                    val trackColor = SurfaceSubtle
                    val grooveBorderColor = if (isDark) Color(0xFF232320) else Color(0xFFD6DBD2)

                    Canvas(modifier = Modifier.fillMaxSize()) {
                        val strokeW = 13.dp.toPx()
                        val radius = (size.minDimension / 2f) - strokeW / 2f - 2.dp.toPx()
                        if (radius > 0f) {
                            // 1. Tactile Inset Groove: subtle boundary outlines carving into the surface
                            val outerR = radius + strokeW / 2f
                            val innerR = radius - strokeW / 2f
                            drawCircle(
                                color = grooveBorderColor.copy(alpha = 0.5f),
                                radius = outerR,
                                style = Stroke(width = 1.dp.toPx())
                            )
                            drawCircle(
                                color = grooveBorderColor.copy(alpha = 0.5f),
                                radius = innerR,
                                style = Stroke(width = 1.dp.toPx())
                            )

                            // 2. Track background
                            drawCircle(
                                color = trackColor,
                                radius = radius,
                                style = Stroke(width = strokeW)
                            )

                            // 3. Rounded Segments
                            val activeSegments = metrics.segments.filter { it.pct > 0 }
                            val totalPct = activeSegments.sumOf { it.pct }.coerceAtLeast(1)

                            if (activeSegments.size == 1) {
                                // Full continuous 360 circle
                                drawArc(
                                    color = activeSegments[0].color,
                                    startAngle = -90f,
                                    sweepAngle = 360f,
                                    useCenter = false,
                                    topLeft = Offset(center.x - radius, center.y - radius),
                                    size = Size(radius * 2f, radius * 2f),
                                    style = Stroke(width = strokeW, cap = StrokeCap.Round)
                                )
                            } else if (activeSegments.size > 1) {
                                // Calculate angular width of the rounded cap to maintain clean gaps between pill ends
                                val capAngularWidth = ((strokeW / 2f) / (2f * Math.PI.toFloat() * radius)) * 360f
                                val visualGap = 7f // visible gap in degrees between rounded caps
                                val gapDegrees = capAngularWidth * 2f + visualGap
                                val totalAvailableDegrees = (360f - gapDegrees * activeSegments.size).coerceAtLeast(0f)
                                var currentStartAngle = -90f

                                activeSegments.forEach { seg ->
                                    val sweep = (seg.pct.toFloat() / totalPct.toFloat()) * totalAvailableDegrees
                                    if (sweep > 0.5f) {
                                        drawArc(
                                            color = seg.color,
                                            startAngle = currentStartAngle + gapDegrees / 2f,
                                            sweepAngle = sweep,
                                            useCenter = false,
                                            topLeft = Offset(
                                                x = center.x - radius,
                                                y = center.y - radius
                                            ),
                                            size = Size(radius * 2f, radius * 2f),
                                            style = Stroke(width = strokeW, cap = StrokeCap.Round)
                                        )
                                    }
                                    currentStartAngle += sweep + gapDegrees
                                }
                            }
                        }
                    }

                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = metrics.distributionTotalTime,
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = (-0.6).sp,
                            color = InkDark
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "TOTAL FOCUS",
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.2.sp,
                            color = SoftSage
                        )
                    }
                }

                // Legend & Individual Progress Bars per Category
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    metrics.segments.forEach { seg ->
                        Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(8.dp)
                                            .clip(CircleShape)
                                            .background(seg.color)
                                    )
                                    Text(
                                        text = seg.label,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = InkDark,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                                Text(
                                    text = "${seg.pct}% · ${seg.displayTime}",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MossSecondary
                                )
                            }

                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(5.dp)
                                    .clip(CircleShape)
                                    .background(SurfaceSubtle)
                            ) {
                                if (seg.pct > 0) {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth((seg.pct / 100f).coerceIn(0.03f, 1f))
                                            .fillMaxHeight()
                                            .clip(CircleShape)
                                            .background(seg.color)
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

