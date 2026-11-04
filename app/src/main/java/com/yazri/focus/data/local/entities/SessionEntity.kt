package com.yazri.focus.data.local.entities

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "sessions",
    indices = [
        Index(value = ["dateStr", "projectId"]),
        Index(value = ["dateStr"])
    ]
)
data class SessionEntity(
    @PrimaryKey val id: String,
    val projectId: String,
    val duration: Int,                   // duration in minutes (matches storage.js)
    val completedAt: String,             // ISO timestamp
    val dateStr: String                  // YYYY-MM-DD
)
