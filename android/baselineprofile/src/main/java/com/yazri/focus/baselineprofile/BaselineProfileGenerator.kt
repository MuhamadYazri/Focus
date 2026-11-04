package com.yazri.focus.baselineprofile

import androidx.benchmark.macro.junit4.BaselineProfileRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.LargeTest
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Direction
import androidx.test.uiautomator.Until
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
@LargeTest
class BaselineProfileGenerator {

    @get:Rule
    val rule = BaselineProfileRule()

    @Test
    fun generateBaselineProfile() {
        rule.collect(
            packageName = "com.yazri.focus.compose",
            includeInStartupProfile = true
        ) {
            // Cold start the application and wait for initial screen
            pressHome()
            startActivityAndWait()

            // Tab 1: Tasks Screen interactions
            device.waitForIdle()

            // Switch to Timer (Tab 2)
            device.findObject(By.descContains("timer"))?.click()
                ?: device.click(device.displayWidth * 2 / 5, device.displayHeight - 120)
            device.waitForIdle()

            // Play / Pause timer
            device.findObject(By.descContains("Start timer"))?.click()
            device.waitForIdle()
            device.findObject(By.descContains("Pause timer"))?.click()
            device.waitForIdle()

            // Switch to Reports / Analytics (Tab 3)
            device.click(device.displayWidth * 3 / 5, device.displayHeight - 120)
            device.waitForIdle()

            // Scroll Analytics screen
            val scrollable = device.findObject(By.scrollable(true))
            scrollable?.fling(Direction.DOWN)
            device.waitForIdle()
            scrollable?.fling(Direction.UP)
            device.waitForIdle()

            // Switch to Settings / Profile (Tab 4)
            device.click(device.displayWidth * 4 / 5, device.displayHeight - 120)
            device.waitForIdle()

            // Switch back to Tasks (Tab 1)
            device.click(device.displayWidth / 5, device.displayHeight - 120)
            device.waitForIdle()
        }
    }
}
