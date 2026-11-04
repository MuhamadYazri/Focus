package com.yazri.focus.ui.navigation

sealed class Screen(val key: String, val label: String, val index: Int) {
    data object Home : Screen("home", "Today", 0)
    data object Timer : Screen("timer", "Timer", 1)
    data object Reports : Screen("reports", "Report", 2)
    data object Profile : Screen("profile", "Profile", 3)

    companion object {
        val items = listOf(Home, Timer, Reports, Profile)
        fun fromKey(key: String): Screen = items.find { it.key == key } ?: Home
    }
}
