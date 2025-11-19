/**
 * Quick Notes Plugin
 * Sticky notes for desktop
 */

class QuickNotes {
  constructor(api) {
    this.api = api;
    this.notes = [];
    this.storageKey = 'quick-notes-data';
  }

  async activate() {
    console.log('[QuickNotes] Activating...');

    // Load notes
    await this.loadNotes();

    // Render existing notes
    this.notes.forEach(note => this.createNoteElement(note));

    // Add "Create Note" button
    this.createAddButton();

    this.api.ui.notify('Quick Notes activated');
  }

  async deactivate() {
    console.log('[QuickNotes] Deactivating...');

    await this.saveNotes();

    // Remove all note elements
    document.querySelectorAll('.quick-note').forEach(el => el.remove());
    document.querySelector('.quick-notes-add-btn')?.remove();
  }

  async loadNotes() {
    try {
      const data = await this.api.storage.get(this.storageKey);
      this.notes = data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[QuickNotes] Failed to load notes:', error);
      this.notes = [];
    }
  }

  async saveNotes() {
    try {
      await this.api.storage.set(this.storageKey, JSON.stringify(this.notes));
    } catch (error) {
      console.error('[QuickNotes] Failed to save notes:', error);
    }
  }

  createAddButton() {
    const btn = document.createElement('button');
    btn.className = 'quick-notes-add-btn';
    btn.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: 50px;
      height: 50px;
      background: #ffc107;
      border: none;
      border-radius: 50%;
      color: white;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      z-index: 9998;
      transition: transform 0.2s;
    `;
    btn.innerHTML = '📝';
    btn.title = 'Add new note';

    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'scale(1.1)';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'scale(1)';
    });

    btn.addEventListener('click', () => this.addNote());

    document.body.appendChild(btn);
  }

  async addNote() {
    const colors = ['#ffeb3b', '#ffc107', '#ff9800', '#8bc34a', '#00bcd4', '#e91e63'];
    const note = {
      id: Date.now(),
      text: '',
      color: colors[Math.floor(Math.random() * colors.length)],
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200
    };

    this.notes.push(note);
    this.createNoteElement(note);
    await this.saveNotes();
  }

  createNoteElement(note) {
    const noteEl = document.createElement('div');
    noteEl.className = 'quick-note';
    noteEl.dataset.noteId = note.id;
    noteEl.style.cssText = `
      position: fixed;
      left: ${note.x}px;
      top: ${note.y}px;
      width: 200px;
      min-height: 150px;
      background: ${note.color};
      border: none;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      cursor: move;
      font-family: 'Comic Sans MS', cursive, sans-serif;
    `;

    noteEl.innerHTML = `
      <div style="padding: 8px; background: rgba(0, 0, 0, 0.1); display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 12px; color: rgba(0, 0, 0, 0.5);">Note</span>
        <button class="delete-note" style="background: none; border: none; cursor: pointer; font-size: 16px; opacity: 0.5;">&times;</button>
      </div>
      <textarea class="note-text" style="
        width: calc(100% - 16px);
        min-height: 110px;
        padding: 8px;
        background: transparent;
        border: none;
        outline: none;
        resize: none;
        font-family: inherit;
        font-size: 14px;
        color: #333;
      " placeholder="Type your note...">${this.escapeHtml(note.text)}</textarea>
    `;

    document.body.appendChild(noteEl);

    // Make draggable
    this._makeDraggable(noteEl, note);

    // Handle text changes
    const textarea = noteEl.querySelector('.note-text');
    textarea.addEventListener('input', async () => {
      note.text = textarea.value;
      await this.saveNotes();
    });

    // Delete button
    noteEl.querySelector('.delete-note').addEventListener('click', async () => {
      await this.deleteNote(note.id);
    });

    return noteEl;
  }

  async deleteNote(noteId) {
    this.notes = this.notes.filter(n => n.id !== noteId);
    document.querySelector(`[data-note-id="${noteId}"]`)?.remove();
    await this.saveNotes();
  }

  _makeDraggable(element, note) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    element.onmousedown = dragMouseDown;

    const self = this;

    function dragMouseDown(e) {
      if (e.target.tagName === 'TEXTAREA' || e.target.className === 'delete-note') {
        return;
      }
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

      // Update note position
      note.x = element.offsetLeft;
      note.y = element.offsetTop;
    }

    async function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
      await self.saveNotes();
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // State management
  async saveState() {
    return {
      notes: this.notes
    };
  }

  async restoreState(state) {
    this.notes = state.notes;
    this.notes.forEach(note => this.createNoteElement(note));
  }
}

module.exports = QuickNotes;
