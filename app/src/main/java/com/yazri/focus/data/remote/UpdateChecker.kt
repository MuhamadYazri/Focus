package com.yazri.focus.data.remote

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL

data class AppUpdateInfo(
    val latestVersion: String,
    val currentVersion: String,
    val isUpdateAvailable: Boolean,
    val releaseTitle: String,
    val changelog: String,
    val downloadUrl: String,
    val releasePageUrl: String
)

sealed interface UpdateCheckState {
    data object Idle : UpdateCheckState
    data object Checking : UpdateCheckState
    data class ResultReceived(val info: AppUpdateInfo) : UpdateCheckState
    data class Error(val message: String) : UpdateCheckState
}

object UpdateChecker {
    private const val GITHUB_API_URL = "https://api.github.com/repos/MuhamadYazri/Focus/releases/latest"
    private const val FALLBACK_RELEASE_URL = "https://github.com/MuhamadYazri/Focus/releases"

    suspend fun checkLatestRelease(currentVersion: String): Result<AppUpdateInfo> = withContext(Dispatchers.IO) {
        runCatching {
            val url = URL(GITHUB_API_URL)
            val connection = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = 8000
                readTimeout = 8000
                setRequestProperty("Accept", "application/vnd.github.v3+json")
                setRequestProperty("User-Agent", "Focus-App-Android")
            }

            val responseCode = connection.responseCode
            if (responseCode != HttpURLConnection.HTTP_OK) {
                throw IllegalStateException("Server returned HTTP $responseCode")
            }

            val responseBody = BufferedReader(InputStreamReader(connection.inputStream)).use { reader ->
                reader.readText()
            }

            val json = JSONObject(responseBody)
            val rawTag = json.optString("tag_name", "").trim()
            val cleanLatest = rawTag.removePrefix("v").trim()
            val releaseTitle = json.optString("name", "v$cleanLatest")
            val releaseNotes = json.optString("body", "").trim()
            val releasePageUrl = json.optString("html_url", FALLBACK_RELEASE_URL)

            // Look for app-release.apk asset or fallback to release page
            var apkDownloadUrl = releasePageUrl
            val assets = json.optJSONArray("assets")
            if (assets != null) {
                for (i in 0 until assets.length()) {
                    val asset = assets.getJSONObject(i)
                    val name = asset.optString("name", "")
                    if (name.endsWith(".apk", ignoreCase = true)) {
                        apkDownloadUrl = asset.optString("browser_download_url", apkDownloadUrl)
                        break
                    }
                }
            }

            val isNewer = isVersionNewer(cleanLatest, currentVersion.removePrefix("v").trim())

            AppUpdateInfo(
                latestVersion = "v$cleanLatest",
                currentVersion = "v${currentVersion.removePrefix("v").trim()}",
                isUpdateAvailable = isNewer,
                releaseTitle = releaseTitle,
                changelog = releaseNotes,
                downloadUrl = apkDownloadUrl,
                releasePageUrl = releasePageUrl
            )
        }
    }

    /**
     * Compares semantic versions (e.g. 1.0.3 vs 1.0.2).
     * Returns true if latest > current.
     */
    fun isVersionNewer(latest: String, current: String): Boolean {
        if (latest.isBlank() || current.isBlank()) return false
        val latestParts = latest.split(".").mapNotNull { it.toIntOrNull() }
        val currentParts = current.split(".").mapNotNull { it.toIntOrNull() }

        val maxLen = maxOf(latestParts.size, currentParts.size)
        for (i in 0 until maxLen) {
            val l = latestParts.getOrElse(i) { 0 }
            val c = currentParts.getOrElse(i) { 0 }
            if (l > c) return true
            if (l < c) return false
        }
        return false
    }
}
