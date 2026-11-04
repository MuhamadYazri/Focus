package com.yazri.focus.ui.theme

import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.ui.graphics.Color

// Raw Static Color Constants for Light & Dark Palette
val LightCanvasBg = Color(0xFFECECE8)
val LightSurfaceWhite = Color(0xFFF9F9F7)
val LightSurfaceSubtle = Color(0xFFE2E2DD)
val LightBorderHairline = Color(0xFFDCDCD6)
val LightTrackGroove = Color(0xFFD2D2CC)
val LightInkDark = Color(0xFF111111)

// Dark Mode Static Tokens
val CanvasDark = Color(0xFF121211)
val SurfaceDark = Color(0xFF1C1C1A)
val SurfaceDarkSubtle = Color(0xFF161615)
val BorderDark = Color(0xFF2C2C28)
val BorderCardDark = Color(0xFF343430)
val TextPrimaryDark = Color(0xFFF2F2EE)
val TextSecondaryDark = Color(0xFFA8A8A2)
val TextMutedDark = Color(0xFF7A7A75)
val MatchaPrimary = Color(0xFFE2E2DD)
val MatchaAccent = Color(0xFFC4C4BE)
val AlertDistraction = Color(0xFFE54D40)

// Dynamic Composable Color Tokens (Reactive to FocusTheme darkTheme setting)
val CanvasBg: Color
    @Composable
    @ReadOnlyComposable
    get() = LocalFocusColors.current.canvas

val SurfaceWhite: Color
    @Composable
    @ReadOnlyComposable
    get() = LocalFocusColors.current.surface

val SurfaceSubtle: Color
    @Composable
    @ReadOnlyComposable
    get() = LocalFocusColors.current.surfaceSubtle

val SurfaceSegmented: Color
    @Composable
    @ReadOnlyComposable
    get() = LocalFocusColors.current.surfaceSegmented

val BorderHairline: Color
    @Composable
    @ReadOnlyComposable
    get() = LocalFocusColors.current.border

val TrackGroove: Color
    @Composable
    @ReadOnlyComposable
    get() = LocalFocusColors.current.trackGroove

val InkDark: Color
    @Composable
    @ReadOnlyComposable
    get() = LocalFocusColors.current.inkDark

val TextOnDark: Color
    @Composable
    @ReadOnlyComposable
    get() = LocalFocusColors.current.textOnDark

val OlivePrimary: Color
    @Composable
    @ReadOnlyComposable
    get() = LocalFocusColors.current.olivePrimary

val MossSecondary: Color
    @Composable
    @ReadOnlyComposable
    get() = LocalFocusColors.current.mossSecondary

val TextSub: Color
    @Composable
    @ReadOnlyComposable
    get() = LocalFocusColors.current.textSub

val SoftSage: Color
    @Composable
    @ReadOnlyComposable
    get() = LocalFocusColors.current.softSage

val CeladonFill: Color
    @Composable
    @ReadOnlyComposable
    get() = LocalFocusColors.current.celadonFill

val PaleMint: Color
    @Composable
    @ReadOnlyComposable
    get() = LocalFocusColors.current.paleMint

val ActivityGreen: Color
    @Composable
    @ReadOnlyComposable
    get() = LocalFocusColors.current.activityGreen

val AccentAmber: Color
    @Composable
    @ReadOnlyComposable
    get() = LocalFocusColors.current.accentAmber

val ErrorRed: Color
    @Composable
    @ReadOnlyComposable
    get() = LocalFocusColors.current.errorRed

fun parseHexColor(hex: String?, fallback: Color = LightInkDark): Color {
    if (hex.isNullOrBlank() || hex.startsWith("var(")) return fallback
    return try {
        val clean = hex.removePrefix("#")
        when (clean.length) {
            6 -> Color(clean.toLong(16) or 0xFF000000)
            8 -> Color(clean.toLong(16))
            else -> fallback
        }
    } catch (_: Exception) {
        fallback
    }
}
