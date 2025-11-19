/**
 * Window Snapping System
 * Provides window snapping to screen edges and corners
 */

export class WindowSnapping {
  constructor(windowManager) {
    this.windowManager = windowManager;
    this.snapZones = this.initializeSnapZones();
    this.setupKeyboardShortcuts();
  }

  initializeSnapZones() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight - 50; // Account for taskbar

    return {
      left: {
        x: 0,
        y: 0,
        width: Math.floor(screenWidth / 2),
        height: screenHeight
      },
      right: {
        x: Math.floor(screenWidth / 2),
        y: 0,
        width: Math.floor(screenWidth / 2),
        height: screenHeight
      },
      topLeft: {
        x: 0,
        y: 0,
        width: Math.floor(screenWidth / 2),
        height: Math.floor(screenHeight / 2)
      },
      topRight: {
        x: Math.floor(screenWidth / 2),
        y: 0,
        width: Math.floor(screenWidth / 2),
        height: Math.floor(screenHeight / 2)
      },
      bottomLeft: {
        x: 0,
        y: Math.floor(screenHeight / 2),
        width: Math.floor(screenWidth / 2),
        height: Math.floor(screenHeight / 2)
      },
      bottomRight: {
        x: Math.floor(screenWidth / 2),
        y: Math.floor(screenHeight / 2),
        width: Math.floor(screenWidth / 2),
        height: Math.floor(screenHeight / 2)
      },
      maximize: {
        x: 0,
        y: 0,
        width: screenWidth,
        height: screenHeight
      }
    };
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Windows key is not accessible, use Ctrl+Alt as alternative
      const modifier = e.ctrlKey && e.altKey;

      if (!modifier) return;

      const activeWindow = this.windowManager.activeWindow;
      if (!activeWindow) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          this.snapWindow(activeWindow, 'left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.snapWindow(activeWindow, 'right');
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.snapWindow(activeWindow, 'maximize');
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.minimizeWindow(activeWindow);
          break;
      }
    });

    // Update snap zones on window resize
    window.addEventListener('resize', () => {
      this.snapZones = this.initializeSnapZones();
    });
  }

  snapWindow(windowId, zone) {
    const windowData = this.windowManager.getWindow(windowId);
    if (!windowData) return;

    const snapZone = this.snapZones[zone];
    if (!snapZone) return;

    const { winbox } = windowData;

    // Store original size for un-maximize
    if (zone === 'maximize') {
      if (!windowData.originalSize) {
        windowData.originalSize = {
          x: winbox.x,
          y: winbox.y,
          width: winbox.width,
          height: winbox.height
        };
      }
    }

    // Apply snap
    winbox.resize(snapZone.width, snapZone.height);
    winbox.move(snapZone.x, snapZone.y);

    // Add snapped class for visual feedback
    winbox.addClass('snapped');
    setTimeout(() => winbox.removeClass('snapped'), 300);
  }

  minimizeWindow(windowId) {
    this.windowManager.minimizeWindow(windowId);
  }

  restoreWindow(windowId) {
    const windowData = this.windowManager.getWindow(windowId);
    if (!windowData || !windowData.originalSize) return;

    const { winbox, originalSize } = windowData;

    winbox.resize(originalSize.width, originalSize.height);
    winbox.move(originalSize.x, originalSize.y);

    delete windowData.originalSize;
  }

  // Get snap zone based on window position (for drag-to-snap)
  getSnapZoneAtPosition(x, y) {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight - 50;
    const snapThreshold = 20;

    // Top edge
    if (y < snapThreshold) {
      if (x < screenWidth / 3) return 'topLeft';
      if (x > (2 * screenWidth) / 3) return 'topRight';
      return 'maximize';
    }

    // Bottom edge
    if (y > screenHeight - snapThreshold) {
      if (x < screenWidth / 3) return 'bottomLeft';
      if (x > (2 * screenWidth) / 3) return 'bottomRight';
      return null;
    }

    // Left edge
    if (x < snapThreshold) {
      return 'left';
    }

    // Right edge
    if (x > screenWidth - snapThreshold) {
      return 'right';
    }

    return null;
  }

  // Show snap preview overlay
  showSnapPreview(zone) {
    this.hideSnapPreview();

    if (!zone) return;

    const snapZone = this.snapZones[zone];
    if (!snapZone) return;

    const overlay = document.createElement('div');
    overlay.id = 'snap-preview';
    overlay.style.cssText = `
      position: fixed;
      left: ${snapZone.x}px;
      top: ${snapZone.y}px;
      width: ${snapZone.width}px;
      height: ${snapZone.height}px;
      background: rgba(102, 126, 234, 0.3);
      border: 2px solid #667eea;
      z-index: 9999;
      pointer-events: none;
      transition: all 0.1s ease;
    `;

    document.body.appendChild(overlay);
  }

  hideSnapPreview() {
    const existing = document.getElementById('snap-preview');
    if (existing) {
      existing.remove();
    }
  }
}
