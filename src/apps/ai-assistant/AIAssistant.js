/**
 * AIAssistant - AI Chat Assistant Application
 *
 * A modern, feature-rich chat interface for interacting with the AI assistant.
 *
 * Enhanced features:
 * - File attachment support (code, text, images)
 * - Voice input with speech recognition
 * - Quick action suggestions
 * - Multi-modal message support
 * - Conversation export
 * - Performance metrics display
 * - Advanced accessibility
 * - Beautiful animations and transitions
 */

import AIService from '../../ai/AIService.js';

export default class AIAssistant {
  constructor(context) {
    this.context = context;
    this.window = null;
    this.chatHistory = [];
    this.container = null;
    this.inputField = null;
    this.messagesContainer = null;
    this.attachedFiles = [];
    this.isRecording = false;
    this.recognition = null;
    this.quickActions = [
      { icon: '💻', label: 'Code Help', query: 'Help me write better code' },
      { icon: '📁', label: 'File Organization', query: 'How can I organize my files?' },
      { icon: '🔍', label: 'Search Files', query: 'Help me find files' },
      { icon: '🐛', label: 'Debug Code', query: 'Help me debug this code' },
      { icon: '📊', label: 'System Info', query: 'Show me system information' },
    ];
  }

  async init() {
    // Initialize AI service
    if (!AIService.isReady()) {
      await AIService.init();
    }

    // Initialize speech recognition if available
    this._initSpeechRecognition();

    console.log('[AIAssistant] Initialized with enhanced features');
  }

  _initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.inputField.value = transcript;
        this.isRecording = false;
        this._updateVoiceButton();
      };

      this.recognition.onerror = (event) => {
        console.error('[AIAssistant] Speech recognition error:', event.error);
        this.isRecording = false;
        this._updateVoiceButton();
      };

      this.recognition.onend = () => {
        this.isRecording = false;
        this._updateVoiceButton();
      };
    }
  }

  render() {
    this.container = document.createElement('div');
    this.container.className = 'ai-assistant-container';
    this.container.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      position: relative;
    `;

    // Header with actions
    const header = this._renderHeader();

    // Quick actions bar
    const quickActionsBar = this._renderQuickActions();

    // Messages container
    this.messagesContainer = document.createElement('div');
    this.messagesContainer.className = 'ai-messages';
    this.messagesContainer.setAttribute('role', 'log');
    this.messagesContainer.setAttribute('aria-live', 'polite');
    this.messagesContainer.setAttribute('aria-label', 'Chat messages');
    this.messagesContainer.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 15px;
      scroll-behavior: smooth;
    `;

    // Add welcome message
    this._addMessage('assistant', 'Hello! I\'m your enhanced AI assistant with advanced capabilities. I can help you with:\n\n• **Code Analysis** - Write, debug, and optimize code\n• **File Management** - Smart search and organization\n• **Terminal Commands** - Suggest and explain commands\n• **System Operations** - Monitor and manage WebOS\n• **Document Processing** - Analyze and summarize documents\n\nTry attaching a file, using voice input, or selecting a quick action!');

    // Input area
    const inputArea = this._renderInputArea();

    this.container.appendChild(header);
    this.container.appendChild(quickActionsBar);
    this.container.appendChild(this.messagesContainer);
    this.container.appendChild(inputArea);

    return this.container;
  }

  _renderHeader() {
    const header = document.createElement('div');
    header.className = 'ai-assistant-header';
    header.style.cssText = `
      padding: 20px;
      background: rgba(255, 255, 255, 0.15);
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    const titleSection = document.createElement('div');
    titleSection.innerHTML = `
      <h2 style="margin: 0; font-size: 24px; display: flex; align-items: center; gap: 10px;">
        <span style="animation: pulse 2s infinite;">🤖</span> AI Assistant Pro
      </h2>
      <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 13px;">
        Enhanced with RAG, Plugins & Multi-modal Support
      </p>
    `;

    const actionsSection = document.createElement('div');
    actionsSection.style.cssText = 'display: flex; gap: 10px;';

    // Metrics button
    const metricsBtn = this._createActionButton('📊', 'Show Metrics');
    metricsBtn.addEventListener('click', () => this._showMetrics());

    // Export button
    const exportBtn = this._createActionButton('💾', 'Export Chat');
    exportBtn.addEventListener('click', () => this._exportConversation());

    // Clear button
    const clearBtn = this._createActionButton('🗑️', 'Clear Chat');
    clearBtn.addEventListener('click', () => this._clearConversation());

    actionsSection.appendChild(metricsBtn);
    actionsSection.appendChild(exportBtn);
    actionsSection.appendChild(clearBtn);

    header.appendChild(titleSection);
    header.appendChild(actionsSection);

    // Add pulse animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
    `;
    header.appendChild(style);

    return header;
  }

  _createActionButton(icon, title) {
    const button = document.createElement('button');
    button.textContent = icon;
    button.title = title;
    button.setAttribute('aria-label', title);
    button.style.cssText = `
      background: rgba(255, 255, 255, 0.2);
      border: none;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.3s;
    `;

    button.addEventListener('mouseenter', () => {
      button.style.background = 'rgba(255, 255, 255, 0.3)';
      button.style.transform = 'scale(1.1)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = 'rgba(255, 255, 255, 0.2)';
      button.style.transform = 'scale(1)';
    });

    return button;
  }

  _renderQuickActions() {
    const container = document.createElement('div');
    container.className = 'quick-actions';
    container.setAttribute('role', 'toolbar');
    container.setAttribute('aria-label', 'Quick actions');
    container.style.cssText = `
      padding: 15px 20px;
      background: rgba(0, 0, 0, 0.1);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      gap: 10px;
      overflow-x: auto;
      scrollbar-width: thin;
    `;

    for (const action of this.quickActions) {
      const btn = document.createElement('button');
      btn.innerHTML = `${action.icon} ${action.label}`;
      btn.setAttribute('aria-label', `Quick action: ${action.label}`);
      btn.style.cssText = `
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 20px;
        padding: 8px 16px;
        font-size: 13px;
        color: white;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.3s;
        font-family: inherit;
      `;

      btn.addEventListener('click', () => {
        this.inputField.value = action.query;
        this.inputField.focus();
      });

      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'rgba(255, 255, 255, 0.3)';
        btn.style.transform = 'translateY(-2px)';
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'rgba(255, 255, 255, 0.2)';
        btn.style.transform = 'translateY(0)';
      });

      container.appendChild(btn);
    }

    return container;
  }

  _renderInputArea() {
    const inputArea = document.createElement('div');
    inputArea.className = 'ai-input-area';
    inputArea.style.cssText = `
      padding: 20px;
      background: rgba(255, 255, 255, 0.15);
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
    `;

    // Attached files display
    this.attachedFilesContainer = document.createElement('div');
    this.attachedFilesContainer.className = 'attached-files';
    this.attachedFilesContainer.style.cssText = `
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    `;

    // Input container
    const inputContainer = document.createElement('div');
    inputContainer.style.cssText = `
      display: flex;
      gap: 10px;
      align-items: flex-end;
    `;

    // Textarea
    this.inputField = document.createElement('textarea');
    this.inputField.placeholder = 'Type your message... (Shift+Enter for new line)';
    this.inputField.rows = 3;
    this.inputField.setAttribute('aria-label', 'Message input');
    this.inputField.style.cssText = `
      flex: 1;
      padding: 12px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.95);
      color: #333;
      font-size: 14px;
      font-family: inherit;
      resize: vertical;
      outline: none;
      box-sizing: border-box;
      transition: all 0.3s;
    `;

    this.inputField.addEventListener('focus', () => {
      this.inputField.style.borderColor = 'rgba(255, 255, 255, 0.6)';
      this.inputField.style.background = 'white';
    });

    this.inputField.addEventListener('blur', () => {
      this.inputField.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      this.inputField.style.background = 'rgba(255, 255, 255, 0.95)';
    });

    this.inputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._handleSend();
      }
    });

    // Button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 8px;';

    // File attachment button
    const attachBtn = this._createInputButton('📎', 'Attach File');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.txt,.js,.py,.java,.cpp,.md,.json,.html,.css,.png,.jpg,.jpeg,.gif';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', (e) => this._handleFileAttach(e));
    attachBtn.addEventListener('click', () => fileInput.click());

    // Voice input button
    this.voiceBtn = this._createInputButton('🎤', 'Voice Input');
    this.voiceBtn.addEventListener('click', () => this._toggleVoiceInput());
    if (!this.recognition) {
      this.voiceBtn.disabled = true;
      this.voiceBtn.style.opacity = '0.5';
      this.voiceBtn.title = 'Voice input not supported';
    }

    // Send button
    const sendBtn = this._createInputButton('📤', 'Send Message');
    sendBtn.style.background = 'rgba(255, 255, 255, 0.9)';
    sendBtn.style.color = '#667eea';
    sendBtn.style.fontWeight = 'bold';
    sendBtn.textContent = 'Send';
    sendBtn.addEventListener('click', () => this._handleSend());

    buttonContainer.appendChild(attachBtn);
    buttonContainer.appendChild(this.voiceBtn);
    buttonContainer.appendChild(sendBtn);

    inputContainer.appendChild(this.inputField);
    inputContainer.appendChild(buttonContainer);

    inputArea.appendChild(this.attachedFilesContainer);
    inputArea.appendChild(inputContainer);
    inputArea.appendChild(fileInput);

    return inputArea;
  }

  _createInputButton(text, title) {
    const button = document.createElement('button');
    button.textContent = text;
    button.title = title;
    button.setAttribute('aria-label', title);
    button.style.cssText = `
      padding: 10px 16px;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s;
      white-space: nowrap;
    `;

    button.addEventListener('mouseenter', () => {
      button.style.background = 'rgba(255, 255, 255, 0.3)';
      button.style.transform = 'scale(1.05)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = 'rgba(255, 255, 255, 0.2)';
      button.style.transform = 'scale(1)';
    });

    return button;
  }

  _handleFileAttach(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Limit file size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      this._addMessage('assistant', '⚠️ File too large. Please attach files smaller than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        content: e.target.result
      };

      this.attachedFiles.push(fileData);
      this._displayAttachedFile(fileData);
    };

    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }

    // Reset file input
    event.target.value = '';
  }

  _displayAttachedFile(fileData) {
    const fileChip = document.createElement('div');
    fileChip.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 20px;
      font-size: 13px;
      animation: slideIn 0.3s;
    `;

    const icon = fileData.type.startsWith('image/') ? '🖼️' : '📄';
    fileChip.innerHTML = `
      <span>${icon}</span>
      <span>${fileData.name}</span>
      <button style="background: none; border: none; color: white; cursor: pointer; font-size: 16px; padding: 0;" aria-label="Remove file">×</button>
    `;

    const removeBtn = fileChip.querySelector('button');
    removeBtn.addEventListener('click', () => {
      this.attachedFiles = this.attachedFiles.filter(f => f.name !== fileData.name);
      fileChip.remove();
    });

    this.attachedFilesContainer.appendChild(fileChip);

    // Add slide-in animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(-20px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    if (!document.getElementById('file-chip-style')) {
      style.id = 'file-chip-style';
      document.head.appendChild(style);
    }
  }

  _toggleVoiceInput() {
    if (!this.recognition) return;

    if (this.isRecording) {
      this.recognition.stop();
      this.isRecording = false;
    } else {
      this.recognition.start();
      this.isRecording = true;
    }

    this._updateVoiceButton();
  }

  _updateVoiceButton() {
    if (this.isRecording) {
      this.voiceBtn.textContent = '⏹️';
      this.voiceBtn.style.background = 'rgba(255, 0, 0, 0.5)';
      this.voiceBtn.title = 'Stop Recording';
    } else {
      this.voiceBtn.textContent = '🎤';
      this.voiceBtn.style.background = 'rgba(255, 255, 255, 0.2)';
      this.voiceBtn.title = 'Voice Input';
    }
  }

  _addMessage(role, content, attachments = []) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-message ai-message-${role}`;
    messageDiv.setAttribute('role', 'article');
    messageDiv.setAttribute('aria-label', `${role} message`);
    messageDiv.style.cssText = `
      display: flex;
      ${role === 'user' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
      animation: fadeIn 0.3s;
    `;

    const messageBubble = document.createElement('div');
    messageBubble.style.cssText = `
      max-width: 75%;
      padding: 14px 18px;
      border-radius: 16px;
      ${role === 'user'
        ? 'background: rgba(255, 255, 255, 0.25);'
        : 'background: rgba(0, 0, 0, 0.25);'}
      backdrop-filter: blur(10px);
      white-space: pre-wrap;
      word-wrap: break-word;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      line-height: 1.6;
    `;

    // Format content
    let formattedContent = content;

    // Format code blocks with syntax highlighting hints
    formattedContent = formattedContent.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const langLabel = lang ? `<div style="font-size: 11px; opacity: 0.7; margin-bottom: 5px;">${lang.toUpperCase()}</div>` : '';
      return `<div style="background: rgba(0,0,0,0.4); padding: 12px; border-radius: 8px; margin: 10px 0; overflow-x: auto; border-left: 3px solid rgba(255,255,255,0.3);">${langLabel}<code style="font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.4;">${this._escapeHtml(code.trim())}</code></div>`;
    });

    // Format inline code
    formattedContent = formattedContent.replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.4); padding: 3px 7px; border-radius: 4px; font-family: \'Courier New\', monospace; font-size: 13px;">$1</code>');

    // Format bold
    formattedContent = formattedContent.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Format italic
    formattedContent = formattedContent.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Format URLs
    formattedContent = formattedContent.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color: #ffd700; text-decoration: underline;">$1</a>');

    // Format bullet points
    formattedContent = formattedContent.replace(/^• (.+)$/gm, '<div style="margin-left: 15px;">• $1</div>');

    messageBubble.innerHTML = formattedContent;

    // Add attachments display
    if (attachments && attachments.length > 0) {
      const attachmentsDiv = document.createElement('div');
      attachmentsDiv.style.cssText = 'margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.2);';

      for (const attachment of attachments) {
        if (attachment.type.startsWith('image/')) {
          const img = document.createElement('img');
          img.src = attachment.content;
          img.alt = attachment.name;
          img.style.cssText = 'max-width: 100%; border-radius: 8px; margin-top: 5px;';
          attachmentsDiv.appendChild(img);
        } else {
          const fileInfo = document.createElement('div');
          fileInfo.style.cssText = 'font-size: 12px; opacity: 0.8; margin-top: 5px;';
          fileInfo.textContent = `📎 ${attachment.name} (${this._formatFileSize(attachment.size)})`;
          attachmentsDiv.appendChild(fileInfo);
        }
      }

      messageBubble.appendChild(attachmentsDiv);
    }

    messageDiv.appendChild(messageBubble);
    this.messagesContainer.appendChild(messageDiv);

    // Scroll to bottom
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

    // Add to history
    this.chatHistory.push({ role, content, attachments, timestamp: Date.now() });

    // Add fade-in animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    if (!document.getElementById('message-fade-style')) {
      style.id = 'message-fade-style';
      document.head.appendChild(style);
    }
  }

  async _handleSend() {
    const message = this.inputField.value.trim();

    if (!message && this.attachedFiles.length === 0) return;

    // Prepare message content
    let fullMessage = message;

    // Add file context
    if (this.attachedFiles.length > 0) {
      fullMessage += '\n\n[Attached files:]\n';
      for (const file of this.attachedFiles) {
        if (file.type.startsWith('image/')) {
          fullMessage += `- Image: ${file.name}\n`;
        } else {
          fullMessage += `- File: ${file.name}\n\`\`\`\n${file.content.substring(0, 1000)}${file.content.length > 1000 ? '\n... (truncated)' : ''}\n\`\`\`\n`;
        }
      }
    }

    // Add user message
    this._addMessage('user', message, this.attachedFiles);

    // Clear input and attachments
    this.inputField.value = '';
    const currentAttachments = [...this.attachedFiles];
    this.attachedFiles = [];
    this.attachedFilesContainer.innerHTML = '';

    // Show typing indicator
    const typingDiv = this._createTypingIndicator();
    this.messagesContainer.appendChild(typingDiv);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

    try {
      // Add to knowledge base if file contains documentation
      for (const file of currentAttachments) {
        if (!file.type.startsWith('image/')) {
          await AIService.addToKnowledgeBase(
            `user-file-${Date.now()}-${file.name}`,
            file.content,
            { filename: file.name, type: file.type }
          );
        }
      }

      // Get AI response with RAG enabled
      const response = await AIService.chat([
        ...this.chatHistory.filter(msg => !msg.attachments || msg.attachments.length === 0).map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        { role: 'user', content: fullMessage },
      ], { useRAG: true, manageContext: true });

      // Remove typing indicator
      typingDiv.remove();

      // Add assistant response
      this._addMessage('assistant', response);
    } catch (error) {
      console.error('[AIAssistant] Error:', error);
      typingDiv.remove();
      this._addMessage('assistant', `⚠️ I encountered an error: ${error.message}. Please try again.`);
    }
  }

  _createTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'ai-typing';
    typingDiv.style.cssText = `
      padding: 14px 18px;
      background: rgba(0, 0, 0, 0.25);
      border-radius: 16px;
      max-width: 75%;
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      gap: 8px;
      animation: fadeIn 0.3s;
    `;

    const dots = document.createElement('div');
    dots.innerHTML = '<span style="animation: blink 1.4s infinite;">•</span> <span style="animation: blink 1.4s infinite 0.2s;">•</span> <span style="animation: blink 1.4s infinite 0.4s;">•</span>';

    const style = document.createElement('style');
    style.textContent = `
      @keyframes blink {
        0%, 60%, 100% { opacity: 0.3; }
        30% { opacity: 1; }
      }
    `;
    if (!document.getElementById('typing-blink-style')) {
      style.id = 'typing-blink-style';
      document.head.appendChild(style);
    }

    typingDiv.innerHTML = '💭 Thinking';
    typingDiv.appendChild(dots);

    return typingDiv;
  }

  _showMetrics() {
    const metrics = AIService.getPerformanceMetrics();
    const metricsText = `📊 **Performance Metrics**

**Requests:** ${metrics.totalRequests}
**Cache Hits:** ${metrics.cacheHits} (${metrics.cacheHitRate})
**Avg Response Time:** ${metrics.averageResponseTime.toFixed(0)}ms
**Errors:** ${metrics.errors}
**Knowledge Base Size:** ${metrics.knowledgeBaseSize} documents
**Active Plugins:** ${metrics.pluginCount}
**Conversation Length:** ${metrics.conversationLength} messages
**Summaries Created:** ${metrics.summaryCount}`;

    this._addMessage('assistant', metricsText);
  }

  _exportConversation() {
    const exportData = {
      exported: new Date().toISOString(),
      messages: this.chatHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp || Date.now()
      })),
      metrics: AIService.getPerformanceMetrics()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-conversation-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    this._addMessage('assistant', '✅ Conversation exported successfully!');
  }

  _clearConversation() {
    if (this.chatHistory.length === 0) return;

    if (confirm('Are you sure you want to clear the conversation history?')) {
      this.chatHistory = [];
      this.messagesContainer.innerHTML = '';
      AIService.clearHistory();
      this._addMessage('assistant', 'Conversation cleared. How can I help you?');
    }
  }

  _formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  destroy() {
    if (this.container) {
      this.container.remove();
    }
    if (this.recognition && this.isRecording) {
      this.recognition.stop();
    }
    this.chatHistory = [];
    this.attachedFiles = [];
  }
}
