package com.yazri.focus.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat
import androidx.core.app.NotificationCompat
import androidx.media.app.NotificationCompat.MediaStyle
import com.yazri.focus.MainActivity
import com.yazri.focus.R
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow

/**
 * Display + remote-control layer for the running timer.
 *
 * The countdown itself is owned by [com.yazri.focus.ui.timer.TimerViewModel] (single source of truth).
 * This service only publishes that state to a [MediaSessionCompat] + MediaStyle notification, which is
 * what OriginOS / Funtouch OS reads to render the Origin Island media capsule (compact pill + expanded
 * card with transport buttons). Button presses (island, shade, lock screen, headset) are forwarded back
 * to the ViewModel through [remoteActions].
 */
class TimerForegroundService : Service() {

    private lateinit var mediaSession: MediaSessionCompat

    private var lastTitle: String = "Focus Session"
    private var lastTimeText: String = "25:00"
    private var lastSubtitle: String = "Focusing on your priority"
    private var lastIsRunning: Boolean = true
    private var lastRemainingSeconds: Int = 25 * 60
    private var lastTotalSeconds: Int = 25 * 60

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        mediaSession = MediaSessionCompat(this, "FocusTimerSession").apply {
            setCallback(object : MediaSessionCompat.Callback() {
                override fun onPlay() {
                    if (!lastIsRunning) _remoteActions.tryEmit(REMOTE_ACTION_TOGGLE_PLAY)
                }

                override fun onPause() {
                    if (lastIsRunning) _remoteActions.tryEmit(REMOTE_ACTION_TOGGLE_PLAY)
                }

                override fun onSkipToNext() {
                    _remoteActions.tryEmit(REMOTE_ACTION_SKIP)
                }

                override fun onStop() {
                    _remoteActions.tryEmit(REMOTE_ACTION_RESTART)
                }

                override fun onCustomAction(action: String?, extras: Bundle?) {
                    if (action == CUSTOM_ACTION_RESTART) _remoteActions.tryEmit(REMOTE_ACTION_RESTART)
                }
            })
            isActive = true
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action ?: ACTION_START_OR_UPDATE) {
            ACTION_STOP -> {
                mediaSession.isActive = false
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
                return START_NOT_STICKY
            }
            ACTION_RESTART -> {
                _remoteActions.tryEmit(REMOTE_ACTION_RESTART)
                return START_STICKY
            }
            ACTION_TOGGLE_PLAY -> {
                _remoteActions.tryEmit(REMOTE_ACTION_TOGGLE_PLAY)
                return START_STICKY
            }
            ACTION_SKIP -> {
                _remoteActions.tryEmit(REMOTE_ACTION_SKIP)
                return START_STICKY
            }
        }

        lastTitle = intent?.getStringExtra(EXTRA_TITLE) ?: lastTitle
        lastTimeText = intent?.getStringExtra(EXTRA_TIME_TEXT) ?: lastTimeText
        lastSubtitle = intent?.getStringExtra(EXTRA_SUBTITLE) ?: lastSubtitle
        lastIsRunning = intent?.getBooleanExtra(EXTRA_IS_RUNNING, lastIsRunning) ?: lastIsRunning
        lastRemainingSeconds = intent?.getIntExtra(EXTRA_REMAINING_SECONDS, lastRemainingSeconds) ?: lastRemainingSeconds
        lastTotalSeconds = intent?.getIntExtra(EXTRA_TOTAL_SECONDS, lastTotalSeconds) ?: lastTotalSeconds

        publishMediaSession()
        val notification = buildMediaNotification()

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                startForeground(
                    NOTIFICATION_ID,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
                )
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }
        } catch (_: Exception) {
            getSystemService(NotificationManager::class.java)?.notify(NOTIFICATION_ID, notification)
        }

        return START_STICKY
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)
        val app = application as? com.yazri.focus.FocusApp
        if (app?.timerEngine?.isRunning?.value == true) {
            // Keep timer running in background! Do not kill service when user swipes app away
        } else {
            mediaSession.isActive = false
            stopForeground(STOP_FOREGROUND_REMOVE)
            stopSelf()
        }
    }

    /** Feeds the system (Origin Island / lock screen / shade) with title, time and playback state. */
    private fun publishMediaSession() {
        val elapsedMs = ((lastTotalSeconds - lastRemainingSeconds).coerceAtLeast(0)) * 1000L

        mediaSession.setMetadata(
            MediaMetadataCompat.Builder()
                .putString(MediaMetadataCompat.METADATA_KEY_TITLE, lastTitle)
                .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, "$lastTimeText · $lastSubtitle")
                .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, lastSubtitle)
                .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, lastTotalSeconds * 1000L)
                .build()
        )

        val state = if (lastIsRunning) PlaybackStateCompat.STATE_PLAYING else PlaybackStateCompat.STATE_PAUSED
        mediaSession.setPlaybackState(
            PlaybackStateCompat.Builder()
                .setState(state, elapsedMs, if (lastIsRunning) 1.0f else 0f)
                .setActions(
                    PlaybackStateCompat.ACTION_PLAY or
                        PlaybackStateCompat.ACTION_PAUSE or
                        PlaybackStateCompat.ACTION_PLAY_PAUSE or
                        PlaybackStateCompat.ACTION_SKIP_TO_NEXT or
                        PlaybackStateCompat.ACTION_STOP
                )
                .addCustomAction(
                    PlaybackStateCompat.CustomAction.Builder(
                        CUSTOM_ACTION_RESTART,
                        "Restart",
                        android.R.drawable.ic_menu_revert
                    ).build()
                )
                .build()
        )
    }

    private fun buildMediaNotification(): Notification {
        if (Build.VERSION.SDK_INT >= 36) return buildLiveUpdateNotification()

        val contentPendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val restart = NotificationCompat.Action(
            android.R.drawable.ic_menu_revert,
            "Restart",
            buildServiceActionPendingIntent(ACTION_RESTART, 101)
        )
        val playPause = NotificationCompat.Action(
            if (lastIsRunning) android.R.drawable.ic_media_pause else android.R.drawable.ic_media_play,
            if (lastIsRunning) "Pause" else "Resume",
            buildServiceActionPendingIntent(ACTION_TOGGLE_PLAY, 102)
        )
        val skip = NotificationCompat.Action(
            android.R.drawable.ic_media_next,
            "Skip",
            buildServiceActionPendingIntent(ACTION_SKIP, 103)
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_status_island_icon)
            .setContentTitle(lastTitle)
            .setContentText("$lastTimeText · $lastSubtitle")
            .setSubText(if (lastIsRunning) null else "Paused")
            .setContentIntent(contentPendingIntent)
            .addAction(restart)
            .addAction(playPause)
            .addAction(skip)
            .setStyle(
                MediaStyle()
                    .setMediaSession(mediaSession.sessionToken)
                    .setShowActionsInCompactView(0, 1, 2)
            )
            .setOngoing(true)
            .setSilent(true)
            .setOnlyAlertOnce(true)
            .setShowWhen(false)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setCategory(NotificationCompat.CATEGORY_TRANSPORT)
            .build()
    }

    /**
     * Android 16 "Live Update" (promoted ongoing notification). OriginOS 6 is built on Android 16, and
     * this is the public API third-party apps can use to reach the status-bar chip / Origin Island.
     * Requirements: ongoing, has a title, standard style (ProgressStyle), no custom views, not MediaStyle.
     */
    @android.annotation.SuppressLint("NewApi")
    private fun buildLiveUpdateNotification(): Notification {
        val contentPendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        fun action(icon: Int, label: String, pi: PendingIntent) = Notification.Action.Builder(
            android.graphics.drawable.Icon.createWithResource(this, icon), label, pi
        ).build()

        val elapsed = (lastTotalSeconds - lastRemainingSeconds).coerceIn(0, lastTotalSeconds.coerceAtLeast(1))
        val style = Notification.ProgressStyle()
            .setStyledByProgress(true)
            .setProgressSegments(listOf(Notification.ProgressStyle.Segment(lastTotalSeconds.coerceAtLeast(1))))
            .setProgress(elapsed)

        return Notification.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_status_island_icon)
            .setContentTitle(lastTitle)
            .setContentText(if (lastIsRunning) lastSubtitle else "Paused · $lastSubtitle")
            .setShortCriticalText(lastTimeText)
            // API 36 has no builder method for this; the request is the "android.requestPromotedOngoing" extra
            // (same key androidx NotificationCompat.setRequestPromotedOngoing writes).
            .addExtras(Bundle().apply { putBoolean("android.requestPromotedOngoing", true) })
            .setContentIntent(contentPendingIntent)
            .setStyle(style)
            .addAction(action(android.R.drawable.ic_menu_revert, "Restart", buildServiceActionPendingIntent(ACTION_RESTART, 101)))
            .addAction(
                action(
                    if (lastIsRunning) android.R.drawable.ic_media_pause else android.R.drawable.ic_media_play,
                    if (lastIsRunning) "Pause" else "Resume",
                    buildServiceActionPendingIntent(ACTION_TOGGLE_PLAY, 102)
                )
            )
            .addAction(action(android.R.drawable.ic_media_next, "Skip", buildServiceActionPendingIntent(ACTION_SKIP, 103)))
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setShowWhen(false)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .setCategory(Notification.CATEGORY_PROGRESS)
            .build()
    }

    private fun buildServiceActionPendingIntent(action: String, requestCode: Int): PendingIntent {
        val intent = Intent(this, TimerForegroundService::class.java).apply {
            this.action = action
        }
        return PendingIntent.getService(
            this,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    private fun createNotificationChannel() {
        val manager = getSystemService(NotificationManager::class.java) ?: return
        // Earlier channels (plain notification / low-importance media attempt) are retired.
        LEGACY_CHANNEL_IDS.forEach { manager.deleteNotificationChannel(it) }
        // Promoted (Live Update) notifications need at least IMPORTANCE_DEFAULT; sound/vibration stay off.
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Focus Timer",
            NotificationManager.IMPORTANCE_DEFAULT
        ).apply {
            description = "Live Pomodoro timer with Origin Island / media controls"
            setShowBadge(false)
            setSound(null, null)
            enableVibration(false)
            lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        }
        manager.createNotificationChannel(channel)
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        mediaSession.isActive = false
        mediaSession.release()
        super.onDestroy()
    }

    companion object {
        const val CHANNEL_ID = "focus_timer_live_channel"
        private val LEGACY_CHANNEL_IDS = listOf("origin_island_channel", "focus_timer_media_channel", "focus_timer_channel")
        const val NOTIFICATION_ID = 999
        const val ACTION_START_OR_UPDATE = "com.yazri.focus.action.START_OR_UPDATE"
        const val ACTION_STOP = "com.yazri.focus.action.STOP"
        const val ACTION_RESTART = "com.yazri.focus.action.RESTART"
        const val ACTION_TOGGLE_PLAY = "com.yazri.focus.action.TOGGLE_PLAY"
        const val ACTION_SKIP = "com.yazri.focus.action.SKIP"
        private const val CUSTOM_ACTION_RESTART = "com.yazri.focus.custom.RESTART"

        const val REMOTE_ACTION_RESTART = "restart"
        const val REMOTE_ACTION_TOGGLE_PLAY = "toggle_play"
        const val REMOTE_ACTION_SKIP = "skip"

        const val EXTRA_TITLE = "extra_title"
        const val EXTRA_TIME_TEXT = "extra_time_text"
        const val EXTRA_SUBTITLE = "extra_subtitle"
        const val EXTRA_IS_RUNNING = "extra_is_running"
        const val EXTRA_REMAINING_SECONDS = "extra_remaining_seconds"
        const val EXTRA_TOTAL_SECONDS = "extra_total_seconds"

        private val _remoteActions = MutableSharedFlow<String>(extraBufferCapacity = 8)
        val remoteActions: SharedFlow<String> = _remoteActions.asSharedFlow()

        fun updateOrStart(
            context: Context,
            title: String,
            timeText: String,
            subtitle: String,
            isRunning: Boolean = true,
            remainingSeconds: Int = 0,
            totalSeconds: Int = 0
        ) {
            try {
                val intent = Intent(context, TimerForegroundService::class.java).apply {
                    action = ACTION_START_OR_UPDATE
                    putExtra(EXTRA_TITLE, title)
                    putExtra(EXTRA_TIME_TEXT, timeText)
                    putExtra(EXTRA_SUBTITLE, subtitle)
                    putExtra(EXTRA_IS_RUNNING, isRunning)
                    putExtra(EXTRA_REMAINING_SECONDS, remainingSeconds)
                    putExtra(EXTRA_TOTAL_SECONDS, totalSeconds)
                }
                context.startForegroundService(intent)
            } catch (_: Exception) {}
        }

        fun stop(context: Context) {
            try {
                val intent = Intent(context, TimerForegroundService::class.java).apply {
                    action = ACTION_STOP
                }
                context.startService(intent)
            } catch (_: Exception) {}
        }
    }
}
