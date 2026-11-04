package com.yazri.focus.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yazri.focus.ui.theme.*

data class ChartBarSegment(
    val color: Color,
    val mins: Int,
    val ratio: Float
)

data class ChartBarSlot(
    val label: String,
    val mins: Int,
    val valText: String,
    val isCurrent: Boolean,
    val targetOffset: Int?,
    val ratio: Float,
    val segments: List<ChartBarSegment> = emptyList()
)

@Composable
fun ActivityCapsuleChart(
    chartTitle: String,
    chartSubLabel: String,
    chartPeakLabel: String,
    slots: List<ChartBarSlot>,
    onSlotClick: (ChartBarSlot) -> Unit,
    modifier: Modifier = Modifier
) {
    val isDense = slots.size > 7

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
                text = chartTitle.uppercase(),
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.2.sp,
                color = SoftSage
            )
            Text(
                text = chartPeakLabel,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                color = MossSecondary
            )
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Vertical Capsule Bars
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(138.dp),
            horizontalArrangement = Arrangement.spacedBy(if (isDense) 4.dp else 8.dp),
            verticalAlignment = Alignment.Bottom
        ) {
            slots.forEach { slot ->
                key(slot.label) {
                    val isDark = FocusTheme.colors.isDark
                    val targetFill = if (slot.mins > 0) slot.ratio.coerceIn(0.14f, 1f) else 0f
                    val fillColor = when {
                        slot.isCurrent && slot.mins > 0 -> if (isDark) Color(0xFFE2E2DD) else InkDark
                        slot.mins > 0 -> if (isDark) Color(0xFF8E8E88) else Color(0xFF7A7A74)
                        else -> Color.Transparent
                    }
                    val trackBg = if (slot.isCurrent) {
                        if (isDark) Color(0xFF282824) else Color(0xFFE2E7DF)
                    } else SurfaceSubtle

                    val barShape = RoundedCornerShape(topStart = 8.dp, topEnd = 8.dp, bottomStart = 4.dp, bottomEnd = 4.dp)

                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                            .then(
                                if (slot.targetOffset != null) {
                                    Modifier.clickable { onSlotClick(slot) }
                                } else Modifier
                            ),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Bottom
                    ) {
                        Text(
                            text = slot.valText,
                            fontSize = if (isDense) 8.sp else 9.sp,
                            fontWeight = if (slot.isCurrent) FontWeight.Bold else FontWeight.Medium,
                            color = if (slot.isCurrent) (if (isDark) Color(0xFFFFFFFF) else InkDark) else if (slot.mins > 0) MossSecondary else SoftSage,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )

                        Spacer(modifier = Modifier.height(5.dp))

                        // Capsule Track (84dp height)
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(84.dp)
                                .clip(barShape)
                                .background(trackBg),
                            contentAlignment = Alignment.BottomCenter
                        ) {
                            if (slot.mins > 0) {
                                val fillTopShape = RoundedCornerShape(topStart = 7.dp, topEnd = 7.dp, bottomStart = 0.dp, bottomEnd = 0.dp)
                                if (slot.segments.isNotEmpty()) {
                                    val totalSegMins = slot.segments.sumOf { it.mins }.coerceAtLeast(1)
                                    Column(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .fillMaxHeight(targetFill)
                                            .clip(fillTopShape),
                                        verticalArrangement = Arrangement.Bottom
                                    ) {
                                        slot.segments.forEach { seg ->
                                            val segWeight = (seg.mins.toFloat() / totalSegMins.toFloat()).coerceAtLeast(0.01f)
                                            Box(
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .weight(segWeight)
                                                    .background(seg.color)
                                            )
                                        }
                                    }
                                } else {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .fillMaxHeight(targetFill)
                                            .clip(fillTopShape)
                                            .background(fillColor)
                                    )
                                }
                            }

                            // Render border as top overlay so fill never obscures or misaligns with the border stroke
                            if (slot.isCurrent) {
                                Box(
                                    modifier = Modifier
                                        .matchParentSize()
                                        .border(
                                            width = 1.2.dp,
                                            color = if (isDark) Color(0xFFE2E2DD).copy(alpha = 0.75f) else InkDark.copy(alpha = 0.8f),
                                            shape = barShape
                                        )
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(6.dp))

                        Text(
                            text = slot.label,
                            fontSize = if (isDense) 8.sp else 10.sp,
                            fontWeight = if (slot.isCurrent) FontWeight.Bold else FontWeight.Medium,
                            color = if (slot.isCurrent) (if (isDark) Color(0xFFFFFFFF) else InkDark) else SoftSage,
                            maxLines = 1
                        )
                    }
                }
            }
        }
    }
}
