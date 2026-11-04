package com.yazri.focus.service

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.media.MediaPlayer
import android.util.Log
import com.yazri.focus.R
import kotlinx.coroutines.*
import java.util.concurrent.CopyOnWriteArrayList
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.exp
import kotlin.math.sin

/**
 * Native audio engine:
 * - Ping-Pong Overlapping Crossfade for ambient soundscapes ('rain', 'forest', 'waves', 'cafe'):
 *   Runs dual alternating MediaPlayers overlapping by 3.0s with equal-power sinusoidal crossfade.
 *   Completely eliminates hardware EOF loop stutter, decoder buffer underruns, and audible loop seams.
 * - Precision zero-crossing calibrated single-track looping for 'clock' (exact steady tick rhythm).
 * - 5-second harmonic zen vibraphone melody for playChime() via AudioTrack.
 */
class SoundEngine(private val context: Context? = null) {
    private val scope = CoroutineScope(Dispatchers.Default + SupervisorJob())
    private var ambientJob: Job? = null
    private val activePlayers = CopyOnWriteArrayList<MediaPlayer>()

    @Volatile
    private var currentSound: String = "none"

    @Volatile
    private var volume: Float = 0.6f

    private val sampleRate = 22050

    fun setVolume(newVol: Float) {
        volume = newVol.coerceIn(0f, 1f)
        for (player in activePlayers) {
            try {
                player.setVolume(volume, volume)
            } catch (_: Exception) {}
        }
    }

    fun stop() {
        currentSound = "none"
        ambientJob?.cancel()
        ambientJob = null
        val playersToRelease = ArrayList(activePlayers)
        activePlayers.clear()
        if (playersToRelease.isNotEmpty()) {
            scope.launch(Dispatchers.Default) {
                for (p in playersToRelease) {
                    try {
                        if (p.isPlaying) {
                            p.stop()
                        }
                        p.reset()
                        p.release()
                    } catch (_: Exception) {}
                }
            }
        }
    }

    fun play(soundType: String, vol: Float = 0.6f) {
        stop()
        currentSound = soundType
        volume = vol.coerceIn(0f, 1f)
        if (soundType == "none" || context == null) return

        val rawResId = when (soundType) {
            "clock" -> R.raw.clock
            "cafe" -> R.raw.cafe
            "waves" -> R.raw.waves
            "rain" -> R.raw.rain
            "forest" -> R.raw.forest
            else -> null
        } ?: return

        ambientJob = scope.launch(Dispatchers.Default) {
            try {
                if (soundType == "clock") {
                    // Clock has exact calibrated zero-crossing tick boundaries; single looping player
                    val mp = MediaPlayer.create(context, rawResId) ?: return@launch
                    if (!isActive || currentSound != soundType) {
                        mp.release()
                        return@launch
                    }
                    mp.isLooping = true
                    mp.setVolume(volume, volume)
                    mp.start()
                    activePlayers.add(mp)
                } else {
                    // Continuous ambient sounds: Ping-Pong Overlapping Crossfade
                    val playerA = MediaPlayer.create(context, rawResId) ?: return@launch
                    val playerB = MediaPlayer.create(context, rawResId) ?: run {
                        playerA.release()
                        return@launch
                    }
                    if (!isActive || currentSound != soundType) {
                        playerA.release()
                        playerB.release()
                        return@launch
                    }

                    activePlayers.add(playerA)
                    activePlayers.add(playerB)

                    val crossfadeMs = 3000L
                    val stepMs = 50L
                    val steps = (crossfadeMs / stepMs).toInt().coerceAtLeast(1)

                    var currentActive = playerA
                    var incoming = playerB

                    currentActive.isLooping = false
                    incoming.isLooping = false
                    currentActive.setVolume(volume, volume)
                    currentActive.start()

                    while (isActive && currentSound == soundType) {
                        val duration = currentActive.duration
                        if (duration <= crossfadeMs) {
                            currentActive.isLooping = true
                            break
                        }

                        // Wait until playback reaches crossfade trigger point (duration - crossfadeMs)
                        while (isActive && currentSound == soundType) {
                            val pos = try { currentActive.currentPosition } catch (_: Exception) { -1 }
                            if (pos >= duration - crossfadeMs || pos == -1) break
                            val sleepMs = ((duration - crossfadeMs - pos) / 2).coerceIn(40L, 500L)
                            delay(sleepMs)
                        }

                        if (!isActive || currentSound != soundType) break

                        // Start incoming player at volume 0
                        incoming.seekTo(0)
                        incoming.setVolume(0f, 0f)
                        incoming.start()

                        // Equal-power sinusoidal crossfade over crossfadeMs
                        for (s in 0..steps) {
                            if (!isActive || currentSound != soundType) break
                            val t = s.toFloat() / steps
                            val fadeOut = (cos(0.5 * PI * t) * volume).toFloat()
                            val fadeIn = (sin(0.5 * PI * t) * volume).toFloat()
                            try {
                                currentActive.setVolume(fadeOut, fadeOut)
                                incoming.setVolume(fadeIn, fadeIn)
                            } catch (_: Exception) {}
                            delay(stepMs)
                        }

                        if (!isActive || currentSound != soundType) break

                        // Complete transition
                        try {
                            currentActive.pause()
                            currentActive.seekTo(0)
                            currentActive.setVolume(0f, 0f)
                            incoming.setVolume(volume, volume)
                        } catch (_: Exception) {}

                        // Swap active and incoming for next cycle
                        val temp = currentActive
                        currentActive = incoming
                        incoming = temp
                    }
                }
            } catch (e: Exception) {
                Log.e("SoundEngine", "Failed to start media player for $soundType", e)
            }
        }
    }

    fun playChime() {
        scope.launch {
            val durationSecs = 5.0
            val totalSamples = (sampleRate * durationSecs).toInt()
            val samples = ShortArray(totalSamples)

            data class Note(val freq: Double, val start: Double, val dur: Double)
            val notes = listOf(
                Note(523.25, 0.0, 2.2),  // C5
                Note(783.99, 0.4, 2.2),  // G5
                Note(880.00, 0.8, 2.2),  // A5
                Note(1318.51, 1.3, 2.2), // E6
                Note(1174.66, 1.9, 2.2), // D6
                Note(1046.50, 2.5, 2.2), // C6
                Note(880.00, 3.1, 2.2),  // A5
                Note(1046.50, 3.7, 1.3), // C6
                Note(1567.98, 3.7, 1.3)  // G6
            )

            val gainScale = volume.coerceAtLeast(0.4f).toDouble()

            for (i in 0 until totalSamples) {
                val t = i.toDouble() / sampleRate.toDouble()
                var mix = 0.0
                for (n in notes) {
                    if (t >= n.start && t <= n.start + n.dur) {
                        val localT = t - n.start
                        val attack = (localT / 0.04).coerceAtMost(1.0)
                        val decay = exp(-localT * 2.4)
                        val fundamental = sin(2.0 * PI * n.freq * localT) * attack * decay * 0.22
                        val overtone = sin(2.0 * PI * (n.freq * 2.0) * localT) * attack * exp(-localT * 4.0) * 0.06
                        mix += (fundamental + overtone) * gainScale
                    }
                }
                samples[i] = (mix.coerceIn(-1.0, 1.0) * Short.MAX_VALUE).toInt().toShort()
            }

            try {
                val track = AudioTrack.Builder()
                    .setAudioAttributes(
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build()
                    )
                    .setAudioFormat(
                        AudioFormat.Builder()
                            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                            .setSampleRate(sampleRate)
                            .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                            .build()
                    )
                    .setBufferSizeInBytes(samples.size * 2)
                    .setTransferMode(AudioTrack.MODE_STATIC)
                    .build()

                track.write(samples, 0, samples.size)
                track.play()
                delay(5200)
                track.release()
            } catch (_: Exception) {}
        }
    }
}
