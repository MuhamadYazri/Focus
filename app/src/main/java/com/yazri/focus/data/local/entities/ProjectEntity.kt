package com.yazri.focus.data.local.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "projects")
data class ProjectEntity(
    @PrimaryKey val id: String,
    val name: String,
    val color: String,
    val icon: String = "folder",
    val pomodoros: Int = 0
) {
    val displayName: String
        get() = name
            .replace(Regex("^[0-9]+\\s*(//|·|\\.)\\s*"), "")
            .replace("_", " ")
            .lowercase()
            .split(" ")
            .filter { it.isNotBlank() }
            .joinToString(" ") { word ->
                word.replaceFirstChar { it.uppercase() }
            }
}
