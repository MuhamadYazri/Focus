package com.yazri.focus.ui.tasks

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yazri.focus.data.local.entities.TaskEntity
import com.yazri.focus.ui.theme.*

@Composable
fun TaskItemRow(
    task: TaskEntity,
    isCurrentFocus: Boolean,
    isPlaying: Boolean = false,
    isJustCompleted: Boolean = false,
    onToggleComplete: () -> Unit,
    onEditTask: () -> Unit,
    onStartPomodoro: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isDone = task.completed || isJustCompleted
    val rowAlpha by animateFloatAsState(
        targetValue = if (isDone) 0.58f else 1f,
        animationSpec = tween(250),
        label = "TaskRowAlpha"
    )
    val checkScale by animateFloatAsState(
        targetValue = if (isDone) 1f else 0.6f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessMedium
        ),
        label = "CheckScale"
    )

    val cardBg by animateColorAsState(
        targetValue = if (isCurrentFocus && !isDone) InkDark else SurfaceWhite,
        animationSpec = tween(220),
        label = "TaskCardBg"
    )
    val primaryTextColor = if (isCurrentFocus && !isDone) TextOnDark else InkDark
    val secondaryTextColor = if (isCurrentFocus && !isDone) (if (FocusTheme.colors.isDark) Color(0xFF6E6E68) else Color(0xFF8E8E8A)) else MossSecondary

    // Reference 1 style rounded-22dp card (inverted solid black when active)
    Box(
        modifier = modifier
            .fillMaxWidth()
            .then(
                if (isCurrentFocus && !isDone) Modifier.raisedDark(RoundedCornerShape(22.dp), cardBg, elevation = 7.dp)
                else Modifier.raised(RoundedCornerShape(22.dp), cardBg, elevation = 7.dp)
            )
            .clickable { onEditTask() }
            .padding(horizontal = 20.dp, vertical = 18.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .alpha(rowAlpha),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Left: Checkbox + Metadata Subtitle + Task Title
            Row(
                modifier = Modifier
                    .weight(1f)
                    .padding(end = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                val ringBg = when {
                    isDone -> InkDark
                    isCurrentFocus -> primaryTextColor.copy(alpha = 0.06f)
                    else -> Color.Transparent
                }
                val ringBorderColor = when {
                    isDone -> InkDark
                    isCurrentFocus -> primaryTextColor.copy(alpha = 0.32f)
                    else -> SoftSage
                }

                Box(
                    modifier = Modifier
                        .size(20.dp)
                        .graphicsLayer {
                            scaleX = if (isJustCompleted) 1.08f else 1f
                            scaleY = if (isJustCompleted) 1.08f else 1f
                        }
                        .clip(CircleShape)
                        .background(ringBg)
                        .border(
                            width = 1.4.dp,
                            color = ringBorderColor,
                            shape = CircleShape
                        )
                        .clickable { onToggleComplete() },
                    contentAlignment = Alignment.Center
                ) {
                    if (isDone) {
                        val checkColor = TextOnDark
                        Canvas(
                            modifier = Modifier
                                .size(10.dp)
                                .graphicsLayer {
                                    scaleX = checkScale
                                    scaleY = checkScale
                                }
                        ) {
                            val sx = size.width / 24f
                            val sy = size.height / 24f
                            val path = Path().apply {
                                moveTo(20f * sx, 6f * sy)
                                lineTo(9f * sx, 17f * sy)
                                lineTo(4f * sx, 12f * sy)
                            }
                            drawPath(
                                path = path,
                                color = checkColor,
                                style = Stroke(
                                    width = 3f * sx,
                                    cap = StrokeCap.Round,
                                    join = StrokeJoin.Round
                                )
                            )
                        }
                    } else if (isCurrentFocus) {
                        Box(
                            modifier = Modifier
                                .size(7.dp)
                                .clip(CircleShape)
                                .background(AccentAmber)
                        )
                    }
                }

                Text(
                    text = task.title,
                    fontSize = 16.sp,
                    lineHeight = 21.sp,
                    letterSpacing = (-0.3).sp,
                    fontWeight = FontWeight.Medium,
                    color = if (isDone) MossSecondary else primaryTextColor,
                    textDecoration = if (isDone) TextDecoration.LineThrough else TextDecoration.None,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            // Right: Oversized Tabular Session Readout + Play/Pause Trigger
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Column(
                    horizontalAlignment = Alignment.End,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = "${task.completedPomos}/${task.estimatedPomos.coerceAtLeast(1)}",
                        fontSize = 26.sp,
                        fontWeight = FontWeight.Normal,
                        letterSpacing = (-1).sp,
                        color = primaryTextColor
                    )
                    if (task.durationMinutes != null && task.durationMinutes > 0) {
                        Text(
                            text = "${task.durationMinutes}m",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = MossSecondary,
                            modifier = Modifier.offset(y = (-3).dp)
                        )
                    }
                }

                if (!isDone) {
                    val playIconTint = if (isCurrentFocus) TextOnDark else InkDark
                    val playButtonModifier = if (isCurrentFocus) {
                        Modifier
                            .clip(CircleShape)
                            .background(primaryTextColor.copy(alpha = 0.08f))
                    } else {
                        Modifier.inset(CircleShape, SurfaceSubtle, depth = 3.dp)
                    }
                    Box(
                        modifier = Modifier
                            .size(34.dp)
                            .then(playButtonModifier)
                            .clickable { onStartPomodoro() },
                        contentAlignment = Alignment.Center
                    ) {
                        Canvas(modifier = Modifier.size(12.dp)) {
                            val sx = size.width / 24f
                            val sy = size.height / 24f
                            val iconTint = playIconTint
                            if (isPlaying) {
                                drawRect(
                                    color = iconTint,
                                    topLeft = Offset(6f * sx, 4f * sy),
                                    size = Size(4f * sx, 16f * sy)
                                )
                                drawRect(
                                    color = iconTint,
                                    topLeft = Offset(14f * sx, 4f * sy),
                                    size = Size(4f * sx, 16f * sy)
                                )
                            } else {
                                val playPath = Path().apply {
                                    moveTo(7f * sx, 4f * sy)
                                    lineTo(20f * sx, 12f * sy)
                                    lineTo(7f * sx, 20f * sy)
                                    close()
                                }
                                drawPath(path = playPath, color = iconTint)
                            }
                        }
                    }
                }
            }
        }
    }
}
