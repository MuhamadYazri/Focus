package com.yazri.focus.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yazri.focus.ui.theme.*
import java.util.Locale

@Composable
fun DailyGoalHero(
    todayHours: Float,
    targetHours: Float,
    progressPercent: Int,
    modifier: Modifier = Modifier
) {
    val animatedFill by animateFloatAsState(
        targetValue = (progressPercent / 100f).coerceIn(0.01f, 1f),
        animationSpec = tween(durationMillis = 650),
        label = "DailyGoalProgressBar"
    )

    Column(modifier = modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Bottom
        ) {
            Row(verticalAlignment = Alignment.Bottom) {
                Text(
                    text = String.format(Locale.US, "%.1f", todayHours),
                    fontFamily = FontFamily.SansSerif,
                    fontSize = 72.sp,
                    lineHeight = 68.sp,
                    letterSpacing = (-3.5).sp,
                    fontWeight = FontWeight.Medium,
                    color = InkDark
                )
                Spacer(modifier = Modifier.width(3.dp))
                Text(
                    text = "h",
                    fontFamily = FontFamily.SansSerif,
                    fontSize = 30.sp,
                    lineHeight = 32.sp,
                    letterSpacing = (-1).sp,
                    fontWeight = FontWeight.Normal,
                    color = MossSecondary,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
            }

            Column(
                horizontalAlignment = Alignment.End,
                modifier = Modifier.padding(bottom = 8.dp)
            ) {
                Text(
                    text = "$progressPercent%",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = (-0.5).sp,
                    color = InkDark
                )
                Text(
                    text = "of ${String.format(Locale.US, "%.1f", targetHours)}h goal",
                    fontSize = 12.sp,
                    color = MossSecondary,
                    fontWeight = FontWeight.Normal
                )
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Crisp 2dp Progress Bar
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(2.dp)
                .clip(RoundedCornerShape(1.dp))
                .background(BorderHairline)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(animatedFill)
                    .fillMaxHeight()
                    .clip(RoundedCornerShape(1.dp))
                    .background(InkDark)
            )
        }
    }
}
