/**
 * Code Formatter - Beautify and format code
 * Supports JavaScript, HTML, CSS, JSON, and more
 */

export class CodeFormatter {
  constructor(editor) {
    this.editor = editor;
  }

  /**
   * Format code based on language
   */
  format(code, language) {
    switch (language) {
      case 'javascript':
      case 'typescript':
      case 'jsx':
      case 'tsx':
        return this.formatJavaScript(code);
      case 'html':
        return this.formatHTML(code);
      case 'css':
      case 'scss':
      case 'less':
        return this.formatCSS(code);
      case 'json':
        return this.formatJSON(code);
      case 'xml':
        return this.formatXML(code);
      case 'sql':
        return this.formatSQL(code);
      default:
        return code;
    }
  }

  /**
   * Format JavaScript code
   */
  formatJavaScript(code) {
    let formatted = code;
    let indentLevel = 0;
    const indentSize = 2;
    const lines = [];
    let currentLine = '';
    let inString = false;
    let stringChar = '';
    let inComment = false;
    let inMultiLineComment = false;

    const indent = () => ' '.repeat(indentLevel * indentSize);

    for (let i = 0; i < formatted.length; i++) {
      const char = formatted[i];
      const nextChar = formatted[i + 1];
      const prevChar = formatted[i - 1];

      // Handle strings
      if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
        currentLine += char;
        continue;
      }

      if (inString) {
        currentLine += char;
        continue;
      }

      // Handle comments
      if (char === '/' && nextChar === '/' && !inMultiLineComment) {
        inComment = true;
        currentLine += char;
        continue;
      }

      if (char === '/' && nextChar === '*') {
        inMultiLineComment = true;
        currentLine += char;
        continue;
      }

      if (char === '*' && nextChar === '/' && inMultiLineComment) {
        currentLine += char + nextChar;
        i++;
        inMultiLineComment = false;
        continue;
      }

      if (inComment && char === '\n') {
        lines.push(currentLine);
        currentLine = '';
        inComment = false;
        continue;
      }

      if (inComment || inMultiLineComment) {
        currentLine += char;
        continue;
      }

      // Format structure
      if (char === '{') {
        currentLine += ' {';
        lines.push(indent() + currentLine.trim());
        indentLevel++;
        currentLine = '';
      } else if (char === '}') {
        if (currentLine.trim()) {
          lines.push(indent() + currentLine.trim());
        }
        indentLevel--;
        lines.push(indent() + '}');
        currentLine = '';
      } else if (char === ';') {
        currentLine += ';';
        lines.push(indent() + currentLine.trim());
        currentLine = '';
      } else if (char === '\n') {
        if (currentLine.trim()) {
          lines.push(indent() + currentLine.trim());
        }
        currentLine = '';
      } else {
        currentLine += char;
      }
    }

    if (currentLine.trim()) {
      lines.push(indent() + currentLine.trim());
    }

    return lines.join('\n');
  }

  /**
   * Format HTML code
   */
  formatHTML(code) {
    let formatted = '';
    let indentLevel = 0;
    const indentSize = 2;
    const indent = () => ' '.repeat(indentLevel * indentSize);

    // Remove extra whitespace
    code = code.replace(/>\s+</g, '><');

    let i = 0;
    while (i < code.length) {
      if (code[i] === '<') {
        // Find tag end
        const tagEnd = code.indexOf('>', i);
        const tag = code.substring(i, tagEnd + 1);

        // Check if closing tag
        if (tag.startsWith('</')) {
          indentLevel--;
          formatted += indent() + tag + '\n';
        }
        // Check if self-closing
        else if (tag.endsWith('/>') || tag.match(/<(img|br|hr|input|meta|link)/)) {
          formatted += indent() + tag + '\n';
        }
        // Opening tag
        else {
          formatted += indent() + tag + '\n';
          indentLevel++;
        }

        i = tagEnd + 1;
      } else {
        // Text content
        let text = '';
        while (i < code.length && code[i] !== '<') {
          text += code[i];
          i++;
        }
        text = text.trim();
        if (text) {
          formatted += indent() + text + '\n';
        }
      }
    }

    return formatted.trim();
  }

  /**
   * Format CSS code
   */
  formatCSS(code) {
    let formatted = '';
    let indentLevel = 0;
    const indentSize = 2;
    const indent = () => ' '.repeat(indentLevel * indentSize);

    // Remove extra whitespace
    code = code.replace(/\s+/g, ' ').trim();

    let i = 0;
    while (i < code.length) {
      const char = code[i];

      if (char === '{') {
        formatted += ' {\n';
        indentLevel++;
      } else if (char === '}') {
        indentLevel--;
        formatted += '\n' + indent() + '}\n';
      } else if (char === ';') {
        formatted += ';\n' + indent();
      } else if (char === ',') {
        formatted += ',\n' + indent();
      } else {
        formatted += char;
      }

      i++;
    }

    // Clean up extra newlines
    formatted = formatted.replace(/\n\s*\n/g, '\n');

    return formatted.trim();
  }

  /**
   * Format JSON code
   */
  formatJSON(code) {
    try {
      const parsed = JSON.parse(code);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      throw new Error('Invalid JSON: ' + error.message);
    }
  }

  /**
   * Format XML code
   */
  formatXML(code) {
    // Similar to HTML formatting
    return this.formatHTML(code);
  }

  /**
   * Format SQL code
   */
  formatSQL(code) {
    const keywords = [
      'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
      'ON', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET',
      'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'TABLE',
      'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN', 'IS', 'NULL'
    ];

    let formatted = code;

    // Add newlines before major keywords
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      formatted = formatted.replace(regex, '\n' + keyword.toUpperCase());
    });

    // Clean up
    formatted = formatted
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');

    return formatted.trim();
  }

  /**
   * Format current editor content
   */
  formatEditor() {
    if (!this.editor) return;

    const model = this.editor.getModel();
    if (!model) return;

    const code = model.getValue();
    const language = model.getLanguageId();

    try {
      const formatted = this.format(code, language);

      // Apply formatted code
      model.setValue(formatted);

      return {
        success: true,
        message: 'Code formatted successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Format error: ' + error.message
      };
    }
  }

  /**
   * Minify code (opposite of format)
   */
  minify(code, language) {
    switch (language) {
      case 'javascript':
      case 'typescript':
        return this.minifyJavaScript(code);
      case 'css':
        return this.minifyCSS(code);
      case 'json':
        return this.minifyJSON(code);
      default:
        return code;
    }
  }

  /**
   * Minify JavaScript
   */
  minifyJavaScript(code) {
    // Basic minification (remove comments and extra whitespace)
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
      .replace(/\/\/.*/g, '') // Remove single-line comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/\s*([{}();,:])\s*/g, '$1') // Remove whitespace around operators
      .trim();
  }

  /**
   * Minify CSS
   */
  minifyCSS(code) {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/\s*([{}:;,])\s*/g, '$1') // Remove whitespace
      .trim();
  }

  /**
   * Minify JSON
   */
  minifyJSON(code) {
    try {
      const parsed = JSON.parse(code);
      return JSON.stringify(parsed);
    } catch (error) {
      throw new Error('Invalid JSON: ' + error.message);
    }
  }
}
