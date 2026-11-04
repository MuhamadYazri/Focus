package com.yazri.focus

import android.Manifest
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.content.pm.ActivityInfo
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.Crossfade
import androidx.compose.animation.core.*
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowForward
import androidx.compose.material.icons.automirrored.outlined.Undo
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.input.pointer.util.VelocityTracker
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.yazri.focus.ui.navigation.rememberPagerSwipeController
import android.content.res.Configuration
import android.graphics.drawable.ColorDrawable
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.content.FileProvider
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.yazri.focus.data.preferences.SettingsDataStore
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.yazri.focus.data.local.entities.TaskEntity
import com.yazri.focus.ui.analytics.AnalyticsScreen
import com.yazri.focus.ui.navigation.BottomDockNav
import com.yazri.focus.ui.navigation.Screen
import com.yazri.focus.ui.profile.ProfileScreen
import com.yazri.focus.ui.profile.ProjectCategoryDialog
import com.yazri.focus.ui.tasks.TaskModalBottomSheet
import com.yazri.focus.ui.tasks.TasksScreen
import com.yazri.focus.ui.theme.*
import com.yazri.focus.ui.timer.CelebrationItem
import com.yazri.focus.ui.timer.TimerScreen
import com.yazri.focus.ui.timer.TimerViewModel
import com.yazri.focus.ui.timer.UndoToastItem
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.io.File
import java.time.LocalDate
import kotlin.math.abs

class MainActivity : ComponentActivity() {

    private val viewModel: TimerViewModel by viewModels {
        val app = application as FocusApp
        TimerViewModel.Factory(
            appContext = app.applicationContext,
            repository = app.repository,
            soundEngine = app.soundEngine,
            hapticManager = app.hapticManager,
            timerEngine = app.timerEngine
        )
    }

    private fun applyStrictModeSystemEffects(strictEnabled: Boolean, promptIfNoPermission: Boolean = false) {
        val insetsController = WindowCompat.getInsetsController(window, window.decorView)
        insetsController.systemBarsBehavior =
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        if (strictEnabled) {
            insetsController.hide(WindowInsetsCompat.Type.statusBars())
        } else {
            insetsController.show(WindowInsetsCompat.Type.statusBars())
        }

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
        if (notificationManager != null) {
            if (notificationManager.isNotificationPolicyAccessGranted) {
                try {
                    notificationManager.setInterruptionFilter(
                        if (strictEnabled) {
                            NotificationManager.INTERRUPTION_FILTER_PRIORITY
                        } else {
                            NotificationManager.INTERRUPTION_FILTER_ALL
                        }
                    )
                } catch (_: SecurityException) {
                }
            } else if (strictEnabled && promptIfNoPermission) {
                try {
                    startActivity(Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS))
                } catch (_: Exception) {
                }
            }
        }
    }

    private fun Modifier.screenSlideFade(index: Int, widthPx: Float, progressProvider: () -> Float): Modifier =
        this.graphicsLayer {
            val p = progressProvider()
            val diff = index - p
            if (kotlin.math.abs(diff) >= 1.0f) {
                translationX = 99999f
                alpha = 0f
            } else {
                // Symmetrical 1:1 horizontal slide + smooth alpha cross-fade
                translationX = diff * widthPx
                alpha = (1f - kotlin.math.abs(diff)).coerceIn(0f, 1f)
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        val splashScreen = installSplashScreen()
        super.onCreate(savedInstanceState)
        requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT

        val cachedTheme = SettingsDataStore.getCachedThemeMode(this)
        val isSystemDark = (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES
        val initialDarkTheme = when (cachedTheme) {
            "dark" -> true
            "light" -> false
            else -> isSystemDark
        }
        window.setBackgroundDrawable(ColorDrawable(if (initialDarkTheme) 0xFF121211.toInt() else 0xFFECECE8.toInt()))

        enableEdgeToEdge()

        setContent {
            val settings by viewModel.settings.collectAsStateWithLifecycle()
            val isSystemDark = androidx.compose.foundation.isSystemInDarkTheme()
            val darkTheme = when (settings.themeMode) {
                "dark" -> true
                "light" -> false
                else -> isSystemDark
            }

            val view = androidx.compose.ui.platform.LocalView.current
            if (!view.isInEditMode) {
                SideEffect {
                    val window = (view.context as android.app.Activity).window
                    val insetsController = androidx.core.view.WindowCompat.getInsetsController(window, view)
                    insetsController.isAppearanceLightStatusBars = !darkTheme
                    insetsController.isAppearanceLightNavigationBars = !darkTheme
                }
            }

            FocusTheme(darkTheme = darkTheme) {
                val activeTab by viewModel.activeTab.collectAsStateWithLifecycle()
                val tasks by viewModel.tasks.collectAsStateWithLifecycle()
                val projects by viewModel.projects.collectAsStateWithLifecycle()
                val sessions by viewModel.sessions.collectAsStateWithLifecycle()
                val timerMode by viewModel.timerMode.collectAsStateWithLifecycle()
                val isRunning by viewModel.isRunning.collectAsStateWithLifecycle()
                val cycleCount by viewModel.cycleCount.collectAsStateWithLifecycle()
                val activeTask by viewModel.activeTask.collectAsStateWithLifecycle()
                val isNavHidden by viewModel.isNavHidden.collectAsStateWithLifecycle()
                val strictModalOpen by viewModel.strictModalOpen.collectAsStateWithLifecycle()
                val celebrations by viewModel.celebrations.collectAsStateWithLifecycle()
                val toast by viewModel.toast.collectAsStateWithLifecycle()
                val updateState by viewModel.updateState.collectAsStateWithLifecycle()

                val scope = rememberCoroutineScope()
                var isPreloading by remember { mutableStateOf(true) }
                var taskModalOpen by remember { mutableStateOf(false) }
                var taskToEdit by remember { mutableStateOf<TaskEntity?>(null) }
                var backupStatusMessage by remember { mutableStateOf("") }
                var prevStrictMode by remember { mutableStateOf<Boolean?>(null) }

                // Silent update check on cold start (non-intrusive)
                LaunchedEffect(Unit) {
                    viewModel.checkForUpdates(isSilent = true)
                }

                // Hide Android status bar + enable System DND when Strict Mode is enabled; restore when disabled
                LaunchedEffect(settings.strictMode) {
                    val userJustToggledOn = prevStrictMode == false && settings.strictMode
                    prevStrictMode = settings.strictMode
                    applyStrictModeSystemEffects(
                        strictEnabled = settings.strictMode,
                        promptIfNoPermission = userJustToggledOn
                    )
                }

                // Request Android 13+ notification permission when timer starts
                val notifPermissionLauncher = rememberLauncherForActivityResult(
                    contract = ActivityResultContracts.RequestPermission()
                ) {}

                LaunchedEffect(isRunning) {
                    if (isRunning && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        notifPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                    }
                }

                // Keep screen awake during active session
                LaunchedEffect(isRunning, settings.keepAwake) {
                    if (isRunning && settings.keepAwake) {
                        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                    } else {
                        window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                    }
                }

                // Lifecycle observer for backgrounding (Strict Mode) & foreground resume sync
                val lifecycleOwner = LocalLifecycleOwner.current
                DisposableEffect(lifecycleOwner, settings.strictMode) {
                    val observer = LifecycleEventObserver { _, event ->
                        when (event) {
                            Lifecycle.Event.ON_RESUME -> {
                                viewModel.syncOnResume()
                                applyStrictModeSystemEffects(
                                    strictEnabled = settings.strictMode,
                                    promptIfNoPermission = false
                                )
                            }
                            Lifecycle.Event.ON_STOP -> viewModel.onAppBackgrounded()
                            else -> {}
                        }
                    }
                    lifecycleOwner.lifecycle.addObserver(observer)
                    onDispose {
                        lifecycleOwner.lifecycle.removeObserver(observer)
                    }
                }

                // JSON Restore File Picker
                val restoreLauncher = rememberLauncherForActivityResult(
                    contract = ActivityResultContracts.GetContent()
                ) { uri ->
                    if (uri != null) {
                        scope.launch {
                            try {
                                val text = contentResolver.openInputStream(uri)?.bufferedReader()?.use { it.readText() }
                                if (!text.isNullOrBlank()) {
                                    viewModel.importBackupJson(text)
                                    backupStatusMessage = "Backup restored successfully"
                                }
                            } catch (e: Exception) {
                                backupStatusMessage = "Error: ${e.message}"
                            }
                        }
                    }
                }

                val isFullscreenTimer = isNavHidden && activeTab == "timer"
                val configuration = androidx.compose.ui.platform.LocalConfiguration.current
                val isLandscape = configuration.orientation == Configuration.ORIENTATION_LANDSCAPE
                val isHorizontalFullscreen = isFullscreenTimer && isLandscape

                // Unlock orientation to sensor ONLY while in fullscreen timer; restore portrait otherwise
                DisposableEffect(isFullscreenTimer) {
                    requestedOrientation = if (isFullscreenTimer) {
                        ActivityInfo.SCREEN_ORIENTATION_SENSOR
                    } else {
                        ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
                    }
                    onDispose {
                        requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
                    }
                }

                // Fullscreen horizontal immersion: hide system bars (status & nav) edge-to-edge
                DisposableEffect(isHorizontalFullscreen, settings.strictMode) {
                    val window = this@MainActivity.window
                    val insetsController = WindowCompat.getInsetsController(window, window.decorView)
                    insetsController.systemBarsBehavior =
                        WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                    if (isHorizontalFullscreen) {
                        insetsController.hide(WindowInsetsCompat.Type.systemBars())
                    } else {
                        applyStrictModeSystemEffects(settings.strictMode, promptIfNoPermission = false)
                        insetsController.show(WindowInsetsCompat.Type.navigationBars())
                    }
                    onDispose {
                        applyStrictModeSystemEffects(settings.strictMode, promptIfNoPermission = false)
                        val ctrl = WindowCompat.getInsetsController(window, window.decorView)
                        ctrl.show(WindowInsetsCompat.Type.navigationBars())
                    }
                }

                // System Back Navigation Handlers:
                // 1) Exit fullscreen timer when in fullscreen
                // 2) Return to Timer (home) tab when on secondary tabs
                BackHandler(enabled = isFullscreenTimer) {
                    viewModel.toggleNavHidden()
                }
                BackHandler(enabled = !isFullscreenTimer && activeTab != "timer") {
                    viewModel.selectTab("timer")
                }

                val currentTab by rememberUpdatedState(activeTab)
                val currentIsFullscreen by rememberUpdatedState(isFullscreenTimer)
                val currentTaskModalOpen by rememberUpdatedState(taskModalOpen)

                val pagerController = rememberPagerSwipeController(
                    initialKey = activeTab,
                    tabCount = Screen.items.size,
                    onTabSettled = { settledKey ->
                        viewModel.selectTab(settledKey)
                    }
                )

                LaunchedEffect(activeTab) {
                    pagerController.syncFromExternalTab(activeTab)
                }

                val tracker = remember { VelocityTracker() }

                // Retained Screen Layer Cache with Option B: Idle Background Pre-warming
                var visitedTabs by remember { mutableStateOf(setOf(activeTab)) }
                LaunchedEffect(activeTab) {
                    visitedTabs = visitedTabs + activeTab
                }

                LaunchedEffect(pagerController.isDragging) {
                    if (pagerController.isDragging) {
                        visitedTabs = visitedTabs + setOf("home", "timer", "reports", "profile")
                    }
                }

                // Option B: Idle Background Pre-warming
                // Wait for initial frame to paint (~120ms), then progressively warm remaining tabs across frames
                LaunchedEffect(Unit) {
                    delay(120)
                    val warmSequence = listOf("timer", "reports", "profile", "home")
                    for (tab in warmSequence) {
                        if (tab !in visitedTabs) {
                            visitedTabs = visitedTabs + tab
                            delay(60) // spread across consecutive frames to maintain locked 120 FPS
                        }
                    }
                }

                BoxWithConstraints(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(CanvasBg)
                        .pointerInput(currentIsFullscreen, currentTaskModalOpen) {
                            if (currentIsFullscreen || currentTaskModalOpen) return@pointerInput
                            val width = size.width.toFloat()
                            detectHorizontalDragGestures(
                                onDragStart = {
                                    tracker.resetTracking()
                                    pagerController.onDragStart()
                                },
                                onHorizontalDrag = { change, dragAmount ->
                                    tracker.addPosition(change.uptimeMillis, change.position)
                                    pagerController.onDrag(dragAmount, width)
                                },
                                onDragEnd = {
                                    val velocity = tracker.calculateVelocity().x
                                    pagerController.onDragEnd(velocity, width)
                                },
                                onDragCancel = {
                                    pagerController.onDragEnd(0f, width)
                                }
                            )
                        }
                ) {
                    val screenWidth = constraints.maxWidth.toFloat()

                    Box(modifier = Modifier.fillMaxSize()) {
                        // 1. Tasks Screen (Index 0)
                        if ("home" in visitedTabs) {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .screenSlideFade(0, screenWidth) { pagerController.progress }
                            ) {
                                TasksScreen(
                                    tasks = tasks,
                                    sessions = sessions,
                                    settings = settings,
                                    activeTaskId = activeTask?.id,
                                    isTimerRunning = isRunning,
                                    onAddTask = {
                                        taskToEdit = null
                                        taskModalOpen = true
                                    },
                                    onEditTask = { task ->
                                        taskToEdit = task
                                        taskModalOpen = true
                                    },
                                    onToggleComplete = { viewModel.toggleTaskComplete(it) },
                                    onStartPomodoro = { viewModel.startPomodoroForTask(it) },
                                    onDeleteTask = { viewModel.deleteTask(it) }
                                )
                            }
                        }

                        // 2. Timer Screen (Index 1)
                        if ("timer" in visitedTabs) {
                            val timeLeft by viewModel.timeLeft.collectAsStateWithLifecycle()
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .screenSlideFade(1, screenWidth) { pagerController.progress }
                            ) {
                                TimerScreen(
                                    mode = timerMode,
                                    timeLeft = timeLeft,
                                    totalTime = viewModel.getTotalTimeForMode(timerMode),
                                    isRunning = isRunning,
                                    cycleCount = cycleCount,
                                    longBreakInterval = settings.longBreakInterval,
                                    currentSound = settings.soundscape,
                                    soundVolume = settings.soundVolume,
                                    strictMode = settings.strictMode,
                                    isNavHidden = isFullscreenTimer,
                                    activeTask = activeTask,
                                    tasks = tasks,
                                    soundEngine = viewModel.soundEngine,
                                    onTogglePlay = { viewModel.togglePlay(it) },
                                    onReset = { viewModel.resetTimer() },
                                    onSkip = { viewModel.skipSession() },
                                    onModeChange = { viewModel.selectMode(it) },
                                    onSelectSound = { snd ->
                                        viewModel.updateSettings(settings.copy(soundscape = snd))
                                    },
                                    onChangeVolume = { vol ->
                                        viewModel.updateSettings(settings.copy(soundVolume = vol))
                                    },
                                    onToggleStrictMode = {
                                        viewModel.updateSettings(settings.copy(strictMode = !settings.strictMode))
                                    },
                                    onToggleNav = { viewModel.toggleNavHidden() },
                                    onSelectActiveTask = { viewModel.selectActiveTask(it) }
                                )
                            }
                        }

                        // 3. Reports Screen (Index 2)
                        if ("reports" in visitedTabs) {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .screenSlideFade(2, screenWidth) { pagerController.progress }
                            ) {
                                AnalyticsScreen(
                                    projects = projects,
                                    sessions = sessions,
                                    settings = settings
                                )
                            }
                        }

                        // 4. Settings / Profile Screen (Index 3)
                        if ("profile" in visitedTabs) {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .screenSlideFade(3, screenWidth) { pagerController.progress }
                            ) {
                                ProfileScreen(
                                    settings = settings,
                                    projects = projects,
                                    backupStatusMessage = backupStatusMessage,
                                    updateState = updateState,
                                    onCheckUpdate = { viewModel.checkForUpdates(isSilent = false) },
                                    onUpdateSettings = { viewModel.updateSettings(it) },
                                    onSaveProject = { viewModel.saveProject(it) },
                                    onDeleteProject = { viewModel.deleteProject(it) },
                                    onExportBackup = {
                                        scope.launch {
                                            try {
                                                val json = viewModel.exportBackupJson()
                                                val fileName = "focus_backup_${LocalDate.now()}.json"
                                                val file = File(cacheDir, fileName)
                                                file.writeText(json)
                                                val uri = FileProvider.getUriForFile(
                                                    this@MainActivity,
                                                    "${packageName}.fileprovider",
                                                    file
                                                )
                                                val shareIntent = Intent(Intent.ACTION_SEND).apply {
                                                    type = "application/json"
                                                    putExtra(Intent.EXTRA_STREAM, uri)
                                                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                                                }
                                                startActivity(Intent.createChooser(shareIntent, "Save or Share Backup"))
                                                backupStatusMessage = "Backup exported successfully"
                                            } catch (e: Exception) {
                                                backupStatusMessage = "Error: ${e.message}"
                                            }
                                        }
                                    },
                                    onImportBackup = {
                                        restoreLauncher.launch("application/json")
                                    },
                                    onResetAllData = { viewModel.resetAllData() }
                                )
                            }
                        }
                    }

                    val navBarBottom = WindowInsets.navigationBars.asPaddingValues().calculateBottomPadding()

                    // Bottom Screen Fade Overlay matching App.jsx (h-28 bg-gradient-to-t from-[#F0F2EF] to-transparent)
                    Box(
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .fillMaxWidth()
                            .height(112.dp + navBarBottom)
                            .graphicsLayer {
                                alpha = if (isFullscreenTimer) 0f else 1f
                            }
                            .background(
                                Brush.verticalGradient(
                                    colors = listOf(Color.Transparent, CanvasBg)
                                )
                            )
                    )

                    // Undo Toast Overlay matching UndoToast.jsx (floats 8dp above dock)
                    UndoToastOverlay(
                        toast = toast,
                        onUndo = { viewModel.triggerUndo() },
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .navigationBarsPadding()
                            .padding(bottom = 78.dp)
                    )

                    // Mascot Peek Animation Overlay ("Appy")
                    com.yazri.focus.ui.components.MascotPeekOverlay(
                        isDark = darkTheme,
                        isHidden = isFullscreenTimer
                    )

                    // Floating Bottom Dock Navigation
                    BottomDockNav(
                        activeTab = activeTab,
                        onSelectTab = { targetTab ->
                            pagerController.syncFromExternalTab(targetTab)
                            viewModel.selectTab(targetTab)
                        },
                        progressProvider = { pagerController.progress },
                        isDraggingProvider = { pagerController.isPageSwiping },
                        isHidden = isFullscreenTimer,
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .navigationBarsPadding()
                            .padding(bottom = 16.dp)
                    )

                    // Fullscreen Session Completion Screen matching SessionCompletionScreen.jsx
                    celebrations.firstOrNull()?.let { cel ->
                        SessionCompletionFullscreen(
                            celebration = cel,
                            onPrimaryAction = { viewModel.handleCelebrationPrimaryAction(cel) },
                            onDismiss = { viewModel.dismissCelebration(cel.id) }
                        )
                    }

                    // Strict Mode Distraction Shield Fullscreen Screen
                    if (strictModalOpen) {
                        StrictModeFullscreen(
                            onResumeFocus = {
                                viewModel.dismissStrictModal(false)
                                viewModel.togglePlay()
                            },
                            onGiveUpAndReset = {
                                viewModel.dismissStrictModal(true)
                            }
                        )
                    }

                    // Split-Reveal Launch Preloader matching SplitRevealPreloader.jsx
                    if (isPreloading && !strictModalOpen) {
                        SplitRevealPreloader(
                            onComplete = { isPreloading = false }
                        )
                    }
                }

                // Task Create / Edit Bottom Sheet
                if (taskModalOpen) {
                    TaskModalBottomSheet(
                        taskToEdit = taskToEdit,
                        projects = projects,
                        defaultWorkDuration = settings.workDuration,
                        onDismiss = { taskModalOpen = false },
                        onSave = { viewModel.saveTask(it) },
                        onDelete = { viewModel.deleteTask(it) },
                        onCreateProject = { viewModel.saveProject(it) }
                    )
                }
            }
        }
    }
}

@Composable
private fun SplitRevealPreloader(
    onComplete: () -> Unit
) {
    var phase by remember { mutableIntStateOf(0) } // 0 = enter branding, 1 = split shutters
    LaunchedEffect(Unit) {
        delay(550)
        phase = 1
        delay(850)
        onComplete()
    }

    val splitEasing = remember { CubicBezierEasing(0.76f, 0f, 0.24f, 1f) }
    val shutterProgress by animateFloatAsState(
        targetValue = if (phase >= 1) 1f else 0f,
        animationSpec = tween(durationMillis = 820, easing = splitEasing),
        label = "ShutterSplitProgress"
    )
    val brandAlpha by animateFloatAsState(
        targetValue = if (phase == 0) 1f else 0f,
        animationSpec = tween(durationMillis = 360),
        label = "BrandAlpha"
    )
    val brandScale by animateFloatAsState(
        targetValue = if (phase == 0) 1f else 1.04f,
        animationSpec = tween(durationMillis = 420),
        label = "BrandScale"
    )

    BoxWithConstraints(
        modifier = Modifier
            .fillMaxSize()
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null
            ) {}
    ) {
        val halfHeightPx = constraints.maxHeight / 2f

        Column(modifier = Modifier.fillMaxSize()) {
            // Top Shutter
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .graphicsLayer {
                        translationY = -shutterProgress * halfHeightPx * 1.05f
                    }
                    .background(CanvasBg)
            )
            // Bottom Shutter
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .graphicsLayer {
                        translationY = shutterProgress * halfHeightPx * 1.05f
                    }
                    .background(CanvasBg)
            )
        }

        // Center Branding Overlay
        Column(
            modifier = Modifier
                .align(Alignment.Center)
                .graphicsLayer {
                    alpha = brandAlpha
                    scaleX = brandScale
                    scaleY = brandScale
                },
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = "FOCUS",
                fontSize = 30.sp,
                fontWeight = FontWeight.ExtraBold,
                letterSpacing = 10.sp,
                color = InkDark
            )
            Text(
                text = "by Yazzzz",
                fontSize = 10.sp,
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Bold,
                letterSpacing = 2.5.sp,
                color = MossSecondary
            )
        }
    }
}

@Composable
private fun UndoToastOverlay(
    toast: UndoToastItem?,
    onUndo: () -> Unit,
    modifier: Modifier = Modifier
) {
    AnimatedVisibility(
        visible = toast != null,
        enter = slideInVertically(initialOffsetY = { it / 2 }) + fadeIn(),
        exit = slideOutVertically(targetOffsetY = { it / 2 }) + fadeOut(),
        modifier = modifier
            .fillMaxWidth()
            .widthIn(max = 440.dp)
            .padding(horizontal = 20.dp)
    ) {
        toast?.let { item ->
            val progress = remember(item.id) { Animatable(1f) }
            LaunchedEffect(item.id) {
                progress.snapTo(1f)
                progress.animateTo(
                    targetValue = 0f,
                    animationSpec = tween(durationMillis = 4000, easing = LinearEasing)
                )
            }

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .shadow(
                        elevation = 14.dp,
                        shape = RoundedCornerShape(16.dp),
                        ambientColor = Color.Black.copy(alpha = 0.25f),
                        spotColor = Color.Black.copy(alpha = 0.25f)
                    )
                    .clip(RoundedCornerShape(16.dp))
                    .background(InkDark)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = item.message,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = SurfaceWhite,
                        modifier = Modifier
                            .weight(1f)
                            .padding(end = 12.dp)
                    )

                    Row(
                        modifier = Modifier
                            .height(32.dp)
                            .clip(CircleShape)
                            .background(SurfaceWhite)
                            .clickable { onUndo() }
                            .padding(horizontal = 14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(5.dp)
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Outlined.Undo,
                            contentDescription = "Undo",
                            tint = InkDark,
                            modifier = Modifier.size(13.dp)
                        )
                        Text(
                            text = "UNDO",
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 0.8.sp,
                            color = InkDark
                        )
                    }
                }

                // 3dp Countdown Progress Bar (#588157)
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(3.dp)
                        .background(SurfaceWhite.copy(alpha = 0.1f))
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(progress.value)
                            .fillMaxHeight()
                            .background(ActivityGreen)
                    )
                }
            }
        }
    }
}

@Composable
private fun StrictModeFullscreen(
    onResumeFocus: () -> Unit,
    onGiveUpAndReset: () -> Unit
) {
    val infiniteTransition = rememberInfiniteTransition(label = "StrictShieldPulse")
    val ringScale by infiniteTransition.animateFloat(
        initialValue = 0.94f,
        targetValue = 1.06f,
        animationSpec = infiniteRepeatable(
            animation = tween(1800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "StrictShieldRingScale"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(CanvasBg)
            .padding(horizontal = 24.dp)
    ) {
        // Centerpiece Illustration + Typography (Perfect true center of the screen)
        Column(
            modifier = Modifier
                .align(Alignment.Center)
                .fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier.size(200.dp),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(180.dp)
                        .graphicsLayer {
                            scaleX = ringScale
                            scaleY = ringScale
                        }
                        .clip(CircleShape)
                        .background(ErrorRed.copy(alpha = 0.12f))
                )
                Box(
                    modifier = Modifier
                        .size(128.dp)
                        .clip(CircleShape)
                        .background(SurfaceWhite)
                        .border(2.dp, ErrorRed.copy(alpha = 0.25f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Outlined.Shield,
                        contentDescription = null,
                        tint = ErrorRed,
                        modifier = Modifier.size(56.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "Focus Interrupted",
                fontSize = 28.sp,
                lineHeight = 34.sp,
                fontWeight = FontWeight.ExtraBold,
                letterSpacing = (-0.5).sp,
                color = InkDark,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = "You left the app while a Strict Mode session was running. Keep your streak going or reset your session.",
                fontSize = 14.sp,
                lineHeight = 20.sp,
                fontWeight = FontWeight.Medium,
                color = MossSecondary,
                textAlign = TextAlign.Center,
                modifier = Modifier.widthIn(max = 290.dp)
            )
        }

        // Bottom Action Footer (Pinned neatly at bottom)
        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 44.dp)
                .fillMaxWidth()
                .widthIn(max = 360.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
                    .shadow(
                        elevation = 10.dp,
                        shape = CircleShape,
                        ambientColor = InkDark.copy(alpha = 0.2f),
                        spotColor = InkDark.copy(alpha = 0.2f)
                    )
                    .clip(CircleShape)
                    .background(InkDark)
                    .clickable { onResumeFocus() },
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Resume Focus",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = SurfaceWhite
                )
                Spacer(modifier = Modifier.width(8.dp))
                Icon(
                    imageVector = Icons.AutoMirrored.Outlined.ArrowForward,
                    contentDescription = null,
                    tint = SurfaceWhite,
                    modifier = Modifier.size(16.dp)
                )
            }

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(42.dp)
                    .clip(CircleShape)
                    .clickable { onGiveUpAndReset() },
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Give Up & Reset",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = ErrorRed
                )
            }
        }
    }
}

@Composable
private fun SessionCompletionFullscreen(
    celebration: CelebrationItem,
    onPrimaryAction: () -> Unit,
    onDismiss: () -> Unit
) {
    val infiniteTransition = rememberInfiniteTransition(label = "CompletionPulse")
    val ringScale by infiniteTransition.animateFloat(
        initialValue = 0.94f,
        targetValue = 1.06f,
        animationSpec = infiniteRepeatable(
            animation = tween(1800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "CompletionRingScale"
    )

    val ctaLabel = when (celebration.type) {
        "work" -> if (celebration.autoStarted) "Continue to Break" else "Start Break"
        "break" -> if (celebration.autoStarted) "Continue Focus" else "Start Next Focus"
        else -> "Keep Going"
    }

    val centerIcon = when (celebration.type) {
        "work" -> Icons.Outlined.EmojiEvents
        "break" -> Icons.Outlined.LocalCafe
        else -> Icons.Outlined.Verified
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(CanvasBg)
            .padding(horizontal = 24.dp)
    ) {
        // Centerpiece Illustration + Typography (Perfect true center of the screen)
        Column(
            modifier = Modifier
                .align(Alignment.Center)
                .fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier.size(200.dp),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(180.dp)
                        .graphicsLayer {
                            scaleX = ringScale
                            scaleY = ringScale
                        }
                        .clip(CircleShape)
                        .background(PaleMint.copy(alpha = 0.55f))
                )
                Box(
                    modifier = Modifier
                        .size(128.dp)
                        .clip(CircleShape)
                        .background(SurfaceWhite)
                        .border(2.dp, CeladonFill, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = centerIcon,
                        contentDescription = null,
                        tint = OlivePrimary,
                        modifier = Modifier.size(56.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = celebration.title,
                fontSize = 28.sp,
                lineHeight = 34.sp,
                fontWeight = FontWeight.ExtraBold,
                letterSpacing = (-0.5).sp,
                color = InkDark,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = celebration.subtitle,
                fontSize = 14.sp,
                lineHeight = 20.sp,
                fontWeight = FontWeight.Medium,
                color = MossSecondary,
                textAlign = TextAlign.Center,
                modifier = Modifier.widthIn(max = 280.dp)
            )
        }

        // Bottom Action Footer (Pinned neatly at bottom)
        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 44.dp)
                .fillMaxWidth()
                .widthIn(max = 360.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
                    .shadow(
                        elevation = 10.dp,
                        shape = CircleShape,
                        ambientColor = InkDark.copy(alpha = 0.2f),
                        spotColor = InkDark.copy(alpha = 0.2f)
                    )
                    .clip(CircleShape)
                    .background(InkDark)
                    .clickable { onPrimaryAction() },
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = ctaLabel,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = SurfaceWhite
                )
                Spacer(modifier = Modifier.width(8.dp))
                Icon(
                    imageVector = Icons.AutoMirrored.Outlined.ArrowForward,
                    contentDescription = null,
                    tint = SurfaceWhite,
                    modifier = Modifier.size(16.dp)
                )
            }

            if (celebration.type == "work" || celebration.type == "break") {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(40.dp)
                        .clip(CircleShape)
                        .clickable { onDismiss() },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Return to Dashboard",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MossSecondary
                    )
                }
            }
        }
    }
}
