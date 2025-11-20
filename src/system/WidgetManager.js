/**
 * WidgetManager - Manages desktop widgets
 * Provides framework for creating, positioning, and managing desktop widgets
 */
export class WidgetManager {
  constructor(kernel) {
    this.kernel = kernel;
    this.widgets = new Map();
    this.widgetContainer = null;
    this.nextWidgetId = 1;
    this.draggedWidget = null;

    this._init();
  }

  _init() {
    // Create widget container on desktop
    this.widgetContainer = document.createElement('div');
    this.widgetContainer.id = 'widgets-container';
    this.widgetContainer.className = 'widgets-container';

    const desktop = document.getElementById('desktop');
    if (desktop) {
      desktop.appendChild(this.widgetContainer);
    }

    // Load saved widgets from config
    this._loadWidgets();
  }

  /**
   * Register a new widget type
   * @param {string} type - Widget type identifier
   * @param {Function} widgetClass - Widget class constructor
   */
  registerWidgetType(type, widgetClass) {
    if (!this.widgetTypes) {
      this.widgetTypes = new Map();
    }
    this.widgetTypes.set(type, widgetClass);
  }

  /**
   * Create a new widget
   * @param {string} type - Widget type
   * @param {Object} options - Widget options (position, size, config)
   * @returns {string} Widget ID
   */
  async createWidget(type, options = {}) {
    const widgetId = `widget-${this.nextWidgetId++}`;

    // Create widget element
    const widgetElement = document.createElement('div');
    widgetElement.id = widgetId;
    widgetElement.className = 'desktop-widget';
    widgetElement.dataset.type = type;

    // Set position
    const position = options.position || this._findEmptySpot();
    widgetElement.style.left = `${position.x}px`;
    widgetElement.style.top = `${position.y}px`;

    // Set size if provided
    if (options.size) {
      widgetElement.style.width = `${options.size.width}px`;
      widgetElement.style.height = `${options.size.height}px`;
    }

    // Create widget header
    const header = document.createElement('div');
    header.className = 'widget-header';
    header.innerHTML = `
      <span class="widget-title">${options.title || type}</span>
      <div class="widget-actions">
        <button class="widget-action" data-action="settings" title="Settings">⚙️</button>
        <button class="widget-action" data-action="close" title="Close">✕</button>
      </div>
    `;

    // Create widget content container
    const content = document.createElement('div');
    content.className = 'widget-content';

    widgetElement.appendChild(header);
    widgetElement.appendChild(content);
    this.widgetContainer.appendChild(widgetElement);

    // Make widget draggable
    this._makeWidgetDraggable(widgetElement, header);

    // Setup widget actions
    this._setupWidgetActions(widgetElement);

    // Store widget info
    const widgetInfo = {
      id: widgetId,
      type,
      element: widgetElement,
      contentElement: content,
      options,
      instance: null
    };

    this.widgets.set(widgetId, widgetInfo);

    // Initialize widget instance if type is registered
    if (this.widgetTypes && this.widgetTypes.has(type)) {
      const WidgetClass = this.widgetTypes.get(type);
      const instance = new WidgetClass(this.kernel, content, options.config || {});
      widgetInfo.instance = instance;

      if (instance.init) {
        await instance.init();
      }
    }

    // Save widgets state
    this._saveWidgets();

    return widgetId;
  }

  /**
   * Remove a widget
   * @param {string} widgetId - Widget ID to remove
   */
  removeWidget(widgetId) {
    const widget = this.widgets.get(widgetId);
    if (!widget) return;

    // Cleanup widget instance
    if (widget.instance && widget.instance.destroy) {
      widget.instance.destroy();
    }

    // Remove element
    widget.element.remove();
    this.widgets.delete(widgetId);

    // Save state
    this._saveWidgets();
  }

  /**
   * Get widget by ID
   * @param {string} widgetId
   * @returns {Object} Widget info
   */
  getWidget(widgetId) {
    return this.widgets.get(widgetId);
  }

  /**
   * List all widgets
   * @returns {Array} Array of widget info
   */
  listWidgets() {
    return Array.from(this.widgets.values());
  }

  /**
   * Make widget draggable
   */
  _makeWidgetDraggable(element, handle) {
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    handle.style.cursor = 'move';

    handle.addEventListener('mousedown', (e) => {
      isDragging = true;
      this.draggedWidget = element;

      const rect = element.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;

      element.style.zIndex = this._getTopZIndex() + 1;
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging || this.draggedWidget !== element) return;

      const x = e.clientX - offsetX;
      const y = e.clientY - offsetY;

      // Keep widget within screen bounds
      const maxX = window.innerWidth - element.offsetWidth;
      const maxY = window.innerHeight - element.offsetHeight - 50; // Account for taskbar

      element.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
      element.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
    });

    document.addEventListener('mouseup', () => {
      if (isDragging && this.draggedWidget === element) {
        isDragging = false;
        this.draggedWidget = null;
        this._saveWidgets();
      }
    });
  }

  /**
   * Setup widget action buttons
   */
  _setupWidgetActions(element) {
    const actions = element.querySelectorAll('.widget-action');

    actions.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = button.dataset.action;
        const widgetId = element.id;

        switch (action) {
          case 'close':
            this.removeWidget(widgetId);
            break;
          case 'settings':
            this._showWidgetSettings(widgetId);
            break;
        }
      });
    });
  }

  /**
   * Show widget settings
   */
  _showWidgetSettings(widgetId) {
    const widget = this.widgets.get(widgetId);
    if (!widget) return;

    // If widget has custom settings, show them
    if (widget.instance && widget.instance.showSettings) {
      widget.instance.showSettings();
    } else {
      // Show generic settings
      alert('Widget settings not available');
    }
  }

  /**
   * Find empty spot for new widget
   */
  _findEmptySpot() {
    const gridSize = 20;
    const startX = gridSize;
    const startY = gridSize;

    // Simple algorithm: place widgets in a cascade pattern
    const offset = (this.widgets.size * 30) % 200;

    return {
      x: startX + offset,
      y: startY + offset
    };
  }

  /**
   * Get highest z-index among widgets
   */
  _getTopZIndex() {
    let maxZ = 1000;
    this.widgets.forEach(widget => {
      const z = parseInt(widget.element.style.zIndex || 1000);
      if (z > maxZ) maxZ = z;
    });
    return maxZ;
  }

  /**
   * Save widgets state to storage
   */
  async _saveWidgets() {
    const widgetsState = [];

    this.widgets.forEach(widget => {
      const rect = widget.element.getBoundingClientRect();
      widgetsState.push({
        type: widget.type,
        position: {
          x: parseInt(widget.element.style.left),
          y: parseInt(widget.element.style.top)
        },
        size: {
          width: rect.width,
          height: rect.height
        },
        config: widget.options.config || {}
      });
    });

    try {
      await this.kernel.fs.writeFile(
        '/home/.config/widgets.json',
        JSON.stringify(widgetsState, null, 2)
      );
    } catch (error) {
      console.warn('Failed to save widgets state:', error);
    }
  }

  /**
   * Load widgets from storage
   */
  async _loadWidgets() {
    try {
      const data = await this.kernel.fs.readFile('/home/.config/widgets.json');
      const widgetsState = JSON.parse(data);

      for (const widgetConfig of widgetsState) {
        await this.createWidget(widgetConfig.type, widgetConfig);
      }
    } catch (error) {
      // No saved widgets or error reading - that's ok
      console.log('No saved widgets to load');
    }
  }

  /**
   * Clear all widgets
   */
  clearAllWidgets() {
    const widgetIds = Array.from(this.widgets.keys());
    widgetIds.forEach(id => this.removeWidget(id));
  }
}

// Export singleton
let widgetManagerInstance = null;

export function initWidgetManager(kernel) {
  if (!widgetManagerInstance) {
    widgetManagerInstance = new WidgetManager(kernel);
  }
  return widgetManagerInstance;
}

export function getWidgetManager() {
  return widgetManagerInstance;
}
