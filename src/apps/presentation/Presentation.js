export default class Presentation {
  constructor(context) {
    this.context = context;
    this.currentFile = null;
    this.slides = [{ id: 1, content: '', title: 'Slide 1', background: '#ffffff' }];
    this.currentSlideIndex = 0;
    this.isModified = false;
    this.presentationMode = false;
  }

  async init() {
    // Initialize presentation
  }

  render() {
    const container = document.createElement('div');
    container.className = 'presentation-container';
    container.style.cssText = 'display:flex;flex-direction:column;height:100%;background:#f5f5f5;';

    // Menu bar
    const menuBar = this._createMenuBar();

    // Toolbar
    const toolbar = this._createToolbar();

    // Main area
    const mainArea = document.createElement('div');
    mainArea.style.cssText = 'flex:1;display:flex;overflow:hidden;';

    // Slide thumbnails
    const thumbnailPanel = this._createThumbnailPanel();

    // Editor area
    const editorArea = this._createEditorArea();

    // Properties panel
    const propertiesPanel = this._createPropertiesPanel();

    mainArea.appendChild(thumbnailPanel);
    mainArea.appendChild(editorArea);
    mainArea.appendChild(propertiesPanel);

    // Status bar
    const statusBar = this._createStatusBar();

    container.appendChild(menuBar);
    container.appendChild(toolbar);
    container.appendChild(mainArea);
    container.appendChild(statusBar);

    this.thumbnailPanel = thumbnailPanel;
    this.editorArea = editorArea;
    this.container = container;

    return container;
  }

  _createMenuBar() {
    const menuBar = document.createElement('div');
    menuBar.className = 'presentation-menu-bar';
    menuBar.style.cssText = 'padding:8px 10px;background:#d14424;color:white;display:flex;gap:20px;font-size:14px;';

    const menus = ['File', 'Edit', 'Insert', 'Design', 'Transitions', 'Slideshow', 'Help'];
    menus.forEach(menu => {
      const menuItem = document.createElement('span');
      menuItem.textContent = menu;
      menuItem.style.cssText = 'cursor:pointer;padding:5px 10px;';
      menuItem.addEventListener('mouseenter', () => {
        menuItem.style.background = 'rgba(255,255,255,0.2)';
      });
      menuItem.addEventListener('mouseleave', () => {
        menuItem.style.background = 'transparent';
      });

      if (menu === 'File') {
        menuItem.addEventListener('click', () => this._showFileMenu(menuItem));
      } else if (menu === 'Slideshow') {
        menuItem.addEventListener('click', () => this._startPresentation());
      }

      menuBar.appendChild(menuItem);
    });

    return menuBar;
  }

  _showFileMenu(anchor) {
    const existing = document.querySelector('.file-menu-dropdown');
    if (existing) existing.remove();

    const menu = document.createElement('div');
    menu.className = 'file-menu-dropdown';
    menu.style.cssText = `
      position:absolute;
      background:white;
      border:1px solid #ccc;
      box-shadow:0 2px 8px rgba(0,0,0,0.15);
      min-width:200px;
      z-index:10000;
    `;

    const options = [
      { label: 'New', action: () => this._newPresentation() },
      { label: 'Open...', action: () => this._openPresentation() },
      { label: 'Save', action: () => this._savePresentation() },
      { label: 'Save As...', action: () => this._savePresentationAs() },
      { label: 'Export as HTML', action: () => this._exportHTML() }
    ];

    options.forEach(opt => {
      const item = document.createElement('div');
      item.textContent = opt.label;
      item.style.cssText = 'padding:8px 15px;cursor:pointer;color:#333;';
      item.addEventListener('mouseenter', () => item.style.background = '#f0f0f0');
      item.addEventListener('mouseleave', () => item.style.background = 'white');
      item.addEventListener('click', () => {
        opt.action();
        menu.remove();
      });
      menu.appendChild(item);
    });

    const rect = anchor.getBoundingClientRect();
    menu.style.top = rect.bottom + 'px';
    menu.style.left = rect.left + 'px';

    document.body.appendChild(menu);

    setTimeout(() => {
      document.addEventListener('click', () => menu.remove(), { once: true });
    }, 0);
  }

  _createToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'presentation-toolbar';
    toolbar.style.cssText = 'padding:8px 10px;border-bottom:1px solid #ccc;background:white;display:flex;gap:10px;align-items:center;';

    // New slide button
    const newSlideBtn = this._createToolbarButton('➕ New Slide', 'Add new slide', () => {
      this._addSlide();
    });

    // Delete slide button
    const deleteSlideBtn = this._createToolbarButton('🗑️ Delete', 'Delete current slide', () => {
      this._deleteSlide();
    });

    // Duplicate slide button
    const duplicateBtn = this._createToolbarButton('📄 Duplicate', 'Duplicate slide', () => {
      this._duplicateSlide();
    });

    toolbar.appendChild(newSlideBtn);
    toolbar.appendChild(deleteSlideBtn);
    toolbar.appendChild(duplicateBtn);
    toolbar.appendChild(this._createSeparator());

    // Layout selector
    const layoutLabel = document.createElement('span');
    layoutLabel.textContent = 'Layout:';
    layoutLabel.style.cssText = 'font-size:12px;';

    const layoutSelect = document.createElement('select');
    layoutSelect.style.cssText = 'padding:4px;border:1px solid #ccc;';
    ['Title Slide', 'Title and Content', 'Two Content', 'Blank'].forEach(layout => {
      const option = document.createElement('option');
      option.value = layout;
      option.textContent = layout;
      layoutSelect.appendChild(option);
    });

    toolbar.appendChild(layoutLabel);
    toolbar.appendChild(layoutSelect);
    toolbar.appendChild(this._createSeparator());

    // Theme selector
    const themeLabel = document.createElement('span');
    themeLabel.textContent = 'Theme:';
    themeLabel.style.cssText = 'font-size:12px;';

    const themeSelect = document.createElement('select');
    themeSelect.style.cssText = 'padding:4px;border:1px solid #ccc;';
    this.themeSelect = themeSelect;

    const themes = [
      { name: 'Default', bg: '#ffffff', text: '#000000' },
      { name: 'Dark', bg: '#1a1a1a', text: '#ffffff' },
      { name: 'Blue', bg: '#0066cc', text: '#ffffff' },
      { name: 'Green', bg: '#2d7d46', text: '#ffffff' },
      { name: 'Orange', bg: '#ff6600', text: '#ffffff' },
      { name: 'Purple', bg: '#6b4c9a', text: '#ffffff' }
    ];

    themes.forEach(theme => {
      const option = document.createElement('option');
      option.value = JSON.stringify(theme);
      option.textContent = theme.name;
      themeSelect.appendChild(option);
    });

    themeSelect.addEventListener('change', () => {
      const theme = JSON.parse(themeSelect.value);
      this._applyThemeToCurrentSlide(theme);
    });

    toolbar.appendChild(themeLabel);
    toolbar.appendChild(themeSelect);
    toolbar.appendChild(this._createSeparator());

    // Start presentation button
    const presentBtn = this._createToolbarButton('▶️ Present', 'Start slideshow', () => {
      this._startPresentation();
    });
    presentBtn.style.background = '#4CAF50';
    presentBtn.style.color = 'white';
    presentBtn.style.fontWeight = 'bold';

    toolbar.appendChild(presentBtn);

    return toolbar;
  }

  _createToolbarButton(text, title, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.title = title;
    button.style.cssText = 'padding:6px 12px;cursor:pointer;background:white;border:1px solid #ccc;border-radius:3px;font-size:13px;';
    button.addEventListener('mouseenter', () => button.style.background = '#f0f0f0');
    button.addEventListener('mouseleave', () => button.style.background = 'white');
    button.addEventListener('click', onClick);
    return button;
  }

  _createSeparator() {
    const sep = document.createElement('div');
    sep.style.cssText = 'width:1px;height:24px;background:#ccc;margin:0 5px;';
    return sep;
  }

  _createThumbnailPanel() {
    const panel = document.createElement('div');
    panel.className = 'thumbnail-panel';
    panel.style.cssText = 'width:180px;background:#f8f8f8;border-right:1px solid #ccc;overflow-y:auto;padding:10px;';

    this._updateThumbnails(panel);

    return panel;
  }

  _updateThumbnails(panel) {
    panel.innerHTML = '';

    this.slides.forEach((slide, index) => {
      const thumbnail = document.createElement('div');
      thumbnail.className = 'slide-thumbnail';
      thumbnail.style.cssText = `
        width:160px;
        height:90px;
        background:${slide.background || '#ffffff'};
        border:2px solid ${index === this.currentSlideIndex ? '#d14424' : '#ccc'};
        margin-bottom:10px;
        cursor:pointer;
        display:flex;
        flex-direction:column;
        padding:5px;
        font-size:10px;
        overflow:hidden;
      `;

      const title = document.createElement('div');
      title.style.cssText = 'font-weight:bold;margin-bottom:3px;';
      title.textContent = slide.title || `Slide ${index + 1}`;

      const preview = document.createElement('div');
      preview.style.cssText = 'flex:1;overflow:hidden;font-size:8px;';
      preview.innerHTML = slide.content || '';

      const number = document.createElement('div');
      number.style.cssText = 'text-align:center;font-size:10px;color:#666;margin-top:3px;';
      number.textContent = index + 1;

      thumbnail.appendChild(title);
      thumbnail.appendChild(preview);
      thumbnail.appendChild(number);

      thumbnail.addEventListener('click', () => {
        this._switchToSlide(index);
      });

      panel.appendChild(thumbnail);
    });
  }

  _createEditorArea() {
    const area = document.createElement('div');
    area.style.cssText = 'flex:1;display:flex;flex-direction:column;overflow:auto;padding:20px;background:#e5e5e5;';

    const slideContainer = document.createElement('div');
    slideContainer.style.cssText = `
      width:960px;
      height:540px;
      margin:0 auto;
      background:white;
      box-shadow:0 0 20px rgba(0,0,0,0.2);
      position:relative;
    `;

    const slideContent = document.createElement('div');
    slideContent.contentEditable = 'true';
    slideContent.style.cssText = `
      width:100%;
      height:100%;
      padding:40px;
      outline:none;
      font-family:Arial, sans-serif;
      font-size:18px;
    `;
    slideContent.innerHTML = this.slides[this.currentSlideIndex].content || '<h1>Click to add title</h1><p>Click to add content</p>';

    slideContent.addEventListener('input', () => {
      this.slides[this.currentSlideIndex].content = slideContent.innerHTML;
      this.isModified = true;
      if (this.thumbnailPanel) {
        this._updateThumbnails(this.thumbnailPanel);
      }
    });

    this.slideContent = slideContent;

    slideContainer.appendChild(slideContent);
    area.appendChild(slideContainer);

    return area;
  }

  _createPropertiesPanel() {
    const panel = document.createElement('div');
    panel.style.cssText = 'width:200px;background:#f8f8f8;border-left:1px solid #ccc;padding:15px;overflow-y:auto;';

    const title = document.createElement('h3');
    title.textContent = 'Properties';
    title.style.cssText = 'margin:0 0 15px 0;font-size:14px;';

    // Background color
    const bgLabel = document.createElement('label');
    bgLabel.textContent = 'Background:';
    bgLabel.style.cssText = 'display:block;margin-bottom:5px;font-size:12px;';

    const bgInput = document.createElement('input');
    bgInput.type = 'color';
    bgInput.value = this.slides[this.currentSlideIndex].background || '#ffffff';
    bgInput.style.cssText = 'width:100%;height:40px;border:1px solid #ccc;cursor:pointer;margin-bottom:15px;';
    bgInput.addEventListener('change', () => {
      this.slides[this.currentSlideIndex].background = bgInput.value;
      this.slideContent.parentElement.style.background = bgInput.value;
      this.isModified = true;
      if (this.thumbnailPanel) {
        this._updateThumbnails(this.thumbnailPanel);
      }
    });

    this.bgInput = bgInput;

    // Slide title
    const titleLabel = document.createElement('label');
    titleLabel.textContent = 'Slide Title:';
    titleLabel.style.cssText = 'display:block;margin-bottom:5px;font-size:12px;';

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.value = this.slides[this.currentSlideIndex].title || '';
    titleInput.style.cssText = 'width:100%;padding:6px;border:1px solid #ccc;margin-bottom:15px;';
    titleInput.addEventListener('input', () => {
      this.slides[this.currentSlideIndex].title = titleInput.value;
      this.isModified = true;
      if (this.thumbnailPanel) {
        this._updateThumbnails(this.thumbnailPanel);
      }
    });

    this.titleInput = titleInput;

    panel.appendChild(title);
    panel.appendChild(bgLabel);
    panel.appendChild(bgInput);
    panel.appendChild(titleLabel);
    panel.appendChild(titleInput);

    return panel;
  }

  _createStatusBar() {
    const statusBar = document.createElement('div');
    statusBar.style.cssText = 'padding:5px 10px;background:#f0f0f0;border-top:1px solid #ccc;font-size:12px;color:#666;display:flex;justify-content:space-between;';

    const slideInfo = document.createElement('span');
    slideInfo.textContent = `Slide ${this.currentSlideIndex + 1} of ${this.slides.length}`;
    this.slideInfo = slideInfo;

    const status = document.createElement('span');
    status.textContent = 'Ready';

    statusBar.appendChild(slideInfo);
    statusBar.appendChild(status);

    return statusBar;
  }

  _addSlide() {
    const newSlide = {
      id: Date.now(),
      content: '<h1>New Slide</h1><p>Add your content here</p>',
      title: `Slide ${this.slides.length + 1}`,
      background: '#ffffff'
    };
    this.slides.splice(this.currentSlideIndex + 1, 0, newSlide);
    this.isModified = true;
    this._switchToSlide(this.currentSlideIndex + 1);
  }

  _deleteSlide() {
    if (this.slides.length === 1) {
      alert('Cannot delete the last slide!');
      return;
    }

    if (confirm('Delete this slide?')) {
      this.slides.splice(this.currentSlideIndex, 1);
      this.isModified = true;
      if (this.currentSlideIndex >= this.slides.length) {
        this.currentSlideIndex = this.slides.length - 1;
      }
      this._switchToSlide(this.currentSlideIndex);
    }
  }

  _duplicateSlide() {
    const currentSlide = this.slides[this.currentSlideIndex];
    const duplicatedSlide = {
      id: Date.now(),
      content: currentSlide.content,
      title: currentSlide.title + ' (Copy)',
      background: currentSlide.background
    };
    this.slides.splice(this.currentSlideIndex + 1, 0, duplicatedSlide);
    this.isModified = true;
    this._switchToSlide(this.currentSlideIndex + 1);
  }

  _switchToSlide(index) {
    this.currentSlideIndex = index;
    const slide = this.slides[index];

    // Update editor
    if (this.slideContent) {
      this.slideContent.innerHTML = slide.content || '';
      this.slideContent.parentElement.style.background = slide.background || '#ffffff';
    }

    // Update properties
    if (this.bgInput) {
      this.bgInput.value = slide.background || '#ffffff';
    }
    if (this.titleInput) {
      this.titleInput.value = slide.title || '';
    }

    // Update status
    if (this.slideInfo) {
      this.slideInfo.textContent = `Slide ${index + 1} of ${this.slides.length}`;
    }

    // Update thumbnails
    if (this.thumbnailPanel) {
      this._updateThumbnails(this.thumbnailPanel);
    }
  }

  _applyThemeToCurrentSlide(theme) {
    this.slides[this.currentSlideIndex].background = theme.bg;
    if (this.slideContent) {
      this.slideContent.parentElement.style.background = theme.bg;
      this.slideContent.style.color = theme.text;
    }
    if (this.bgInput) {
      this.bgInput.value = theme.bg;
    }
    this.isModified = true;
    if (this.thumbnailPanel) {
      this._updateThumbnails(this.thumbnailPanel);
    }
  }

  _startPresentation() {
    // Create fullscreen presentation overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:fixed;
      top:0;
      left:0;
      width:100vw;
      height:100vh;
      background:black;
      z-index:100000;
      display:flex;
      align-items:center;
      justify-content:center;
    `;

    const slideDisplay = document.createElement('div');
    slideDisplay.style.cssText = `
      width:90vw;
      height:90vh;
      background:white;
      position:relative;
    `;

    const slideContent = document.createElement('div');
    slideContent.style.cssText = `
      width:100%;
      height:100%;
      padding:40px;
      font-family:Arial, sans-serif;
      font-size:32px;
      overflow:auto;
    `;

    let currentIndex = 0;

    const showSlide = (index) => {
      if (index < 0 || index >= this.slides.length) return;
      currentIndex = index;
      const slide = this.slides[index];
      slideContent.innerHTML = slide.content || '';
      slideDisplay.style.background = slide.background || '#ffffff';
      slideContent.style.color = slide.text || '#000000';
    };

    // Navigation
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '◀';
    prevBtn.style.cssText = 'position:absolute;left:20px;top:50%;transform:translateY(-50%);font-size:48px;background:rgba(255,255,255,0.3);border:none;cursor:pointer;padding:10px 20px;';
    prevBtn.addEventListener('click', () => {
      if (currentIndex > 0) showSlide(currentIndex - 1);
    });

    const nextBtn = document.createElement('button');
    nextBtn.textContent = '▶';
    nextBtn.style.cssText = 'position:absolute;right:20px;top:50%;transform:translateY(-50%);font-size:48px;background:rgba(255,255,255,0.3);border:none;cursor:pointer;padding:10px 20px;';
    nextBtn.addEventListener('click', () => {
      if (currentIndex < this.slides.length - 1) showSlide(currentIndex + 1);
    });

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'position:absolute;top:20px;right:20px;font-size:32px;background:rgba(255,255,255,0.3);border:none;cursor:pointer;padding:10px 20px;';
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });

    // Keyboard navigation
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        if (currentIndex < this.slides.length - 1) showSlide(currentIndex + 1);
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) showSlide(currentIndex - 1);
      } else if (e.key === 'Escape') {
        document.body.removeChild(overlay);
        document.removeEventListener('keydown', handleKeyPress);
      }
    };

    document.addEventListener('keydown', handleKeyPress);

    slideDisplay.appendChild(slideContent);
    overlay.appendChild(slideDisplay);
    overlay.appendChild(prevBtn);
    overlay.appendChild(nextBtn);
    overlay.appendChild(closeBtn);

    document.body.appendChild(overlay);
    showSlide(this.currentSlideIndex);
  }

  async _newPresentation() {
    if (this.isModified && !confirm('You have unsaved changes. Continue?')) {
      return;
    }
    this.currentFile = null;
    this.slides = [{ id: 1, content: '<h1>New Presentation</h1>', title: 'Slide 1', background: '#ffffff' }];
    this.currentSlideIndex = 0;
    this.isModified = false;
    this._switchToSlide(0);
  }

  async _openPresentation() {
    const path = prompt('Enter presentation path:', '/home/user/');
    if (!path) return;

    try {
      const content = await this.context.fs.readFile(path, { encoding: 'utf8' });
      this.slides = JSON.parse(content);
      this.currentFile = path;
      this.currentSlideIndex = 0;
      this.isModified = false;
      this._switchToSlide(0);
    } catch (error) {
      alert(`Error opening presentation: ${error.message}`);
    }
  }

  async _savePresentation() {
    if (!this.currentFile) {
      return this._savePresentationAs();
    }

    try {
      const content = JSON.stringify(this.slides, null, 2);
      await this.context.fs.writeFile(this.currentFile, content, { encoding: 'utf8' });
      this.isModified = false;
      alert('Presentation saved successfully!');
    } catch (error) {
      alert(`Error saving presentation: ${error.message}`);
    }
  }

  async _savePresentationAs() {
    const path = prompt('Enter path to save presentation:', '/home/user/presentation.json');
    if (!path) return;

    try {
      const content = JSON.stringify(this.slides, null, 2);
      await this.context.fs.writeFile(path, content, { encoding: 'utf8' });
      this.currentFile = path;
      this.isModified = false;
      alert('Presentation saved successfully!');
    } catch (error) {
      alert(`Error saving presentation: ${error.message}`);
    }
  }

  async _exportHTML() {
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Presentation</title>
  <style>
    body { margin:0; padding:0; font-family:Arial,sans-serif; }
    .slide { width:100vw; height:100vh; padding:40px; box-sizing:border-box; }
  </style>
</head>
<body>
`;

    this.slides.forEach((slide, index) => {
      html += `
  <div class="slide" style="background:${slide.background || '#ffffff'};">
    ${slide.content}
  </div>
`;
    });

    html += `
</body>
</html>
    `.trim();

    const path = prompt('Enter path to export HTML:', '/home/user/presentation.html');
    if (!path) return;

    try {
      await this.context.fs.writeFile(path, html, { encoding: 'utf8' });
      alert('Presentation exported successfully!');
    } catch (error) {
      alert(`Error exporting presentation: ${error.message}`);
    }
  }
}
