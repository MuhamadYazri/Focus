package com.yazri.focus.ui.navigation

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.onClick
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.yazri.focus.ui.theme.raised
import com.yazri.focus.ui.theme.raisedDark
import com.yazri.focus.ui.theme.*
import kotlinx.coroutines.launch
import kotlin.math.abs
import kotlin.math.exp

// Dock geometry (dp) – layout is FIXED; magnification is applied purely in the GPU graphicsLayer.
private const val ITEM_DP = 44f
private const val GAP_DP = 6f
private const val PAD_DP = 5f
private const val MAX_EXTRA_SCALE = 0.30f

/** Gaussian falloff magnification for item [i] given the live touch X (px, dock-local). */
private fun dockScaleAt(i: Int, touchX: Float, progress: Float, stride: Float, pad: Float, item: Float): Float {
    val center = pad + i * stride + item / 2f
    val d = abs(touchX - center) / stride
    return 1f + MAX_EXTRA_SCALE * progress * exp(-(d * d) / 0.98f)
}

/**
 * macOS-style dock (inspired by ReactBits Dock) adapted for touch:
 * - Press & glide a finger across the dock: icons magnify with a Gaussian falloff, neighbours are pushed
 *   aside, the capsule stretches to fit, and a haptic tick fires when crossing between items.
 * - Release selects the nearest item (release far outside the dock cancels), with an elastic spring pop.
 *
 * Performance contract: the dock's layout never changes. Touch X / progress / pop are read ONLY inside
 * `graphicsLayer {}` lambdas, so a glide produces zero recompositions and zero layout passes.
 */
@Composable
fun BottomDockNav(
    activeTab: String,
    onSelectTab: (String) -> Unit,
    isHidden: Boolean = false,
    modifier: Modifier = Modifier
) {
    AnimatedVisibility(
        visible = !isHidden,
        enter = slideInVertically(
            initialOffsetY = { it * 2 },
            animationSpec = spring(stiffness = Spring.StiffnessMediumLow)
        ) + fadeIn(),
        exit = slideOutVertically(
            targetOffsetY = { it * 2 },
            animationSpec = spring(stiffness = Spring.StiffnessMediumLow)
        ) + fadeOut(),
        modifier = modifier
    ) {
        val dockBg = FocusTheme.colors.dockBg
        val density = LocalDensity.current
        val haptic = LocalHapticFeedback.current
        val scope = rememberCoroutineScope()

        val itemPx = with(density) { ITEM_DP.dp.toPx() }
        val gapPx = with(density) { GAP_DP.dp.toPx() }
        val padPx = with(density) { PAD_DP.dp.toPx() }
        val stridePx = itemPx + gapPx
        val count = Screen.items.size
        val capsuleWidthPx = padPx * 2 + count * itemPx + (count - 1) * gapPx

        var pressed by remember { mutableStateOf(false) }
        var touchX by remember { mutableFloatStateOf(0f) }
        val progressState = animateFloatAsState(
            targetValue = if (pressed) 1f else 0f,
            animationSpec = spring(dampingRatio = 0.78f, stiffness = Spring.StiffnessMedium),
            label = "DockMagnifyProgress"
        )
        val pops = remember { List(count) { Animatable(1f) } }

        val currentActiveTab by rememberUpdatedState(activeTab)
        val currentOnSelectTab by rememberUpdatedState(onSelectTab)

        fun itemCenter(i: Int): Float = padPx + i * stridePx + itemPx / 2f

        fun nearestIndex(x: Float): Int =
            ((x - padPx - itemPx / 2f) / stridePx).let { Math.round(it) }.coerceIn(0, count - 1)

        // Returns index if touchX is within 80% selection threshold of item's center (distance <= 0.20 * stridePx)
        fun candidateIndexAt80Percent(x: Float): Int? {
            for (i in 0 until count) {
                if (abs(x - itemCenter(i)) <= 0.20f * stridePx) {
                    return i
                }
            }
            return null
        }

        Box(
            modifier = Modifier.pointerInput(count, stridePx, padPx, itemPx) {
                awaitEachGesture {
                    val down = awaitFirstDown(requireUnconsumed = false)
                    pressed = true
                    touchX = down.position.x
                    val initialTabKey = currentActiveTab
                    var activeTabKey = initialTabKey
                    var lastSwitchedIdx = Screen.items.indexOfFirst { it.key == initialTabKey }.coerceAtLeast(0)
                    var cancelled = false
                    val startX = down.position.x

                    // Check if initial touch immediately lands on an 80%-focused item
                    candidateIndexAt80Percent(down.position.x)?.let { idx ->
                        val target = Screen.items[idx]
                        if (target.key != activeTabKey) {
                            activeTabKey = target.key
                            lastSwitchedIdx = idx
                            currentOnSelectTab(target.key)
                            haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            scope.launch {
                                pops[idx].snapTo(0.82f)
                                pops[idx].animateTo(
                                    1f,
                                    spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessMedium)
                                )
                            }
                        }
                    }

                    while (true) {
                        val event = awaitPointerEvent()
                        val change = event.changes.firstOrNull { it.id == down.id }
                        if (change == null) { cancelled = true; break }
                        if (change.pressed) {
                            touchX = change.position.x
                            // Live tab switch when 80% selection threshold is reached
                            val candidate = candidateIndexAt80Percent(change.position.x)
                            if (candidate != null && candidate != lastSwitchedIdx) {
                                lastSwitchedIdx = candidate
                                val target = Screen.items[candidate]
                                if (target.key != activeTabKey) {
                                    activeTabKey = target.key
                                    currentOnSelectTab(target.key)
                                    haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                    scope.launch {
                                        pops[candidate].snapTo(0.82f)
                                        pops[candidate].animateTo(
                                            1f,
                                            spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessMedium)
                                        )
                                    }
                                }
                            }
                            change.consume()
                        } else {
                            val slop = 56.dp.toPx()
                            val y = change.position.y
                            cancelled = y < -slop || y > size.height + slop
                            change.consume()
                            break
                        }
                    }
                    pressed = false

                    if (cancelled) {
                        // Dragged out vertically to cancel: restore initial tab
                        if (activeTabKey != initialTabKey) {
                            currentOnSelectTab(initialTabKey)
                        }
                    } else {
                        val totalDrag = abs(touchX - startX)
                        val tapSlopPx = 15.dp.toPx()
                        if (totalDrag < tapSlopPx) {
                            // Quick tap on an icon (even if slightly off-center)
                            val tappedIdx = nearestIndex(touchX)
                            val target = Screen.items[tappedIdx]
                            if (target.key != currentActiveTab) {
                                currentOnSelectTab(target.key)
                                scope.launch {
                                    pops[tappedIdx].snapTo(0.82f)
                                    pops[tappedIdx].animateTo(
                                        1f,
                                        spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessMedium)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        ) {
            // Capsule background is a separate layer (the `raised` modifier clips children to its shape,
            // which would crop magnified icons). It stretches horizontally to follow the magnified row.
            Box(
                modifier = Modifier
                    .matchParentSize()
                    .graphicsLayer {
                        val p = progressState.value
                        if (p > 0f) {
                            var total = 0f
                            for (k in 0 until count) {
                                total += (dockScaleAt(k, touchX, p, stridePx, padPx, itemPx) - 1f) * itemPx
                            }
                            scaleX = 1f + total / capsuleWidthPx
                        }
                    }
                    .raised(CircleShape, dockBg, elevation = 9.dp)
            )

            Row(
                modifier = Modifier.padding(PAD_DP.dp),
                horizontalArrangement = Arrangement.spacedBy(GAP_DP.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Screen.items.forEachIndexed { index, item ->
                    val isSelected = item.key == activeTab
                    val circleBg by animateColorAsState(
                        targetValue = if (isSelected) FocusTheme.colors.dockSelectedCircle else FocusTheme.colors.dockUnselectedCircle,
                        animationSpec = tween(200),
                        label = "DockCircleBg"
                    )
                    val iconTint by animateColorAsState(
                        targetValue = if (isSelected) FocusTheme.colors.dockSelectedIcon else FocusTheme.colors.dockUnselectedIcon,
                        animationSpec = tween(200),
                        label = "DockIconTint"
                    )

                    Box(
                        modifier = Modifier
                            .size(ITEM_DP.dp)
                            .graphicsLayer {
                                val p = progressState.value
                                val pop = pops[index].value
                                val s = dockScaleAt(index, touchX, p, stridePx, padPx, itemPx) * pop
                                var shift = 0f
                                if (p > 0f) {
                                    var before = 0f
                                    var total = 0f
                                    var mine = 0f
                                    for (k in 0 until count) {
                                        val e = (dockScaleAt(k, touchX, p, stridePx, padPx, itemPx) - 1f) * itemPx
                                        if (k < index) before += e
                                        if (k == index) mine = e
                                        total += e
                                    }
                                    shift = before + mine / 2f - total / 2f
                                }
                                transformOrigin = TransformOrigin(0.5f, 1f)
                                scaleX = s
                                scaleY = s
                                translationX = shift
                            }
                            .then(
                                if (isSelected) Modifier.raisedDark(CircleShape, circleBg, elevation = 5.dp)
                                else Modifier.raised(CircleShape, circleBg, elevation = 4.dp)
                            )
                            .semantics {
                                role = Role.Tab
                                contentDescription = item.label
                                onClick { onSelectTab(item.key); true }
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        BottomNavSvgIcon(
                            screen = item,
                            tint = iconTint,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun BottomNavSvgIcon(
    screen: Screen,
    tint: Color,
    modifier: Modifier = Modifier
) {
    Canvas(modifier = modifier) {
        val scaleX = size.width / 24f
        val scaleY = size.height / 24f
        val strokeWidth = 1.8f * scaleX
        val stroke = Stroke(width = strokeWidth, cap = StrokeCap.Round, join = StrokeJoin.Round)

        when (screen) {
            Screen.Home -> {
                // Clean task/calendar outline
                drawRoundRect(
                    color = tint,
                    topLeft = Offset(3.5f * scaleX, 4.5f * scaleY),
                    size = Size(17f * scaleX, 16f * scaleY),
                    cornerRadius = CornerRadius(3.5f * scaleX, 3.5f * scaleY),
                    style = stroke
                )
                drawLine(
                    color = tint,
                    start = Offset(16f * scaleX, 2.5f * scaleY),
                    end = Offset(16f * scaleX, 6f * scaleY),
                    strokeWidth = strokeWidth,
                    cap = StrokeCap.Round
                )
                drawLine(
                    color = tint,
                    start = Offset(8f * scaleX, 2.5f * scaleY),
                    end = Offset(8f * scaleX, 6f * scaleY),
                    strokeWidth = strokeWidth,
                    cap = StrokeCap.Round
                )
                drawLine(
                    color = tint,
                    start = Offset(3.5f * scaleX, 9.5f * scaleY),
                    end = Offset(20.5f * scaleX, 9.5f * scaleY),
                    strokeWidth = strokeWidth,
                    cap = StrokeCap.Round
                )
            }
            Screen.Timer -> {
                // Clock icon matching Reference 1 center button
                drawCircle(
                    color = tint,
                    radius = 8.5f * scaleX,
                    center = Offset(12f * scaleX, 12f * scaleY),
                    style = stroke
                )
                val path = Path().apply {
                    moveTo(12f * scaleX, 7.5f * scaleY)
                    lineTo(12f * scaleX, 12f * scaleY)
                    lineTo(15f * scaleX, 13.8f * scaleY)
                }
                drawPath(path = path, color = tint, style = stroke)
            }
            Screen.Reports -> {
                // Analytics bar icon
                drawLine(
                    color = tint,
                    start = Offset(6.5f * scaleX, 19f * scaleY),
                    end = Offset(6.5f * scaleX, 13.5f * scaleY),
                    strokeWidth = strokeWidth,
                    cap = StrokeCap.Round
                )
                drawLine(
                    color = tint,
                    start = Offset(12f * scaleX, 19f * scaleY),
                    end = Offset(12f * scaleX, 5.5f * scaleY),
                    strokeWidth = strokeWidth,
                    cap = StrokeCap.Round
                )
                drawLine(
                    color = tint,
                    start = Offset(17.5f * scaleX, 19f * scaleY),
                    end = Offset(17.5f * scaleX, 10f * scaleY),
                    strokeWidth = strokeWidth,
                    cap = StrokeCap.Round
                )
            }
            Screen.Profile -> {
                // User / Settings icon
                drawCircle(
                    color = tint,
                    radius = 3.8f * scaleX,
                    center = Offset(12f * scaleX, 8.2f * scaleY),
                    style = stroke
                )
                drawArc(
                    color = tint,
                    startAngle = 180f,
                    sweepAngle = 180f,
                    useCenter = false,
                    topLeft = Offset(5.5f * scaleX, 13.2f * scaleY),
                    size = Size(13f * scaleX, 11f * scaleY),
                    style = stroke
                )
            }
        }
    }
}
