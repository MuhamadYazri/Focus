package com.yazri.focus.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.key
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yazri.focus.ui.theme.*
import kotlin.math.roundToInt

data class HeatmapCellData(
    val dayNum: Int,
    val curMins: Int,
    val curHours: Float,
    val targetHours: Float,
    val dateStr: String,
    val isCurrent: Boolean,
    val isToday: Boolean,
    val isSameMonth: Boolean
)

@Composable
fun ActivityHeatmap(
    heatmapTitleDate: String,
    grid: List<List<HeatmapCellData>>,
    period: String,
    onCellClick: (HeatmapCellData) -> Unit,
    modifier: Modifier = Modifier
) {
    val dayHeaders = listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")

    Column(
        modifier = modifier
            .fillMaxWidth()
            .raised(RoundedCornerShape(22.dp), SurfaceWhite, elevation = 7.dp)
            .padding(18.dp)
    ) {
        // Header Row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "ACTIVITY HEATMAP",
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.2.sp,
                color = SoftSage
            )
            Text(
                text = heatmapTitleDate,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                color = MossSecondary
            )
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Day-of-week column headers
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(5.dp)
        ) {
            dayHeaders.forEach { day ->
                Box(
                    modifier = Modifier.weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = day,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Medium,
                        color = SoftSage
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(6.dp))

        // 5x7 Grid
        Column(
            verticalArrangement = Arrangement.spacedBy(5.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            grid.forEach { week ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(5.dp)
                ) {
                    week.forEach { cell ->
                        key(cell.dateStr) {
                            val ratio = if (cell.targetHours > 0f) {
                                (cell.curHours / cell.targetHours).coerceIn(0f, 1f)
                            } else 0f

                            val isDark = FocusTheme.colors.isDark
                            val isSelected = cell.isCurrent
                            // High-contrast monochrome intensity scale
                            val bgColor = when {
                                isSelected && cell.curMins <= 0 -> if (isDark) Color(0xFF2C2C28) else Color(0xFFE4E9E2)
                                cell.curMins <= 0 -> SurfaceSubtle
                                ratio >= 1.0f -> if (isDark) Color(0xFFE2E2DD) else InkDark
                                ratio >= 0.7f -> if (isDark) Color(0xFF9E9E96) else Color(0xFF3E3E3B)
                                ratio >= 0.35f -> if (isDark) Color(0xFF5E5E58) else Color(0xFF8A8A84)
                                else -> if (isDark) Color(0xFF2C2C28) else Color(0xFFC6C6C0)
                            }

                            // Dynamic luminance evaluation: determine whether the cell's background is dark
                            val isCellBgDark = if (isDark) {
                                cell.curMins <= 0 || ratio < 0.7f
                            } else {
                                cell.curMins > 0 && ratio >= 0.7f
                            }

                            // Strictly luminance-aware text color: guarantees 100% readability across all ratios and selection states
                            val dayTextColor = when {
                                cell.curMins <= 0 -> if (isSelected) {
                                    if (isDark) Color(0xFFF2F2EE) else InkDark
                                } else SoftSage
                                isCellBgDark -> Color(0xFFF9F9F7) // Pure crisp white on dark background
                                else -> Color(0xFF111111)         // Pure carbon black on light background
                            }

                            val isInteractive = period == "Daily" || period == "Weekly" || period == "Monthly"

                            // Selection border inverts against cell's own background so it is always crisp, distinct, and visible
                            val borderModifier = when {
                                cell.isCurrent -> {
                                    val selBorderColor = if (isCellBgDark) {
                                        Color(0xFFFFFFFF)
                                    } else {
                                        Color(0xFF111111)
                                    }
                                    Modifier.border(
                                        width = 1.5.dp,
                                        color = selBorderColor,
                                        shape = RoundedCornerShape(8.dp)
                                    )
                                }
                                cell.isToday -> Modifier.border(
                                    width = 1.dp,
                                    color = MossSecondary,
                                    shape = RoundedCornerShape(8.dp)
                                )
                                else -> Modifier
                            }

                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .height(34.dp)
                                    .alpha(if (cell.isSameMonth) 1f else 0.25f)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(bgColor)
                                    .then(borderModifier)
                                    .then(
                                        if (isInteractive) {
                                            Modifier.clickable { onCellClick(cell) }
                                        } else Modifier
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = cell.dayNum.toString(),
                                    fontSize = 12.sp,
                                    fontWeight = if (cell.curMins > 0 || cell.isToday) FontWeight.Bold else FontWeight.Medium,
                                    color = dayTextColor
                                )
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Legend Row
        val isDark = FocusTheme.colors.isDark
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = "0h",
                    fontSize = 9.sp,
                    color = SoftSage,
                    modifier = Modifier.padding(end = 2.dp)
                )
                val swatches = if (isDark) {
                    listOf(
                        SurfaceSubtle,
                        Color(0xFF2C2C28),
                        Color(0xFF5E5E58),
                        Color(0xFF9E9E96),
                        Color(0xFFE2E2DD)
                    )
                } else {
                    listOf(
                        SurfaceSubtle,
                        Color(0xFFC6C6C0),
                        Color(0xFF8A8A84),
                        Color(0xFF3E3E3B),
                        InkDark
                    )
                }
                swatches.forEach { swatch ->
                    Box(
                        modifier = Modifier
                            .size(9.dp)
                            .clip(RoundedCornerShape(2.dp))
                            .background(swatch)
                    )
                }
                Text(
                    text = "Goal+",
                    fontSize = 9.sp,
                    color = SoftSage,
                    modifier = Modifier.padding(start = 2.dp)
                )
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(5.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(9.dp)
                        .clip(RoundedCornerShape(3.dp))
                        .border(1.2.dp, if (isDark) Color(0xFFE2E2DD) else InkDark, RoundedCornerShape(3.dp))
                )
                Text(
                    text = "Selected",
                    fontSize = 9.sp,
                    color = SoftSage
                )
            }
        }
    }
}
