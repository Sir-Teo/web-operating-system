export default class Email {
  constructor(context) {
    this.context = context;
    this.fs = context.fs;
    this.ipc = context.ipc;

    this.currentFolder = 'inbox';
    this.emails = {
      inbox: [
        {
          id: 1,
          from: 'system@webos.local',
          subject: 'Welcome to WebOS Email',
          body: 'This is your new email client. You can compose, read, and organize your emails here.',
          date: new Date('2024-01-15'),
          read: false
        },
        {
          id: 2,
          from: 'admin@webos.local',
          subject: 'Getting Started Guide',
          body: 'Welcome! Here are some tips to get started with your new operating system...',
          date: new Date('2024-01-14'),
          read: false
        }
      ],
      sent: [],
      drafts: [],
      trash: []
    };

    this.selectedEmail = null;
  }

  async init() {
    // Try to load emails from file system
    try {
      const emailData = await this.fs.readFile('/home/emails.json');
      if (emailData) {
        this.emails = JSON.parse(emailData);
      }
    } catch (error) {
      // Use default emails
      await this.saveEmails();
    }
  }

  async saveEmails() {
    try {
      await this.fs.writeFile('/home/emails.json', JSON.stringify(this.emails, null, 2));
    } catch (error) {
      console.error('Failed to save emails:', error);
    }
  }

  render() {
    const container = document.createElement('div');
    container.className = 'email-app';
    container.innerHTML = `
      <div class="email-layout">
        <div class="email-sidebar">
          <button class="compose-btn">✉️ Compose</button>
          <div class="folder-list">
            <div class="folder-item ${this.currentFolder === 'inbox' ? 'active' : ''}" data-folder="inbox">
              📥 Inbox <span class="count">${this.getUnreadCount('inbox')}</span>
            </div>
            <div class="folder-item ${this.currentFolder === 'sent' ? 'active' : ''}" data-folder="sent">
              📤 Sent
            </div>
            <div class="folder-item ${this.currentFolder === 'drafts' ? 'active' : ''}" data-folder="drafts">
              📝 Drafts
            </div>
            <div class="folder-item ${this.currentFolder === 'trash' ? 'active' : ''}" data-folder="trash">
              🗑️ Trash
            </div>
          </div>
        </div>
        <div class="email-list">
          <div class="email-list-header">
            <h3>${this.currentFolder.charAt(0).toUpperCase() + this.currentFolder.slice(1)}</h3>
          </div>
          <div class="email-items">
            ${this.renderEmailList()}
          </div>
        </div>
        <div class="email-content">
          ${this.renderEmailContent()}
        </div>
      </div>
    `;

    this.attachEventListeners(container);
    return container;
  }

  renderEmailList() {
    const emails = this.emails[this.currentFolder];
    if (!emails || emails.length === 0) {
      return '<div class="empty-state">No emails in this folder</div>';
    }

    return emails.map(email => `
      <div class="email-item ${!email.read ? 'unread' : ''} ${this.selectedEmail?.id === email.id ? 'selected' : ''}" data-id="${email.id}">
        <div class="email-from">${email.from}</div>
        <div class="email-subject">${email.subject}</div>
        <div class="email-preview">${email.body.substring(0, 50)}...</div>
        <div class="email-date">${this.formatDate(email.date)}</div>
      </div>
    `).join('');
  }

  renderEmailContent() {
    if (!this.selectedEmail) {
      return '<div class="empty-state">Select an email to read</div>';
    }

    return `
      <div class="email-header">
        <div class="email-actions">
          <button class="action-btn reply-btn">↩️ Reply</button>
          <button class="action-btn forward-btn">➡️ Forward</button>
          <button class="action-btn delete-btn">🗑️ Delete</button>
        </div>
        <h2>${this.selectedEmail.subject}</h2>
        <div class="email-meta">
          <div><strong>From:</strong> ${this.selectedEmail.from}</div>
          <div><strong>Date:</strong> ${this.formatDate(this.selectedEmail.date)}</div>
        </div>
      </div>
      <div class="email-body">
        ${this.selectedEmail.body.replace(/\n/g, '<br>')}
      </div>
    `;
  }

  attachEventListeners(container) {
    // Folder navigation
    container.querySelectorAll('.folder-item').forEach(item => {
      item.addEventListener('click', () => {
        this.currentFolder = item.dataset.folder;
        this.selectedEmail = null;
        this.refresh();
      });
    });

    // Email selection
    container.querySelectorAll('.email-item').forEach(item => {
      item.addEventListener('click', () => {
        const emailId = parseInt(item.dataset.id);
        const email = this.emails[this.currentFolder].find(e => e.id === emailId);
        if (email) {
          email.read = true;
          this.selectedEmail = email;
          this.saveEmails();
          this.refresh();
        }
      });
    });

    // Compose button
    const composeBtn = container.querySelector('.compose-btn');
    if (composeBtn) {
      composeBtn.addEventListener('click', () => this.showComposeDialog());
    }

    // Action buttons
    const replyBtn = container.querySelector('.reply-btn');
    if (replyBtn) {
      replyBtn.addEventListener('click', () => this.reply());
    }

    const deleteBtn = container.querySelector('.delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => this.deleteEmail());
    }
  }

  showComposeDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'compose-dialog';
    dialog.innerHTML = `
      <div class="compose-content">
        <h3>New Email</h3>
        <input type="email" class="compose-to" placeholder="To:">
        <input type="text" class="compose-subject" placeholder="Subject:">
        <textarea class="compose-body" placeholder="Write your message..."></textarea>
        <div class="compose-actions">
          <button class="send-btn">Send</button>
          <button class="cancel-btn">Cancel</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    dialog.querySelector('.send-btn').addEventListener('click', () => {
      const to = dialog.querySelector('.compose-to').value;
      const subject = dialog.querySelector('.compose-subject').value;
      const body = dialog.querySelector('.compose-body').value;

      if (to && subject && body) {
        this.sendEmail(to, subject, body);
        dialog.remove();
      } else {
        alert('Please fill in all fields');
      }
    });

    dialog.querySelector('.cancel-btn').addEventListener('click', () => {
      dialog.remove();
    });
  }

  sendEmail(to, subject, body) {
    const newEmail = {
      id: Date.now(),
      from: 'me@webos.local',
      to: to,
      subject: subject,
      body: body,
      date: new Date(),
      read: true
    };

    this.emails.sent.push(newEmail);
    this.saveEmails();
    this.currentFolder = 'sent';
    this.selectedEmail = newEmail;
    this.refresh();
  }

  reply() {
    if (!this.selectedEmail) return;

    const dialog = document.createElement('div');
    dialog.className = 'compose-dialog';
    dialog.innerHTML = `
      <div class="compose-content">
        <h3>Reply to: ${this.selectedEmail.from}</h3>
        <input type="text" class="compose-subject" value="Re: ${this.selectedEmail.subject}" readonly>
        <textarea class="compose-body" placeholder="Write your reply..."></textarea>
        <div class="compose-actions">
          <button class="send-btn">Send</button>
          <button class="cancel-btn">Cancel</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    dialog.querySelector('.send-btn').addEventListener('click', () => {
      const body = dialog.querySelector('.compose-body').value;
      if (body) {
        this.sendEmail(this.selectedEmail.from, `Re: ${this.selectedEmail.subject}`, body);
        dialog.remove();
      }
    });

    dialog.querySelector('.cancel-btn').addEventListener('click', () => {
      dialog.remove();
    });
  }

  deleteEmail() {
    if (!this.selectedEmail) return;

    const index = this.emails[this.currentFolder].findIndex(e => e.id === this.selectedEmail.id);
    if (index !== -1) {
      const [deleted] = this.emails[this.currentFolder].splice(index, 1);
      if (this.currentFolder !== 'trash') {
        this.emails.trash.push(deleted);
      }
      this.selectedEmail = null;
      this.saveEmails();
      this.refresh();
    }
  }

  getUnreadCount(folder) {
    const count = this.emails[folder].filter(e => !e.read).length;
    return count > 0 ? count : '';
  }

  formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
