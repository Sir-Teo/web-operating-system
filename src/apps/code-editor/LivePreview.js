/**
 * Live Preview Panel - Real-time web development preview
 * Renders HTML/CSS/JS in real-time with auto-refresh
 */

export class LivePreview {
  constructor(fs, tabManager) {
    this.fs = fs;
    this.tabManager = tabManager;
    this.panel = null;
    this.iframe = null;
    this.isVisible = false;
    this.autoRefresh = true;
    this.refreshDelay = 500; // ms
    this.refreshTimeout = null;
  }

  /**
   * Initialize the live preview panel
   */
  initialize(container) {
    this.container = container;
    this.createPanel();
  }

  /**
   * Create the panel
   */
  createPanel() {
    this.panel = document.createElement('div');
    this.panel.className = 'live-preview-panel';
    this.panel.style.display = 'none';
    this.panel.innerHTML = this.getPanelHTML();

    this.container.appendChild(this.panel);
    this.attachEventListeners();
  }

  /**
   * Get panel HTML
   */
  getPanelHTML() {
    return `
      <div class="live-preview-header">
        <div class="header-left">
          <h3>Live Preview</h3>
          <div class="preview-controls">
            <button class="control-btn" id="refresh-preview" title="Refresh (Ctrl+Shift+R)">
              🔄 Refresh
            </button>
            <button class="control-btn" id="open-devtools" title="Open DevTools">
              🛠️ DevTools
            </button>
            <label class="auto-refresh-toggle">
              <input type="checkbox" id="auto-refresh" ${this.autoRefresh ? 'checked' : ''} />
              Auto-refresh
            </label>
          </div>
        </div>
        <button class="close-btn" id="close-preview">×</button>
      </div>
      <div class="live-preview-content">
        <iframe
          id="preview-iframe"
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
          title="Live Preview">
        </iframe>
      </div>
      <div class="live-preview-footer">
        <span class="status-text" id="preview-status">Ready</span>
      </div>

      <style>
        .live-preview-panel {
          position: fixed;
          right: 0;
          top: 80px;
          bottom: 0;
          width: 45%;
          background: #1e1e1e;
          border-left: 1px solid #3e3e3e;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          box-shadow: -4px 0 16px rgba(0, 0, 0, 0.3);
        }

        .live-preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          background: #252526;
          border-bottom: 1px solid #3e3e3e;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .live-preview-header h3 {
          margin: 0;
          color: #d4d4d4;
          font-size: 14px;
          font-weight: 600;
        }

        .preview-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .control-btn {
          padding: 6px 12px;
          background: #3c3c3c;
          border: 1px solid #565656;
          border-radius: 4px;
          color: #d4d4d4;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }

        .control-btn:hover {
          background: #505050;
          border-color: #007acc;
        }

        .auto-refresh-toggle {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #d4d4d4;
          font-size: 12px;
          cursor: pointer;
        }

        .auto-refresh-toggle input[type="checkbox"] {
          cursor: pointer;
        }

        .live-preview-content {
          flex: 1;
          overflow: hidden;
          background: white;
        }

        #preview-iframe {
          width: 100%;
          height: 100%;
          border: none;
        }

        .live-preview-footer {
          padding: 8px 20px;
          background: #252526;
          border-top: 1px solid #3e3e3e;
          font-size: 12px;
          color: #969696;
        }

        .status-text {
          font-family: 'Consolas', monospace;
        }

        .close-btn {
          background: transparent;
          border: none;
          color: #d4d4d4;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
        }

        .close-btn:hover {
          color: #fff;
          background: #505050;
          border-radius: 4px;
        }
      </style>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close button
    this.panel.querySelector('#close-preview')?.addEventListener('click', () => {
      this.hide();
    });

    // Refresh button
    this.panel.querySelector('#refresh-preview')?.addEventListener('click', () => {
      this.refresh();
    });

    // Auto-refresh toggle
    this.panel.querySelector('#auto-refresh')?.addEventListener('change', (e) => {
      this.autoRefresh = e.target.checked;
      if (this.autoRefresh) {
        this.refresh();
      }
    });

    // Open DevTools button
    this.panel.querySelector('#open-devtools')?.addEventListener('click', () => {
      this.openConsole();
    });

    // Get iframe reference
    this.iframe = this.panel.querySelector('#preview-iframe');
  }

  /**
   * Refresh the preview
   */
  async refresh() {
    if (!this.iframe) return;

    const activeTab = this.tabManager.getActiveTab();
    if (!activeTab) {
      this.updateStatus('No file open');
      return;
    }

    const content = activeTab.content;
    const fileName = activeTab.name;
    const fileExt = fileName.split('.').pop().toLowerCase();

    try {
      let html = '';

      if (fileExt === 'html' || fileExt === 'htm') {
        html = content;
      } else if (fileExt === 'js' || fileExt === 'jsx') {
        html = this.wrapJavaScript(content);
      } else if (fileExt === 'css') {
        html = this.wrapCSS(content);
      } else if (fileExt === 'md' || fileExt === 'markdown') {
        html = this.wrapMarkdown(content);
      } else {
        html = this.wrapPlainText(content);
      }

      // Write to iframe
      const iframeDoc = this.iframe.contentDocument || this.iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      this.updateStatus(`Refreshed ${fileName} at ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      console.error('Preview error:', error);
      this.updateStatus('Error: ' + error.message);
    }
  }

  /**
   * Schedule auto-refresh
   */
  scheduleRefresh() {
    if (!this.autoRefresh || !this.isVisible) return;

    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }

    this.refreshTimeout = setTimeout(() => {
      this.refresh();
    }, this.refreshDelay);
  }

  /**
   * Wrap JavaScript in HTML
   */
  wrapJavaScript(js) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>JavaScript Preview</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            padding: 20px;
            background: #fff;
            color: #000;
          }
          #output {
            white-space: pre-wrap;
            font-family: 'Consolas', 'Monaco', monospace;
            background: #f5f5f5;
            padding: 15px;
            border-radius: 4px;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <h2>JavaScript Output</h2>
        <div id="output"></div>
        <script>
          const output = document.getElementById('output');
          const originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn
          };

          console.log = (...args) => {
            output.textContent += args.map(a => JSON.stringify(a, null, 2)).join(' ') + '\\n';
            originalConsole.log(...args);
          };

          console.error = (...args) => {
            output.innerHTML += '<span style="color: red;">' + args.join(' ') + '</span>\\n';
            originalConsole.error(...args);
          };

          console.warn = (...args) => {
            output.innerHTML += '<span style="color: orange;">' + args.join(' ') + '</span>\\n';
            originalConsole.warn(...args);
          };

          try {
            ${js}
          } catch (error) {
            console.error('Error:', error.message);
          }
        </script>
      </body>
      </html>
    `;
  }

  /**
   * Wrap CSS in HTML
   */
  wrapCSS(css) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CSS Preview</title>
        <style>
          ${css}
        </style>
      </head>
      <body>
        <h1>CSS Preview</h1>
        <p>This is a sample paragraph with your CSS applied.</p>
        <div class="container">
          <div class="box">Box 1</div>
          <div class="box">Box 2</div>
          <div class="box">Box 3</div>
        </div>
        <button>Button</button>
        <input type="text" placeholder="Input field" />
      </body>
      </html>
    `;
  }

  /**
   * Wrap Markdown in HTML (basic)
   */
  wrapMarkdown(md) {
    // Simple markdown to HTML conversion
    const html = md
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\n/gim, '<br>');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Markdown Preview</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            line-height: 1.6;
          }
          h1, h2, h3 { margin-top: 1.5em; }
          code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;
  }

  /**
   * Wrap plain text in HTML
   */
  wrapPlainText(text) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Text Preview</title>
        <style>
          body {
            font-family: 'Consolas', 'Monaco', monospace;
            padding: 20px;
            white-space: pre-wrap;
          }
        </style>
      </head>
      <body>${text}</body>
      </html>
    `;
  }

  /**
   * Update status message
   */
  updateStatus(message) {
    const status = this.panel?.querySelector('#preview-status');
    if (status) {
      status.textContent = message;
    }
  }

  /**
   * Open browser console (limited in iframe)
   */
  openConsole() {
    alert('DevTools tip: Right-click the preview and select "Inspect Element" to debug.');
  }

  /**
   * Show the panel
   */
  show() {
    if (!this.panel) return;

    this.panel.style.display = 'flex';
    this.isVisible = true;
    this.refresh();
  }

  /**
   * Hide the panel
   */
  hide() {
    if (!this.panel) return;

    this.panel.style.display = 'none';
    this.isVisible = false;
  }

  /**
   * Toggle panel visibility
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Trigger refresh from outside (when content changes)
   */
  triggerRefresh() {
    this.scheduleRefresh();
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
  }
}
