package com.yazri.focus.ui.components

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.unit.dp
import com.airbnb.lottie.compose.LottieAnimation
import com.airbnb.lottie.compose.LottieCompositionSpec
import com.airbnb.lottie.compose.rememberLottieComposition
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlin.random.Random

enum class MascotSide {
    LEFT,
    RIGHT,
    TOP
}

/**
 * Mascot Peek Overlay ("Appy"):
 * Periodically peeks in from the left bezel, right bezel, or top bezel (behind system notification/status bar).
 * When on sides: stays safely below the system notification bar and above the bottom dock nav.
 * When on top: emerges downwards from behind the top screen edge / status bar with random horizontal placement.
 * Plays forward -> pauses looking around -> reverses back into the bezel -> picks a new random position!
 * Automatically switches colors to match Light or Dark theme.
 */
@Composable
fun MascotPeekOverlay(
    isDark: Boolean,
    modifier: Modifier = Modifier
) {
    val assetName = if (isDark) "appy_present_dark.json" else "appy_present_light.json"
    val compositionResult = rememberLottieComposition(LottieCompositionSpec.Asset(assetName))
    val composition = compositionResult.value

    var currentSide by remember {
        mutableStateOf(listOf(MascotSide.LEFT, MascotSide.RIGHT, MascotSide.TOP).random())
    }
    var currentYFraction by remember { mutableFloatStateOf(0.45f) }
    var currentXFraction by remember { mutableFloatStateOf(Random.nextFloat()) }
    var isTappedRetreat by remember { mutableStateOf(false) }

    val progress = remember { Animatable(0f) }
    val scope = rememberCoroutineScope()

    // Loop cycle: play forward (0->1) -> pause looking around -> reverse (1->0) -> change position -> repeat
    LaunchedEffect(composition) {
        val comp = composition ?: return@LaunchedEffect
        val animDurationMs = (comp.duration).toLong().coerceIn(1500L, 3000L)

        // Initial short delay on app launch before first peek
        delay(1200L)

        while (isActive) {
            isTappedRetreat = false

            // 1. Play forward from 0f to 1f (peeks out from bezel)
            progress.animateTo(
                targetValue = 1f,
                animationSpec = tween(
                    durationMillis = animDurationMs.toInt(),
                    easing = LinearEasing
                )
            )

            // 2. Pause in peeked state (glancing around)
            if (!isTappedRetreat) {
                delay(1800L)
            }

            // 3. Reverse back from 1f to 0f (retreats into bezel)
            if (!isTappedRetreat) {
                progress.animateTo(
                    targetValue = 0f,
                    animationSpec = tween(
                        durationMillis = (animDurationMs * 0.85f).toInt(),
                        easing = LinearEasing
                    )
                )
            }

            // 4. Fully hidden in bezel: wait random idle interval (4 to 8 sec) before next appearance
            delay(Random.nextLong(4000L, 8000L))

            // 5. Change position: random side (LEFT, RIGHT, or TOP) and random offsets
            currentSide = when (Random.nextInt(3)) {
                0 -> MascotSide.LEFT
                1 -> MascotSide.RIGHT
                else -> MascotSide.TOP
            }
            currentYFraction = Random.nextFloat()
            currentXFraction = Random.nextFloat()
        }
    }

    BoxWithConstraints(
        modifier = modifier.fillMaxSize()
    ) {
        val navBarBottom = WindowInsets.navigationBars.asPaddingValues().calculateBottomPadding()
        val safeTop = 110.dp
        val safeBottom = 120.dp + navBarBottom
        val mascotWidth = 140.dp
        val mascotHeight = 240.dp

        val availableHeight = (maxHeight - safeTop - safeBottom - mascotWidth).coerceAtLeast(0.dp)
        val calculatedY = safeTop + (availableHeight * currentYFraction)
        val availableWidth = (maxWidth - mascotWidth - 48.dp).coerceAtLeast(0.dp)
        val calculatedX = 24.dp + (availableWidth * currentXFraction)

        // Geometry mapping for LEFT, RIGHT, and TOP
        val (alignment, xOffset, yOffset, rotationAngle) = when (currentSide) {
            MascotSide.LEFT -> {
                // Tucked by -2.dp into left bezel to eliminate 1px fractional rendering gap
                Quad(Alignment.TopStart, (-mascotWidth / 2f) - 2.dp, calculatedY, 90f)
            }
            MascotSide.RIGHT -> {
                Quad(Alignment.TopEnd, mascotWidth / 2f, calculatedY, -90f)
            }
            MascotSide.TOP -> {
                // Emerging downwards from top edge behind system status/notification bar; tucked 2.dp above top edge
                // Pivot at bottom-center (0.5f, 1f) at Y = -2.dp; 180 deg rotation swings it downwards into view
                Quad(Alignment.TopStart, calculatedX, -mascotHeight - 2.dp, 180f)
            }
        }

        // 1. Visual Lottie layer (does not consume touches outside mascot)
        Box(
            modifier = Modifier
                .align(alignment)
                .offset(x = xOffset, y = yOffset)
                .size(width = mascotWidth, height = mascotHeight)
                .graphicsLayer {
                    transformOrigin = TransformOrigin(0.5f, 1f)
                    rotationZ = rotationAngle
                    clip = false
                }
        ) {
            if (composition != null) {
                LottieAnimation(
                    composition = composition,
                    progress = { progress.value },
                    modifier = Modifier.fillMaxSize()
                )
            }
        }

        // 2. Compact touch target strictly bounded to the visible mascot peek zone at the bezel
        val (touchAlignment, touchX, touchY, touchWidth, touchHeight) = when (currentSide) {
            MascotSide.LEFT -> Quint(
                Alignment.TopStart,
                0.dp,
                calculatedY + (mascotHeight - mascotWidth) / 2,
                80.dp,
                mascotWidth
            )
            MascotSide.RIGHT -> Quint(
                Alignment.TopEnd,
                0.dp,
                calculatedY + (mascotHeight - mascotWidth) / 2,
                80.dp,
                mascotWidth
            )
            MascotSide.TOP -> Quint(
                Alignment.TopStart,
                calculatedX,
                0.dp,
                mascotWidth,
                90.dp
            )
        }

        Box(
            modifier = Modifier
                .align(touchAlignment)
                .offset(x = touchX, y = touchY)
                .size(width = touchWidth, height = touchHeight)
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null,
                    enabled = progress.value > 0.1f && !isTappedRetreat
                ) {
                    if (progress.value > 0.1f && !isTappedRetreat) {
                        isTappedRetreat = true
                        scope.launch {
                            progress.animateTo(
                                targetValue = 0f,
                                animationSpec = tween(350, easing = LinearEasing)
                            )
                        }
                    }
                }
        )
    }
}

private data class Quad<A, B, C, D>(val first: A, val second: B, val third: C, val fourth: D)
private data class Quint<A, B, C, D, E>(val first: A, val second: B, val third: C, val fourth: D, val fifth: E)
