/**
 * AIAssistant - AI Chat Assistant Application
 *
 * A chat interface for interacting with the AI assistant.
 * Provides general help, code assistance, system information, and more.
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
  }

  async init() {
    // Initialize AI service
    if (!AIService.isReady()) {
      await AIService.init();
    }

    console.log('[AIAssistant] Initialized');
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
    `;

    // Header
    const header = document.createElement('div');
    header.className = 'ai-assistant-header';
    header.style.cssText = `
      padding: 20px;
      background: rgba(255, 255, 255, 0.1);
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
    `;
    header.innerHTML = `
      <h2 style="margin: 0; font-size: 24px;">🤖 AI Assistant</h2>
      <p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 14px;">
        Ask me anything about WebOS, coding, or general questions!
      </p>
    `;

    // Messages container
    this.messagesContainer = document.createElement('div');
    this.messagesContainer.className = 'ai-messages';
    this.messagesContainer.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 15px;
    `;

    // Add welcome message
    this._addMessage('assistant', 'Hello! I\'m your AI assistant. I can help you with:\n\n• Terminal commands and shell scripting\n• Code writing and debugging\n• File management and organization\n• System information and troubleshooting\n\nWhat can I help you with today?');

    // Input container
    const inputContainer = document.createElement('div');
    inputContainer.className = 'ai-input-container';
    inputContainer.style.cssText = `
      padding: 20px;
      background: rgba(255, 255, 255, 0.1);
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
    `;

    // Input field
    this.inputField = document.createElement('textarea');
    this.inputField.placeholder = 'Type your message here...';
    this.inputField.rows = 3;
    this.inputField.style.cssText = `
      width: 100%;
      padding: 12px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.9);
      color: #333;
      font-size: 14px;
      font-family: inherit;
      resize: vertical;
      outline: none;
      box-sizing: border-box;
    `;

    // Send button
    const sendButton = document.createElement('button');
    sendButton.textContent = 'Send';
    sendButton.style.cssText = `
      margin-top: 10px;
      padding: 10px 30px;
      background: rgba(255, 255, 255, 0.9);
      color: #667eea;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s;
    `;

    sendButton.addEventListener('click', () => this._handleSend());
    this.inputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._handleSend();
      }
    });

    sendButton.addEventListener('mouseenter', () => {
      sendButton.style.background = 'white';
      sendButton.style.transform = 'scale(1.05)';
    });

    sendButton.addEventListener('mouseleave', () => {
      sendButton.style.background = 'rgba(255, 255, 255, 0.9)';
      sendButton.style.transform = 'scale(1)';
    });

    inputContainer.appendChild(this.inputField);
    inputContainer.appendChild(sendButton);

    this.container.appendChild(header);
    this.container.appendChild(this.messagesContainer);
    this.container.appendChild(inputContainer);

    return this.container;
  }

  _addMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-message ai-message-${role}`;
    messageDiv.style.cssText = `
      display: flex;
      ${role === 'user' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
    `;

    const messageBubble = document.createElement('div');
    messageBubble.style.cssText = `
      max-width: 70%;
      padding: 12px 16px;
      border-radius: 12px;
      ${role === 'user' ? 'background: rgba(255, 255, 255, 0.2);' : 'background: rgba(0, 0, 0, 0.2);'}
      backdrop-filter: blur(10px);
      white-space: pre-wrap;
      word-wrap: break-word;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    `;

    // Format code blocks
    let formattedContent = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; margin: 10px 0; overflow-x: auto;"><code style="font-family: 'Courier New', monospace; font-size: 13px;">${this._escapeHtml(code.trim())}</code></div>`;
    });

    // Format inline code
    formattedContent = formattedContent.replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px; font-family: \'Courier New\', monospace;">$1</code>');

    // Format URLs
    formattedContent = formattedContent.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color: #ffd700;">$1</a>');

    messageBubble.innerHTML = formattedContent;

    messageDiv.appendChild(messageBubble);
    this.messagesContainer.appendChild(messageDiv);

    // Scroll to bottom
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

    // Add to history
    this.chatHistory.push({ role, content });
  }

  async _handleSend() {
    const message = this.inputField.value.trim();

    if (!message) return;

    // Add user message
    this._addMessage('user', message);

    // Clear input
    this.inputField.value = '';

    // Show typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'ai-typing';
    typingDiv.style.cssText = `
      padding: 12px 16px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 12px;
      max-width: 70%;
      backdrop-filter: blur(10px);
    `;
    typingDiv.textContent = '💭 Thinking...';
    this.messagesContainer.appendChild(typingDiv);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

    try {
      // Get AI response
      const response = await AIService.chat([
        ...this.chatHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        { role: 'user', content: message },
      ]);

      // Remove typing indicator
      typingDiv.remove();

      // Add assistant response
      this._addMessage('assistant', response);
    } catch (error) {
      typingDiv.remove();
      this._addMessage('assistant', `I apologize, but I encountered an error: ${error.message}. Please try again.`);
    }
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
    this.chatHistory = [];
  }
}
