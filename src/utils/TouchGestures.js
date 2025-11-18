/**
 * Touch Gesture Handler
 * Handles touch gestures like swipe, pinch, tap, long press, etc.
 */

export class TouchGestures {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      swipeThreshold: options.swipeThreshold || 50,
      longPressDelay: options.longPressDelay || 500,
      doubleTapDelay: options.doubleTapDelay || 300,
      pinchThreshold: options.pinchThreshold || 0.1,
      ...options
    };

    this.handlers = {
      swipe: [],
      tap: [],
      doubleTap: [],
      longPress: [],
      pinch: [],
      pan: []
    };

    this.state = {
      touching: false,
      startX: 0,
      startY: 0,
      lastTapTime: 0,
      longPressTimer: null,
      initialDistance: 0
    };

    this.setupListeners();
  }

  /**
   * Setup touch event listeners
   */
  setupListeners() {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });
  }

  /**
   * Handle touch start
   * @param {TouchEvent} e - Touch event
   */
  handleTouchStart(e) {
    const touch = e.touches[0];
    this.state.touching = true;
    this.state.startX = touch.clientX;
    this.state.startY = touch.clientY;

    // Check for multi-touch (pinch)
    if (e.touches.length === 2) {
      this.state.initialDistance = this.getDistance(e.touches[0], e.touches[1]);
    }

    // Setup long press timer
    this.state.longPressTimer = setTimeout(() => {
      this.trigger('longPress', {
        x: touch.clientX,
        y: touch.clientY,
        target: e.target
      });
    }, this.options.longPressDelay);
  }

  /**
   * Handle touch move
   * @param {TouchEvent} e - Touch event
   */
  handleTouchMove(e) {
    if (!this.state.touching) return;

    // Clear long press timer on move
    clearTimeout(this.state.longPressTimer);

    const touch = e.touches[0];

    // Handle pinch gesture
    if (e.touches.length === 2) {
      e.preventDefault();
      const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / this.state.initialDistance;

      if (Math.abs(scale - 1) > this.options.pinchThreshold) {
        this.trigger('pinch', {
          scale,
          center: this.getCenter(e.touches[0], e.touches[1])
        });
      }
      return;
    }

    // Handle pan gesture
    const deltaX = touch.clientX - this.state.startX;
    const deltaY = touch.clientY - this.state.startY;

    this.trigger('pan', {
      deltaX,
      deltaY,
      x: touch.clientX,
      y: touch.clientY
    });
  }

  /**
   * Handle touch end
   * @param {TouchEvent} e - Touch event
   */
  handleTouchEnd(e) {
    if (!this.state.touching) return;

    clearTimeout(this.state.longPressTimer);

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - this.state.startX;
    const deltaY = touch.clientY - this.state.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Check for swipe
    if (distance > this.options.swipeThreshold) {
      const direction = this.getSwipeDirection(deltaX, deltaY);
      this.trigger('swipe', {
        direction,
        deltaX,
        deltaY,
        distance
      });
    }
    // Check for tap/double tap
    else if (distance < 10) {
      const now = Date.now();
      const timeSinceLastTap = now - this.state.lastTapTime;

      if (timeSinceLastTap < this.options.doubleTapDelay) {
        this.trigger('doubleTap', {
          x: touch.clientX,
          y: touch.clientY,
          target: e.target
        });
        this.state.lastTapTime = 0;
      } else {
        this.trigger('tap', {
          x: touch.clientX,
          y: touch.clientY,
          target: e.target
        });
        this.state.lastTapTime = now;
      }
    }

    this.state.touching = false;
  }

  /**
   * Handle touch cancel
   */
  handleTouchCancel() {
    clearTimeout(this.state.longPressTimer);
    this.state.touching = false;
  }

  /**
   * Get swipe direction
   * @param {number} deltaX - X delta
   * @param {number} deltaY - Y delta
   * @returns {string} Direction ('up', 'down', 'left', 'right')
   */
  getSwipeDirection(deltaX, deltaY) {
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX > absDeltaY) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }

  /**
   * Get distance between two touches
   * @param {Touch} touch1 - First touch
   * @param {Touch} touch2 - Second touch
   * @returns {number} Distance
   */
  getDistance(touch1, touch2) {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get center point between two touches
   * @param {Touch} touch1 - First touch
   * @param {Touch} touch2 - Second touch
   * @returns {Object} Center point {x, y}
   */
  getCenter(touch1, touch2) {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  }

  /**
   * Register gesture handler
   * @param {string} gesture - Gesture type
   * @param {Function} handler - Handler function
   * @returns {Function} Cleanup function
   */
  on(gesture, handler) {
    if (!this.handlers[gesture]) {
      console.warn(`Unknown gesture: ${gesture}`);
      return () => {};
    }

    this.handlers[gesture].push(handler);

    return () => {
      const index = this.handlers[gesture].indexOf(handler);
      if (index > -1) {
        this.handlers[gesture].splice(index, 1);
      }
    };
  }

  /**
   * Trigger gesture handlers
   * @param {string} gesture - Gesture type
   * @param {Object} data - Gesture data
   */
  trigger(gesture, data) {
    if (this.handlers[gesture]) {
      this.handlers[gesture].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in ${gesture} handler:`, error);
        }
      });
    }
  }

  /**
   * Destroy gesture handler
   */
  destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchcancel', this.handleTouchCancel);

    clearTimeout(this.state.longPressTimer);

    this.handlers = {
      swipe: [],
      tap: [],
      doubleTap: [],
      longPress: [],
      pinch: [],
      pan: []
    };
  }
}
