package com.yazri.focus.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

data class FocusColorPalette(
    val canvas: Color,
    val surface: Color,
    val surfaceSubtle: Color,
    val surfaceSegmented: Color,
    val border: Color,
    val borderCard: Color,
    val trackGroove: Color,
    val inkDark: Color,
    val textOnDark: Color,
    val olivePrimary: Color,
    val mossSecondary: Color,
    val textSub: Color,
    val softSage: Color,
    val celadonFill: Color,
    val paleMint: Color,
    val activityGreen: Color,
    val accentAmber: Color,
    val errorRed: Color,
    val dockBg: Color,
    val dockSelectedCircle: Color,
    val dockSelectedIcon: Color,
    val dockUnselectedCircle: Color,
    val dockUnselectedIcon: Color,
    val isDark: Boolean
)

val LightFocusColors = FocusColorPalette(
    canvas = Color(0xFFECECE8),        // Warm Architectural Alabaster
    surface = Color(0xFFF9F9F7),       // Crisp Elevated White Surface
    surfaceSubtle = Color(0xFFE2E2DD),  // Recessed Track / Well
    surfaceSegmented = Color(0xFFF9F9F7),
    border = Color(0xFFDCDCD6),        // Crisp 0.85dp Hairline
    borderCard = Color(0xFFDCDCD6),
    trackGroove = Color(0xFFD2D2CC),    // Inactive Groove
    inkDark = Color(0xFF111111),        // Pitch Carbon Black
    textOnDark = Color(0xFFF9F9F7),     // Crisp White Text on Inverted Surfaces
    olivePrimary = Color(0xFF181818),
    mossSecondary = Color(0xFF6E6E6A),  // Neutral Stone Grey
    textSub = Color(0xFF5A5A56),        // Muted Charcoal Captions
    softSage = Color(0xFF969690),       // Subtle Metadata
    celadonFill = Color(0xFFC4C4BE),
    paleMint = Color(0xFFE0E0DA),
    activityGreen = Color(0xFF111111),
    accentAmber = Color(0xFFF5A623),
    errorRed = Color(0xFFD93829),
    dockBg = Color(0xFFE4E4DF),
    dockSelectedCircle = Color(0xFF111111),
    dockSelectedIcon = Color(0xFFF9F9F7),
    dockUnselectedCircle = Color(0xFFF9F9F7),
    dockUnselectedIcon = Color(0xFF111111),
    isDark = false
)

val DarkFocusColors = FocusColorPalette(
    canvas = Color(0xFF121211),        // Deep Obsidian Canvas
    surface = Color(0xFF1C1C1A),       // Elevated Card Charcoal
    surfaceSubtle = Color(0xFF161615), // Recessed Track / Well
    surfaceSegmented = Color(0xFF1C1C1A),
    border = Color(0xFF2C2C28),        // Crisp Dark Hairline
    borderCard = Color(0xFF343430),
    trackGroove = Color(0xFF242422),   // Inactive Groove
    inkDark = Color(0xFFF2F2EE),       // Warm Alabaster Primary / Big Numerals / Inverted Fill
    textOnDark = Color(0xFF111111),    // Pitch Carbon Text on Inverted Fills
    olivePrimary = Color(0xFFE2E2DD),  // High-Contrast Primary
    mossSecondary = Color(0xFFA8A8A2), // Muted Stone Grey
    textSub = Color(0xFF8E8E88),       // Charcoal Subtitles
    softSage = Color(0xFF6E6E68),      // Inactive / Tertiary
    celadonFill = Color(0xFF3A3A36),
    paleMint = Color(0xFF262624),
    activityGreen = Color(0xFFF2F2EE),
    accentAmber = Color(0xFFF5A623),
    errorRed = Color(0xFFE54D40),
    dockBg = Color(0xFF181816),
    dockSelectedCircle = Color(0xFFF2F2EE),
    dockSelectedIcon = Color(0xFF111111),
    dockUnselectedCircle = Color(0xFF242422),
    dockUnselectedIcon = Color(0xFFA8A8A2),
    isDark = true
)

val LocalFocusColors = staticCompositionLocalOf { LightFocusColors }

object FocusTheme {
    val colors: FocusColorPalette
        @Composable
        @ReadOnlyComposable
        get() = LocalFocusColors.current
}

private val JapandiLightScheme = lightColorScheme(
    primary = Color(0xFF181818),
    onPrimary = Color(0xFFF9F9F7),
    secondary = Color(0xFF6E6E6A),
    onSecondary = Color(0xFFF9F9F7),
    tertiary = Color(0xFF969690),
    background = Color(0xFFECECE8),
    onBackground = Color(0xFF111111),
    surface = Color(0xFFF9F9F7),
    onSurface = Color(0xFF111111),
    surfaceVariant = Color(0xFFE2E2DD),
    onSurfaceVariant = Color(0xFF6E6E6A),
    outline = Color(0xFFDCDCD6),
    error = Color(0xFFD93829)
)

private val JapandiDarkScheme = darkColorScheme(
    primary = Color(0xFFE2E2DD),
    onPrimary = Color(0xFF111111),
    secondary = Color(0xFFA8A8A2),
    onSecondary = Color(0xFF111111),
    tertiary = Color(0xFF6E6E68),
    background = Color(0xFF121211),
    onBackground = Color(0xFFF2F2EE),
    surface = Color(0xFF1C1C1A),
    onSurface = Color(0xFFF2F2EE),
    surfaceVariant = Color(0xFF161615),
    onSurfaceVariant = Color(0xFFA8A8A2),
    outline = Color(0xFF2C2C28),
    error = Color(0xFFE54D40)
)

@Composable
fun FocusTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colors = if (darkTheme) DarkFocusColors else LightFocusColors
    val colorScheme = if (darkTheme) JapandiDarkScheme else JapandiLightScheme

    CompositionLocalProvider(
        LocalFocusColors provides colors
    ) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = FocusTypography,
            content = content
        )
    }
}
