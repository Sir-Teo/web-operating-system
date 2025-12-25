/**
 * Language Server Protocol (LSP) Client
 *
 * Provides rich code intelligence features:
 * - Auto-completion
 * - Go to definition
 * - Find references
 * - Hover documentation
 * - Diagnostics (errors, warnings)
 * - Code actions (quick fixes, refactoring)
 * - Formatting
 * - Signature help
 * - Rename symbols
 *
 * Supports multiple languages through different LSP servers
 */

export class LSPClient {
  constructor() {
    this.servers = new Map();
    this.workers = new Map();
    this.requestId = 0;
    this.pendingRequests = new Map();
    this.capabilities = new Map();
    this.documents = new Map();

    // LSP server configurations
    this.serverConfigs = {
      typescript: {
        name: 'typescript-language-server',
        languages: ['javascript', 'typescript', 'jsx', 'tsx'],
        entrypoint: '/lsp/typescript-language-server/index.js',
        initOptions: {}
      },
      python: {
        name: 'pyright',
        languages: ['python'],
        entrypoint: '/lsp/pyright/index.js',
        initOptions: {}
      },
      rust: {
        name: 'rust-analyzer',
        languages: ['rust'],
        entrypoint: '/lsp/rust-analyzer/index.js',
        initOptions: {}
      },
      go: {
        name: 'gopls',
        languages: ['go'],
        entrypoint: '/lsp/gopls/index.js',
        initOptions: {}
      },
      json: {
        name: 'vscode-json-languageserver',
        languages: ['json'],
        entrypoint: '/lsp/json-languageserver/index.js',
        initOptions: {}
      },
      html: {
        name: 'vscode-html-languageserver',
        languages: ['html'],
        entrypoint: '/lsp/html-languageserver/index.js',
        initOptions: {}
      },
      css: {
        name: 'vscode-css-languageserver',
        languages: ['css', 'scss', 'less'],
        entrypoint: '/lsp/css-languageserver/index.js',
        initOptions: {}
      }
    };

    this.initialized = false;
  }

  /**
   * Initialize LSP client
   */
  async initialize() {
    console.log('🔧 Initializing LSP Client...');

    // Start LSP servers for common languages
    await this.startServer('typescript');
    await this.startServer('python');
    await this.startServer('json');

    this.initialized = true;
    console.log('✅ LSP Client initialized');
  }

  /**
   * Start an LSP server
   */
  async startServer(languageId) {
    const config = this.serverConfigs[languageId];
    if (!config) {
      throw new Error(`No LSP server configuration for language: ${languageId}`);
    }

    console.log(`  Starting ${config.name}...`);

    try {
      // Create Web Worker for LSP server
      const worker = await this.createLSPWorker(languageId, config);

      this.workers.set(languageId, worker);

      // Initialize the server
      const initResult = await this.sendRequest(languageId, 'initialize', {
        processId: null,
        clientInfo: {
          name: 'WebOS Code Editor',
          version: '1.0.0'
        },
        capabilities: {
          textDocument: {
            synchronization: {
              dynamicRegistration: false,
              willSave: true,
              willSaveWaitUntil: true,
              didSave: true
            },
            completion: {
              dynamicRegistration: false,
              completionItem: {
                snippetSupport: true,
                commitCharactersSupport: true,
                documentationFormat: ['markdown', 'plaintext']
              }
            },
            hover: {
              dynamicRegistration: false,
              contentFormat: ['markdown', 'plaintext']
            },
            signatureHelp: {
              dynamicRegistration: false,
              signatureInformation: {
                documentationFormat: ['markdown', 'plaintext']
              }
            },
            definition: { dynamicRegistration: false },
            references: { dynamicRegistration: false },
            documentHighlight: { dynamicRegistration: false },
            documentSymbol: { dynamicRegistration: false },
            formatting: { dynamicRegistration: false },
            rangeFormatting: { dynamicRegistration: false },
            rename: { dynamicRegistration: false },
            codeAction: { dynamicRegistration: false },
            codeLens: { dynamicRegistration: false }
          },
          workspace: {
            applyEdit: true,
            workspaceEdit: {
              documentChanges: true
            },
            didChangeConfiguration: {
              dynamicRegistration: false
            },
            didChangeWatchedFiles: {
              dynamicRegistration: false
            }
          }
        },
        initializationOptions: config.initOptions,
        workspaceFolders: [
          {
            uri: 'file:///workspace',
            name: 'Workspace'
          }
        ]
      });

      // Store server capabilities
      this.capabilities.set(languageId, initResult.capabilities);

      // Send initialized notification
      await this.sendNotification(languageId, 'initialized', {});

      console.log(`  ✓ ${config.name} started`);

      return worker;
    } catch (error) {
      console.error(`  ✗ Failed to start ${config.name}:`, error);
      throw error;
    }
  }

  /**
   * Create Web Worker for LSP server
   */
  async createLSPWorker(languageId, config) {
    const workerCode = `
      // LSP Server Worker: ${config.name}

      // Mock LSP server implementation
      // In production, this would load the actual LSP server code

      let state = {
        languageId: '${languageId}',
        serverName: '${config.name}',
        capabilities: null,
        documents: new Map()
      };

      self.onmessage = async (event) => {
        const { jsonrpc, id, method, params } = event.data;

        try {
          const result = await handleRequest(method, params);

          if (id !== undefined) {
            // This is a request, send response
            self.postMessage({
              jsonrpc: '2.0',
              id: id,
              result: result
            });
          }
        } catch (error) {
          if (id !== undefined) {
            self.postMessage({
              jsonrpc: '2.0',
              id: id,
              error: {
                code: -32603,
                message: error.message
              }
            });
          }
        }
      };

      async function handleRequest(method, params) {
        switch (method) {
          case 'initialize':
            return handleInitialize(params);

          case 'textDocument/didOpen':
            return handleDidOpen(params);

          case 'textDocument/didChange':
            return handleDidChange(params);

          case 'textDocument/completion':
            return handleCompletion(params);

          case 'textDocument/hover':
            return handleHover(params);

          case 'textDocument/definition':
            return handleDefinition(params);

          case 'textDocument/references':
            return handleReferences(params);

          case 'textDocument/formatting':
            return handleFormatting(params);

          case 'textDocument/rename':
            return handleRename(params);

          case 'initialized':
            return null; // Notification, no response needed

          default:
            console.warn('Unhandled LSP method:', method);
            return null;
        }
      }

      function handleInitialize(params) {
        state.capabilities = {
          textDocumentSync: 1, // Full sync
          completionProvider: {
            resolveProvider: true,
            triggerCharacters: ['.', ':', '<', '"', '/', '@']
          },
          hoverProvider: true,
          definitionProvider: true,
          referencesProvider: true,
          documentFormattingProvider: true,
          renameProvider: true,
          documentSymbolProvider: true,
          codeActionProvider: true
        };

        return {
          capabilities: state.capabilities,
          serverInfo: {
            name: state.serverName,
            version: '1.0.0'
          }
        };
      }

      function handleDidOpen(params) {
        const { textDocument } = params;
        state.documents.set(textDocument.uri, {
          uri: textDocument.uri,
          languageId: textDocument.languageId,
          version: textDocument.version,
          content: textDocument.text
        });
        return null;
      }

      function handleDidChange(params) {
        const { textDocument, contentChanges } = params;
        const doc = state.documents.get(textDocument.uri);

        if (doc) {
          // Full sync - replace entire content
          if (contentChanges[0].text !== undefined) {
            doc.content = contentChanges[0].text;
          }
          doc.version = textDocument.version;
        }

        return null;
      }

      function handleCompletion(params) {
        const { textDocument, position } = params;
        const doc = state.documents.get(textDocument.uri);

        if (!doc) return { items: [] };

        // Mock completions based on language
        const completions = generateCompletions(state.languageId, doc.content, position);

        return { items: completions };
      }

      function generateCompletions(languageId, content, position) {
        const items = [];

        switch (languageId) {
          case 'javascript':
          case 'typescript':
            items.push(
              {
                label: 'console.log',
                kind: 3, // Function
                detail: 'Log to console',
                insertText: 'console.log($1)',
                insertTextFormat: 2 // Snippet
              },
              {
                label: 'function',
                kind: 15, // Keyword
                insertText: 'function $1($2) {\\n  $0\\n}',
                insertTextFormat: 2
              },
              {
                label: 'const',
                kind: 15,
                insertText: 'const $1 = $0',
                insertTextFormat: 2
              },
              {
                label: 'import',
                kind: 15,
                insertText: 'import { $1 } from "$2"',
                insertTextFormat: 2
              }
            );
            break;

          case 'python':
            items.push(
              {
                label: 'print',
                kind: 3,
                detail: 'Print to console',
                insertText: 'print($1)',
                insertTextFormat: 2
              },
              {
                label: 'def',
                kind: 15,
                insertText: 'def $1($2):\\n    $0',
                insertTextFormat: 2
              },
              {
                label: 'class',
                kind: 15,
                insertText: 'class $1:\\n    $0',
                insertTextFormat: 2
              }
            );
            break;
        }

        return items;
      }

      function handleHover(params) {
        const { textDocument, position } = params;

        return {
          contents: {
            kind: 'markdown',
            value: '**Symbol Documentation**\\n\\nHover information would appear here.'
          }
        };
      }

      function handleDefinition(params) {
        return null; // Would return location of symbol definition
      }

      function handleReferences(params) {
        return []; // Would return all references to symbol
      }

      function handleFormatting(params) {
        return []; // Would return text edits to format document
      }

      function handleRename(params) {
        return null; // Would return workspace edit for rename
      }

      console.log('[LSP Worker] ${config.name} ready');
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);

    const worker = typeof Worker !== 'undefined'
      ? new Worker(workerUrl, {
          type: 'module',
          name: `lsp-${languageId}`
        })
      : this.createMockWorker(languageId);

    // Set up message handling
    worker.onmessage = (event) => {
      this.handleServerMessage(languageId, event.data);
    };

    worker.onerror = (error) => {
      console.error(`LSP Worker error (${languageId}):`, error);
    };

    return worker;
  }

  /**
   * Create a mock worker for environments without Web Workers
   */
  createMockWorker(languageId) {
    const mockWorker = {
      onmessage: null,
      onerror: null,
      postMessage: (data) => {
        // Simulate worker processing
        setTimeout(() => {
          if (mockWorker.onmessage) {
            if (data.method === 'initialize') {
              mockWorker.onmessage({
                data: {
                  jsonrpc: '2.0',
                  id: data.id,
                  result: {
                    capabilities: {
                      textDocumentSync: 1,
                      completionProvider: { resolveProvider: true }
                    },
                    serverInfo: {
                      name: `mock-${languageId}`,
                      version: '1.0.0'
                    }
                  }
                }
              });
            } else if (data.method === 'shutdown') {
              mockWorker.onmessage({
                data: {
                  jsonrpc: '2.0',
                  id: data.id,
                  result: null
                }
              });
            } else if (data.id !== undefined) {
              // Generic response for other requests
              mockWorker.onmessage({
                data: {
                  jsonrpc: '2.0',
                  id: data.id,
                  result: {}
                }
              });
            }
          }
        }, 10);
      },
      terminate: () => {}
    };
    return mockWorker;
  }

  /**
   * Handle messages from LSP server
   */
  handleServerMessage(languageId, message) {
    const { id, result, error, method, params } = message;

    if (id !== undefined) {
      // This is a response to a request
      const pending = this.pendingRequests.get(id);
      if (pending) {
        this.pendingRequests.delete(id);

        if (error) {
          pending.reject(new Error(error.message));
        } else {
          pending.resolve(result);
        }
      }
    } else if (method) {
      // This is a notification or request from server
      this.handleServerNotification(languageId, method, params);
    }
  }

  /**
   * Handle notifications from LSP server
   */
  handleServerNotification(languageId, method, params) {
    switch (method) {
      case 'textDocument/publishDiagnostics':
        // Emit diagnostics event
        window.dispatchEvent(new CustomEvent('lsp:diagnostics', {
          detail: { languageId, ...params }
        }));
        break;

      case 'window/showMessage':
        console.log(`[LSP ${languageId}]:`, params.message);
        break;

      default:
        console.log(`[LSP ${languageId}] Notification:`, method, params);
    }
  }

  /**
   * Send request to LSP server
   */
  async sendRequest(languageId, method, params, timeout = 5000) {
    const worker = this.workers.get(languageId);
    if (!worker) {
      throw new Error(`No LSP server for language: ${languageId}`);
    }

    const id = ++this.requestId;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`LSP request timeout: ${method}`));
      }, timeout);

      this.pendingRequests.set(id, {
        resolve: (result) => {
          clearTimeout(timeoutId);
          resolve(result);
        },
        reject: (error) => {
          clearTimeout(timeoutId);
          reject(error);
        }
      });

      worker.postMessage({
        jsonrpc: '2.0',
        id: id,
        method: method,
        params: params
      });
    });
  }

  /**
   * Send notification to LSP server (no response expected)
   */
  async sendNotification(languageId, method, params) {
    const worker = this.workers.get(languageId);
    if (!worker) {
      throw new Error(`No LSP server for language: ${languageId}`);
    }

    worker.postMessage({
      jsonrpc: '2.0',
      method: method,
      params: params
    });
  }

  /**
   * Open document in LSP server
   */
  async openDocument(uri, languageId, version, text) {
    this.documents.set(uri, { uri, languageId, version, text });

    await this.sendNotification(languageId, 'textDocument/didOpen', {
      textDocument: {
        uri: uri,
        languageId: languageId,
        version: version,
        text: text
      }
    });
  }

  /**
   * Update document content
   */
  async updateDocument(uri, version, text) {
    const doc = this.documents.get(uri);
    if (!doc) return;

    doc.version = version;
    doc.text = text;

    await this.sendNotification(doc.languageId, 'textDocument/didChange', {
      textDocument: {
        uri: uri,
        version: version
      },
      contentChanges: [
        {
          text: text
        }
      ]
    });
  }

  /**
   * Close document
   */
  async closeDocument(uri) {
    const doc = this.documents.get(uri);
    if (!doc) return;

    await this.sendNotification(doc.languageId, 'textDocument/didClose', {
      textDocument: {
        uri: uri
      }
    });

    this.documents.delete(uri);
  }

  /**
   * Request completions
   */
  async getCompletions(uri, position) {
    const doc = this.documents.get(uri);
    if (!doc) return [];

    const result = await this.sendRequest(doc.languageId, 'textDocument/completion', {
      textDocument: { uri: uri },
      position: position
    });

    return result?.items || [];
  }

  /**
   * Request hover information
   */
  async getHover(uri, position) {
    const doc = this.documents.get(uri);
    if (!doc) return null;

    return await this.sendRequest(doc.languageId, 'textDocument/hover', {
      textDocument: { uri: uri },
      position: position
    });
  }

  /**
   * Go to definition
   */
  async getDefinition(uri, position) {
    const doc = this.documents.get(uri);
    if (!doc) return null;

    return await this.sendRequest(doc.languageId, 'textDocument/definition', {
      textDocument: { uri: uri },
      position: position
    });
  }

  /**
   * Find references
   */
  async getReferences(uri, position) {
    const doc = this.documents.get(uri);
    if (!doc) return [];

    return await this.sendRequest(doc.languageId, 'textDocument/references', {
      textDocument: { uri: uri },
      position: position,
      context: { includeDeclaration: true }
    });
  }

  /**
   * Format document
   */
  async formatDocument(uri) {
    const doc = this.documents.get(uri);
    if (!doc) return [];

    return await this.sendRequest(doc.languageId, 'textDocument/formatting', {
      textDocument: { uri: uri },
      options: {
        tabSize: 2,
        insertSpaces: true
      }
    });
  }

  /**
   * Rename symbol
   */
  async rename(uri, position, newName) {
    const doc = this.documents.get(uri);
    if (!doc) return null;

    return await this.sendRequest(doc.languageId, 'textDocument/rename', {
      textDocument: { uri: uri },
      position: position,
      newName: newName
    });
  }

  /**
   * Get server capabilities for language
   */
  getCapabilities(languageId) {
    return this.capabilities.get(languageId);
  }

  /**
   * Check if server supports a capability
   */
  hasCapability(languageId, capability) {
    const caps = this.capabilities.get(languageId);
    return caps && caps[capability];
  }

  /**
   * Shutdown all LSP servers
   */
  async shutdown() {
    console.log('Shutting down LSP Client...');

    // Close all documents
    for (const uri of this.documents.keys()) {
      await this.closeDocument(uri).catch(() => {});
    }

    // Shutdown all servers
    for (const [languageId, worker] of this.workers) {
      try {
        await this.sendRequest(languageId, 'shutdown', {});
        await this.sendNotification(languageId, 'exit', {});
        worker.terminate();
      } catch (error) {
        worker.terminate();
      }
    }

    this.workers.clear();
    this.servers.clear();
    this.documents.clear();
    this.capabilities.clear();

    console.log('✅ LSP Client shut down');
  }
}

// Singleton instance
let lspInstance = null;

export function getLSPClient() {
  if (!lspInstance) {
    lspInstance = new LSPClient();
  }
  return lspInstance;
}
