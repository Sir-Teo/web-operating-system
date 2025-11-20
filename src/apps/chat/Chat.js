export default class Chat {
  constructor(context) {
    this.context = context;
    this.fs = context.fs;
    this.ipc = context.ipc;

    this.currentChat = null;
    this.chats = [
      {
        id: 1,
        name: 'Alice Johnson',
        avatar: '👩',
        status: 'online',
        messages: [
          { id: 1, sender: 'them', text: 'Hey! How are you?', timestamp: new Date(Date.now() - 3600000) },
          { id: 2, sender: 'me', text: 'I\'m doing great! Thanks for asking.', timestamp: new Date(Date.now() - 3500000) },
          { id: 3, sender: 'them', text: 'That\'s wonderful! Want to grab coffee later?', timestamp: new Date(Date.now() - 3400000) }
        ]
      },
      {
        id: 2,
        name: 'Bob Smith',
        avatar: '👨',
        status: 'away',
        messages: [
          { id: 1, sender: 'them', text: 'Did you finish the project?', timestamp: new Date(Date.now() - 7200000) },
          { id: 2, sender: 'me', text: 'Almost done! Just need to test it.', timestamp: new Date(Date.now() - 7100000) }
        ]
      },
      {
        id: 3,
        name: 'Team Group',
        avatar: '👥',
        status: 'online',
        isGroup: true,
        messages: [
          { id: 1, sender: 'Alice', text: 'Morning everyone!', timestamp: new Date(Date.now() - 1800000) },
          { id: 2, sender: 'Bob', text: 'Good morning!', timestamp: new Date(Date.now() - 1700000) },
          { id: 3, sender: 'me', text: 'Hi team!', timestamp: new Date(Date.now() - 1600000) }
        ]
      }
    ];
  }

  async init() {
    // Load saved chats
    try {
      const data = await this.fs.readFile('/home/chats.json');
      if (data) {
        const parsed = JSON.parse(data);
        this.chats = parsed.chats || this.chats;
        // Convert timestamp strings back to Date objects
        this.chats.forEach(chat => {
          chat.messages.forEach(msg => {
            msg.timestamp = new Date(msg.timestamp);
          });
        });
      }
    } catch (error) {
      // Use defaults
    }

    if (this.chats.length > 0) {
      this.currentChat = this.chats[0];
    }
  }

  async saveChats() {
    try {
      await this.fs.writeFile('/home/chats.json', JSON.stringify({
        chats: this.chats
      }, null, 2));
    } catch (error) {
      console.error('Failed to save chats:', error);
    }
  }

  render() {
    const container = document.createElement('div');
    container.className = 'chat-app';
    container.innerHTML = `
      <div class="chat-layout">
        <div class="chat-sidebar">
          <div class="chat-header">
            <h2>💬 Messages</h2>
            <button class="new-chat-btn" title="New Chat">+</button>
          </div>

          <div class="search-box">
            <input type="text" class="search-input" placeholder="Search chats...">
          </div>

          <div class="chats-list">
            ${this.chats.map(chat => {
              const lastMessage = chat.messages[chat.messages.length - 1];
              const isActive = this.currentChat?.id === chat.id;

              return `
                <div class="chat-item ${isActive ? 'active' : ''}" data-id="${chat.id}">
                  <div class="chat-avatar">
                    ${chat.avatar}
                    <span class="status-indicator ${chat.status}"></span>
                  </div>
                  <div class="chat-info">
                    <div class="chat-name">${chat.name}</div>
                    <div class="chat-preview">${lastMessage ? this.escapeHtml(lastMessage.text) : 'No messages'}</div>
                  </div>
                  <div class="chat-meta">
                    <div class="chat-time">${lastMessage ? this.formatTime(lastMessage.timestamp) : ''}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="chat-main">
          ${this.currentChat ? this.renderChatView() : this.renderEmptyState()}
        </div>
      </div>
    `;

    this.attachEventListeners(container);
    this.scrollToBottom(container);
    return container;
  }

  renderChatView() {
    return `
      <div class="chat-top-bar">
        <div class="chat-avatar-large">${this.currentChat.avatar}</div>
        <div class="chat-details">
          <div class="chat-name-large">${this.currentChat.name}</div>
          <div class="chat-status">
            <span class="status-dot ${this.currentChat.status}"></span>
            ${this.currentChat.status}
          </div>
        </div>
        <div class="chat-actions">
          <button class="action-btn" title="Voice Call">📞</button>
          <button class="action-btn" title="Video Call">📹</button>
          <button class="action-btn" title="More">⋮</button>
        </div>
      </div>

      <div class="messages-container">
        ${this.currentChat.messages.map(msg => `
          <div class="message ${msg.sender === 'me' ? 'sent' : 'received'}">
            ${msg.sender !== 'me' && this.currentChat.isGroup ? `
              <div class="message-sender">${msg.sender}</div>
            ` : ''}
            <div class="message-bubble">
              <div class="message-text">${this.escapeHtml(msg.text)}</div>
              <div class="message-time">${this.formatTime(msg.timestamp)}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="message-input-area">
        <button class="attachment-btn" title="Attach File">📎</button>
        <input type="text" class="message-input" placeholder="Type a message...">
        <button class="emoji-btn" title="Emoji">😊</button>
        <button class="send-btn" title="Send">➤</button>
      </div>
    `;
  }

  renderEmptyState() {
    return `
      <div class="empty-chat">
        <div class="empty-icon">💬</div>
        <div class="empty-text">Select a chat to start messaging</div>
      </div>
    `;
  }

  attachEventListeners(container) {
    // Chat selection
    container.querySelectorAll('.chat-item').forEach(item => {
      item.addEventListener('click', () => {
        const chatId = parseInt(item.dataset.id);
        this.currentChat = this.chats.find(c => c.id === chatId);
        this.refresh();
      });
    });

    // New chat button
    const newChatBtn = container.querySelector('.new-chat-btn');
    if (newChatBtn) {
      newChatBtn.addEventListener('click', () => this.createNewChat());
    }

    // Search
    const searchInput = container.querySelector('.search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.searchChats(e.target.value));
    }

    // Message input
    const messageInput = container.querySelector('.message-input');
    const sendBtn = container.querySelector('.send-btn');

    const sendMessage = () => {
      if (messageInput && this.currentChat) {
        const text = messageInput.value.trim();
        if (text) {
          this.sendMessage(text);
          messageInput.value = '';
        }
      }
    };

    if (sendBtn) {
      sendBtn.addEventListener('click', sendMessage);
    }

    if (messageInput) {
      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          sendMessage();
        }
      });

      // Focus on message input
      messageInput.focus();
    }

    // Emoji button
    const emojiBtn = container.querySelector('.emoji-btn');
    if (emojiBtn) {
      emojiBtn.addEventListener('click', () => {
        const emojis = ['😀', '😂', '❤️', '👍', '🎉', '🔥', '✨', '💯'];
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        if (messageInput) {
          messageInput.value += emoji;
          messageInput.focus();
        }
      });
    }

    // Attachment button
    const attachmentBtn = container.querySelector('.attachment-btn');
    if (attachmentBtn) {
      attachmentBtn.addEventListener('click', () => {
        alert('File attachment feature coming soon!');
      });
    }

    // Call buttons
    container.querySelectorAll('.action-btn').forEach((btn, index) => {
      btn.addEventListener('click', () => {
        if (index === 0) {
          alert('Voice call feature coming soon!');
        } else if (index === 1) {
          alert('Video call feature coming soon!');
        } else {
          alert('More options coming soon!');
        }
      });
    });
  }

  sendMessage(text) {
    if (!this.currentChat) return;

    const newMessage = {
      id: Date.now(),
      sender: 'me',
      text: text,
      timestamp: new Date()
    };

    this.currentChat.messages.push(newMessage);
    this.saveChats();
    this.refresh();

    // Simulate response from other user after a delay
    if (!this.currentChat.isGroup) {
      setTimeout(() => {
        this.simulateResponse();
      }, 2000 + Math.random() * 3000);
    }
  }

  simulateResponse() {
    if (!this.currentChat) return;

    const responses = [
      'That\'s great!',
      'Interesting!',
      'Tell me more about that.',
      'I see what you mean.',
      'Thanks for sharing!',
      'That makes sense.',
      'Cool!',
      'Awesome!'
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];

    const newMessage = {
      id: Date.now(),
      sender: 'them',
      text: response,
      timestamp: new Date()
    };

    this.currentChat.messages.push(newMessage);
    this.saveChats();
    this.refresh();
  }

  createNewChat() {
    const name = prompt('Enter contact name:');
    if (name && name.trim()) {
      const avatars = ['👨', '👩', '👤', '🧑', '👨‍💼', '👩‍💼'];
      const avatar = avatars[Math.floor(Math.random() * avatars.length)];

      const newChat = {
        id: Date.now(),
        name: name.trim(),
        avatar: avatar,
        status: 'offline',
        messages: []
      };

      this.chats.unshift(newChat);
      this.currentChat = newChat;
      this.saveChats();
      this.refresh();
    }
  }

  searchChats(query) {
    const items = document.querySelectorAll('.chat-item');
    const lowerQuery = query.toLowerCase();

    items.forEach(item => {
      const chatId = parseInt(item.dataset.id);
      const chat = this.chats.find(c => c.id === chatId);

      if (chat) {
        const matches = chat.name.toLowerCase().includes(lowerQuery) ||
                       chat.messages.some(m => m.text.toLowerCase().includes(lowerQuery));
        item.style.display = matches ? 'flex' : 'none';
      }
    });
  }

  formatTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  scrollToBottom(container) {
    setTimeout(() => {
      const messagesContainer = container.querySelector('.messages-container');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 100);
  }

  refresh() {
    const container = this.context.process.window?.contentElement;
    if (container) {
      const newContent = this.render();
      container.innerHTML = '';
      container.appendChild(newContent);
    }
  }
}
