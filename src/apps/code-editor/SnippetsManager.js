/**
 * Snippets Manager - Code Snippets System
 * Provides reusable code templates for rapid development
 */

export class SnippetsManager {
  constructor(editor) {
    this.editor = editor;
    this.snippets = this.loadDefaultSnippets();
    this.customSnippets = this.loadCustomSnippets();
    this.panel = null;
    this.isVisible = false;
  }

  /**
   * Load default code snippets for various languages
   */
  loadDefaultSnippets() {
    return {
      javascript: {
        'func': {
          prefix: 'func',
          body: [
            'function ${1:functionName}(${2:params}) {',
            '\t${3:// function body}',
            '\treturn ${4:value};',
            '}'
          ],
          description: 'Function declaration'
        },
        'arrow': {
          prefix: 'arrow',
          body: [
            'const ${1:name} = (${2:params}) => {',
            '\t${3:// function body}',
            '\treturn ${4:value};',
            '};'
          ],
          description: 'Arrow function'
        },
        'class': {
          prefix: 'class',
          body: [
            'class ${1:ClassName} {',
            '\tconstructor(${2:params}) {',
            '\t\t${3:// constructor}',
            '\t}',
            '',
            '\t${4:methodName}() {',
            '\t\t${5:// method body}',
            '\t}',
            '}'
          ],
          description: 'Class declaration'
        },
        'async': {
          prefix: 'async',
          body: [
            'async function ${1:functionName}(${2:params}) {',
            '\ttry {',
            '\t\tconst ${3:result} = await ${4:promise};',
            '\t\treturn ${3:result};',
            '\t} catch (error) {',
            '\t\tconsole.error(\'Error:\', error);',
            '\t\tthrow error;',
            '\t}',
            '}'
          ],
          description: 'Async function with error handling'
        },
        'promise': {
          prefix: 'promise',
          body: [
            'new Promise((resolve, reject) => {',
            '\t${1:// async operation}',
            '\tif (${2:condition}) {',
            '\t\tresolve(${3:value});',
            '\t} else {',
            '\t\treject(${4:error});',
            '\t}',
            '})'
          ],
          description: 'Promise declaration'
        },
        'foreach': {
          prefix: 'foreach',
          body: [
            '${1:array}.forEach((${2:item}) => {',
            '\t${3:// operation}',
            '});'
          ],
          description: 'forEach loop'
        },
        'map': {
          prefix: 'map',
          body: [
            'const ${1:result} = ${2:array}.map((${3:item}) => {',
            '\treturn ${4:item};',
            '});'
          ],
          description: 'Array map'
        },
        'filter': {
          prefix: 'filter',
          body: [
            'const ${1:filtered} = ${2:array}.filter((${3:item}) => {',
            '\treturn ${4:condition};',
            '});'
          ],
          description: 'Array filter'
        },
        'reduce': {
          prefix: 'reduce',
          body: [
            'const ${1:result} = ${2:array}.reduce((${3:acc}, ${4:item}) => {',
            '\treturn ${5:acc};',
            '}, ${6:initialValue});'
          ],
          description: 'Array reduce'
        },
        'trycatch': {
          prefix: 'trycatch',
          body: [
            'try {',
            '\t${1:// code}',
            '} catch (error) {',
            '\tconsole.error(\'Error:\', error);',
            '\t${2:// error handling}',
            '}'
          ],
          description: 'Try-catch block'
        },
        'import': {
          prefix: 'import',
          body: [
            'import ${1:module} from \'${2:path}\';'
          ],
          description: 'Import statement'
        },
        'export': {
          prefix: 'export',
          body: [
            'export ${1:default} ${2:name};'
          ],
          description: 'Export statement'
        },
        'module': {
          prefix: 'module',
          body: [
            '/**',
            ' * ${1:Module description}',
            ' */',
            '',
            'export default class ${2:ModuleName} {',
            '\tconstructor(${3:params}) {',
            '\t\t${4:// initialization}',
            '\t}',
            '',
            '\t/**',
            '\t * ${5:Method description}',
            '\t */',
            '\t${6:methodName}() {',
            '\t\t${7:// method body}',
            '\t}',
            '}'
          ],
          description: 'Module template'
        },
        'react-component': {
          prefix: 'rfc',
          body: [
            'import React from \'react\';',
            '',
            'export default function ${1:ComponentName}({ ${2:props} }) {',
            '\treturn (',
            '\t\t<div>',
            '\t\t\t${3:// JSX}',
            '\t\t</div>',
            '\t);',
            '}'
          ],
          description: 'React functional component'
        },
        'react-hooks': {
          prefix: 'useState',
          body: [
            'const [${1:state}, set${1/(.*)/${1:/capitalize}/}] = useState(${2:initialValue});'
          ],
          description: 'React useState hook'
        },
        'useEffect': {
          prefix: 'useEffect',
          body: [
            'useEffect(() => {',
            '\t${1:// effect}',
            '\t',
            '\treturn () => {',
            '\t\t${2:// cleanup}',
            '\t};',
            '}, [${3:dependencies}]);'
          ],
          description: 'React useEffect hook'
        },
        'test': {
          prefix: 'test',
          body: [
            'describe(\'${1:TestSuite}\', () => {',
            '\ttest(\'${2:test description}\', () => {',
            '\t\t${3:// test code}',
            '\t\texpect(${4:actual}).toBe(${5:expected});',
            '\t});',
            '});'
          ],
          description: 'Test suite'
        }
      },
      html: {
        'html5': {
          prefix: 'html5',
          body: [
            '<!DOCTYPE html>',
            '<html lang="en">',
            '<head>',
            '\t<meta charset="UTF-8">',
            '\t<meta name="viewport" content="width=device-width, initial-scale=1.0">',
            '\t<title>${1:Document}</title>',
            '</head>',
            '<body>',
            '\t${2:<!-- content -->}',
            '</body>',
            '</html>'
          ],
          description: 'HTML5 template'
        },
        'link': {
          prefix: 'link',
          body: [
            '<link rel="${1:stylesheet}" href="${2:path}">'
          ],
          description: 'Link tag'
        },
        'script': {
          prefix: 'script',
          body: [
            '<script src="${1:path}"></script>'
          ],
          description: 'Script tag'
        },
        'div': {
          prefix: 'div',
          body: [
            '<div class="${1:className}">',
            '\t${2:content}',
            '</div>'
          ],
          description: 'Div element'
        },
        'form': {
          prefix: 'form',
          body: [
            '<form action="${1:action}" method="${2:post}">',
            '\t${3:<!-- form fields -->}',
            '\t<button type="submit">${4:Submit}</button>',
            '</form>'
          ],
          description: 'Form element'
        }
      },
      css: {
        'media': {
          prefix: 'media',
          body: [
            '@media (${1:max-width}: ${2:768px}) {',
            '\t${3:/* styles */}',
            '}'
          ],
          description: 'Media query'
        },
        'flexbox': {
          prefix: 'flexbox',
          body: [
            'display: flex;',
            'justify-content: ${1:center};',
            'align-items: ${2:center};',
            'gap: ${3:1rem};'
          ],
          description: 'Flexbox layout'
        },
        'grid': {
          prefix: 'grid',
          body: [
            'display: grid;',
            'grid-template-columns: ${1:repeat(3, 1fr)};',
            'gap: ${2:1rem};'
          ],
          description: 'Grid layout'
        },
        'animation': {
          prefix: 'animation',
          body: [
            '@keyframes ${1:animationName} {',
            '\t0% {',
            '\t\t${2:/* start */}',
            '\t}',
            '\t100% {',
            '\t\t${3:/* end */}',
            '\t}',
            '}',
            '',
            'animation: ${1:animationName} ${4:1s} ${5:ease-in-out};'
          ],
          description: 'CSS animation'
        }
      },
      python: {
        'def': {
          prefix: 'def',
          body: [
            'def ${1:function_name}(${2:params}):',
            '\t"""${3:Docstring}"""',
            '\t${4:pass}'
          ],
          description: 'Function definition'
        },
        'class': {
          prefix: 'class',
          body: [
            'class ${1:ClassName}:',
            '\t"""${2:Docstring}"""',
            '\t',
            '\tdef __init__(self, ${3:params}):',
            '\t\t${4:pass}',
            '\t',
            '\tdef ${5:method_name}(self):',
            '\t\t${6:pass}'
          ],
          description: 'Class definition'
        },
        'main': {
          prefix: 'main',
          body: [
            'def main():',
            '\t${1:pass}',
            '',
            'if __name__ == "__main__":',
            '\tmain()'
          ],
          description: 'Main function'
        },
        'trycatch': {
          prefix: 'try',
          body: [
            'try:',
            '\t${1:pass}',
            'except ${2:Exception} as e:',
            '\tprint(f"Error: {e}")',
            '\t${3:pass}'
          ],
          description: 'Try-except block'
        }
      },
      json: {
        'package': {
          prefix: 'package',
          body: [
            '{',
            '\t"name": "${1:package-name}",',
            '\t"version": "1.0.0",',
            '\t"description": "${2:description}",',
            '\t"main": "index.js",',
            '\t"scripts": {',
            '\t\t"test": "echo \\"Error: no test specified\\" && exit 1"',
            '\t},',
            '\t"keywords": [],',
            '\t"author": "",',
            '\t"license": "MIT"',
            '}'
          ],
          description: 'package.json template'
        }
      }
    };
  }

  /**
   * Load custom user snippets from localStorage
   */
  loadCustomSnippets() {
    try {
      const saved = localStorage.getItem('code-editor-custom-snippets');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Error loading custom snippets:', error);
      return {};
    }
  }

  /**
   * Save custom snippets to localStorage
   */
  saveCustomSnippets() {
    try {
      localStorage.setItem('code-editor-custom-snippets', JSON.stringify(this.customSnippets));
    } catch (error) {
      console.error('Error saving custom snippets:', error);
    }
  }

  /**
   * Get snippets for a specific language
   */
  getSnippetsForLanguage(language) {
    return {
      ...(this.snippets[language] || {}),
      ...(this.customSnippets[language] || {})
    };
  }

  /**
   * Insert snippet at cursor position
   */
  insertSnippet(snippetBody) {
    if (!this.editor) return;

    const model = this.editor.getModel();
    const position = this.editor.getPosition();

    if (!model || !position) return;

    // Join snippet body lines
    const snippetText = Array.isArray(snippetBody) ? snippetBody.join('\n') : snippetBody;

    // Parse snippet variables (simple implementation)
    const parsedSnippet = this.parseSnippet(snippetText);

    // Insert text
    this.editor.executeEdits('snippet', [{
      range: {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      },
      text: parsedSnippet,
      forceMoveMarkers: true
    }]);

    // Focus editor
    this.editor.focus();
  }

  /**
   * Parse snippet variables (basic implementation)
   */
  parseSnippet(snippet) {
    // Replace ${n:placeholder} with placeholder (basic implementation)
    return snippet.replace(/\$\{\d+:([^}]+)\}/g, '$1')
                 .replace(/\$\{\d+\}/g, '')
                 .replace(/\$\d+/g, '');
  }

  /**
   * Add custom snippet
   */
  addCustomSnippet(language, key, snippet) {
    if (!this.customSnippets[language]) {
      this.customSnippets[language] = {};
    }
    this.customSnippets[language][key] = snippet;
    this.saveCustomSnippets();
  }

  /**
   * Initialize and render the snippets panel
   */
  initialize(container) {
    this.container = container;
    this.createPanel();
  }

  /**
   * Create the snippets panel
   */
  createPanel() {
    this.panel = document.createElement('div');
    this.panel.className = 'snippets-panel';
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
      <div class="snippets-header">
        <h3>Code Snippets</h3>
        <button class="close-btn" id="close-snippets">×</button>
      </div>
      <div class="snippets-search">
        <input type="text" id="snippet-search" placeholder="Search snippets..." />
      </div>
      <div class="snippets-content" id="snippets-list"></div>
      <div class="snippets-footer">
        <button class="btn-primary" id="add-snippet-btn">+ Add Custom Snippet</button>
      </div>

      <style>
        .snippets-panel {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 600px;
          max-height: 500px;
          background: #1e1e1e;
          border: 1px solid #3e3e3e;
          border-radius: 8px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          z-index: 10000;
          display: flex;
          flex-direction: column;
        }

        .snippets-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          border-bottom: 1px solid #3e3e3e;
          background: #252526;
        }

        .snippets-header h3 {
          margin: 0;
          color: #d4d4d4;
          font-size: 16px;
        }

        .snippets-search {
          padding: 15px 20px;
          border-bottom: 1px solid #3e3e3e;
        }

        .snippets-search input {
          width: 100%;
          padding: 8px 12px;
          background: #3c3c3c;
          border: 1px solid #565656;
          border-radius: 4px;
          color: #d4d4d4;
          font-size: 14px;
          outline: none;
        }

        .snippets-search input:focus {
          border-color: #007acc;
        }

        .snippets-content {
          flex: 1;
          overflow-y: auto;
          padding: 10px;
        }

        .snippet-item {
          padding: 12px 15px;
          margin: 5px 0;
          background: #2d2d2d;
          border: 1px solid #3e3e3e;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .snippet-item:hover {
          background: #3e3e3e;
          border-color: #007acc;
        }

        .snippet-prefix {
          font-weight: bold;
          color: #4ec9b0;
          font-family: 'Consolas', monospace;
        }

        .snippet-description {
          color: #969696;
          font-size: 12px;
          margin-top: 4px;
        }

        .snippet-language {
          display: inline-block;
          padding: 2px 6px;
          background: #007acc;
          color: white;
          font-size: 10px;
          border-radius: 3px;
          margin-right: 8px;
        }

        .snippets-footer {
          padding: 15px 20px;
          border-top: 1px solid #3e3e3e;
          display: flex;
          justify-content: flex-end;
        }

        .btn-primary {
          padding: 8px 16px;
          background: #007acc;
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
          font-size: 13px;
        }

        .btn-primary:hover {
          background: #005a9e;
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
        }
      </style>
    `;
  }

  /**
   * Render snippets list
   */
  renderSnippetsList(searchTerm = '') {
    const listContainer = this.panel.querySelector('#snippets-list');
    if (!listContainer) return;

    let html = '';

    // Combine default and custom snippets
    const allLanguages = new Set([
      ...Object.keys(this.snippets),
      ...Object.keys(this.customSnippets)
    ]);

    for (const language of allLanguages) {
      const languageSnippets = this.getSnippetsForLanguage(language);

      for (const [key, snippet] of Object.entries(languageSnippets)) {
        // Filter by search term
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const matchesPrefix = snippet.prefix.toLowerCase().includes(searchLower);
          const matchesDesc = snippet.description.toLowerCase().includes(searchLower);
          const matchesLang = language.toLowerCase().includes(searchLower);

          if (!matchesPrefix && !matchesDesc && !matchesLang) {
            continue;
          }
        }

        html += `
          <div class="snippet-item" data-language="${language}" data-key="${key}">
            <div>
              <span class="snippet-language">${language}</span>
              <span class="snippet-prefix">${snippet.prefix}</span>
            </div>
            <div class="snippet-description">${snippet.description}</div>
          </div>
        `;
      }
    }

    if (!html) {
      html = '<div style="text-align: center; color: #969696; padding: 40px;">No snippets found</div>';
    }

    listContainer.innerHTML = html;

    // Attach click listeners to snippet items
    listContainer.querySelectorAll('.snippet-item').forEach(item => {
      item.addEventListener('click', () => {
        const language = item.dataset.language;
        const key = item.dataset.key;
        const snippet = this.getSnippetsForLanguage(language)[key];

        if (snippet) {
          this.insertSnippet(snippet.body);
          this.hide();
        }
      });
    });
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close button
    this.panel.querySelector('#close-snippets')?.addEventListener('click', () => {
      this.hide();
    });

    // Search
    this.panel.querySelector('#snippet-search')?.addEventListener('input', (e) => {
      this.renderSnippetsList(e.target.value);
    });

    // Add custom snippet
    this.panel.querySelector('#add-snippet-btn')?.addEventListener('click', () => {
      this.showAddSnippetDialog();
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });
  }

  /**
   * Show add snippet dialog
   */
  showAddSnippetDialog() {
    const language = prompt('Language (e.g., javascript, html, css):');
    if (!language) return;

    const prefix = prompt('Snippet prefix (trigger):');
    if (!prefix) return;

    const description = prompt('Description:');
    const body = prompt('Snippet body (use \\n for new lines):');

    if (body) {
      this.addCustomSnippet(language, prefix, {
        prefix,
        description: description || 'Custom snippet',
        body: body.split('\\n')
      });

      this.renderSnippetsList();
      alert('Custom snippet added!');
    }
  }

  /**
   * Show the panel
   */
  show() {
    if (!this.panel) return;

    this.panel.style.display = 'flex';
    this.isVisible = true;
    this.renderSnippetsList();

    // Focus search input
    const searchInput = this.panel.querySelector('#snippet-search');
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }
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
   * Cleanup
   */
  destroy() {
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
  }
}
