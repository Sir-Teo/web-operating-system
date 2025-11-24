import Kernel from './kernel/Kernel.js';
import WindowManager from './ui/WindowManager.js';
import { Desktop } from './ui/Desktop.js';
import { initializeRuntimes } from './system/runtime/index.ts';
import { Taskbar } from './ui/Taskbar.js';
import { StartMenu } from './ui/StartMenu.js';
import { WindowSnapping } from './ui/WindowSnapping.js';
import { LoginScreen } from './ui/LoginScreen.js';
import AppRegistry from './apps/AppRegistry.js';
import nextGenKernel from './NextGenKernel.js';
import './ui/CommandPalette.css';
import './ui/desktop.css';
import AIAssistant from './apps/ai-assistant/AIAssistant.js';
import Terminal from './apps/terminal/Terminal.js';
import FileManager from './apps/file-manager/FileManager.js';
import FileManagerV2 from './apps/file-manager/FileManagerV2.js';
import TextEditor from './apps/text-editor/TextEditor.js';
import CodeEditor from './apps/code-editor/CodeEditor.js';
import Browser from './apps/browser/Browser.js';
import CloudStorage from './apps/cloud-storage/CloudStorage.js';
import PackageManager from './apps/package-manager/PackageManager.js';
import PluginManager from './apps/plugin-manager/PluginManager.js';
import Settings from './apps/settings/Settings.js';
import SystemMonitor from './apps/system-monitor/SystemMonitor.js';
import DevTools from './apps/devtools/DevTools.js';
import UserManagerApp from './apps/user-manager/UserManagerApp.js';
import WordProcessor from './apps/word-processor/WordProcessor.js';
import Spreadsheet from './apps/spreadsheet/Spreadsheet.js';
import Presentation from './apps/presentation/Presentation.js';
import Paint from './apps/paint/Paint.js';
import TicTacToe from './apps/tic-tac-toe/TicTacToe.js';
import Snake from './apps/snake/Snake.js';
import Tetris from './apps/tetris/Tetris.js';
import Minesweeper from './apps/minesweeper/Minesweeper.js';
import AirplaneShooter from './apps/airplane-shooter/AirplaneShooter.js';
import Racing from './apps/racing/Racing.js';
import Calculator from './apps/calculator/Calculator.js';
import ImageViewer from './apps/image-viewer/ImageViewer.js';
import MusicPlayer from './apps/music-player/MusicPlayer.js';
import Calendar from './apps/calendar/Calendar.js';
import TaskManager from './apps/task-manager/TaskManager.js';
import CodeRunner from './apps/code-runner/CodeRunner.js';
import CodeRunnerEnhanced from './apps/code-runner/CodeRunnerEnhanced.js';
import LanguageManager from './apps/language-manager/LanguageManager.tsx';
import PolyglotPlayground from './apps/polyglot-playground/PolyglotPlayground.tsx';
import InteractiveNotebook from './apps/interactive-notebook/InteractiveNotebook.tsx';
import RuntimeDiagnostics from './apps/runtime-diagnostics/RuntimeDiagnostics.tsx';
import ScreenshotApp from './apps/screenshot/Screenshot.js';
import CollaborationHub from './apps/collaboration-hub/CollaborationHub.js';
import SecurityCenter from './apps/security-center/SecurityCenter.js';
import ImageEditor from './apps/image-editor/ImageEditor.js';
import CSVEditor from './apps/csv-editor/CSVEditor.js';
import PluginMarketplace from './apps/plugin-marketplace/PluginMarketplace.js';
import Email from './apps/email/Email.js';
import Notes from './apps/notes/Notes.js';
import VideoPlayer from './apps/video-player/VideoPlayer.js';
import Weather from './apps/weather/Weather.js';
import Maps from './apps/maps/Maps.js';
import Camera from './apps/camera/Camera.js';
import Chat from './apps/chat/Chat.js';
import Clock from './apps/clock/Clock.js';
import VoiceRecorder from './apps/voice-recorder/VoiceRecorder.js';
import ArchiveManager from './apps/archive-manager/ArchiveManager.js';
import PdfViewer from './apps/pdf-viewer/PdfViewer.js';
import Contacts from './apps/contacts/Contacts.js';
import ColorPicker from './apps/color-picker/ColorPicker.js';
import CharacterMap from './apps/character-map/CharacterMap.js';
import AdvancedImageEditor from './apps/AdvancedImageEditor.js';
import DataVisualization from './apps/DataVisualization.js';
import GitClient from './apps/GitClient.js';
import ScreenRecorder from './apps/ScreenRecorder.js';
import DatabaseManager from './apps/DatabaseManager.js';
import APITester from './apps/APITester.js';
import MarkdownEditor from './apps/MarkdownEditor.js';
import 'winbox/dist/css/winbox.min.css';
import './apps/code-editor/CodeEditor.css';
import './apps/browser/Browser.css';
import './apps/package-manager/PackageManager.css';
import './apps/settings/Settings.css';
import './apps/system-monitor/SystemMonitor.css';
import './apps/word-processor/WordProcessor.css';
import './apps/spreadsheet/Spreadsheet.css';
import './apps/presentation/Presentation.css';
import './apps/collaboration-hub/CollaborationHub.css';
import './apps/security-center/SecurityCenter.css';
import './apps/image-editor/ImageEditor.css';
import './apps/csv-editor/CSVEditor.css';
import './apps/email/Email.css';
import './apps/notes/Notes.css';
import './apps/video-player/VideoPlayer.css';
import './apps/weather/Weather.css';
import './apps/maps/Maps.css';
import './apps/camera/Camera.css';
import './apps/chat/Chat.css';

class WebOS {
  constructor() {
    this.kernel = Kernel;
    this.nextGenKernel = nextGenKernel;
    this.desktop = null;
    this.taskbar = null;
    this.startMenu = null;
    this.windowSnapping = null;
    this.loginScreen = null;
  }

  async boot() {
    console.log('Starting WebOS...');

    try {
      // Update boot message
      this.updateBootMessage('Initializing kernel...');

      // Boot the kernel
      await this.kernel.boot();

      this.updateBootMessage('Loading system applications...');

      // Register system applications
      this.registerApplications();

      this.updateBootMessage('Initializing language runtimes...');

      // Initialize multi-language runtime system
      initializeRuntimes();

      this.updateBootMessage('Initializing next-generation features...');

      // Initialize Next-Gen Kernel (AI, Distributed Computing, etc.)
      await this.nextGenKernel.initialize();

      this.updateBootMessage('Initializing user interface...');

      // Initialize UI components
      await this.initializeUI();

      this.updateBootMessage('Registering service worker...');

      // Register service worker
      await this.registerServiceWorker();

      // Hide boot screen and show login screen
      this.updateBootMessage('Starting desktop environment...');

      setTimeout(() => {
        this.showLoginScreen();
        console.log('WebOS boot complete!');
      }, 500);

    } catch (error) {
      console.error('Boot failed:', error);
      this.showBootError(error);
    }
  }

  registerApplications() {
    // Register AI Assistant
    AppRegistry.register({
      id: 'ai-assistant',
      name: 'AI Assistant',
      version: '1.0.0',
      icon: '🤖',
      type: 'web',
      permissions: ['network.http'],
      Component: AIAssistant
    });

    // Register Terminal
    AppRegistry.register({
      id: 'terminal',
      name: 'Terminal',
      version: '1.0.0',
      icon: '💻',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write'],
      Component: Terminal
    });

    // Register File Manager
    AppRegistry.register({
      id: 'file-manager',
      name: 'File Manager',
      version: '1.0.0',
      icon: '📁',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write'],
      Component: FileManager
    });

    // Register Advanced File Manager
    AppRegistry.register({
      id: 'file-manager-v2',
      name: 'File Explorer',
      version: '2.0.0',
      icon: '🗂️',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write'],
      Component: FileManagerV2
    });

    // Register Text Editor
    AppRegistry.register({
      id: 'text-editor',
      name: 'Text Editor',
      version: '1.0.0',
      icon: '📝',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write'],
      Component: TextEditor
    });

    // Register Code Editor
    AppRegistry.register({
      id: 'code-editor',
      name: 'Code Editor',
      version: '1.0.0',
      icon: '👨‍💻',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write'],
      Component: CodeEditor
    });

    // Register Web Browser
    AppRegistry.register({
      id: 'browser',
      name: 'Web Browser',
      version: '1.0.0',
      icon: '🌐',
      type: 'web',
      permissions: ['network.http'],
      Component: Browser
    });

    // Register Cloud Storage
    AppRegistry.register({
      id: 'cloud-storage',
      name: 'Cloud Storage',
      version: '1.0.0',
      icon: '☁️',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write', 'network.http'],
      Component: CloudStorage
    });

    // Register Package Manager
    AppRegistry.register({
      id: 'package-manager',
      name: 'Package Manager',
      version: '1.0.0',
      icon: '📦',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write', 'network.http'],
      Component: PackageManager
    });

    // Register Plugin Manager
    AppRegistry.register({
      id: 'plugin-manager',
      name: 'Plugin Manager',
      version: '1.0.0',
      icon: '🔌',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write', 'system.plugin'],
      Component: PluginManager
    });

    // Register Settings
    AppRegistry.register({
      id: 'settings',
      name: 'Settings',
      version: '2.0.0',
      icon: '⚙️',
      type: 'web',
      permissions: ['system.theme', 'system.user', 'system.plugin'],
      Component: Settings
    });

    // Register System Monitor
    AppRegistry.register({
      id: 'system-monitor',
      name: 'System Monitor',
      version: '1.0.0',
      icon: '📊',
      type: 'web',
      permissions: ['system.process', 'system.performance'],
      Component: SystemMonitor
    });

    // Register DevTools
    AppRegistry.register({
      id: 'devtools',
      name: 'DevTools',
      version: '1.0.0',
      icon: '🛠️',
      type: 'web',
      permissions: ['system.process', 'network.http'],
      Component: DevTools
    });

    // Register User Manager
    AppRegistry.register({
      id: 'user-manager',
      name: 'User Accounts',
      version: '1.0.0',
      icon: '👥',
      type: 'web',
      permissions: ['system.user'],
      Component: UserManagerApp
    });

    // Register Collaboration Hub
    AppRegistry.register({
      id: 'collaboration-hub',
      name: 'Collaboration Hub',
      version: '1.0.0',
      icon: '🤝',
      type: 'web',
      permissions: ['network.http', 'network.webrtc', 'filesystem.read', 'filesystem.write'],
      Component: CollaborationHub
    });

    // Register Security Center
    AppRegistry.register({
      id: 'security-center',
      name: 'Security Center',
      version: '1.0.0',
      icon: '🔒',
      type: 'web',
      permissions: ['system.security', 'filesystem.read', 'filesystem.write'],
      Component: SecurityCenter
    });

    // Register Image Editor
    AppRegistry.register({
      id: 'image-editor',
      name: 'Image Editor',
      version: '1.0.0',
      icon: '🎨',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write'],
      Component: ImageEditor
    });

    // Register CSV Editor
    AppRegistry.register({
      id: 'csv-editor',
      name: 'CSV Editor',
      version: '1.0.0',
      icon: '📊',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write'],
      Component: CSVEditor
    });

    // Register Plugin Marketplace
    AppRegistry.register({
      id: 'plugin-marketplace',
      name: 'Plugin Marketplace',
      version: '1.0.0',
      icon: '🧩',
      type: 'web',
      permissions: ['network.http', 'filesystem.read', 'filesystem.write'],
      Component: PluginMarketplace
    });

    // Register Paint
    AppRegistry.register({
      id: 'paint',
      name: 'Paint',
      version: '1.0.0',
      icon: '🎨',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write'],
      Component: Paint
    });

    // Register Word Processor
    AppRegistry.register({
      id: 'word-processor',
      name: 'Word Processor',
      version: '1.0.0',
      icon: '📄',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write'],
      Component: WordProcessor
    });

    // Register Spreadsheet
    AppRegistry.register({
      id: 'spreadsheet',
      name: 'Spreadsheet',
      version: '1.0.0',
      icon: '📊',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write'],
      Component: Spreadsheet
    });

    // Register Presentation
    AppRegistry.register({
      id: 'presentation',
      name: 'Presentation',
      version: '1.0.0',
      icon: '📽️',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write'],
      Component: Presentation
    });

    // Register Games
    AppRegistry.register({
      id: 'tic-tac-toe',
      name: 'Tic Tac Toe',
      version: '1.0.0',
      icon: '⭕',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write'],
      Component: TicTacToe
    });

    AppRegistry.register({
      id: 'snake',
      name: 'Snake',
      version: '1.0.0',
      icon: '🐍',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write'],
      Component: Snake
    });

    AppRegistry.register({
      id: 'tetris',
      name: 'Tetris',
      version: '1.0.0',
      icon: '🎮',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write'],
      Component: Tetris
    });

    AppRegistry.register({
      id: 'minesweeper',
      name: 'Minesweeper',
      version: '1.0.0',
      icon: '💣',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write'],
      Component: Minesweeper
    });

    AppRegistry.register({
      id: 'airplane-shooter',
      name: 'Sky Defender',
      version: '1.0.0',
      icon: '✈️',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write'],
      Component: AirplaneShooter
    });

    AppRegistry.register({
      id: 'racing',
      name: 'Speed Racer',
      version: '1.0.0',
      icon: '🏎️',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write'],
      Component: Racing
    });

    // Register Calculator
    AppRegistry.register({
      id: 'calculator',
      name: 'Calculator',
      version: '1.0.0',
      icon: '🔢',
      type: 'web',
      permissions: [],
      Component: Calculator
    });

    // Register Image Viewer
    AppRegistry.register({
      id: 'image-viewer',
      name: 'Image Viewer',
      version: '1.0.0',
      icon: '🖼️',
      type: 'web',
      permissions: ['filesystem.read'],
      Component: ImageViewer
    });

    // Register Music Player
    AppRegistry.register({
      id: 'music-player',
      name: 'Music Player',
      version: '1.0.0',
      icon: '🎵',
      type: 'web',
      permissions: ['filesystem.read'],
      Component: MusicPlayer
    });

    // Register Calendar
    AppRegistry.register({
      id: 'calendar',
      name: 'Calendar',
      version: '1.0.0',
      icon: '📅',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write'],
      Component: Calendar
    });

    // Register Task Manager
    AppRegistry.register({
      id: 'task-manager',
      name: 'Task Manager',
      version: '1.0.0',
      icon: '✅',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write'],
      Component: TaskManager
    });

    // Register Code Runner
    AppRegistry.register({
      id: 'code-runner',
      name: 'Code Runner',
      version: '1.0.0',
      icon: '▶️',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write'],
      Component: CodeRunner
    });

    // Register Enhanced Code Runner (Multi-Language)
    AppRegistry.register({
      id: 'code-runner-enhanced',
      name: 'Code Runner Pro',
      version: '2.0.0',
      icon: '🚀',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write', 'network.http'],
      Component: CodeRunnerEnhanced
    });

    // Register Language Manager
    AppRegistry.register({
      id: 'language-manager',
      name: 'Language Manager',
      version: '1.0.0',
      icon: '🌐',
      type: 'react',
      permissions: ['filesystem.read', 'filesystem.write', 'network.http'],
      Component: LanguageManager
    });

    // Register Polyglot Playground
    AppRegistry.register({
      id: 'polyglot-playground',
      name: 'Polyglot Playground',
      version: '1.0.0',
      icon: '🎮',
      type: 'react',
      permissions: ['filesystem.read', 'filesystem.write', 'network.http'],
      Component: PolyglotPlayground
    });

    // Register Interactive Notebook
    AppRegistry.register({
      id: 'interactive-notebook',
      name: 'Interactive Notebook',
      version: '1.0.0',
      icon: '📓',
      type: 'react',
      permissions: ['filesystem.read', 'filesystem.write', 'network.http'],
      Component: InteractiveNotebook
    });

    // Register Runtime Diagnostics
    AppRegistry.register({
      id: 'runtime-diagnostics',
      name: 'Runtime Diagnostics',
      version: '1.0.0',
      icon: '📊',
      type: 'react',
      permissions: ['system.diagnostics', 'system.performance'],
      Component: RuntimeDiagnostics
    });

    // Register Screenshot Tool
    AppRegistry.register({
      id: 'screenshot',
      name: 'Screenshot Tool',
      version: '1.0.0',
      icon: '📸',
      type: 'web',
      permissions: ['system.screencapture'],
      Component: ScreenshotApp
    });

    // Register Email Client
    AppRegistry.register({
      id: 'email',
      name: 'Email',
      version: '1.0.0',
      icon: '📧',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write'],
      Component: Email
    });

    // Register Notes
    AppRegistry.register({
      id: 'notes',
      name: 'Notes',
      version: '1.0.0',
      icon: '📝',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write'],
      Component: Notes
    });

    // Register Video Player
    AppRegistry.register({
      id: 'video-player',
      name: 'Video Player',
      version: '1.0.0',
      icon: '🎬',
      type: 'web',
      permissions: ['filesystem.read'],
      Component: VideoPlayer
    });

    // Register Weather
    AppRegistry.register({
      id: 'weather',
      name: 'Weather',
      version: '1.0.0',
      icon: '🌤️',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write'],
      Component: Weather
    });

    // Register Maps
    AppRegistry.register({
      id: 'maps',
      name: 'Maps',
      version: '1.0.0',
      icon: '🗺️',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write'],
      Component: Maps
    });

    // Register Camera
    AppRegistry.register({
      id: 'camera',
      name: 'Camera',
      version: '1.0.0',
      icon: '📷',
      type: 'web',
      permissions: ['system.screencapture', 'filesystem.read', 'filesystem.write'],
      Component: Camera
    });

    // Register Chat
    AppRegistry.register({
      id: 'chat',
      name: 'Chat',
      version: '1.0.0',
      icon: '💬',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write'],
      Component: Chat
    });

    // Register Clock
    AppRegistry.register({
      id: 'clock',
      name: 'Clock',
      version: '1.0.0',
      icon: '🕐',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write'],
      Component: Clock
    });

    // Register Voice Recorder
    AppRegistry.register({
      id: 'voice-recorder',
      name: 'Voice Recorder',
      version: '1.0.0',
      icon: '🎙️',
      type: 'web',
      permissions: ['system.screencapture', 'filesystem.read', 'filesystem.write'],
      Component: VoiceRecorder
    });

    // Register Archive Manager
    AppRegistry.register({
      id: 'archive-manager',
      name: 'Archive Manager',
      version: '1.0.0',
      icon: '📦',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write', 'filesystem.delete'],
      Component: ArchiveManager
    });

    // Register PDF Viewer
    AppRegistry.register({
      id: 'pdf-viewer',
      name: 'PDF Viewer',
      version: '1.0.0',
      icon: '📄',
      type: 'web',
      permissions: ['filesystem.read'],
      Component: PdfViewer
    });

    // Register Contacts
    AppRegistry.register({
      id: 'contacts',
      name: 'Contacts',
      version: '1.0.0',
      icon: '👥',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write'],
      Component: Contacts
    });

    // Register Color Picker
    AppRegistry.register({
      id: 'color-picker',
      name: 'Color Picker',
      version: '1.0.0',
      icon: '🎨',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write'],
      Component: ColorPicker
    });

    // Register Character Map
    AppRegistry.register({
      id: 'character-map',
      name: 'Character Map',
      version: '1.0.0',
      icon: '🔤',
      type: 'web',
      permissions: [],
      Component: CharacterMap
    });

    // Register Advanced Image Editor
    AppRegistry.register({
      id: 'advanced-image-editor',
      name: 'Advanced Image Editor',
      version: '1.0.0',
      icon: '🎨',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write'],
      Component: AdvancedImageEditor
    });

    // Register Data Visualization
    AppRegistry.register({
      id: 'data-visualization',
      name: 'Data Visualization',
      version: '1.0.0',
      icon: '📊',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write'],
      Component: DataVisualization
    });

    // Register Git Client
    AppRegistry.register({
      id: 'git-client',
      name: 'Git Client',
      version: '1.0.0',
      icon: '🌿',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write'],
      Component: GitClient
    });

    // Register Screen Recorder
    AppRegistry.register({
      id: 'screen-recorder',
      name: 'Screen Recorder',
      version: '1.0.0',
      icon: '🎥',
      type: 'web',
      permissions: ['system.screencapture', 'filesystem.read', 'filesystem.write'],
      Component: ScreenRecorder
    });

    // Register Database Manager
    AppRegistry.register({
      id: 'database-manager',
      name: 'Database Manager',
      version: '1.0.0',
      icon: '🗄️',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write'],
      Component: DatabaseManager
    });

    // Register API Tester
    AppRegistry.register({
      id: 'api-tester',
      name: 'API Tester',
      version: '1.0.0',
      icon: '🌐',
      type: 'web',
      permissions: ['network.http', 'filesystem.read', 'filesystem.write'],
      Component: APITester
    });

    // Register Markdown Editor
    AppRegistry.register({
      id: 'markdown-editor',
      name: 'Markdown Editor',
      version: '1.0.0',
      icon: '📝',
      type: 'web',
      permissions: ['filesystem.read', 'filesystem.write'],
      Component: MarkdownEditor
    });
  }

  async initializeUI() {
    // Create Desktop
    this.desktop = new Desktop(this.kernel);
    await this.desktop.init();

    // Create Taskbar
    this.taskbar = new Taskbar(this.kernel);
    this.taskbar.init();

    // Create Start Menu
    this.startMenu = new StartMenu(this.kernel);
    await this.startMenu.init();

    // Initialize Window Snapping
    this.windowSnapping = new WindowSnapping(WindowManager);

    // Forward window events to the global window object for taskbar
    WindowManager.addEventListener('window-created', (e) => {
      window.dispatchEvent(new CustomEvent('window-created', { detail: e.detail }));
    });

    WindowManager.addEventListener('window-closed', (e) => {
      window.dispatchEvent(new CustomEvent('window-closed', { detail: e.detail }));
    });

    // Initialize Phase 16: Advanced Desktop Features
    await this.initializePhase16Features();
  }

  async initializePhase16Features() {
    // Initialize Widget Manager
    const { initWidgetManager } = await import('./system/WidgetManager.js');
    this.widgetManager = initWidgetManager(this.kernel);

    // Register widget types
    const { ClockWidget } = await import('./widgets/ClockWidget.js');
    const { WeatherWidget } = await import('./widgets/WeatherWidget.js');
    const { CalendarWidget } = await import('./widgets/CalendarWidget.js');
    const { NotesWidget } = await import('./widgets/NotesWidget.js');

    this.widgetManager.registerWidgetType('clock', ClockWidget);
    this.widgetManager.registerWidgetType('weather', WeatherWidget);
    this.widgetManager.registerWidgetType('calendar', CalendarWidget);
    this.widgetManager.registerWidgetType('notes', NotesWidget);

    // Initialize Workspace Manager
    const { initWorkspaceManager } = await import('./system/WorkspaceManager.js');
    this.workspaceManager = initWorkspaceManager(this.kernel);

    // Initialize Workspace Switcher in Taskbar
    const WorkspaceSwitcher = (await import('./ui/WorkspaceSwitcher.js')).default;
    const workspaceSwitcherContainer = document.getElementById('workspace-switcher-container');
    if (workspaceSwitcherContainer) {
      new WorkspaceSwitcher(this.kernel, workspaceSwitcherContainer);
    }

    // Initialize Global Search
    const { initGlobalSearch } = await import('./system/GlobalSearch.js');
    this.globalSearch = initGlobalSearch(this.kernel);

    // Initialize Quick Actions Panel
    const { initQuickActionsPanel } = await import('./system/QuickActionsPanel.js');
    this.quickActionsPanel = initQuickActionsPanel(this.kernel);

    // Initialize Screen Capture
    const { initScreenCapture } = await import('./system/ScreenCapture.js');
    this.screenCapture = initScreenCapture(this.kernel);

    // Initialize Notification Center
    const { initNotificationCenter } = await import('./system/NotificationCenter.js');
    this.notificationCenter = initNotificationCenter(this.kernel);
    this.kernel.notificationCenter = this.notificationCenter;

    // Initialize Shortcuts Manager
    const { initShortcutsManager } = await import('./system/ShortcutsManager.js');
    this.shortcutsManager = initShortcutsManager(this.kernel);

    console.log('Phase 16 features initialized successfully!');
  }

  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;

    if (isDev) {
      // Ensure any previously registered service workers are removed during development
      const registrations = await navigator.serviceWorker.getRegistrations();
      registrations.forEach((registration) => registration.unregister());
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered:', registration);
    } catch (error) {
      console.warn('Service Worker registration failed:', error);
    }
  }

  updateBootMessage(message) {
    const bootMessage = document.querySelector('.boot-message');
    if (bootMessage) {
      bootMessage.textContent = message;
    }
  }

  showLoginScreen() {
    const bootScreen = document.getElementById('boot-screen');

    if (bootScreen) {
      bootScreen.style.opacity = '0';
      bootScreen.style.transition = 'opacity 0.5s';
      setTimeout(() => {
        bootScreen.style.display = 'none';
      }, 500);
    }

    // Create and show login screen
    this.loginScreen = new LoginScreen(this.kernel);
    this.loginScreen.show();

    // Listen for successful login
    window.addEventListener('login-success', () => {
      this.showDesktop();
    }, { once: true });
  }

  showDesktop() {
    const desktop = document.getElementById('desktop');
    const taskbar = document.getElementById('taskbar');

    // Hide login screen if it exists
    if (this.loginScreen) {
      this.loginScreen.hide();
    }

    if (desktop) {
      desktop.style.display = 'block';
      desktop.style.opacity = '0';
      setTimeout(() => {
        desktop.style.transition = 'opacity 0.5s';
        desktop.style.opacity = '1';
      }, 100);
    }

    if (taskbar) {
      taskbar.style.display = 'flex';
      taskbar.style.opacity = '0';
      setTimeout(() => {
        taskbar.style.transition = 'opacity 0.5s';
        taskbar.style.opacity = '1';
      }, 100);
    }
  }

  showBootError(error) {
    const bootScreen = document.getElementById('boot-screen');
    if (bootScreen) {
      bootScreen.innerHTML = `
        <div class="boot-logo">
          <h1 style="color:#ff4444;">Boot Error</h1>
          <p style="margin-top:20px;max-width:600px;">${error.message}</p>
          <p style="margin-top:10px;opacity:0.7;">Please check the console for more details.</p>
          <button onclick="location.reload()" style="margin-top:30px;padding:10px 20px;font-size:1rem;cursor:pointer;border:2px solid white;background:transparent;color:white;border-radius:5px;">
            Retry Boot
          </button>
        </div>
      `;
    }
  }
}

// Start WebOS when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const webos = new WebOS();
    window.webos = webos; // Expose globally
    window.nextGenKernel = nextGenKernel; // Expose next-gen features globally
    webos.boot();
  });
} else {
  const webos = new WebOS();
  window.webos = webos; // Expose globally
  window.nextGenKernel = nextGenKernel; // Expose next-gen features globally
  webos.boot();
}
