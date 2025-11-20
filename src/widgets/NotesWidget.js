/**
 * NotesWidget - Quick notes widget
 */
export class NotesWidget {
  constructor(kernel, container, config = {}) {
    this.kernel = kernel;
    this.container = container;
    this.config = config;
    this.notes = config.notes || '';
    this.saveTimeout = null;
  }

  async init() {
    await this._loadNotes();
    this._render();
  }

  _render() {
    this.container.className = 'notes-widget';
    this.container.innerHTML = `
      <textarea placeholder="Type your notes here..." id="notes-textarea">${this.notes}</textarea>
      <div class="notes-footer">
        <span class="char-count">0 characters</span>
      </div>
    `;

    this.textarea = this.container.querySelector('#notes-textarea');
    this.charCount = this.container.querySelector('.char-count');

    this._updateCharCount();

    // Auto-save on input
    this.textarea.addEventListener('input', () => {
      this._updateCharCount();
      this._scheduleSave();
    });
  }

  _updateCharCount() {
    const count = this.textarea.value.length;
    this.charCount.textContent = `${count} character${count !== 1 ? 's' : ''}`;
  }

  _scheduleSave() {
    // Debounce save
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this._saveNotes();
    }, 1000);
  }

  async _saveNotes() {
    this.notes = this.textarea.value;

    try {
      await this.kernel.fs.writeFile(
        '/home/.config/notes-widget.txt',
        this.notes
      );
    } catch (error) {
      console.warn('Failed to save notes:', error);
    }
  }

  async _loadNotes() {
    try {
      this.notes = await this.kernel.fs.readFile('/home/.config/notes-widget.txt');
    } catch (error) {
      // No saved notes - that's ok
      this.notes = '';
    }
  }

  destroy() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    // Save before destroying
    this._saveNotes();
  }
}
