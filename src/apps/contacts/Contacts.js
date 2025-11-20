export default class Contacts {
  constructor(context) {
    this.context = context;
    this.fs = context.fs;
    this.ipc = context.ipc;
    this.process = context.process;

    this.contacts = [];
    this.selectedContact = null;
    this.searchQuery = '';
    this.dataPath = '/home/contacts-data.json';
  }

  async init() {
    await this.loadContacts();
  }

  async loadContacts() {
    try {
      const data = await this.fs.readFile(this.dataPath);
      this.contacts = JSON.parse(data);
    } catch (error) {
      this.contacts = [];
      await this.saveContacts();
    }
  }

  async saveContacts() {
    await this.fs.writeFile(this.dataPath, JSON.stringify(this.contacts, null, 2));
  }

  render() {
    const container = document.createElement('div');
    container.className = 'contacts-container';
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #f5f5f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Header
    const header = this.createHeader();
    container.appendChild(header);

    // Main content
    const content = document.createElement('div');
    content.style.cssText = `
      flex: 1;
      display: flex;
      overflow: hidden;
    `;

    // Left panel - Contacts list
    const leftPanel = this.createContactsList();
    content.appendChild(leftPanel);

    // Right panel - Contact details
    const rightPanel = this.createDetailsPanel();
    content.appendChild(rightPanel);

    container.appendChild(content);

    return container;
  }

  createHeader() {
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 15px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;

    const title = document.createElement('h2');
    title.textContent = '=e Contacts';
    title.style.cssText = 'margin: 0; font-size: 24px;';

    const addBtn = this.createButton('+ New Contact', () => this.showAddContactDialog());
    addBtn.style.cssText += 'background: rgba(255,255,255,0.2); padding: 10px 20px;';

    header.appendChild(title);
    header.appendChild(addBtn);

    return header;
  }

  createContactsList() {
    const panel = document.createElement('div');
    panel.style.cssText = `
      width: 350px;
      background: white;
      border-right: 1px solid #ddd;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;

    // Search bar
    const searchBar = document.createElement('div');
    searchBar.style.cssText = `
      padding: 15px;
      border-bottom: 1px solid #ddd;
    `;

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'ðŸ” Search contacts...';
    searchInput.style.cssText = `
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 20px;
      font-size: 14px;
      box-sizing: border-box;
    `;
    searchInput.oninput = (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.renderContactList();
    };
    searchBar.appendChild(searchInput);

    // Contacts list
    const listContainer = document.createElement('div');
    listContainer.style.cssText = `
      flex: 1;
      overflow-y: auto;
    `;
    this.contactListContainer = listContainer;
    this.renderContactList();

    // Stats footer
    const footer = document.createElement('div');
    footer.style.cssText = `
      padding: 10px 15px;
      background: #f5f5f5;
      border-top: 1px solid #ddd;
      font-size: 13px;
      color: #666;
    `;
    this.contactsFooter = footer;
    this.updateFooter();

    panel.appendChild(searchBar);
    panel.appendChild(listContainer);
    panel.appendChild(footer);

    return panel;
  }

  renderContactList() {
    this.contactListContainer.innerHTML = '';

    const filtered = this.contacts.filter(contact => {
      if (!this.searchQuery) return true;
      const name = (contact.firstName + ' ' + contact.lastName).toLowerCase();
      const email = (contact.email || '').toLowerCase();
      const phone = (contact.phone || '').toLowerCase();
      return name.includes(this.searchQuery) ||
             email.includes(this.searchQuery) ||
             phone.includes(this.searchQuery);
    });

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = this.searchQuery
        ? 'No contacts found'
        : 'No contacts yet. Click "New Contact" to add one.';
      empty.style.cssText = `
        text-align: center;
        padding: 40px 20px;
        color: #999;
      `;
      this.contactListContainer.appendChild(empty);
      return;
    }

    // Sort by first name
    filtered.sort((a, b) => a.firstName.localeCompare(b.firstName));

    filtered.forEach((contact, index) => {
      const item = this.createContactItem(contact, index);
      this.contactListContainer.appendChild(item);
    });
  }

  createContactItem(contact, index) {
    const item = document.createElement('div');
    item.style.cssText = `
      display: flex;
      align-items: center;
      padding: 15px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      transition: background 0.2s;
      ${this.selectedContact === contact ? 'background: #f0f0f0;' : ''}
    `;

    const avatar = document.createElement('div');
    avatar.textContent = contact.firstName.charAt(0).toUpperCase();
    avatar.style.cssText = `
      width: 45px;
      height: 45px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 18px;
      margin-right: 15px;
    `;

    const info = document.createElement('div');
    info.style.cssText = 'flex: 1; overflow: hidden;';

    const name = document.createElement('div');
    name.textContent = `${contact.firstName} ${contact.lastName}`;
    name.style.cssText = `
      font-weight: 600;
      margin-bottom: 3px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    `;

    const email = document.createElement('div');
    email.textContent = contact.email || 'No email';
    email.style.cssText = `
      font-size: 13px;
      color: #666;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    `;

    info.appendChild(name);
    info.appendChild(email);

    item.appendChild(avatar);
    item.appendChild(info);

    item.onmouseover = () => {
      if (this.selectedContact !== contact) {
        item.style.background = '#fafafa';
      }
    };
    item.onmouseout = () => {
      if (this.selectedContact !== contact) {
        item.style.background = 'white';
      }
    };

    item.onclick = () => {
      this.selectedContact = contact;
      this.renderContactList();
      this.renderDetailsPanel();
    };

    return item;
  }

  createDetailsPanel() {
    const panel = document.createElement('div');
    panel.style.cssText = `
      flex: 1;
      background: white;
      display: flex;
      flex-direction: column;
      overflow: auto;
    `;

    this.detailsPanel = panel;
    this.renderDetailsPanel();

    return panel;
  }

  renderDetailsPanel() {
    if (!this.detailsPanel) return;

    this.detailsPanel.innerHTML = '';

    if (!this.selectedContact) {
      const placeholder = document.createElement('div');
      placeholder.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #999;
        font-size: 18px;
      `;
      placeholder.textContent = 'Select a contact to view details';
      this.detailsPanel.appendChild(placeholder);
      return;
    }

    const contact = this.selectedContact;

    // Header with avatar
    const header = document.createElement('div');
    header.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    `;

    const avatar = document.createElement('div');
    avatar.textContent = contact.firstName.charAt(0).toUpperCase();
    avatar.style.cssText = `
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: rgba(255,255,255,0.3);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      font-weight: 600;
      margin-bottom: 15px;
    `;

    const name = document.createElement('h2');
    name.textContent = `${contact.firstName} ${contact.lastName}`;
    name.style.cssText = 'margin: 0 0 10px 0; font-size: 32px;';

    if (contact.company) {
      const company = document.createElement('div');
      company.textContent = contact.company;
      company.style.cssText = 'opacity: 0.9; font-size: 16px;';
      header.appendChild(avatar);
      header.appendChild(name);
      header.appendChild(company);
    } else {
      header.appendChild(avatar);
      header.appendChild(name);
    }

    this.detailsPanel.appendChild(header);

    // Contact info
    const info = document.createElement('div');
    info.style.cssText = 'padding: 30px 40px;';

    const fields = [
      { icon: '=ç', label: 'Email', value: contact.email },
      { icon: '=ñ', label: 'Phone', value: contact.phone },
      { icon: '<â', label: 'Company', value: contact.company },
      { icon: '=¼', label: 'Job Title', value: contact.jobTitle },
      { icon: '<à', label: 'Address', value: contact.address },
      { icon: '=Ý', label: 'Notes', value: contact.notes }
    ];

    fields.forEach(field => {
      if (field.value) {
        const row = this.createInfoRow(field.icon, field.label, field.value);
        info.appendChild(row);
      }
    });

    this.detailsPanel.appendChild(info);

    // Actions
    const actions = document.createElement('div');
    actions.style.cssText = `
      padding: 20px 40px;
      display: flex;
      gap: 10px;
      border-top: 1px solid #f0f0f0;
    `;

    const editBtn = this.createButton(' Edit', () => this.showEditContactDialog());
    editBtn.style.cssText += 'flex: 1; background: #667eea; color: white; padding: 12px;';

    const deleteBtn = this.createButton('=Ñ Delete', async () => {
      if (confirm(`Delete ${contact.firstName} ${contact.lastName}?`)) {
        await this.deleteContact();
      }
    });
    deleteBtn.style.cssText += 'flex: 1; background: #f44336; color: white; padding: 12px;';

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    this.detailsPanel.appendChild(actions);
  }

  createInfoRow(icon, label, value) {
    const row = document.createElement('div');
    row.style.cssText = `
      display: flex;
      padding: 15px 0;
      border-bottom: 1px solid #f5f5f5;
    `;

    const iconEl = document.createElement('div');
    iconEl.textContent = icon;
    iconEl.style.cssText = 'width: 40px; font-size: 20px;';

    const content = document.createElement('div');
    content.style.cssText = 'flex: 1;';

    const labelEl = document.createElement('div');
    labelEl.textContent = label;
    labelEl.style.cssText = 'font-size: 12px; color: #999; margin-bottom: 5px;';

    const valueEl = document.createElement('div');
    valueEl.textContent = value;
    valueEl.style.cssText = 'font-size: 15px; color: #333;';

    content.appendChild(labelEl);
    content.appendChild(valueEl);

    row.appendChild(iconEl);
    row.appendChild(content);

    return row;
  }

  showAddContactDialog() {
    this.showContactDialog();
  }

  showEditContactDialog() {
    this.showContactDialog(this.selectedContact);
  }

  showContactDialog(existingContact = null) {
    const dialog = this.createDialog();
    const form = dialog.querySelector('.dialog-content');

    const title = document.createElement('h3');
    title.textContent = existingContact ? 'Edit Contact' : 'New Contact';
    title.style.cssText = 'margin-top: 0; margin-bottom: 20px; color: #333;';
    form.appendChild(title);

    const fields = [
      { label: 'First Name', id: 'firstName', required: true },
      { label: 'Last Name', id: 'lastName', required: true },
      { label: 'Email', id: 'email', type: 'email' },
      { label: 'Phone', id: 'phone', type: 'tel' },
      { label: 'Company', id: 'company' },
      { label: 'Job Title', id: 'jobTitle' },
      { label: 'Address', id: 'address' },
      { label: 'Notes', id: 'notes', type: 'textarea' }
    ];

    const inputs = {};
    fields.forEach(field => {
      const input = this.createFormField(field, existingContact);
      inputs[field.id] = input.element;
      form.appendChild(input.group);
    });

    const buttons = document.createElement('div');
    buttons.style.cssText = 'display: flex; gap: 10px; margin-top: 20px;';

    const saveBtn = this.createButton('Save', async () => {
      if (!inputs.firstName.value || !inputs.lastName.value) {
        alert('Please enter first and last name');
        return;
      }

      const contactData = {
        id: existingContact?.id || Date.now(),
        firstName: inputs.firstName.value,
        lastName: inputs.lastName.value,
        email: inputs.email.value,
        phone: inputs.phone.value,
        company: inputs.company.value,
        jobTitle: inputs.jobTitle.value,
        address: inputs.address.value,
        notes: inputs.notes.value
      };

      if (existingContact) {
        // Update existing
        const index = this.contacts.findIndex(c => c.id === existingContact.id);
        this.contacts[index] = contactData;
        this.selectedContact = contactData;
      } else {
        // Add new
        this.contacts.push(contactData);
      }

      await this.saveContacts();
      this.renderContactList();
      this.renderDetailsPanel();
      this.updateFooter();
      document.body.removeChild(dialog);
    });
    saveBtn.style.cssText += 'flex: 1; background: #667eea; color: white; padding: 10px;';

    const cancelBtn = this.createButton('Cancel', () => document.body.removeChild(dialog));
    cancelBtn.style.cssText += 'flex: 1; background: #ccc; color: #333; padding: 10px;';

    buttons.appendChild(saveBtn);
    buttons.appendChild(cancelBtn);
    form.appendChild(buttons);

    document.body.appendChild(dialog);
    inputs.firstName.focus();
  }

  createFormField(field, existingContact) {
    const group = document.createElement('div');
    group.style.cssText = 'margin-bottom: 15px;';

    const label = document.createElement('label');
    label.textContent = field.label + (field.required ? ' *' : '');
    label.style.cssText = 'display: block; margin-bottom: 5px; color: #555; font-weight: 500;';

    let element;
    if (field.type === 'textarea') {
      element = document.createElement('textarea');
      element.rows = 3;
    } else {
      element = document.createElement('input');
      element.type = field.type || 'text';
    }

    if (existingContact && existingContact[field.id]) {
      element.value = existingContact[field.id];
    }

    element.style.cssText = `
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      box-sizing: border-box;
      font-family: inherit;
    `;

    group.appendChild(label);
    group.appendChild(element);

    return { group, element };
  }

  async deleteContact() {
    const index = this.contacts.findIndex(c => c.id === this.selectedContact.id);
    this.contacts.splice(index, 1);
    this.selectedContact = null;
    await this.saveContacts();
    this.renderContactList();
    this.renderDetailsPanel();
    this.updateFooter();
  }

  updateFooter() {
    this.contactsFooter.textContent = `${this.contacts.length} contact${this.contacts.length !== 1 ? 's' : ''}`;
  }

  createDialog() {
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const content = document.createElement('div');
    content.className = 'dialog-content';
    content.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      width: 90%;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
    `;

    dialog.appendChild(content);
    dialog.onclick = (e) => {
      if (e.target === dialog) document.body.removeChild(dialog);
    };

    return dialog;
  }

  createButton(text, onClick) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.cssText = `
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: opacity 0.2s;
    `;
    btn.onmouseover = () => btn.style.opacity = '0.8';
    btn.onmouseout = () => btn.style.opacity = '1';
    btn.onclick = onClick;
    return btn;
  }

  async destroy() {
    await this.saveContacts();
  }
}
