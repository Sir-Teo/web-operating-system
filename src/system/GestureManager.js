/**
 * GestureManager - Touch Gesture Recognition
 *
 * Recognizes and handles touch gestures including:
 * - Tap (single and double)
 * - Long press
 * - Swipe (up, down, left, right)
 * - Pinch (zoom in/out)
 * - Pan/Drag
 */

export class GestureManager {
  constructor(element) {
    this.element = element;
    this.handlers = new Map();
    this.touchStart = null;
    this.touchCurrent = null;
    this.lastTap = 0;
    this.longPressTimer = null;
    this.isPanning = false;
    this.pinchDistance = 0;

    // Configuration
    this.config = {
      tapDelay: 300, // Max delay for tap
      doubleTapDelay: 300, // Max delay between taps for double tap
      longPressDelay: 500, // Delay for long press
      swipeThreshold: 50, // Min distance for swipe
      pinchThreshold: 10 // Min distance change for pinch
    };

    this.init();
  }

  /**
   * Initialize event listeners
   */
  init() {
    if (!this.element) return;

    // Touch events
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this));

    // Prevent default context menu on long press
    this.element.addEventListener('contextmenu', (e) => {
      if (this.touchStart) {
        e.preventDefault();
      }
    });
  }

  /**
   * Handle touch start
   */
  handleTouchStart(e) {
    const touches = e.touches;

    if (touches.length === 1) {
      // Single touch - potential tap, long press, or swipe
      this.touchStart = {
        x: touches[0].clientX,
        y: touches[0].clientY,
        time: Date.now()
      };
      this.touchCurrent = { ...this.touchStart };

      // Start long press timer
      this.longPressTimer = setTimeout(() => {
        this.emit('longpress', {
          x: this.touchStart.x,
          y: this.touchStart.y,
          target: e.target
        });
        this.touchStart = null; // Cancel other gestures
      }, this.config.longPressDelay);

    } else if (touches.length === 2) {
      // Two fingers - pinch gesture
      this.clearLongPress();
      const distance = this.getDistance(touches[0], touches[1]);
      this.pinchDistance = distance;

      this.emit('pinchstart', {
        distance,
        touches: Array.from(touches).map(t => ({ x: t.clientX, y: t.clientY }))
      });
    }
  }

  /**
   * Handle touch move
   */
  handleTouchMove(e) {
    const touches = e.touches;

    if (touches.length === 1 && this.touchStart) {
      // Single touch movement
      this.touchCurrent = {
        x: touches[0].clientX,
        y: touches[0].clientY,
        time: Date.now()
      };

      const deltaX = this.touchCurrent.x - this.touchStart.x;
      const deltaY = this.touchCurrent.y - this.touchStart.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // If moved significantly, it's not a tap
      if (distance > 10) {
        this.clearLongPress();

        if (!this.isPanning) {
          this.isPanning = true;
          this.emit('panstart', {
            x: this.touchStart.x,
            y: this.touchStart.y,
            target: e.target
          });
        }

        this.emit('panmove', {
          x: this.touchCurrent.x,
          y: this.touchCurrent.y,
          deltaX,
          deltaY,
          target: e.target
        });
      }

    } else if (touches.length === 2 && this.pinchDistance > 0) {
      // Pinch gesture
      const distance = this.getDistance(touches[0], touches[1]);
      const delta = distance - this.pinchDistance;

      if (Math.abs(delta) > this.config.pinchThreshold) {
        this.emit('pinchmove', {
          distance,
          delta,
          scale: distance / this.pinchDistance,
          touches: Array.from(touches).map(t => ({ x: t.clientX, y: t.clientY }))
        });
      }

      // Prevent default to avoid zooming
      e.preventDefault();
    }
  }

  /**
   * Handle touch end
   */
  handleTouchEnd(e) {
    this.clearLongPress();

    if (this.isPanning) {
      // End pan
      this.isPanning = false;
      this.emit('panend', {
        x: this.touchCurrent.x,
        y: this.touchCurrent.y,
        target: e.target
      });
      this.touchStart = null;
      return;
    }

    if (this.pinchDistance > 0) {
      // End pinch
      this.emit('pinchend', {
        distance: this.pinchDistance
      });
      this.pinchDistance = 0;
      return;
    }

    if (!this.touchStart) return;

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
      time: Date.now()
    };

    const deltaX = touchEnd.x - this.touchStart.x;
    const deltaY = touchEnd.y - this.touchStart.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = touchEnd.time - this.touchStart.time;

    // Check for swipe
    if (distance > this.config.swipeThreshold && duration < 500) {
      const direction = this.getSwipeDirection(deltaX, deltaY);
      this.emit('swipe', {
        direction,
        distance,
        deltaX,
        deltaY,
        velocity: distance / duration,
        target: e.target
      });
      this.emit(`swipe${direction}`, {
        distance,
        deltaX,
        deltaY,
        target: e.target
      });
    }
    // Check for tap
    else if (distance < 10 && duration < this.config.tapDelay) {
      const now = Date.now();

      // Check for double tap
      if (now - this.lastTap < this.config.doubleTapDelay) {
        this.emit('doubletap', {
          x: touchEnd.x,
          y: touchEnd.y,
          target: e.target
        });
        this.lastTap = 0;
      } else {
        this.emit('tap', {
          x: touchEnd.x,
          y: touchEnd.y,
          target: e.target
        });
        this.lastTap = now;
      }
    }

    this.touchStart = null;
    this.touchCurrent = null;
  }

  /**
   * Handle touch cancel
   */
  handleTouchCancel(e) {
    this.clearLongPress();
    this.touchStart = null;
    this.touchCurrent = null;
    this.isPanning = false;
    this.pinchDistance = 0;
  }

  /**
   * Get swipe direction
   */
  getSwipeDirection(deltaX, deltaY) {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > absY) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }

  /**
   * Get distance between two touch points
   */
  getDistance(touch1, touch2) {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Clear long press timer
   */
  clearLongPress() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  /**
   * Register event handler
   */
  on(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event).add(handler);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  /**
   * Unregister event handler
   */
  off(event, handler) {
    if (this.handlers.has(event)) {
      this.handlers.get(event).delete(handler);
    }
  }

  /**
   * Emit event
   */
  emit(event, data) {
    if (this.handlers.has(event)) {
      this.handlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in gesture handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Destroy gesture manager
   */
  destroy() {
    this.clearLongPress();
    this.handlers.clear();
    this.touchStart = null;
    this.touchCurrent = null;
  }
}

/**
 * Create gesture manager for an element
 */
export function createGestureManager(element) {
  return new GestureManager(element);
}

export default GestureManager;
