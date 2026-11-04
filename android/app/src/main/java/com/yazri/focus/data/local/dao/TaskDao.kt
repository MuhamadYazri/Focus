package com.yazri.focus.data.local.dao

import androidx.room.*
import com.yazri.focus.data.local.entities.TaskEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface TaskDao {
    @Query("SELECT * FROM tasks ORDER BY createdAt DESC")
    fun getAllTasks(): Flow<List<TaskEntity>>

    @Query("SELECT * FROM tasks ORDER BY createdAt DESC")
    suspend fun getAllTasksOnce(): List<TaskEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTask(task: TaskEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(tasks: List<TaskEntity>)

    @Update
    suspend fun updateTask(task: TaskEntity)

    @Query("DELETE FROM tasks WHERE id = :id")
    suspend fun deleteTaskById(id: String)

    @Query("DELETE FROM tasks WHERE projectId = :projectId")
    suspend fun deleteTasksByProject(projectId: String)

    @Query("UPDATE tasks SET projectId = :fallbackProjectId WHERE projectId = :deletedProjectId")
    suspend fun reassignTasksProject(deletedProjectId: String, fallbackProjectId: String)

    @Query("DELETE FROM tasks")
    suspend fun deleteAllTasks()
}
