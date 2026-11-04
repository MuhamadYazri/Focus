package com.yazri.focus.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.yazri.focus.data.local.dao.ProjectDao
import com.yazri.focus.data.local.dao.SessionDao
import com.yazri.focus.data.local.dao.TaskDao
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import com.yazri.focus.data.local.entities.ProjectEntity
import com.yazri.focus.data.local.entities.SessionEntity
import com.yazri.focus.data.local.entities.TaskEntity

@Database(
    entities = [TaskEntity::class, ProjectEntity::class, SessionEntity::class],
    version = 3,
    exportSchema = false
)
abstract class FocusDatabase : RoomDatabase() {
    abstract fun taskDao(): TaskDao
    abstract fun projectDao(): ProjectDao
    abstract fun sessionDao(): SessionDao

    companion object {
        @Volatile
        private var INSTANCE: FocusDatabase? = null

        val MIGRATION_2_3 = object : Migration(2, 3) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE tasks ADD COLUMN durationMinutes INTEGER DEFAULT NULL")
            }
        }

        fun getInstance(context: Context): FocusDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    FocusDatabase::class.java,
                    "focus_native.db"
                )
                    .addMigrations(MIGRATION_2_3)
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
