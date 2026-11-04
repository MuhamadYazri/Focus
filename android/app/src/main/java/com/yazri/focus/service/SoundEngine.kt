package com.yazri.focus.service

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import kotlinx.coroutines.*
import kotlin.math.PI
import kotlin.math.exp
import kotlin.math.sin
import kotlin.random.Random

/**
 * Native procedural PCM audio synthesizer replicating Web Audio API SoundEngine:
 * - Ambient pink/filtered noise for 'rain', 'forest', 'waves', 'cafe'
 * - Mechanical sine-decay tick for 'clock'
 * - 5-second harmonic zen vibraphone melody for playChime()
 */
class SoundEngine {
    private val scope = CoroutineScope(Dispatchers.Default + SupervisorJob())
    private var ambientJob: Job? = null
    private var activeTrack: AudioTrack? = null

    @Volatile
    private var currentSound: String = "none"

    @Volatile
    private var volume: Float = 0.6f

    private val sampleRate = 22050

    fun setVolume(newVol: Float) {
        volume = newVol.coerceIn(0f, 1f)
        try {
            activeTrack?.setVolume(volume)
        } catch (_: Exception) {}
    }

    fun stop() {
        currentSound = "none"
        ambientJob?.cancel()
        ambientJob = null
        try {
            activeTrack?.pause()
            activeTrack?.flush()
            activeTrack?.release()
        } catch (_: Exception) {}
        activeTrack = null
    }

    fun play(soundType: String, vol: Float = 0.6f) {
        stop()
        currentSound = soundType
        volume = vol.coerceIn(0f, 1f)
        if (soundType == "none") return

        ambientJob = scope.launch {
            val minBuf = AudioTrack.getMinBufferSize(
                sampleRate,
                AudioFormat.CHANNEL_OUT_MONO,
                AudioFormat.ENCODING_PCM_16BIT
            ).coerceAtLeast(4096)

            val track = AudioTrack.Builder()
                .setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .build()
                )
                .setAudioFormat(
                    AudioFormat.Builder()
                        .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                        .setSampleRate(sampleRate)
                        .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                        .build()
                )
                .setBufferSizeInBytes(minBuf * 2)
                .setTransferMode(AudioTrack.MODE_STREAM)
                .build()

            activeTrack = track
            track.setVolume(volume)
            track.play()

            val chunkSize = 2048
            val buffer = ShortArray(chunkSize)

            // Pink noise filter state
            var b0 = 0.0
            var b1 = 0.0
            var b2 = 0.0
            var b3 = 0.0
            var b4 = 0.0
            var b5 = 0.0
            var b6 = 0.0
            var lpState = 0.0
            var sampleIndex = 0L

            try {
                while (isActive && currentSound == soundType) {
                    for (i in 0 until chunkSize) {
                        val t = sampleIndex.toDouble() / sampleRate.toDouble()
                        sampleIndex++

                        val sampleDouble = if (soundType == "clock") {
                            val secFrac = t % 1.0
                            if (secFrac < 0.035) {
                                val freq = 1200.0 * exp(-secFrac * 35.0)
                                val env = exp(-secFrac * 120.0)
                                sin(2.0 * PI * freq * secFrac) * env * 0.45
                            } else {
                                0.0
                            }
                        } else {
                            val white = Random.nextDouble(-1.0, 1.0)
                            b0 = 0.99886 * b0 + white * 0.0555179
                            b1 = 0.99332 * b1 + white * 0.0750759
                            b2 = 0.96900 * b2 + white * 0.1538520
                            b3 = 0.86650 * b3 + white * 0.3104856
                            b4 = 0.55000 * b4 + white * 0.5329522
                            b5 = -0.7616 * b5 - white * 0.0168980
                            val pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.06
                            b6 = white * 0.115926

                            val alpha = when (soundType) {
                                "rain" -> 0.25
                                "forest" -> 0.14
                                "waves" -> 0.08 + 0.06 * sin(2.0 * PI * 0.12 * t)
                                "cafe" -> 0.38
                                else -> 0.2
                            }
                            lpState += alpha * (pink - lpState)
                            val mod = if (soundType == "waves") {
                                0.65 + 0.35 * sin(2.0 * PI * 0.12 * t)
                            } else 1.0
                            lpState * mod
                        }

                        val pcm = (sampleDouble.coerceIn(-1.0, 1.0) * Short.MAX_VALUE).toInt().toShort()
                        buffer[i] = pcm
                    }
                    track.write(buffer, 0, chunkSize)
                }
            } catch (_: Exception) {
            } finally {
                try {
                    track.stop()
                    track.release()
                } catch (_: Exception) {}
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
