package com.yazri.focus.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.yazri.focus.R

val StyroFontFamily = FontFamily(
    Font(R.font.styro_bold, FontWeight.Bold),
    Font(R.font.styro_black, FontWeight.Black)
)

val PanchangFontFamily = FontFamily(
    Font(R.font.panchang_regular, FontWeight.Normal),
    Font(R.font.panchang_medium, FontWeight.Medium),
    Font(R.font.panchang_semibold, FontWeight.SemiBold),
    Font(R.font.panchang_bold, FontWeight.Bold),
    Font(R.font.panchang_extrabold, FontWeight.ExtraBold)
)

val ClashDisplayFontFamily = FontFamily(
    Font(R.font.clash_display_regular, FontWeight.Normal),
    Font(R.font.clash_display_medium, FontWeight.Medium),
    Font(R.font.clash_display_semibold, FontWeight.SemiBold),
    Font(R.font.clash_display_bold, FontWeight.Bold)
)

val FocusTypography = Typography(
    displayLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Black,
        fontSize = 80.sp,
        lineHeight = 88.sp,
        letterSpacing = (-3).sp
    ),
    headlineLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.ExtraBold,
        fontSize = 28.sp,
        lineHeight = 36.sp,
        letterSpacing = (-0.8).sp
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.ExtraBold,
        fontSize = 22.sp,
        lineHeight = 28.sp,
        letterSpacing = (-0.4).sp
    ),
    bodyLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = (-0.2).sp
    ),
    labelSmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 10.sp,
        lineHeight = 14.sp,
        letterSpacing = 1.5.sp
    )
)
