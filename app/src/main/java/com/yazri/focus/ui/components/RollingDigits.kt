package com.yazri.focus.ui.components

import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.zIndex
import androidx.compose.foundation.shape.GenericShape
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.PlatformTextStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yazri.focus.ui.theme.InkDark
import com.yazri.focus.ui.theme.ClashDisplayFontFamily
import com.yazri.focus.ui.theme.PanchangFontFamily

@Composable
fun RollingDigit(
    digit: Int,
    style: TextStyle,
    height: Dp = 22.dp,
    clipHeight: Dp = height,
    verticalShift: Dp = 0.dp,
    strokeColor: Color = Color.Unspecified,
    strokeWidth: Dp = 0.dp,
    shadowColor: Color = Color.Unspecified,
    shadowRadius: Dp = 0.dp,
    allowRightOverflow: Boolean = false,
    modifier: Modifier = Modifier
) {
    val safeDigit = digit.coerceIn(0, 9)
    val density = LocalDensity.current
    val heightPx = with(density) { height.toPx() }
    val shiftPx = with(density) { verticalShift.toPx() }
    val strokeWidthPx = with(density) { strokeWidth.toPx() }
    val shadowRadiusPx = with(density) { shadowRadius.toPx() }

    val animatedOffsetPx by animateFloatAsState(
        targetValue = -safeDigit * heightPx,
        animationSpec = spring(
            stiffness = 220f,
            dampingRatio = 0.82f,
            visibilityThreshold = 0.5f
        ),
        label = "RollingDigitStripOffset"
    )

    val finalStyle = androidx.compose.runtime.remember(style, shadowColor, shadowRadiusPx) {
        if (shadowRadiusPx > 0f && shadowColor != Color.Unspecified) {
            style.copy(
                shadow = Shadow(
                    color = shadowColor,
                    offset = Offset.Zero,
                    blurRadius = shadowRadiusPx
                )
            )
        } else {
            style
        }
    }

    val strokeStyle = androidx.compose.runtime.remember(style, strokeColor, strokeWidthPx) {
        if (strokeWidthPx > 0f && strokeColor != Color.Unspecified) {
            style.copy(
                color = strokeColor,
                drawStyle = Stroke(
                    width = strokeWidthPx,
                    join = StrokeJoin.Round,
                    cap = StrokeCap.Round
                )
            )
        } else null
    }

    val clipShape = androidx.compose.runtime.remember(density, allowRightOverflow) {
        if (allowRightOverflow) {
            GenericShape { size, _ ->
                addRect(
                    Rect(
                        left = 0f,
                        top = 0f,
                        right = size.width + with(density) { 120.dp.toPx() },
                        bottom = size.height
                    )
                )
            }
        } else null
    }

    Box(
        modifier = modifier
            .height(clipHeight)
            .then(
                if (clipShape != null) Modifier.clip(clipShape) else Modifier.clipToBounds()
            ),
        contentAlignment = Alignment.TopCenter
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier
                .wrapContentHeight(align = Alignment.Top, unbounded = true)
                .graphicsLayer {
                    translationY = animatedOffsetPx
                }
        ) {
            val textModifier = Modifier
                .wrapContentHeight(
                    align = Alignment.CenterVertically,
                    unbounded = true
                )
                .graphicsLayer {
                    translationY = shiftPx
                }

            for (n in 0..9) {
                Box(
                    modifier = Modifier.height(height),
                    contentAlignment = Alignment.Center
                ) {
                    if (strokeStyle != null) {
                        Text(
                            text = n.toString(),
                            style = strokeStyle,
                            modifier = textModifier
                        )
                    }

                    Text(
                        text = n.toString(),
                        style = finalStyle,
                        modifier = textModifier
                    )
                }
            }
        }
    }
}

@Composable
fun RollingTwoDigits(
    value: Int,
    height: Dp = 88.dp,
    clipHeight: Dp = height,
    fontSize: TextUnit = 88.sp,
    lineHeight: TextUnit = 88.sp,
    letterSpacing: TextUnit = (-4).sp,
    color: Color = InkDark,
    fontWeight: FontWeight = FontWeight.Bold,
    fontFamily: FontFamily = ClashDisplayFontFamily,
    verticalShift: Dp = 0.dp,
    strokeColor: Color = Color.Unspecified,
    strokeWidth: Dp = 0.dp,
    shadowColor: Color = Color.Unspecified,
    shadowRadius: Dp = 0.dp,
    digitSpacing: Dp = 0.dp,
    modifier: Modifier = Modifier
) {
    val style = androidx.compose.runtime.remember(fontSize, lineHeight, letterSpacing, color, fontWeight, fontFamily) {
        TextStyle(
            fontFamily = fontFamily,
            fontSize = fontSize,
            lineHeight = lineHeight,
            letterSpacing = letterSpacing,
            fontWeight = fontWeight,
            color = color,
            platformStyle = PlatformTextStyle(includeFontPadding = false)
        )
    }
    val tens = (value / 10).coerceIn(0, 9)
    val ones = (value % 10).coerceIn(0, 9)

    Row(
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(digitSpacing),
        modifier = modifier
    ) {
        RollingDigit(
            digit = tens,
            style = style,
            height = height,
            clipHeight = clipHeight,
            verticalShift = verticalShift,
            strokeColor = strokeColor,
            strokeWidth = strokeWidth,
            shadowColor = shadowColor,
            shadowRadius = shadowRadius,
            allowRightOverflow = true,
            modifier = Modifier.zIndex(1f)
        )
        RollingDigit(
            digit = ones,
            style = style,
            height = height,
            clipHeight = clipHeight,
            verticalShift = verticalShift,
            strokeColor = Color.Unspecified,
            strokeWidth = 0.dp,
            shadowColor = Color.Unspecified,
            shadowRadius = 0.dp,
            allowRightOverflow = false,
            modifier = Modifier.zIndex(0f)
        )
    }
}
