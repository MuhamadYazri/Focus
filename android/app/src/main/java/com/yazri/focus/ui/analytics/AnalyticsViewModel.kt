package com.yazri.focus.ui.analytics

import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color
import com.yazri.focus.data.local.entities.ProjectEntity
import com.yazri.focus.data.local.entities.SessionEntity
import com.yazri.focus.data.preferences.AppSettings
import com.yazri.focus.ui.components.ChartBarSegment
import com.yazri.focus.ui.components.ChartBarSlot
import com.yazri.focus.ui.components.HeatmapCellData
import com.yazri.focus.ui.theme.*
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import java.time.temporal.TemporalAdjusters
import java.util.Locale
import kotlin.math.roundToInt

@Immutable
data class DistributionSegment(
    val label: String,
    val pct: Int,
    val count: Int,
    val mins: Int,
    val displayTime: String,
    val color: Color
)

@Immutable
data class AnalyticsMetrics(
    val displayHours: String,
    val displayPomos: Int,
    val displaySubToday: String,
    val displaySubDays: String,
    val dateRangeLabel: String,
    val heatmapTitleDate: String,
    val heatmapGrid: List<List<HeatmapCellData>>,
    val chartTitle: String,
    val chartSubLabel: String,
    val chartPeakLabel: String,
    val chartSlots: List<ChartBarSlot>,
    val distributionTotalTime: String,
    val segments: List<DistributionSegment>
)

@Immutable
data class AggregatedSessions(
    val dateMap: Map<String, Int>,
    val monthMap: Map<String, Int>,
    val yearMap: Map<String, Int>,
    val sessionsByDate: Map<String, List<SessionEntity>>,
    val rawSessions: List<SessionEntity>
)

object AnalyticsCalculator {

    private val FALLBACK_COLORS = listOf(Color(0xFF181818), Color(0xFF6E6E6A), Color(0xFF969690), Color(0xFFC4C4BE))
    private val MONTH_YEAR_FMT = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.US)
    private val SHORT_DATE_FMT = DateTimeFormatter.ofPattern("MMM d", Locale.US)
    private val FULL_DATE_FMT = DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.US)

    fun aggregate(sessions: List<SessionEntity>): AggregatedSessions {
        val dateMap = HashMap<String, Int>()
        val monthMap = HashMap<String, Int>()
        val yearMap = HashMap<String, Int>()
        val sessionsByDate = HashMap<String, MutableList<SessionEntity>>()

        sessions.forEach { s ->
            val dt = s.dateStr.ifBlank { s.completedAt.substringBefore("T") }
            if (dt.length >= 10) {
                val dur = s.duration.coerceAtLeast(1)
                dateMap[dt] = (dateMap[dt] ?: 0) + dur
                val mo = dt.substring(0, 7)
                monthMap[mo] = (monthMap[mo] ?: 0) + dur
                val yr = dt.substring(0, 4)
                yearMap[yr] = (yearMap[yr] ?: 0) + dur

                sessionsByDate.getOrPut(dt) { mutableListOf() }.add(s)
            }
        }
        return AggregatedSessions(dateMap, monthMap, yearMap, sessionsByDate, sessions)
    }

    fun formatDisplayHours(totalMins: Int): String {
        if (totalMins <= 0) return "0h 00m"
        val hrs = totalMins / 60
        val mins = totalMins % 60
        return String.format(Locale.US, "%dh %02dm", hrs, mins)
    }

    fun formatTimeNoDecimals(totalMins: Int): String {
        if (totalMins <= 0) return "0h"
        val hrs = totalMins / 60
        val mins = totalMins % 60
        if (hrs == 0) return "${mins}m"
        if (mins == 0) return "${hrs}h"
        return String.format(Locale.US, "%dh %02dm", hrs, mins)
    }

    fun formatBarHours(totalMins: Int): String {
        if (totalMins <= 0) return "0h"
        return String.format(Locale.US, "%.1fh", totalMins / 60f)
    }

    private fun computeSegmentsForSessions(
        sessList: List<SessionEntity>,
        projects: List<ProjectEntity>,
        goalMins: Float
    ): List<ChartBarSegment> {
        if (sessList.isEmpty()) return emptyList()
        val projMap = projects.associateBy { it.id }
        val projStats = mutableMapOf<String, Int>()
        sessList.forEach { s ->
            val pid = s.projectId.ifBlank { projects.firstOrNull()?.id ?: "proj-1" }
            projStats[pid] = (projStats[pid] ?: 0) + s.duration
        }
        return projStats.mapNotNull { (pid, dur) ->
            if (dur <= 0) null
            else {
                val proj = projMap[pid]
                val color = proj?.let { parseHexColor(it.color, FALLBACK_COLORS[0]) } ?: FALLBACK_COLORS[0]
                ChartBarSegment(color = color, mins = dur, ratio = (dur / goalMins).coerceIn(0f, 1f))
            }
        }.sortedByDescending { it.mins }
    }

    fun compute(
        sessions: List<SessionEntity>,
        projects: List<ProjectEntity>,
        settings: AppSettings,
        period: String,
        offset: Int
    ): AnalyticsMetrics = compute(aggregate(sessions), projects, settings, period, offset)

    fun compute(
        cache: AggregatedSessions,
        projects: List<ProjectEntity>,
        settings: AppSettings,
        period: String,
        offset: Int
    ): AnalyticsMetrics {
        val today = LocalDate.now()
        val todayStr = today.toString()

        val dateMap = cache.dateMap
        val monthMap = cache.monthMap
        val yearMap = cache.yearMap
        val sessions = cache.rawSessions

        fun generateHeatmap(refDate: LocalDate, hlStart: String, hlEnd: String): List<List<HeatmapCellData>> {
            val firstDayOfMonth = refDate.withDayOfMonth(1)
            val startMon = firstDayOfMonth.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
            val targetMonthPrefix = String.format(Locale.US, "%04d-%02d", refDate.year, refDate.monthValue)

            val grid = mutableListOf<List<HeatmapCellData>>()
            for (w in 0 until 5) {
                val row = mutableListOf<HeatmapCellData>()
                for (d in 0 until 7) {
                    val cur = startMon.plusDays((w * 7 + d).toLong())
                    val curStr = cur.toString()
                    val curMins = dateMap[curStr] ?: 0
                    val curHours = curMins / 60f
                    val targetHours = settings.getDailyGoalForDate(curStr)
                    row.add(
                        HeatmapCellData(
                            dayNum = cur.dayOfMonth,
                            curMins = curMins,
                            curHours = curHours,
                            targetHours = targetHours,
                            dateStr = curStr,
                            isCurrent = curStr >= hlStart && curStr <= hlEnd,
                            isToday = curStr == todayStr,
                            isSameMonth = curStr.startsWith(targetMonthPrefix)
                        )
                    )
                }
                grid.add(row)
            }
            return grid
        }

        var displayHours = "0h 00m"
        var displayPomos = 0
        var displaySubToday = "0h today"
        var displaySubDays = "0 active days"
        var dateRangeLabel = "Today"
        var heatmapTitleDate = "Month"
        var heatmapGrid: List<List<HeatmapCellData>> = emptyList()
        var chartTitle = "Total per day"
        var chartSubLabel = "Bar focused by daily goal"
        var chartPeakLabel = "Goal: ${settings.dailyGoalHours}h"
        var chartSlots: List<ChartBarSlot> = emptyList()
        var filteredSessions: List<SessionEntity> = emptyList()

        val monthYearFmt = MONTH_YEAR_FMT
        val shortDateFmt = SHORT_DATE_FMT
        val fullDateFmt = FULL_DATE_FMT

        when (period) {
            "Daily" -> {
                val targetDate = today.plusDays(offset.toLong())
                val targetStr = targetDate.toString()
                val dateStrLabel = targetDate.format(fullDateFmt)
                dateRangeLabel = when (offset) {
                    0 -> "Today ($dateStrLabel)"
                    -1 -> "Yesterday ($dateStrLabel)"
                    else -> dateStrLabel
                }
                heatmapTitleDate = targetDate.format(monthYearFmt)

                val totalMins = dateMap[targetStr] ?: 0
                filteredSessions = sessions.filter { it.dateStr == targetStr }
                displayHours = formatDisplayHours(totalMins)
                displayPomos = filteredSessions.size
                displaySubToday = "$displayHours on this day"
                displaySubDays = if (totalMins > 0) "1 active day" else "0 active days"

                val monDate = targetDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                val labels = listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
                val targetGoal = settings.getDailyGoalForDate(targetStr)

                chartSlots = labels.mapIndexed { idx, label ->
                    val d = monDate.plusDays(idx.toLong())
                    val dStr = d.toString()
                    val mins = dateMap[dStr] ?: 0
                    val slotGoalMins = (settings.getDailyGoalForDate(dStr) * 60f).coerceAtLeast(1f)
                    val ratio = (mins / slotGoalMins).coerceIn(0f, 1f)
                    val diffDays = ChronoUnit.DAYS.between(today, d).toInt()
                    val daySessions = cache.sessionsByDate[dStr] ?: emptyList()
                    val daySegments = computeSegmentsForSessions(daySessions, projects, slotGoalMins)
                    ChartBarSlot(
                        label = label,
                        mins = mins,
                        valText = formatBarHours(mins),
                        isCurrent = dStr == targetStr,
                        targetOffset = diffDays,
                        ratio = ratio,
                        segments = daySegments
                    )
                }
                chartTitle = "Total per day"
                chartPeakLabel = "Goal: ${targetGoal}h"
                chartSubLabel = "Bar focused by daily goal"
                heatmapGrid = generateHeatmap(targetDate, targetStr, targetStr)
            }

            "Weekly" -> {
                val thisWeekMon = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                val wkStart = thisWeekMon.plusWeeks(offset.toLong())
                val wkEnd = wkStart.plusDays(6)
                val sStr = wkStart.toString()
                val eStr = wkEnd.toString()

                dateRangeLabel = "${wkStart.format(shortDateFmt)} - ${wkEnd.format(fullDateFmt)}"
                heatmapTitleDate = wkStart.format(monthYearFmt)

                filteredSessions = sessions.filter { it.dateStr in sStr..eStr }
                val totalMins = filteredSessions.sumOf { it.duration }
                displayHours = formatDisplayHours(totalMins)
                displayPomos = filteredSessions.size
                val uniqueDays = filteredSessions.map { it.dateStr }.toSet().size
                displaySubToday = "${formatTimeNoDecimals((totalMins / 7f).roundToInt())} avg / day"
                displaySubDays = "$uniqueDays days focused"

                val weeklyGoalHours = settings.dailyGoalHours * 7f
                val weeklyGoalMins = (weeklyGoalHours * 60f).coerceAtLeast(1f)
                val maxW = (offset + 3).coerceAtMost(0)

                val slots = mutableListOf<ChartBarSlot>()
                for (w in (maxW - 3)..maxW) {
                    val curStart = thisWeekMon.plusWeeks(w.toLong())
                    var mins = 0
                    val wkSessions = mutableListOf<SessionEntity>()
                    for (i in 0..6) {
                        val dStr = curStart.plusDays(i.toLong()).toString()
                        mins += dateMap[dStr] ?: 0
                        cache.sessionsByDate[dStr]?.let { wkSessions.addAll(it) }
                    }
                    val label = if (w == 0) "This Wk" else "${kotlin.math.abs(w)}Wk Ago"
                    val wkSegments = computeSegmentsForSessions(wkSessions, projects, weeklyGoalMins)
                    slots.add(
                        ChartBarSlot(
                            label = label,
                            mins = mins,
                            valText = formatBarHours(mins),
                            isCurrent = w == offset,
                            targetOffset = w,
                            ratio = (mins / weeklyGoalMins).coerceIn(0f, 1f),
                            segments = wkSegments
                        )
                    )
                }
                chartSlots = slots
                chartTitle = "Total per week"
                chartPeakLabel = "Goal: ${weeklyGoalHours.roundToInt()}h/wk"
                chartSubLabel = "Bar focused by weekly goal"
                heatmapGrid = generateHeatmap(wkEnd, sStr, eStr)
            }

            "Monthly" -> {
                val targetYm = YearMonth.from(today).plusMonths(offset.toLong())
                val prefix = String.format(Locale.US, "%04d-%02d", targetYm.year, targetYm.monthValue)
                dateRangeLabel = targetYm.atDay(1).format(monthYearFmt)
                heatmapTitleDate = dateRangeLabel

                filteredSessions = sessions.filter { it.dateStr.startsWith(prefix) }
                val totalMins = monthMap[prefix] ?: 0
                displayHours = formatDisplayHours(totalMins)
                displayPomos = filteredSessions.size
                val uniqueDays = filteredSessions.map { it.dateStr }.toSet().size
                displaySubToday = "${formatTimeNoDecimals(totalMins / uniqueDays.coerceAtLeast(1))} avg / active day"
                displaySubDays = "$uniqueDays days focused"

                val monthlyGoalHours = settings.dailyGoalHours * 22f
                val monthlyGoalMins = (monthlyGoalHours * 60f).coerceAtLeast(1f)
                val monthNames = listOf("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")

                chartSlots = monthNames.mapIndexed { idx, mName ->
                    val pfx = String.format(Locale.US, "%04d-%02d", targetYm.year, idx + 1)
                    val mins = monthMap[pfx] ?: 0
                    val moSessions = sessions.filter { it.dateStr.startsWith(pfx) }
                    val moSegments = computeSegmentsForSessions(moSessions, projects, monthlyGoalMins)
                    ChartBarSlot(
                        label = mName,
                        mins = mins,
                        valText = formatBarHours(mins),
                        isCurrent = (idx + 1) == targetYm.monthValue,
                        targetOffset = (targetYm.year - today.year) * 12 + (idx + 1 - today.monthValue),
                        ratio = (mins / monthlyGoalMins).coerceIn(0f, 1f),
                        segments = moSegments
                    )
                }
                chartTitle = "Total per month (${targetYm.year})"
                chartPeakLabel = "Goal: ${monthlyGoalHours.roundToInt()}h/mo"
                chartSubLabel = "Bar focused by monthly goal"
                val moStart = targetYm.atDay(1).toString()
                val moEnd = targetYm.atEndOfMonth().toString()
                heatmapGrid = generateHeatmap(targetYm.atDay(1), moStart, moEnd)
            }

            else -> {
                // Yearly or All
                val targetYr = if (period == "Yearly") today.year + offset else today.year
                val yrStr = targetYr.toString()
                dateRangeLabel = if (period == "All") "All Time" else yrStr
                heatmapTitleDate = "All Time"

                filteredSessions = if (period == "All") sessions else sessions.filter { it.dateStr.startsWith(yrStr) }
                val totalMins = filteredSessions.sumOf { it.duration }
                displayHours = formatDisplayHours(totalMins)
                displayPomos = filteredSessions.size
                val uniqueDays = filteredSessions.map { it.dateStr }.toSet().size
                displaySubToday = "${formatTimeNoDecimals(totalMins / uniqueDays.coerceAtLeast(1))} avg / active day"
                displaySubDays = "$uniqueDays active days"

                val years = listOf(targetYr - 2, targetYr - 1, targetYr)
                val maxYrMins = years.maxOfOrNull { yearMap[it.toString()] ?: 0 } ?: 0
                val yearlyGoalMins = maxYrMins.toFloat().coerceAtLeast(1f)
                chartSlots = years.map { y ->
                    val mins = yearMap[y.toString()] ?: 0
                    val yrSessions = sessions.filter { it.dateStr.startsWith(y.toString()) }
                    val yrSegments = computeSegmentsForSessions(yrSessions, projects, yearlyGoalMins)
                    ChartBarSlot(
                        label = y.toString(),
                        mins = mins,
                        valText = formatBarHours(mins),
                        isCurrent = y == targetYr,
                        targetOffset = if (period == "Yearly") y - today.year else null,
                        ratio = if (maxYrMins > 0) (mins.toFloat() / maxYrMins.toFloat()).coerceIn(0f, 1f) else 0f,
                        segments = yrSegments
                    )
                }
                chartTitle = "Total per year"
                chartPeakLabel = if (maxYrMins > 0) formatDisplayHours(maxYrMins) else "No activity"
                chartSubLabel = if (period == "All") "All-time focus progression" else "Annual focus time progression"
                heatmapGrid = generateHeatmap(today, todayStr, todayStr)
            }
        }

        // Distribution by project matching AnalyticsDashboard.jsx
        val distTotalMins = filteredSessions.sumOf { it.duration }
        val projStats = mutableMapOf<String, Pair<Int, Int>>() // count to mins
        filteredSessions.forEach { s ->
            val pid = s.projectId.ifBlank { projects.firstOrNull()?.id ?: "proj-1" }
            val cur = projStats[pid] ?: (0 to 0)
            projStats[pid] = (cur.first + 1) to (cur.second + s.duration)
        }

        val allSegments = projects.mapIndexed { idx, proj ->
            val stats = projStats[proj.id] ?: (0 to 0)
            val pct = if (distTotalMins > 0) ((stats.second.toFloat() / distTotalMins.toFloat()) * 100f).roundToInt() else 0
            DistributionSegment(
                label = proj.displayName,
                pct = pct,
                count = stats.first,
                mins = stats.second,
                displayTime = formatDisplayHours(stats.second),
                color = parseHexColor(proj.color, FALLBACK_COLORS[idx % FALLBACK_COLORS.size])
            )
        }

        val activeSegments = allSegments
            .filter { it.pct > 0 || it.count > 0 }
            .sortedByDescending { it.mins }
            .ifEmpty {
                allSegments.take(4).ifEmpty {
                    listOf(
                        DistributionSegment(
                            label = "General",
                            pct = 0,
                            count = 0,
                            mins = 0,
                            displayTime = "0h 00m",
                            color = Color(0xFF181818)
                        )
                    )
                }
            }

        return AnalyticsMetrics(
            displayHours = displayHours,
            displayPomos = displayPomos,
            displaySubToday = displaySubToday,
            displaySubDays = displaySubDays,
            dateRangeLabel = dateRangeLabel,
            heatmapTitleDate = heatmapTitleDate,
            heatmapGrid = heatmapGrid,
            chartTitle = chartTitle,
            chartSubLabel = chartSubLabel,
            chartPeakLabel = chartPeakLabel,
            chartSlots = chartSlots,
            distributionTotalTime = formatDisplayHours(distTotalMins),
            segments = activeSegments
        )
    }
}
