package com.yazri.focus

import android.app.Application
import com.yazri.focus.data.local.FocusDatabase
import com.yazri.focus.data.preferences.SettingsDataStore
import com.yazri.focus.data.repository.FocusRepository
import com.yazri.focus.service.HapticManager
import com.yazri.focus.service.SoundEngine
import com.yazri.focus.service.TimerEngine

class FocusApp : Application() {
    lateinit var database: FocusDatabase
        private set
    lateinit var settingsDataStore: SettingsDataStore
        private set
    lateinit var repository: FocusRepository
        private set
    lateinit var soundEngine: SoundEngine
        private set
    lateinit var hapticManager: HapticManager
        private set
    lateinit var timerEngine: TimerEngine
        private set

    override fun onCreate() {
        super.onCreate()
        database = FocusDatabase.getInstance(this)
        settingsDataStore = SettingsDataStore(this)
        repository = FocusRepository(database, settingsDataStore)
        soundEngine = SoundEngine(this)
        hapticManager = HapticManager(this)
        timerEngine = TimerEngine(this, repository, soundEngine, hapticManager)
    }
}
