import Kernel from './kernel/Kernel.js';
import WindowManager from './ui/WindowManager.js';
import { Desktop } from './ui/Desktop.js';
import { Taskbar } from './ui/Taskbar.js';
import { StartMenu } from './ui/StartMenu.js';
import { WindowSnapping } from './ui/WindowSnapping.js';
import AppRegistry from './apps/AppRegistry.js';
import Terminal from './apps/terminal/Terminal.js';
import FileManager from './apps/file-manager/FileManager.js';
import FileManagerV2 from './apps/file-manager/FileManagerV2.js';
import TextEditor from './apps/text-editor/TextEditor.js';
import CodeEditor from './apps/code-editor/CodeEditor.js';
import Browser from './apps/browser/Browser.js';
import PackageManager from './apps/package-manager/PackageManager.js';
import Settings from './apps/settings/Settings.js';
import SystemMonitor from './apps/system-monitor/SystemMonitor.js';
import 'winbox/dist/css/winbox.min.css';
import './apps/code-editor/CodeEditor.css';
import './apps/browser/Browser.css';
import './apps/package-manager/PackageManager.css';
import './apps/settings/Settings.css';
import './apps/system-monitor/SystemMonitor.css';

class WebOS {
  constructor() {
    this.kernel = Kernel;
    this.desktop = null;
    this.taskbar = null;
    this.startMenu = null;
    this.windowSnapping = null;
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

      this.updateBootMessage('Initializing user interface...');

      // Initialize UI components
      await this.initializeUI();

      this.updateBootMessage('Registering service worker...');

      // Register service worker
      await this.registerServiceWorker();

      // Hide boot screen and show desktop
      this.updateBootMessage('Starting desktop environment...');

      setTimeout(() => {
        this.showDesktop();
        console.log('WebOS boot complete!');
      }, 500);

    } catch (error) {
      console.error('Boot failed:', error);
      this.showBootError(error);
    }
  }

  registerApplications() {
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
  }

  async initializeUI() {
    // Create Desktop
    this.desktop = new Desktop(this.kernel);
    await this.desktop.init();

    // Create Taskbar
    this.taskbar = new Taskbar();
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

  showDesktop() {
    const bootScreen = document.getElementById('boot-screen');
    const desktop = document.getElementById('desktop');
    const taskbar = document.getElementById('taskbar');

    if (bootScreen) {
      bootScreen.style.opacity = '0';
      bootScreen.style.transition = 'opacity 0.5s';
      setTimeout(() => {
        bootScreen.style.display = 'none';
      }, 500);
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
    webos.boot();
  });
} else {
  const webos = new WebOS();
  webos.boot();
}
