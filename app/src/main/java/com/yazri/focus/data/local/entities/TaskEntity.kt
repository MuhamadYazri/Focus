package com.yazri.focus.data.local.entities

import androidx.room.Entity
import androidx.room.PrimaryKey
import org.json.JSONArray
import org.json.JSONObject

data class SubtaskItem(
    val id: String,
    val title: String,
    val completed: Boolean = false
)

@Entity(tableName = "tasks")
data class TaskEntity(
    @PrimaryKey val id: String,
    val title: String,
    val projectId: String,
    val estimatedPomos: Int = 1,
    val completedPomos: Int = 0,
    val completed: Boolean = false,
    val completedDateStr: String? = null, // YYYY-MM-DD
    val completedAt: String? = null,      // ISO timestamp
    val priority: String = "NONE",        // HIGH, MEDIUM, LOW, NONE
    val scheduleType: String = "today",   // today, daily, weekly, date
    val scheduledDate: String? = null,
    val weeklyDaysCsv: String = "",       // Comma separated e.g. "1,3,5"
    val subtasksJson: String = "[]",
    val createdAt: String,
    val durationMinutes: Int? = null
) {
    val weeklyDays: List<Int>
        get() = if (weeklyDaysCsv.isBlank()) emptyList()
        else weeklyDaysCsv.split(",").mapNotNull { it.trim().toIntOrNull() }

    val subtasks: List<SubtaskItem>
        get() = try {
            val arr = JSONArray(subtasksJson)
            val list = mutableListOf<SubtaskItem>()
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                list.add(
                    SubtaskItem(
                        id = obj.optString("id", "sub-$i"),
                        title = obj.optString("title", ""),
                        completed = obj.optBoolean("completed", false)
                    )
                )
            }
            list
        } catch (_: Exception) {
            emptyList()
        }

    companion object {
        fun serializeSubtasks(items: List<SubtaskItem>): String {
            val arr = JSONArray()
            items.forEach { item ->
                val obj = JSONObject()
                obj.put("id", item.id)
                obj.put("title", item.title)
                obj.put("completed", item.completed)
                arr.put(obj)
            }
            return arr.toString()
        }

        fun serializeWeeklyDays(days: List<Int>): String {
            return days.joinToString(",")
        }
    }
}
