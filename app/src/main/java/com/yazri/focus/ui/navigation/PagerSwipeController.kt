package com.yazri.focus.ui.navigation

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.AnimationVector1D
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import kotlin.math.abs
import kotlin.math.roundToInt

/**
 * High-performance, GPU-driven gesture controller for interactive 1:1 parallax slide
 * and real-time bottom dock indicator progression at locked 120 FPS.
 *
 * All live progress values are consumed inside `Modifier.graphicsLayer { ... }` or Canvas scopes,
 * eliminating recompositions and re-layout passes during touch drags.
 */
@Stable
class PagerSwipeController(
    initialIndex: Int,
    val tabCount: Int,
    private val scope: CoroutineScope,
    private val onTabSettled: (String) -> Unit
) {
    val animatable: Animatable<Float, AnimationVector1D> = Animatable(initialIndex.toFloat())

    var isDragging by mutableStateOf(false)
        private set

    var lastSettledIndex by mutableIntStateOf(initialIndex)
        private set

    val progress: Float
        get() = animatable.value

    fun onDragStart() {
        isDragging = true
    }

    fun onDrag(deltaX: Float, screenWidthPx: Float) {
        if (screenWidthPx <= 0f) return
        val current = animatable.value
        // Swiping left (deltaX < 0) advances to next page (deltaProgress > 0)
        val deltaProgress = -deltaX / screenWidthPx
        val rawProgress = current + deltaProgress

        // Rubber-band resistance at bounds
        val boundedProgress = when {
            rawProgress < 0f -> rawProgress * 0.25f
            rawProgress > (tabCount - 1) -> (tabCount - 1) + (rawProgress - (tabCount - 1)) * 0.25f
            else -> rawProgress
        }

        scope.launch {
            animatable.snapTo(boundedProgress)
        }
    }

    fun onDockDrag(touchX: Float, startCenterPx: Float, stridePx: Float) {
        if (stridePx <= 0f) return
        val raw = (touchX - startCenterPx) / stridePx
        val clamped = raw.coerceIn(0f, (tabCount - 1).toFloat())
        scope.launch {
            animatable.snapTo(clamped)
        }
    }

    fun onDragEnd(velocityPx: Float = 0f, screenWidthPx: Float = 1f) {
        isDragging = false
        val current = animatable.value
        val targetIndex = if (abs(velocityPx) > 1000f && screenWidthPx > 0f) {
            if (velocityPx < 0) {
                // Fling to next
                (current.toInt() + 1).coerceAtMost(tabCount - 1)
            } else {
                // Fling to prev
                current.toInt().coerceAtLeast(0)
            }
        } else {
            current.roundToInt().coerceIn(0, tabCount - 1)
        }
        snapToTab(targetIndex)
    }

    fun snapToTab(targetIndex: Int) {
        val clamped = targetIndex.coerceIn(0, tabCount - 1)
        scope.launch {
            animatable.animateTo(
                targetValue = clamped.toFloat(),
                animationSpec = spring(
                    dampingRatio = 0.85f,
                    stiffness = Spring.StiffnessMediumLow
                )
            )
            if (lastSettledIndex != clamped) {
                lastSettledIndex = clamped
                val targetKey = Screen.items.getOrNull(clamped)?.key ?: Screen.Timer.key
                onTabSettled(targetKey)
            }
        }
    }

    fun syncFromExternalTab(targetKey: String) {
        val idx = Screen.items.indexOfFirst { it.key == targetKey }
        if (idx != -1 && !isDragging && animatable.targetValue.roundToInt() != idx) {
            snapToTab(idx)
        }
    }
}

@Composable
fun rememberPagerSwipeController(
    initialKey: String,
    tabCount: Int = Screen.items.size,
    onTabSettled: (String) -> Unit
): PagerSwipeController {
    val scope = rememberCoroutineScope()
    val initialIdx = Screen.items.indexOfFirst { it.key == initialKey }.coerceAtLeast(0)
    return remember {
        PagerSwipeController(
            initialIndex = initialIdx,
            tabCount = tabCount,
            scope = scope,
            onTabSettled = onTabSettled
        )
    }
}
