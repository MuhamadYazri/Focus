package com.yazri.focus.service

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

class HapticManager(context: Context) {
    private val vibrator: Vibrator? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val vm = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
        vm?.defaultVibrator
    } else {
        @Suppress("DEPRECATION")
        context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
    }

    fun tap(durationMs: Long = 10L) {
        try {
            vibrator?.vibrate(VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE))
        } catch (_: Exception) {}
    }

    fun taskCompleted() {
        try {
            vibrator?.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 12, 30, 18), -1))
        } catch (_: Exception) {}
    }

    fun sessionCompleted() {
        try {
            vibrator?.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 100, 50, 100, 50, 200), -1))
        } catch (_: Exception) {}
    }

    fun strictModeAlert() {
        try {
            vibrator?.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 200, 100, 200, 100, 200), -1))
        } catch (_: Exception) {}
    }
}
