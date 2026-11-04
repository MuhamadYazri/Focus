package com.yazri.focus.ui.tasks

import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animate
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.draggable
import androidx.compose.foundation.gestures.rememberDraggableState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlin.math.abs

/**
 * Swipe-to-act row (inspired by ReactBits SwipeRow).
 *
 * - Swipe RIGHT past the threshold  -> [onSwipeRight] (e.g. complete)
 * - Swipe LEFT  past the threshold  -> [onSwipeLeft]  (e.g. delete, undo toast is handled upstream)
 *
 * Performance contract: the live drag offset is stored in a plain float state that is ONLY read inside
 * `graphicsLayer {}` / `drawBehind {}` lambdas. Dragging therefore never triggers recomposition or a
 * layout pass; only the GPU RenderNode translation + a single draw invalidation per frame.
 */
@Composable
fun SwipeActionRow(
    rightIcon: ImageVector,
    rightColor: Color,
    rightIconTint: Color,
    leftIcon: ImageVector,
    leftColor: Color,
    leftIconTint: Color,
    onSwipeRight: () -> Unit,
    onSwipeLeft: () -> Unit,
    modifier: Modifier = Modifier,
    cornerRadius: androidx.compose.ui.unit.Dp = 22.dp,
    content: @Composable () -> Unit
) {
    var offsetX by remember { mutableFloatStateOf(0f) }
    var widthPx by remember { mutableFloatStateOf(0f) }
    val armed = remember { BooleanArray(1) }
    val settleJob = remember { arrayOfNulls<Job>(1) }
    val scope = rememberCoroutineScope()
    val haptic = LocalHapticFeedback.current
    val cornerPx = with(LocalDensity.current) { cornerRadius.toPx() }

    fun threshold() = widthPx * 0.34f

    fun settle(target: Float, spec: androidx.compose.animation.core.AnimationSpec<Float>, after: (() -> Unit)? = null) {
        settleJob[0]?.cancel()
        settleJob[0] = scope.launch {
            animate(initialValue = offsetX, targetValue = target, animationSpec = spec) { v, _ -> offsetX = v }
            after?.invoke()
        }
    }

    val springBack = spring<Float>(dampingRatio = 0.72f, stiffness = Spring.StiffnessMediumLow)

    val dragState = rememberDraggableState { delta ->
        val w = widthPx
        if (w <= 0f) return@rememberDraggableState
        val thr = threshold()
        // Rubber-band: full tracking up to the threshold, heavy resistance beyond it.
        val resistance = if (abs(offsetX) >= thr) 0.32f else 1f
        offsetX = (offsetX + delta * resistance).coerceIn(-w * 0.7f, w * 0.7f)

        val nowArmed = abs(offsetX) >= thr
        if (nowArmed != armed[0]) {
            armed[0] = nowArmed
            if (nowArmed) haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
        }
    }

    Box(
        modifier = modifier
            .onSizeChanged { widthPx = it.width.toFloat() }
            .draggable(
                state = dragState,
                orientation = Orientation.Horizontal,
                onDragStarted = { settleJob[0]?.cancel() },
                onDragStopped = { velocity ->
                    val w = widthPx
                    val thr = threshold()
                    armed[0] = false
                    val flingRight = velocity > 1800f && offsetX > w * 0.12f
                    val flingLeft = velocity < -1800f && offsetX < -w * 0.12f
                    when {
                        offsetX >= thr || flingRight -> {
                            haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                            onSwipeRight()
                            settle(0f, springBack)
                        }
                        offsetX <= -thr || flingLeft -> {
                            haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                            // Slide fully off-screen, then act; spring home in case the row survives.
                            settle(-w, tween(160)) {
                                onSwipeLeft()
                                settle(0f, springBack)
                            }
                        }
                        else -> settle(0f, springBack)
                    }
                }
            )
    ) {
        // ── Action tray (behind the card). Draw-phase only; no composition reads of offsetX. ──
        Box(
            modifier = Modifier
                .matchParentSize()
                .drawBehind {
                    val o = offsetX
                    if (o == 0f) return@drawBehind
                    val color = if (o > 0f) rightColor else leftColor
                    val a = (abs(o) / (size.width * 0.10f)).coerceIn(0f, 1f)
                    drawRoundRect(
                        color = color.copy(alpha = color.alpha * a),
                        cornerRadius = CornerRadius(cornerPx, cornerPx)
                    )
                }
        ) {
            Box(
                modifier = Modifier
                    .align(Alignment.CenterStart)
                    .padding(start = 26.dp)
                    .graphicsLayer {
                        val p = (offsetX / threshold().coerceAtLeast(1f)).coerceIn(0f, 1f)
                        alpha = if (offsetX > 0f) p else 0f
                        val s = 0.7f + 0.3f * p + if (p >= 1f) 0.18f else 0f
                        scaleX = s
                        scaleY = s
                    }
            ) {
                Icon(imageVector = rightIcon, contentDescription = null, tint = rightIconTint, modifier = Modifier.size(24.dp))
            }
            Box(
                modifier = Modifier
                    .align(Alignment.CenterEnd)
                    .padding(end = 26.dp)
                    .graphicsLayer {
                        val p = (-offsetX / threshold().coerceAtLeast(1f)).coerceIn(0f, 1f)
                        alpha = if (offsetX < 0f) p else 0f
                        val s = 0.7f + 0.3f * p + if (p >= 1f) 0.18f else 0f
                        scaleX = s
                        scaleY = s
                    }
            ) {
                Icon(imageVector = leftIcon, contentDescription = null, tint = leftIconTint, modifier = Modifier.size(24.dp))
            }
        }

        // ── Foreground card: GPU translation only ──
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .graphicsLayer { translationX = offsetX }
        ) {
            content()
        }
    }
}
