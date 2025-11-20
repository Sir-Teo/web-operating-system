export default class Notes {
  constructor(context) {
    this.context = context;
    this.fs = context.fs;
    this.ipc = context.ipc;

    this.notes = [];
    this.selectedNote = null;
    this.isEditing = false;
  }

  async init() {
    // Try to load notes from file system
    try {
      const notesData = await this.fs.readFile('/home/notes.json');
      if (notesData) {
        this.notes = JSON.parse(notesData);
      }
    } catch (error) {
      // Create default notes
      this.notes = [
        {
          id: 1,
          title: 'Welcome to Notes',
          content: '# Welcome!\n\nThis is your notes app. You can create, edit, and organize notes here.\n\n## Features\n- Markdown support\n- Search functionality\n- Auto-save\n- Color coding',
          color: '#fff3cd',
          created: new Date().toISOString(),
          modified: new Date().toISOString()
        }
      ];
      await this.saveNotes();
    }

    if (this.notes.length > 0) {
      this.selectedNote = this.notes[0];
    }
  }

  async saveNotes() {
    try {
      await this.fs.writeFile('/home/notes.json', JSON.stringify(this.notes, null, 2));
    } catch (error) {
      console.error('Failed to save notes:', error);
    }
  }

  render() {
    const container = document.createElement('div');
    container.className = 'notes-app';
    container.innerHTML = `
      <div class="notes-layout">
        <div class="notes-sidebar">
          <div class="notes-header">
            <h3>📝 My Notes</h3>
            <button class="new-note-btn" title="New Note">+</button>
          </div>
          <div class="search-box">
            <input type="text" class="search-input" placeholder="Search notes...">
          </div>
          <div class="notes-list">
            ${this.renderNotesList()}
          </div>
        </div>
        <div class="note-editor">
          ${this.renderNoteEditor()}
        </div>
      </div>
    `;

    this.attachEventListeners(container);
    return container;
  }

  renderNotesList() {
    if (this.notes.length === 0) {
      return '<div class="empty-state">No notes yet. Click + to create one!</div>';
    }

    return this.notes.map(note => {
      const preview = this.getPreview(note.content);
      const isSelected = this.selectedNote?.id === note.id;

      return `
        <div class="note-item ${isSelected ? 'selected' : ''}" data-id="${note.id}" style="border-left: 4px solid ${note.color}">
          <div class="note-title">${this.escapeHtml(note.title)}</div>
          <div class="note-preview">${this.escapeHtml(preview)}</div>
          <div class="note-date">${this.formatDate(note.modified)}</div>
        </div>
      `;
    }).join('');
  }

  renderNoteEditor() {
    if (!this.selectedNote) {
      return '<div class="empty-state">Select a note or create a new one</div>';
    }

    return `
      <div class="editor-header">
        <input type="text" class="note-title-input" value="${this.escapeHtml(this.selectedNote.title)}" placeholder="Note title...">
        <div class="editor-actions">
          <div class="color-picker">
            <button class="color-btn" data-color="#fff3cd" style="background: #fff3cd" title="Yellow"></button>
            <button class="color-btn" data-color="#d4edda" style="background: #d4edda" title="Green"></button>
            <button class="color-btn" data-color="#d1ecf1" style="background: #d1ecf1" title="Blue"></button>
            <button class="color-btn" data-color="#f8d7da" style="background: #f8d7da" title="Red"></button>
            <button class="color-btn" data-color="#e2e3e5" style="background: #e2e3e5" title="Gray"></button>
          </div>
          <button class="delete-note-btn" title="Delete Note">🗑️</button>
        </div>
      </div>
      <div class="editor-content">
        <textarea class="note-textarea" placeholder="Write your note here... (Markdown supported)">${this.escapeHtml(this.selectedNote.content)}</textarea>
        <div class="note-preview-pane">
          <div class="preview-label">Preview</div>
          ${this.renderMarkdown(this.selectedNote.content)}
        </div>
      </div>
    `;
  }

  attachEventListeners(container) {
    // New note button
    const newNoteBtn = container.querySelector('.new-note-btn');
    if (newNoteBtn) {
      newNoteBtn.addEventListener('click', () => this.createNewNote());
    }

    // Search
    const searchInput = container.querySelector('.search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.searchNotes(e.target.value));
    }

    // Note selection
    container.querySelectorAll('.note-item').forEach(item => {
      item.addEventListener('click', () => {
        const noteId = parseInt(item.dataset.id);
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
          this.selectedNote = note;
          this.refresh();
        }
      });
    });

    // Title editing
    const titleInput = container.querySelector('.note-title-input');
    if (titleInput) {
      titleInput.addEventListener('input', (e) => {
        if (this.selectedNote) {
          this.selectedNote.title = e.target.value;
          this.selectedNote.modified = new Date().toISOString();
          this.saveNotes();
          this.refreshNotesList();
        }
      });
    }

    // Content editing
    const textarea = container.querySelector('.note-textarea');
    if (textarea) {
      textarea.addEventListener('input', (e) => {
        if (this.selectedNote) {
          this.selectedNote.content = e.target.value;
          this.selectedNote.modified = new Date().toISOString();
          this.saveNotes();
          this.refreshPreview();
        }
      });
    }

    // Color picker
    container.querySelectorAll('.color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.selectedNote) {
          this.selectedNote.color = btn.dataset.color;
          this.saveNotes();
          this.refresh();
        }
      });
    });

    // Delete note
    const deleteBtn = container.querySelector('.delete-note-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => this.deleteNote());
    }
  }

  createNewNote() {
    const newNote = {
      id: Date.now(),
      title: 'New Note',
      content: '',
      color: '#fff3cd',
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };

    this.notes.unshift(newNote);
    this.selectedNote = newNote;
    this.saveNotes();
    this.refresh();

    // Focus on title input
    setTimeout(() => {
      const titleInput = document.querySelector('.note-title-input');
      if (titleInput) {
        titleInput.select();
      }
    }, 100);
  }

  deleteNote() {
    if (!this.selectedNote) return;

    if (confirm('Are you sure you want to delete this note?')) {
      const index = this.notes.findIndex(n => n.id === this.selectedNote.id);
      if (index !== -1) {
        this.notes.splice(index, 1);
        this.selectedNote = this.notes.length > 0 ? this.notes[0] : null;
        this.saveNotes();
        this.refresh();
      }
    }
  }

  searchNotes(query) {
    const items = document.querySelectorAll('.note-item');
    const lowerQuery = query.toLowerCase();

    items.forEach(item => {
      const noteId = parseInt(item.dataset.id);
      const note = this.notes.find(n => n.id === noteId);

      if (note) {
        const matches = note.title.toLowerCase().includes(lowerQuery) ||
                       note.content.toLowerCase().includes(lowerQuery);
        item.style.display = matches ? 'block' : 'none';
      }
    });
  }

  getPreview(content) {
    const lines = content.split('\n').filter(line => line.trim());
    return lines.length > 0 ? lines[0].replace(/^#+\s*/, '') : 'Empty note';
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  }

  renderMarkdown(text) {
    // Simple markdown rendering
    let html = this.escapeHtml(text);

    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');

    // Lists
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Line breaks
    html = html.replace(/\n/g, '<br>');

    return `<div class="markdown-preview">${html}</div>`;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  refresh() {
    const container = this.context.process.window?.contentElement;
    if (container) {
      const newContent = this.render();
      container.innerHTML = '';
      container.appendChild(newContent);
    }
  }

  refreshNotesList() {
    const notesList = document.querySelector('.notes-list');
    if (notesList) {
      notesList.innerHTML = this.renderNotesList();

      // Re-attach click listeners to note items
      notesList.querySelectorAll('.note-item').forEach(item => {
        item.addEventListener('click', () => {
          const noteId = parseInt(item.dataset.id);
          const note = this.notes.find(n => n.id === noteId);
          if (note) {
            this.selectedNote = note;
            this.refresh();
          }
        });
      });
    }
  }

  refreshPreview() {
    const previewPane = document.querySelector('.note-preview-pane');
    if (previewPane && this.selectedNote) {
      previewPane.innerHTML = `
        <div class="preview-label">Preview</div>
        ${this.renderMarkdown(this.selectedNote.content)}
      `;
    }
  }
}
