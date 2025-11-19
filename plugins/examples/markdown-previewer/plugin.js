/**
 * Markdown Live Preview Plugin
 * Shows live preview of markdown files
 */

class MarkdownPreviewer {
  constructor(api) {
    this.api = api;
    this.panel = null;
    this.updateTimer = null;
  }

  async activate() {
    console.log('[MarkdownPreviewer] Activating...');

    // Create preview panel
    this.createPanel();

    // Show sample markdown
    this.updatePreview(this.getSampleMarkdown());

    this.api.ui.notify('Markdown Preview activated (Ctrl+Shift+M to toggle)');

    // Keyboard shortcut
    document.addEventListener('keydown', this.handleKeyboard.bind(this));
  }

  async deactivate() {
    console.log('[MarkdownPreviewer] Deactivating...');

    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }

    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
  }

  createPanel() {
    this.panel = document.createElement('div');
    this.panel.className = 'markdown-preview-panel';
    this.panel.style.cssText = `
      position: fixed;
      top: 60px;
      right: 20px;
      width: 400px;
      height: calc(100vh - 100px);
      background: rgba(255, 255, 255, 0.98);
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      font-family: system-ui, sans-serif;
    `;

    this.panel.innerHTML = `
      <div style="padding: 12px 16px; background: #f5f5f5; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center; border-radius: 8px 8px 0 0;">
        <h3 style="margin: 0; font-size: 14px; color: #333;">📄 Markdown Preview</h3>
        <button class="close-btn" style="background: none; border: none; color: #666; cursor: pointer; font-size: 18px;">&times;</button>
      </div>
      <div class="preview-content" style="
        flex: 1;
        padding: 20px;
        overflow-y: auto;
        color: #333;
        line-height: 1.6;
      "></div>
      <div style="padding: 8px 16px; background: #f5f5f5; border-top: 1px solid #ddd; font-size: 11px; color: #666; border-radius: 0 0 8px 8px;">
        Press Ctrl+Shift+M to toggle
      </div>
    `;

    document.body.appendChild(this.panel);

    // Close button
    this.panel.querySelector('.close-btn').addEventListener('click', () => {
      this.panel.style.display = 'none';
    });

    // Make draggable
    this._makeDraggable(this.panel);
  }

  handleKeyboard(e) {
    // Ctrl+Shift+M to toggle
    if (e.ctrlKey && e.shiftKey && e.key === 'M') {
      e.preventDefault();
      this.togglePanel();
    }
  }

  togglePanel() {
    if (this.panel.style.display === 'none') {
      this.panel.style.display = 'flex';
    } else {
      this.panel.style.display = 'none';
    }
  }

  updatePreview(markdown) {
    const html = this.markdownToHtml(markdown);
    const content = this.panel.querySelector('.preview-content');

    content.innerHTML = html;

    // Apply styles to rendered content
    this.applyPreviewStyles(content);
  }

  markdownToHtml(markdown) {
    // Simple markdown parser (in production, use a library like marked.js)
    let html = markdown;

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

    // Lists
    html = html.replace(/^\* (.+)$/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';

    // Clean up multiple paragraph tags
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>(<[huo])/g, '$1');
    html = html.replace(/(<\/[huo][^>]*>)<\/p>/g, '$1');

    return html;
  }

  applyPreviewStyles(content) {
    const style = document.createElement('style');
    style.textContent = `
      .preview-content h1 {
        font-size: 28px;
        margin: 20px 0 12px 0;
        border-bottom: 2px solid #eee;
        padding-bottom: 8px;
      }
      .preview-content h2 {
        font-size: 24px;
        margin: 18px 0 10px 0;
        border-bottom: 1px solid #eee;
        padding-bottom: 6px;
      }
      .preview-content h3 {
        font-size: 20px;
        margin: 16px 0 8px 0;
      }
      .preview-content p {
        margin: 12px 0;
      }
      .preview-content code {
        background: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 3px;
        padding: 2px 6px;
        font-family: 'Courier New', monospace;
        font-size: 13px;
      }
      .preview-content pre {
        background: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 12px;
        overflow-x: auto;
        margin: 12px 0;
      }
      .preview-content pre code {
        background: none;
        border: none;
        padding: 0;
      }
      .preview-content ul {
        margin: 12px 0;
        padding-left: 24px;
      }
      .preview-content li {
        margin: 4px 0;
      }
      .preview-content a {
        color: #007acc;
        text-decoration: none;
      }
      .preview-content a:hover {
        text-decoration: underline;
      }
    `;

    if (!content.querySelector('style')) {
      content.appendChild(style);
    }
  }

  getSampleMarkdown() {
    return `# Markdown Preview

## Features

This plugin provides **live preview** of markdown files.

### Supported Syntax

- **Bold** text with \`**text**\`
- *Italic* text with \`*text*\`
- \`Inline code\` with backticks
- [Links](https://example.com)
- Lists (like this one!)

### Code Blocks

\`\`\`javascript
const hello = () => {
  console.log("Hello, WebOS!");
};
\`\`\`

## Usage

Press **Ctrl+Shift+M** to toggle this panel.

Happy writing!`;
  }

  _makeDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = element.querySelector('div');

    header.style.cursor = 'move';
    header.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      if (e.target.className === 'close-btn') return;
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      element.style.top = (element.offsetTop - pos2) + 'px';
      element.style.left = (element.offsetLeft - pos1) + 'px';
      element.style.right = 'auto';
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  // State management
  async saveState() {
    return {
      isVisible: this.panel?.style.display !== 'none'
    };
  }

  async restoreState(state) {
    if (!state.isVisible && this.panel) {
      this.panel.style.display = 'none';
    }
  }
}

module.exports = MarkdownPreviewer;
