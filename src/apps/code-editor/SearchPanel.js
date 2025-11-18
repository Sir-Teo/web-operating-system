/**
 * Search Panel for Code Editor
 * Provides find and replace functionality
 */
export class SearchPanel {
  constructor(editor) {
    this.editor = editor;
    this.isVisible = false;
    this.container = null;
  }

  /**
   * Create search panel HTML
   * @returns {string} HTML string
   */
  createPanel() {
    return `
      <div class="search-panel" id="search-panel" style="display: none;">
        <div class="search-controls">
          <div class="search-row">
            <input type="text" id="search-input" placeholder="Find" class="search-input" />
            <button id="search-prev" class="search-btn" title="Previous (Shift+Enter)">↑</button>
            <button id="search-next" class="search-btn" title="Next (Enter)">↓</button>
            <button id="search-close" class="search-btn" title="Close (Escape)">✕</button>
          </div>
          <div class="search-row">
            <input type="text" id="replace-input" placeholder="Replace" class="search-input" />
            <button id="replace-one" class="search-btn">Replace</button>
            <button id="replace-all" class="search-btn">Replace All</button>
          </div>
          <div class="search-options">
            <label>
              <input type="checkbox" id="search-case-sensitive" />
              <span>Match Case</span>
            </label>
            <label>
              <input type="checkbox" id="search-whole-word" />
              <span>Whole Word</span>
            </label>
            <label>
              <input type="checkbox" id="search-regex" />
              <span>Regex</span>
            </label>
          </div>
          <div class="search-results" id="search-results"></div>
        </div>
      </div>
    `;
  }

  /**
   * Initialize search panel
   * @param {HTMLElement} container - Container element
   */
  initialize(container) {
    this.container = container;
    container.innerHTML += this.createPanel();
    this.attachEventListeners();
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    const searchInput = document.getElementById('search-input');
    const replaceInput = document.getElementById('replace-input');
    const searchPrev = document.getElementById('search-prev');
    const searchNext = document.getElementById('search-next');
    const searchClose = document.getElementById('search-close');
    const replaceOne = document.getElementById('replace-one');
    const replaceAll = document.getElementById('replace-all');
    const caseSensitive = document.getElementById('search-case-sensitive');
    const wholeWord = document.getElementById('search-whole-word');
    const regex = document.getElementById('search-regex');

    // Search input
    searchInput?.addEventListener('input', () => {
      this.search(searchInput.value);
    });

    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          this.findPrevious();
        } else {
          this.findNext();
        }
      } else if (e.key === 'Escape') {
        this.hide();
      }
    });

    // Navigation buttons
    searchPrev?.addEventListener('click', () => this.findPrevious());
    searchNext?.addEventListener('click', () => this.findNext());
    searchClose?.addEventListener('click', () => this.hide());

    // Replace buttons
    replaceOne?.addEventListener('click', () => {
      const replaceText = replaceInput?.value || '';
      this.replaceOne(replaceText);
    });

    replaceAll?.addEventListener('click', () => {
      const replaceText = replaceInput?.value || '';
      this.replaceAll(replaceText);
    });

    // Options
    [caseSensitive, wholeWord, regex].forEach(checkbox => {
      checkbox?.addEventListener('change', () => {
        const searchText = searchInput?.value || '';
        if (searchText) {
          this.search(searchText);
        }
      });
    });
  }

  /**
   * Show search panel
   */
  show() {
    const panel = document.getElementById('search-panel');
    if (panel) {
      panel.style.display = 'block';
      this.isVisible = true;

      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.focus();

        // Pre-fill with selected text if any
        const selection = this.editor.getSelection();
        if (selection && !selection.isEmpty()) {
          const selectedText = this.editor.getModel().getValueInRange(selection);
          searchInput.value = selectedText;
          this.search(selectedText);
        }
      }
    }
  }

  /**
   * Hide search panel
   */
  hide() {
    const panel = document.getElementById('search-panel');
    if (panel) {
      panel.style.display = 'none';
      this.isVisible = false;
      this.editor.focus();
    }
  }

  /**
   * Toggle search panel visibility
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Perform search
   * @param {string} searchText - Text to search for
   */
  search(searchText) {
    if (!searchText) {
      this.updateResults(0, 0);
      return;
    }

    const options = this.getSearchOptions();
    const matches = this.editor.getModel().findMatches(
      searchText,
      true,  // searchOnlyEditableRange
      options.isRegex,
      options.matchCase,
      options.wholeWord ? searchText : null,
      true   // captureMatches
    );

    this.updateResults(matches.length, 0);
  }

  /**
   * Find next match
   */
  findNext() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput?.value) return;

    const options = this.getSearchOptions();
    this.editor.trigger('search', 'actions.find', {
      searchString: searchInput.value,
      ...options
    });
  }

  /**
   * Find previous match
   */
  findPrevious() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput?.value) return;

    const options = this.getSearchOptions();
    this.editor.trigger('search', 'editor.action.previousMatchFindAction', {
      searchString: searchInput.value,
      ...options
    });
  }

  /**
   * Replace one occurrence
   * @param {string} replaceText - Replacement text
   */
  replaceOne(replaceText) {
    const selection = this.editor.getSelection();
    if (selection && !selection.isEmpty()) {
      this.editor.executeEdits('replace', [{
        range: selection,
        text: replaceText
      }]);
      this.findNext();
    }
  }

  /**
   * Replace all occurrences
   * @param {string} replaceText - Replacement text
   */
  replaceAll(replaceText) {
    const searchInput = document.getElementById('search-input');
    if (!searchInput?.value) return;

    const options = this.getSearchOptions();
    const model = this.editor.getModel();
    const matches = model.findMatches(
      searchInput.value,
      true,
      options.isRegex,
      options.matchCase,
      options.wholeWord ? searchInput.value : null,
      true
    );

    if (matches.length > 0) {
      const edits = matches.map(match => ({
        range: match.range,
        text: replaceText
      }));

      this.editor.executeEdits('replace-all', edits);
      this.updateResults(0, matches.length);
    }
  }

  /**
   * Get search options
   * @returns {Object} Search options
   */
  getSearchOptions() {
    return {
      matchCase: document.getElementById('search-case-sensitive')?.checked || false,
      wholeWord: document.getElementById('search-whole-word')?.checked || false,
      isRegex: document.getElementById('search-regex')?.checked || false
    };
  }

  /**
   * Update results display
   * @param {number} total - Total matches
   * @param {number} current - Current match index
   */
  updateResults(total, current) {
    const resultsDiv = document.getElementById('search-results');
    if (resultsDiv) {
      if (total === 0) {
        resultsDiv.textContent = 'No results';
      } else if (current === 0) {
        resultsDiv.textContent = `${total} results`;
      } else {
        resultsDiv.textContent = `${current} of ${total}`;
      }
    }
  }
}
