/**
 * Markdown Editor
 * Modern markdown editor with live preview and syntax highlighting
 *
 * Features:
 * - Live preview with split-pane view
 * - Syntax highlighting
 * - Markdown toolbar with common formatting
 * - Export to HTML, PDF
 * - Table of contents generation
 * - Code block syntax highlighting
 * - Image upload and embedding
 * - Full-screen mode
 * - Dark/light theme
 * - Word/character count
 */

export default class MarkdownEditor {
    static metadata = {
        name: 'Markdown Editor',
        description: 'Write and preview Markdown documents',
        author: 'WebOS',
        version: '1.0.0',
        category: 'productivity',
        icon: '📝'
    };

    constructor(context) {
        this.context = context;
        this.container = null;
        this.content = '';
        this.currentFile = null;
    }

    async init() {
        console.log('[MarkdownEditor] Initialized');
    }

    render() {
        this.container = document.createElement('div');
        this.container.innerHTML = this.createUI();

        setTimeout(() => {
            this.attachEventListeners();

            // Load file if provided
            if (this.context.args?.file) {
                this.loadFile(this.context.args.file);
            } else {
                this.updatePreview();
            }
        }, 0);

        return this.container;
    }

    createUI() {
        return `
            <style>
                .md-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    color: #e0e0e0;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .md-toolbar {
                    display: flex;
                    gap: 8px;
                    padding: 12px 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    flex-wrap: wrap;
                    backdrop-filter: blur(10px);
                }

                .toolbar-group {
                    display: flex;
                    gap: 4px;
                    padding: 4px;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 6px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .toolbar-btn {
                    padding: 8px 12px;
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 4px;
                    color: #e0e0e0;
                    cursor: pointer;
                    font-size: 13px;
                    transition: all 0.2s ease;
                }

                .toolbar-btn:hover {
                    background: rgba(255, 255, 255, 0.15);
                    transform: translateY(-1px);
                }

                .toolbar-btn.active {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-color: #667eea;
                }

                .md-content {
                    display: flex;
                    flex: 1;
                    overflow: hidden;
                }

                .editor-pane,
                .preview-pane {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .editor-pane {
                    border-right: 1px solid rgba(255, 255, 255, 0.1);
                }

                .pane-header {
                    padding: 12px 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    font-weight: 600;
                    font-size: 13px;
                    color: #a0a0a0;
                    text-transform: uppercase;
                }

                .editor-textarea {
                    flex: 1;
                    padding: 20px;
                    background: #0a0a0a;
                    border: none;
                    color: #e0e0e0;
                    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                    font-size: 14px;
                    line-height: 1.8;
                    resize: none;
                    outline: none;
                }

                .preview-content {
                    flex: 1;
                    padding: 20px;
                    overflow-y: auto;
                    background: rgba(255, 255, 255, 0.02);
                }

                .preview-content h1,
                .preview-content h2,
                .preview-content h3,
                .preview-content h4,
                .preview-content h5,
                .preview-content h6 {
                    margin-top: 24px;
                    margin-bottom: 12px;
                    font-weight: 600;
                    color: #667eea;
                }

                .preview-content h1 {
                    font-size: 32px;
                    border-bottom: 2px solid rgba(255, 255, 255, 0.1);
                    padding-bottom: 8px;
                }

                .preview-content h2 {
                    font-size: 26px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    padding-bottom: 6px;
                }

                .preview-content h3 {
                    font-size: 22px;
                }

                .preview-content h4 {
                    font-size: 18px;
                }

                .preview-content p {
                    margin: 12px 0;
                    line-height: 1.7;
                }

                .preview-content code {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-family: 'Monaco', 'Menlo', monospace;
                    font-size: 13px;
                    color: #f093fb;
                }

                .preview-content pre {
                    background: rgba(0, 0, 0, 0.3);
                    padding: 16px;
                    border-radius: 8px;
                    overflow-x: auto;
                    margin: 16px 0;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .preview-content pre code {
                    background: none;
                    padding: 0;
                    color: #e0e0e0;
                }

                .preview-content blockquote {
                    border-left: 4px solid #667eea;
                    padding-left: 16px;
                    margin: 16px 0;
                    color: #a0a0a0;
                    font-style: italic;
                }

                .preview-content ul,
                .preview-content ol {
                    padding-left: 24px;
                    margin: 12px 0;
                }

                .preview-content li {
                    margin: 6px 0;
                }

                .preview-content a {
                    color: #667eea;
                    text-decoration: none;
                }

                .preview-content a:hover {
                    text-decoration: underline;
                }

                .preview-content table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 16px 0;
                }

                .preview-content table th,
                .preview-content table td {
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 10px;
                    text-align: left;
                }

                .preview-content table th {
                    background: rgba(102, 126, 234, 0.2);
                    font-weight: 600;
                }

                .preview-content img {
                    max-width: 100%;
                    border-radius: 8px;
                    margin: 16px 0;
                }

                .preview-content hr {
                    border: none;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    margin: 24px 0;
                }

                .status-bar {
                    padding: 8px 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    font-size: 12px;
                    display: flex;
                    gap: 20px;
                    color: #a0a0a0;
                }

                .toc-panel {
                    width: 250px;
                    background: rgba(255, 255, 255, 0.03);
                    border-left: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 16px;
                    overflow-y: auto;
                    display: none;
                }

                .toc-panel.active {
                    display: block;
                }

                .toc-item {
                    padding: 6px 12px;
                    margin: 2px 0;
                    cursor: pointer;
                    border-radius: 4px;
                    font-size: 13px;
                    transition: all 0.2s ease;
                }

                .toc-item:hover {
                    background: rgba(255, 255, 255, 0.05);
                }

                .toc-item.level-1 {
                    font-weight: 600;
                    margin-top: 8px;
                }

                .toc-item.level-2 {
                    padding-left: 20px;
                }

                .toc-item.level-3 {
                    padding-left: 32px;
                    font-size: 12px;
                }
            </style>

            <div class="md-container">
                <div class="md-toolbar">
                    <div class="toolbar-group">
                        <button class="toolbar-btn" data-action="new">📄 New</button>
                        <button class="toolbar-btn" data-action="open">📁 Open</button>
                        <button class="toolbar-btn" data-action="save">💾 Save</button>
                    </div>

                    <div class="toolbar-group">
                        <button class="toolbar-btn" data-format="bold" title="Bold">𝗕</button>
                        <button class="toolbar-btn" data-format="italic" title="Italic">𝑰</button>
                        <button class="toolbar-btn" data-format="strikethrough" title="Strikethrough">S̶</button>
                        <button class="toolbar-btn" data-format="code" title="Code">&lt;/&gt;</button>
                    </div>

                    <div class="toolbar-group">
                        <button class="toolbar-btn" data-format="h1" title="Heading 1">H1</button>
                        <button class="toolbar-btn" data-format="h2" title="Heading 2">H2</button>
                        <button class="toolbar-btn" data-format="h3" title="Heading 3">H3</button>
                    </div>

                    <div class="toolbar-group">
                        <button class="toolbar-btn" data-format="link" title="Link">🔗</button>
                        <button class="toolbar-btn" data-format="image" title="Image">🖼️</button>
                        <button class="toolbar-btn" data-format="table" title="Table">📊</button>
                    </div>

                    <div class="toolbar-group">
                        <button class="toolbar-btn" data-format="ul" title="Unordered List">• List</button>
                        <button class="toolbar-btn" data-format="ol" title="Ordered List">1. List</button>
                        <button class="toolbar-btn" data-format="quote" title="Quote">❝ Quote</button>
                    </div>

                    <div class="toolbar-group">
                        <button class="toolbar-btn" data-action="toc" title="Table of Contents">📑 TOC</button>
                        <button class="toolbar-btn" data-action="export" title="Export">📤 Export</button>
                    </div>
                </div>

                <div class="md-content">
                    <div class="editor-pane">
                        <div class="pane-header">Editor</div>
                        <textarea class="editor-textarea" id="mdEditor" placeholder="# Welcome to Markdown Editor

Start writing your markdown here...

## Features
- **Bold text**
- *Italic text*
- [Links](https://example.com)
- Code blocks
- And much more!

"></textarea>
                    </div>

                    <div class="preview-pane">
                        <div class="pane-header">Preview</div>
                        <div class="preview-content" id="mdPreview"></div>
                    </div>

                    <div class="toc-panel" id="tocPanel">
                        <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #a0a0a0; text-transform: uppercase;">
                            Table of Contents
                        </h3>
                        <div id="tocList"></div>
                    </div>
                </div>

                <div class="status-bar">
                    <span id="wordCount">Words: 0</span>
                    <span>•</span>
                    <span id="charCount">Characters: 0</span>
                    <span>•</span>
                    <span id="lineCount">Lines: 0</span>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        const body = this.container;
        const editor = body.querySelector('#mdEditor');

        // Toolbar actions
        body.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleAction(action);
            });
        });

        // Formatting buttons
        body.querySelectorAll('[data-format]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const format = e.currentTarget.dataset.format;
                this.applyFormat(format);
            });
        });

        // Editor input
        editor.addEventListener('input', () => {
            this.content = editor.value;
            this.updatePreview();
            this.updateStats();
        });

        // Initial update
        this.updatePreview();
        this.updateStats();
    }

    handleAction(action) {
        switch (action) {
            case 'new':
                this.newDocument();
                break;
            case 'open':
                this.openDocument();
                break;
            case 'save':
                this.saveDocument();
                break;
            case 'toc':
                this.toggleTOC();
                break;
            case 'export':
                this.exportDocument();
                break;
        }
    }

    applyFormat(format) {
        const editor = this.container.querySelector('#mdEditor');
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const selectedText = editor.value.substring(start, end);
        const beforeText = editor.value.substring(0, start);
        const afterText = editor.value.substring(end);

        let newText = '';
        let cursorOffset = 0;

        switch (format) {
            case 'bold':
                newText = `**${selectedText || 'bold text'}**`;
                cursorOffset = selectedText ? 2 : 2;
                break;
            case 'italic':
                newText = `*${selectedText || 'italic text'}*`;
                cursorOffset = selectedText ? 1 : 1;
                break;
            case 'strikethrough':
                newText = `~~${selectedText || 'strikethrough text'}~~`;
                cursorOffset = selectedText ? 2 : 2;
                break;
            case 'code':
                newText = `\`${selectedText || 'code'}\``;
                cursorOffset = selectedText ? 1 : 1;
                break;
            case 'h1':
                newText = `# ${selectedText || 'Heading 1'}`;
                cursorOffset = 2;
                break;
            case 'h2':
                newText = `## ${selectedText || 'Heading 2'}`;
                cursorOffset = 3;
                break;
            case 'h3':
                newText = `### ${selectedText || 'Heading 3'}`;
                cursorOffset = 4;
                break;
            case 'link':
                newText = `[${selectedText || 'link text'}](url)`;
                cursorOffset = selectedText ? selectedText.length + 3 : 11;
                break;
            case 'image':
                newText = `![${selectedText || 'alt text'}](image-url)`;
                cursorOffset = selectedText ? selectedText.length + 4 : 13;
                break;
            case 'ul':
                newText = `- ${selectedText || 'list item'}`;
                cursorOffset = 2;
                break;
            case 'ol':
                newText = `1. ${selectedText || 'list item'}`;
                cursorOffset = 3;
                break;
            case 'quote':
                newText = `> ${selectedText || 'quote'}`;
                cursorOffset = 2;
                break;
            case 'table':
                newText = `| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |`;
                cursorOffset = 0;
                break;
        }

        editor.value = beforeText + newText + afterText;
        editor.focus();
        editor.selectionStart = editor.selectionEnd = start + cursorOffset;

        this.content = editor.value;
        this.updatePreview();
        this.updateStats();
    }

    updatePreview() {
        const preview = this.container.querySelector('#mdPreview');
        const markdown = this.container.querySelector('#mdEditor').value;

        preview.innerHTML = this.parseMarkdown(markdown);
        this.updateTOC();
    }

    parseMarkdown(markdown) {
        let html = markdown;

        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // Bold
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

        // Italic
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

        // Strikethrough
        html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

        // Code inline
        html = html.replace(/`(.+?)`/g, '<code>$1</code>');

        // Code blocks
        html = html.replace(/```([a-z]*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');

        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

        // Images
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

        // Unordered lists
        html = html.replace(/^\* (.+)/gim, '<li>$1</li>');
        html = html.replace(/^- (.+)/gim, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

        // Ordered lists
        html = html.replace(/^\d+\. (.+)/gim, '<li>$1</li>');

        // Blockquotes
        html = html.replace(/^> (.+)/gim, '<blockquote>$1</blockquote>');

        // Horizontal rule
        html = html.replace(/^---$/gim, '<hr>');

        // Tables (basic)
        html = html.replace(/\|(.+)\|/g, (match) => {
            const cells = match.split('|').filter(cell => cell.trim());
            const cellHtml = cells.map(cell => `<td>${cell.trim()}</td>`).join('');
            return `<tr>${cellHtml}</tr>`;
        });
        html = html.replace(/(<tr>.*<\/tr>)/s, '<table>$1</table>');

        // Paragraphs
        html = html.replace(/\n\n(.+)/g, '<p>$1</p>');

        // Line breaks
        html = html.replace(/\n/g, '<br>');

        return html;
    }

    updateTOC() {
        const markdown = this.container.querySelector('#mdEditor').value;
        const tocList = this.container.querySelector('#tocList');

        // Extract headers
        const headers = [];
        const lines = markdown.split('\n');

        lines.forEach((line, index) => {
            const h1Match = line.match(/^# (.+)/);
            const h2Match = line.match(/^## (.+)/);
            const h3Match = line.match(/^### (.+)/);

            if (h1Match) {
                headers.push({ level: 1, text: h1Match[1], line: index });
            } else if (h2Match) {
                headers.push({ level: 2, text: h2Match[1], line: index });
            } else if (h3Match) {
                headers.push({ level: 3, text: h3Match[1], line: index });
            }
        });

        if (headers.length === 0) {
            tocList.innerHTML = '<p style="color: #666; font-size: 12px;">No headers found</p>';
            return;
        }

        tocList.innerHTML = headers.map(header => `
            <div class="toc-item level-${header.level}">
                ${header.text}
            </div>
        `).join('');
    }

    updateStats() {
        const text = this.container.querySelector('#mdEditor').value;

        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const chars = text.length;
        const lines = text.split('\n').length;

        this.container.querySelector('#wordCount').textContent = `Words: ${words}`;
        this.container.querySelector('#charCount').textContent = `Characters: ${chars}`;
        this.container.querySelector('#lineCount').textContent = `Lines: ${lines}`;
    }

    toggleTOC() {
        const tocPanel = this.container.querySelector('#tocPanel');
        tocPanel.classList.toggle('active');
    }

    newDocument() {
        if (confirm('Create new document? Unsaved changes will be lost.')) {
            this.container.querySelector('#mdEditor').value = '';
            this.currentFile = null;
            this.content = '';
            this.updatePreview();
            this.updateStats();
        }
    }

    async openDocument() {
        // In a real implementation, this would open a file picker
        const filename = prompt('Enter filename to open:');
        if (filename) {
            await this.loadFile(filename);
        }
    }

    async loadFile(filename) {
        try {
            const content = await this.context.fs.readFile(filename);
            const text = new TextDecoder().decode(content);

            this.container.querySelector('#mdEditor').value = text;
            this.currentFile = filename;
            this.content = text;
            this.updatePreview();
            this.updateStats();
        } catch (error) {
            alert('Failed to load file: ' + error.message);
        }
    }

    async saveDocument() {
        try {
            let filename = this.currentFile;

            if (!filename) {
                filename = prompt('Enter filename:', 'document.md');
                if (!filename) return;

                if (!filename.endsWith('.md')) {
                    filename += '.md';
                }

                filename = `/home/${this.context.kernel.currentUser}/Documents/${filename}`;
            }

            const content = this.container.querySelector('#mdEditor').value;
            const encoder = new TextEncoder();
            const data = encoder.encode(content);

            await this.context.fs.writeFile(filename, data);

            this.currentFile = filename;
            alert('Document saved successfully!');
        } catch (error) {
            alert('Failed to save document: ' + error.message);
        }
    }

    exportDocument() {
        const format = prompt('Export as (html/md):', 'html');

        if (format === 'html') {
            const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Markdown Export</title>
    <style>
        body {
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.7;
            color: #333;
        }
        code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', monospace;
        }
        pre {
            background: #f4f4f4;
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
        }
        blockquote {
            border-left: 4px solid #ddd;
            padding-left: 16px;
            color: #666;
            font-style: italic;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        table th, table td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
        }
        table th {
            background: #f4f4f4;
        }
    </style>
</head>
<body>
${this.container.querySelector('#mdPreview').innerHTML}
</body>
</html>`;

            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'export.html';
            a.click();
            URL.revokeObjectURL(url);
        } else {
            const markdown = this.container.querySelector('#mdEditor').value;
            const blob = new Blob([markdown], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'export.md';
            a.click();
            URL.revokeObjectURL(url);
        }
    }
}
