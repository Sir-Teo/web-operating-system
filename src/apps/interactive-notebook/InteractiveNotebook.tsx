/**
 * Interactive Notebook
 * Jupyter-style notebook for exploratory programming and data science
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  RuntimeManager,
  getLanguageInfo,
  SUPPORTED_LANGUAGES,
  type ExecutionResult,
} from '../../system/runtime';
import { getFileSystem } from '../../system/filesystem/FileSystemService';

interface NotebookCell {
  id: string;
  type: 'code' | 'markdown';
  content: string;
  output?: string;
  executionTime?: number;
  success?: boolean;
  executionCount?: number;
}

interface NotebookProps {
  windowId: string;
}

const InteractiveNotebook: React.FC<NotebookProps> = ({ windowId }) => {
  const [runtimeManager] = useState(() => RuntimeManager.getInstance());
  const [language, setLanguage] = useState('python');
  const [cells, setCells] = useState<NotebookCell[]>([
    { id: '1', type: 'markdown', content: '# Interactive Notebook\n\nWelcome to your interactive programming environment!' },
    { id: '2', type: 'code', content: '', executionCount: 0 },
  ]);
  const [selectedCell, setSelectedCell] = useState<string>('2');
  const [isRunning, setIsRunning] = useState(false);
  const [notebookName, setNotebookName] = useState('Untitled Notebook');
  const [isEditingName, setIsEditingName] = useState(false);
  const [globalExecutionCount, setGlobalExecutionCount] = useState(0);
  const cellRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});

  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  const addCell = (type: 'code' | 'markdown', afterId?: string) => {
    const newCell: NotebookCell = {
      id: generateId(),
      type,
      content: '',
      executionCount: type === 'code' ? 0 : undefined,
    };

    if (afterId) {
      const index = cells.findIndex(c => c.id === afterId);
      const newCells = [...cells];
      newCells.splice(index + 1, 0, newCell);
      setCells(newCells);
    } else {
      setCells([...cells, newCell]);
    }

    setSelectedCell(newCell.id);
    setTimeout(() => {
      cellRefs.current[newCell.id]?.focus();
    }, 100);
  };

  const deleteCell = (id: string) => {
    if (cells.length === 1) return;
    setCells(cells.filter(c => c.id !== id));
    if (selectedCell === id) {
      setSelectedCell(cells[0].id);
    }
  };

  const moveCell = (id: string, direction: 'up' | 'down') => {
    const index = cells.findIndex(c => c.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === cells.length - 1)
    ) {
      return;
    }

    const newCells = [...cells];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newCells[index], newCells[targetIndex]] = [newCells[targetIndex], newCells[index]];
    setCells(newCells);
  };

  const updateCell = (id: string, updates: Partial<NotebookCell>) => {
    setCells(cells.map(c => (c.id === id ? { ...c, ...updates } : c)));
  };

  const runCell = async (id: string) => {
    const cell = cells.find(c => c.id === id);
    if (!cell || cell.type !== 'code' || !cell.content.trim()) return;

    setIsRunning(true);
    const execCount = globalExecutionCount + 1;
    setGlobalExecutionCount(execCount);

    updateCell(id, {
      output: 'Running...',
      success: true,
      executionCount: execCount,
    });

    try {
      const result: ExecutionResult = await runtimeManager.execute(language, cell.content);

      updateCell(id, {
        output: result.output || (result.error ? '' : '(No output)'),
        executionTime: result.executionTime,
        success: result.success,
        executionCount: execCount,
      });

      if (!result.success && result.error) {
        updateCell(id, {
          output: (result.output || '') + '\n\n❌ Error:\n' + result.error,
          success: false,
        });
      }
    } catch (error) {
      updateCell(id, {
        output: `❌ Execution failed:\n${error}`,
        success: false,
        executionCount: execCount,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runAllCells = async () => {
    for (const cell of cells) {
      if (cell.type === 'code' && cell.content.trim()) {
        await runCell(cell.id);
      }
    }
  };

  const clearAllOutputs = () => {
    setCells(cells.map(c => ({ ...c, output: undefined, executionTime: undefined })));
  };

  const saveNotebook = async () => {
    const fs = getFileSystem();
    const notebookData = {
      language,
      cells: cells.map(c => ({
        type: c.type,
        content: c.content,
        // Don't save output or execution counts
      })),
    };

    try {
      const filename = `/home/notebooks/${notebookName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
      await fs.writeFile(filename, JSON.stringify(notebookData, null, 2));
      alert(`Notebook saved to ${filename}`);
    } catch (error) {
      alert(`Failed to save notebook: ${error}`);
    }
  };

  const loadNotebook = async (filename: string) => {
    const fs = getFileSystem();
    try {
      const content = await fs.readFile(filename);
      const notebookData = JSON.parse(content);

      setLanguage(notebookData.language || 'python');
      setCells(
        notebookData.cells.map((c: any) => ({
          id: generateId(),
          type: c.type,
          content: c.content,
          executionCount: c.type === 'code' ? 0 : undefined,
        }))
      );
      setNotebookName(filename.split('/').pop()?.replace('.json', '') || 'Untitled Notebook');
    } catch (error) {
      alert(`Failed to load notebook: ${error}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, cellId: string) => {
    // Shift+Enter: Run cell and move to next
    if (e.shiftKey && e.key === 'Enter') {
      e.preventDefault();
      runCell(cellId);
      const index = cells.findIndex(c => c.id === cellId);
      if (index < cells.length - 1) {
        setSelectedCell(cells[index + 1].id);
        cellRefs.current[cells[index + 1].id]?.focus();
      } else {
        addCell('code', cellId);
      }
    }

    // Ctrl+Enter: Run cell
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      runCell(cellId);
    }

    // Alt+Enter: Run cell and insert new cell below
    if (e.altKey && e.key === 'Enter') {
      e.preventDefault();
      runCell(cellId);
      addCell('code', cellId);
    }
  };

  const renderMarkdown = (content: string) => {
    // Simple markdown rendering
    let html = content
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br/>');

    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div className="interactive-notebook">
      <style>{`
        .interactive-notebook {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #fafafa;
          color: #333;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }

        .in-toolbar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: #fff;
          border-bottom: 1px solid #e0e0e0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .in-notebook-name {
          font-size: 16px;
          font-weight: 600;
          padding: 4px 8px;
          border: 1px solid transparent;
          border-radius: 4px;
          cursor: pointer;
        }

        .in-notebook-name:hover {
          background: #f5f5f5;
        }

        .in-notebook-name.editing {
          border-color: #2196F3;
          background: #fff;
          cursor: text;
        }

        .in-toolbar select {
          padding: 6px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: #fff;
          font-size: 13px;
          cursor: pointer;
        }

        .in-toolbar button {
          padding: 6px 14px;
          background: #2196F3;
          border: none;
          border-radius: 4px;
          color: #fff;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .in-toolbar button:hover:not(:disabled) {
          background: #1976D2;
        }

        .in-toolbar button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .in-toolbar button.secondary {
          background: #fff;
          color: #333;
          border: 1px solid #ddd;
        }

        .in-toolbar button.secondary:hover:not(:disabled) {
          background: #f5f5f5;
        }

        .in-toolbar .spacer {
          flex: 1;
        }

        .in-cells-container {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .in-cell {
          margin-bottom: 16px;
          background: #fff;
          border: 2px solid transparent;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: all 0.2s;
        }

        .in-cell.selected {
          border-color: #2196F3;
          box-shadow: 0 2px 8px rgba(33, 150, 243, 0.2);
        }

        .in-cell-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #f8f8f8;
          border-bottom: 1px solid #e0e0e0;
          font-size: 12px;
        }

        .in-cell-type {
          font-weight: 600;
          text-transform: uppercase;
          color: #666;
        }

        .in-cell-actions {
          display: flex;
          gap: 4px;
        }

        .in-cell-action {
          padding: 4px 8px;
          background: transparent;
          border: none;
          color: #666;
          cursor: pointer;
          border-radius: 3px;
          font-size: 11px;
        }

        .in-cell-action:hover {
          background: #e0e0e0;
        }

        .in-cell-content {
          padding: 12px;
        }

        .in-cell-content textarea {
          width: 100%;
          min-height: 60px;
          background: transparent;
          border: none;
          color: #333;
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 14px;
          line-height: 1.6;
          resize: vertical;
          outline: none;
        }

        .in-cell-content.markdown textarea {
          font-family: 'Segoe UI', system-ui, sans-serif;
        }

        .in-markdown-preview {
          padding: 12px;
          line-height: 1.6;
        }

        .in-markdown-preview h1 {
          font-size: 28px;
          margin: 16px 0 12px 0;
        }

        .in-markdown-preview h2 {
          font-size: 22px;
          margin: 14px 0 10px 0;
        }

        .in-markdown-preview h3 {
          font-size: 18px;
          margin: 12px 0 8px 0;
        }

        .in-markdown-preview code {
          background: #f5f5f5;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Consolas', monospace;
          font-size: 13px;
        }

        .in-cell-output {
          padding: 12px;
          background: #f8f8f8;
          border-top: 1px solid #e0e0e0;
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 13px;
          line-height: 1.6;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .in-cell-output.error {
          background: #ffebee;
          color: #c62828;
        }

        .in-cell-footer {
          padding: 6px 12px;
          background: #f8f8f8;
          border-top: 1px solid #e0e0e0;
          font-size: 11px;
          color: #666;
          display: flex;
          justify-content: space-between;
        }

        .in-execution-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          background: #e3f2fd;
          color: #1976d2;
          border-radius: 10px;
          font-weight: 600;
        }

        .in-add-cell-buttons {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          justify-content: center;
        }

        .in-add-cell-buttons button {
          padding: 8px 16px;
          background: #fff;
          border: 1px dashed #ccc;
          border-radius: 4px;
          color: #666;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .in-add-cell-buttons button:hover {
          background: #f5f5f5;
          border-color: #999;
        }

        .in-shortcuts-hint {
          padding: 12px;
          background: #e3f2fd;
          border-radius: 6px;
          font-size: 12px;
          color: #1976d2;
          margin-top: 20px;
        }

        .in-shortcuts-hint strong {
          font-weight: 600;
        }
      `}</style>

      <div className="in-toolbar">
        {isEditingName ? (
          <input
            className="in-notebook-name editing"
            value={notebookName}
            onChange={e => setNotebookName(e.target.value)}
            onBlur={() => setIsEditingName(false)}
            onKeyDown={e => e.key === 'Enter' && setIsEditingName(false)}
            autoFocus
          />
        ) : (
          <span className="in-notebook-name" onClick={() => setIsEditingName(true)}>
            {notebookName}
          </span>
        )}

        <select value={language} onChange={e => setLanguage(e.target.value)}>
          {SUPPORTED_LANGUAGES.map(lang => (
            <option key={lang.id} value={lang.id}>
              {lang.icon} {lang.name}
            </option>
          ))}
        </select>

        <button onClick={runAllCells} disabled={isRunning}>
          ▶ Run All
        </button>

        <button className="secondary" onClick={clearAllOutputs}>
          Clear Outputs
        </button>

        <button className="secondary" onClick={saveNotebook}>
          💾 Save
        </button>

        <div className="spacer" />

        <button className="secondary" onClick={() => addCell('code')}>
          + Code
        </button>

        <button className="secondary" onClick={() => addCell('markdown')}>
          + Markdown
        </button>
      </div>

      <div className="in-cells-container">
        {cells.map((cell, index) => (
          <div
            key={cell.id}
            className={`in-cell ${selectedCell === cell.id ? 'selected' : ''}`}
            onClick={() => setSelectedCell(cell.id)}
          >
            <div className="in-cell-header">
              <span className="in-cell-type">
                {cell.type === 'code' ? '[ ]' : 'MD'} {cell.type}
                {cell.type === 'code' && cell.executionCount ? ` [${cell.executionCount}]` : ''}
              </span>
              <div className="in-cell-actions">
                <button
                  className="in-cell-action"
                  onClick={() => moveCell(cell.id, 'up')}
                  disabled={index === 0}
                >
                  ↑
                </button>
                <button
                  className="in-cell-action"
                  onClick={() => moveCell(cell.id, 'down')}
                  disabled={index === cells.length - 1}
                >
                  ↓
                </button>
                {cell.type === 'code' && (
                  <button
                    className="in-cell-action"
                    onClick={() => runCell(cell.id)}
                    disabled={isRunning}
                  >
                    ▶ Run
                  </button>
                )}
                <button className="in-cell-action" onClick={() => deleteCell(cell.id)}>
                  🗑️
                </button>
              </div>
            </div>

            <div className={`in-cell-content ${cell.type}`}>
              <textarea
                ref={el => (cellRefs.current[cell.id] = el)}
                value={cell.content}
                onChange={e => updateCell(cell.id, { content: e.target.value })}
                onKeyDown={e => handleKeyDown(e, cell.id)}
                placeholder={
                  cell.type === 'code'
                    ? 'Write your code here... (Shift+Enter to run)'
                    : 'Write markdown here...'
                }
                spellCheck={false}
              />
            </div>

            {cell.type === 'markdown' && cell.content && (
              <div className="in-markdown-preview">{renderMarkdown(cell.content)}</div>
            )}

            {cell.output !== undefined && (
              <>
                <div className={`in-cell-output ${cell.success === false ? 'error' : ''}`}>
                  {cell.output}
                </div>
                {cell.executionTime !== undefined && (
                  <div className="in-cell-footer">
                    <span>⏱️ {cell.executionTime.toFixed(2)}ms</span>
                    {cell.executionCount && (
                      <span className="in-execution-badge">Run #{cell.executionCount}</span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ))}

        <div className="in-add-cell-buttons">
          <button onClick={() => addCell('code')}>+ Add Code Cell</button>
          <button onClick={() => addCell('markdown')}>+ Add Markdown Cell</button>
        </div>

        <div className="in-shortcuts-hint">
          <strong>Keyboard Shortcuts:</strong> Shift+Enter (run and move), Ctrl+Enter (run), Alt+Enter (run and insert)
        </div>
      </div>
    </div>
  );
};

export default InteractiveNotebook;
