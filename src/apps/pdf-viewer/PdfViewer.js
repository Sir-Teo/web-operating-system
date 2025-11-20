export default class PdfViewer {
  constructor(context) {
    this.context = context;
    this.fs = context.fs;
    this.ipc = context.ipc;
    this.process = context.process;
    this.args = context.args || {};

    this.currentFile = this.args.file || null;
    this.currentPage = 1;
    this.totalPages = 0;
    this.zoom = 100;
    this.pdfData = null;
  }

  async init() {
    if (this.currentFile) {
      await this.loadPdf(this.currentFile);
    }
  }

  render() {
    const container = document.createElement('div');
    container.className = 'pdf-viewer-container';
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #525659;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Toolbar
    const toolbar = this.createToolbar();
    container.appendChild(toolbar);

    // PDF viewer area
    const viewerArea = document.createElement('div');
    viewerArea.style.cssText = `
      flex: 1;
      overflow: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;

    this.viewerArea = viewerArea;

    if (!this.currentFile) {
      const placeholder = this.createPlaceholder();
      viewerArea.appendChild(placeholder);
    } else {
      this.renderPdfContent();
    }

    container.appendChild(viewerArea);

    return container;
  }

  createToolbar() {
    const toolbar = document.createElement('div');
    toolbar.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 15px;
      background: #323639;
      color: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;

    // Left controls
    const leftControls = document.createElement('div');
    leftControls.style.cssText = 'display: flex; align-items: center; gap: 10px;';

    const openBtn = this.createToolbarButton('=Â Open', () => this.showOpenDialog());
    leftControls.appendChild(openBtn);

    if (this.currentFile) {
      const fileName = document.createElement('span');
      fileName.textContent = this.currentFile.split('/').pop();
      fileName.style.cssText = 'margin-left: 10px; opacity: 0.9;';
      leftControls.appendChild(fileName);
    }

    // Center controls - Navigation
    const centerControls = document.createElement('div');
    centerControls.style.cssText = 'display: flex; align-items: center; gap: 10px;';

    if (this.currentFile) {
      const prevBtn = this.createToolbarButton('À', () => this.previousPage());
      prevBtn.disabled = this.currentPage <= 1;

      this.pageInfo = document.createElement('span');
      this.pageInfo.textContent = `${this.currentPage} / ${this.totalPages}`;
      this.pageInfo.style.cssText = 'min-width: 80px; text-align: center;';

      const nextBtn = this.createToolbarButton('¶', () => this.nextPage());
      nextBtn.disabled = this.currentPage >= this.totalPages;

      centerControls.appendChild(prevBtn);
      centerControls.appendChild(this.pageInfo);
      centerControls.appendChild(nextBtn);
    }

    // Right controls - Zoom
    const rightControls = document.createElement('div');
    rightControls.style.cssText = 'display: flex; align-items: center; gap: 10px;';

    if (this.currentFile) {
      const zoomOutBtn = this.createToolbarButton('', () => this.changeZoom(-10));
      const zoomDisplay = document.createElement('span');
      zoomDisplay.textContent = `${this.zoom}%`;
      zoomDisplay.style.cssText = 'min-width: 50px; text-align: center;';
      this.zoomDisplay = zoomDisplay;

      const zoomInBtn = this.createToolbarButton('+', () => this.changeZoom(10));

      rightControls.appendChild(zoomOutBtn);
      rightControls.appendChild(zoomDisplay);
      rightControls.appendChild(zoomInBtn);
    }

    toolbar.appendChild(leftControls);
    toolbar.appendChild(centerControls);
    toolbar.appendChild(rightControls);

    return toolbar;
  }

  createToolbarButton(text, onClick) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.cssText = `
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      background: rgba(255,255,255,0.1);
      color: white;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    `;
    btn.onmouseover = () => btn.style.background = 'rgba(255,255,255,0.2)';
    btn.onmouseout = () => btn.style.background = 'rgba(255,255,255,0.1)';
    btn.onclick = onClick;
    return btn;
  }

  createPlaceholder() {
    const placeholder = document.createElement('div');
    placeholder.style.cssText = `
      text-align: center;
      color: white;
      padding: 60px;
    `;

    const icon = document.createElement('div');
    icon.textContent = '=Ä';
    icon.style.cssText = 'font-size: 80px; margin-bottom: 20px;';

    const text = document.createElement('div');
    text.textContent = 'No PDF file open';
    text.style.cssText = 'font-size: 20px; opacity: 0.7; margin-bottom: 20px;';

    const hint = document.createElement('div');
    hint.textContent = 'Click "Open" to select a PDF file';
    hint.style.cssText = 'font-size: 14px; opacity: 0.5;';

    placeholder.appendChild(icon);
    placeholder.appendChild(text);
    placeholder.appendChild(hint);

    return placeholder;
  }

  async showOpenDialog() {
    const path = prompt('Enter PDF file path:', '/home/document.pdf');
    if (!path) return;

    try {
      await this.loadPdf(path);
      this.currentFile = path;

      // Re-render the entire UI
      const parent = this.viewerArea.parentElement;
      const newRender = this.render();
      parent.replaceWith(newRender);

    } catch (error) {
      alert('Error loading PDF: ' + error.message);
    }
  }

  async loadPdf(path) {
    try {
      const data = await this.fs.readFile(path);
      this.pdfData = data;

      // Simulate PDF parsing
      // In a real implementation, you would use PDF.js library
      this.totalPages = this.simulatePageCount(data);
      this.currentPage = 1;

    } catch (error) {
      throw new Error('Could not read file: ' + error.message);
    }
  }

  simulatePageCount(data) {
    // Simple simulation: estimate pages based on file size
    // In reality, use PDF.js to parse the actual PDF structure
    const sizeInKB = data.length / 1024;
    return Math.max(1, Math.ceil(sizeInKB / 50)); // Rough estimate
  }

  renderPdfContent() {
    this.viewerArea.innerHTML = '';

    const pageContainer = document.createElement('div');
    pageContainer.style.cssText = `
      background: white;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      max-width: 100%;
      position: relative;
    `;

    // Calculate dimensions based on zoom
    const baseWidth = 800;
    const baseHeight = 1000;
    const width = (baseWidth * this.zoom) / 100;
    const height = (baseHeight * this.zoom) / 100;

    pageContainer.style.width = width + 'px';
    pageContainer.style.height = height + 'px';

    // Render page content
    const content = this.renderPage(this.currentPage);
    pageContainer.appendChild(content);

    this.viewerArea.appendChild(pageContainer);
  }

  renderPage(pageNumber) {
    // This is a simplified placeholder
    // In a real implementation, use PDF.js to render actual PDF content

    const page = document.createElement('div');
    page.style.cssText = `
      width: 100%;
      height: 100%;
      padding: 60px;
      box-sizing: border-box;
      overflow: hidden;
    `;

    const pageHeader = document.createElement('div');
    pageHeader.textContent = `PDF Content - Page ${pageNumber}`;
    pageHeader.style.cssText = `
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 30px;
      color: #333;
    `;

    const placeholderText = document.createElement('div');
    placeholderText.innerHTML = `
      <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
        This is a simplified PDF viewer. In a production environment,
        integrate PDF.js library to render actual PDF content.
      </p>
      <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
        PDF.js is Mozilla's open-source PDF rendering library that can:
      </p>
      <ul style="color: #666; line-height: 1.8; padding-left: 30px;">
        <li>Parse and render actual PDF documents</li>
        <li>Handle text extraction and search</li>
        <li>Support annotations and forms</li>
        <li>Render pages as canvas elements</li>
        <li>Handle encrypted PDFs</li>
      </ul>
      <p style="color: #999; font-size: 14px; margin-top: 30px;">
        File: ${this.currentFile || 'No file'}<br>
        Total Pages: ${this.totalPages}<br>
        Current Page: ${pageNumber}<br>
        Zoom: ${this.zoom}%
      </p>
    `;

    page.appendChild(pageHeader);
    page.appendChild(placeholderText);

    return page;
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.renderPdfContent();
      this.pageInfo.textContent = `${this.currentPage} / ${this.totalPages}`;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.renderPdfContent();
      this.pageInfo.textContent = `${this.currentPage} / ${this.totalPages}`;
    }
  }

  changeZoom(delta) {
    this.zoom = Math.max(50, Math.min(200, this.zoom + delta));
    this.zoomDisplay.textContent = `${this.zoom}%`;
    this.renderPdfContent();
  }

  async destroy() {
    // Cleanup
  }
}
