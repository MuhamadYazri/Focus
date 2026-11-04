package com.yazri.focus.ui.components

import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yazri.focus.ui.theme.*
import kotlin.math.roundToInt

@Composable
fun CircularRingProgress(
    progress: Float, // 0f to 1f
    trackColor: Color = TrackGroove,
    progressColor: Color = OlivePrimary,
    strokeWidthDp: Float = 2.8f,
    modifier: Modifier = Modifier
) {
    val animatedProgress by animateFloatAsState(
        targetValue = progress.coerceIn(0f, 1f),
        animationSpec = tween(durationMillis = 600),
        label = "RingSweepProgress"
    )

    Canvas(modifier = modifier.fillMaxSize()) {
        val strokePx = strokeWidthDp.dp.toPx()
        val trackStrokePx = 2.5.dp.toPx()
        val sweep = animatedProgress * 360f

        drawCircle(
            color = trackColor,
            style = Stroke(width = trackStrokePx)
        )

        drawArc(
            color = progressColor,
            startAngle = -90f,
            sweepAngle = sweep,
            useCenter = false,
            style = Stroke(width = strokePx, cap = StrokeCap.Round)
        )
    }
}

@Composable
fun TimerClockRing(
    timeLeft: Int,
    totalTime: Int,
    mode: String = "work",
    cycleCount: Int = 0,
    longBreakInterval: Int = 4,
    modifier: Modifier = Modifier
) {
    val progress = if (totalTime > 0) (totalTime - timeLeft).toFloat() / totalTime.toFloat() else 0f
    val m = timeLeft / 60
    val s = timeLeft % 60
    val isBreak = mode == "shortBreak" || mode == "longBreak"
    val totalCycles = longBreakInterval.coerceAtLeast(1)
    val currentSessionNumber = (cycleCount % totalCycles) + 1

    val subLabel = when (mode) {
        "work" -> "session $currentSessionNumber of $totalCycles today"
        "shortBreak" -> "Rest & recharge · ${(totalTime / 60f).roundToInt()} min"
        else -> "Deep recovery · ${(totalTime / 60f).roundToInt()} min"
    }

    Box(
        modifier = modifier.size(310.dp),
        contentAlignment = Alignment.Center
    ) {
        CircularRingProgress(
            progress = progress,
            trackColor = TrackGroove,
            progressColor = if (isBreak) SoftSage else OlivePrimary,
            strokeWidthDp = 2.8f,
            modifier = Modifier
                .fillMaxSize()
                .padding(20.dp)
        )

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                RollingTwoDigits(
                    value = m,
                    height = 88.dp,
                    fontSize = 80.sp,
                    lineHeight = 88.sp,
                    letterSpacing = (-4).sp,
                    color = InkDark,
                    fontWeight = FontWeight.Black
                )
                Text(
                    text = ":",
                    fontFamily = FontFamily.SansSerif,
                    fontSize = 80.sp,
                    lineHeight = 88.sp,
                    letterSpacing = (-4).sp,
                    fontWeight = FontWeight.Black,
                    color = InkDark
                )
                RollingTwoDigits(
                    value = s,
                    height = 88.dp,
                    fontSize = 80.sp,
                    lineHeight = 88.sp,
                    letterSpacing = (-4).sp,
                    color = InkDark,
                    fontWeight = FontWeight.Black
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = subLabel,
                fontSize = 12.sp,
                lineHeight = 18.sp,
                letterSpacing = 0.12.sp,
                color = SoftSage,
                fontWeight = FontWeight.Normal
            )

            Spacer(modifier = Modifier.height(10.dp))

            // Horizon Dots: Active dot 18x5dp, Done 5x5dp, Inactive 5x5dp
            Row(
                horizontalArrangement = Arrangement.spacedBy(5.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                for (n in 1..totalCycles) {
                    val isCurrent = n == currentSessionNumber
                    val isDone = n < currentSessionNumber
                    val dotWidth by animateDpAsState(
                        targetValue = if (isCurrent) 18.dp else 5.dp,
                        animationSpec = tween(300),
                        label = "HorizonDotWidth"
                    )
                    val dotColor = when {
                        isCurrent || isDone -> if (isBreak) MossSecondary else OlivePrimary
                        else -> TrackGroove
                    }
                    Box(
                        modifier = Modifier
                            .width(dotWidth)
                            .height(5.dp)
                            .clip(CircleShape)
                            .background(dotColor)
                    )
                }
            }
        }
    }
}
