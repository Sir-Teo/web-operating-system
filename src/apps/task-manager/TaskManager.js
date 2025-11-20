export default class TaskManager {
  constructor(context) {
    this.context = context;
    this.tasks = [];
    this.filter = 'all'; // 'all', 'active', 'completed'
    this.sortBy = 'created'; // 'created', 'priority', 'due'
    this.nextId = 1;
  }

  async init() {
    await this.loadTasks();
  }

  render() {
    const container = document.createElement('div');
    container.className = 'task-manager-container';
    container.style.cssText = 'display:flex;flex-direction:column;height:100%;background:#f0f2f5;';

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'padding:20px;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.1);';

    const title = document.createElement('h2');
    title.textContent = '✅ Task Manager';
    title.style.cssText = 'margin:0 0 10px 0;font-size:28px;';

    this.statsLabel = document.createElement('div');
    this.statsLabel.style.cssText = 'font-size:14px;opacity:0.9;';

    header.appendChild(title);
    header.appendChild(this.statsLabel);

    // Add task section
    const addSection = document.createElement('div');
    addSection.style.cssText = 'padding:20px;background:#fff;border-bottom:1px solid #ddd;';

    const addForm = document.createElement('div');
    addForm.style.cssText = 'display:flex;gap:10px;margin-bottom:10px;';

    this.taskInput = document.createElement('input');
    this.taskInput.type = 'text';
    this.taskInput.placeholder = 'What needs to be done?';
    this.taskInput.style.cssText = 'flex:1;padding:12px;border:2px solid #ddd;border-radius:6px;font-size:14px;outline:none;';
    this.taskInput.addEventListener('focus', () => {
      this.taskInput.style.borderColor = '#667eea';
    });
    this.taskInput.addEventListener('blur', () => {
      this.taskInput.style.borderColor = '#ddd';
    });

    const addBtn = this._createButton('➕ Add Task', () => this.addTask(), '#667eea', '#5568d3');
    addBtn.style.cssText = 'padding:12px 24px;background:#667eea;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:bold;font-size:14px;transition:background 0.2s;';

    this.taskInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addTask();
      }
    });

    addForm.appendChild(this.taskInput);
    addForm.appendChild(addBtn);

    const optionsRow = document.createElement('div');
    optionsRow.style.cssText = 'display:flex;gap:15px;';

    const prioritySelect = document.createElement('select');
    prioritySelect.style.cssText = 'padding:8px;border:1px solid #ddd;border-radius:4px;font-size:13px;';
    ['Low', 'Medium', 'High'].forEach(priority => {
      const option = document.createElement('option');
      option.value = priority.toLowerCase();
      option.textContent = `Priority: ${priority}`;
      prioritySelect.appendChild(option);
    });
    prioritySelect.value = 'medium';
    this.prioritySelect = prioritySelect;

    const dueDateInput = document.createElement('input');
    dueDateInput.type = 'date';
    dueDateInput.style.cssText = 'padding:8px;border:1px solid #ddd;border-radius:4px;font-size:13px;';
    this.dueDateInput = dueDateInput;

    const categoryInput = document.createElement('input');
    categoryInput.type = 'text';
    categoryInput.placeholder = 'Category (optional)';
    categoryInput.style.cssText = 'padding:8px;border:1px solid #ddd;border-radius:4px;font-size:13px;flex:1;';
    this.categoryInput = categoryInput;

    optionsRow.appendChild(prioritySelect);
    optionsRow.appendChild(dueDateInput);
    optionsRow.appendChild(categoryInput);

    addSection.appendChild(addForm);
    addSection.appendChild(optionsRow);

    // Filter and sort bar
    const filterBar = document.createElement('div');
    filterBar.style.cssText = 'padding:15px 20px;background:#fff;border-bottom:1px solid #ddd;display:flex;justify-content:space-between;align-items:center;';

    const filterButtons = document.createElement('div');
    filterButtons.style.cssText = 'display:flex;gap:10px;';

    ['all', 'active', 'completed'].forEach(filter => {
      const btn = this._createFilterButton(filter.charAt(0).toUpperCase() + filter.slice(1), () => {
        this.filter = filter;
        this.renderTasks();
      });
      if (filter === 'all') {
        btn.style.background = '#667eea';
        btn.style.color = '#fff';
      }
      btn.dataset.filter = filter;
      filterButtons.appendChild(btn);
      if (filter === 'all') this.activeFilterBtn = btn;
    });

    const sortSelect = document.createElement('select');
    sortSelect.style.cssText = 'padding:8px 12px;border:1px solid #ddd;border-radius:4px;font-size:13px;';
    [
      { value: 'created', label: 'Sort by: Created' },
      { value: 'priority', label: 'Sort by: Priority' },
      { value: 'due', label: 'Sort by: Due Date' }
    ].forEach(option => {
      const opt = document.createElement('option');
      opt.value = option.value;
      opt.textContent = option.label;
      sortSelect.appendChild(opt);
    });
    sortSelect.addEventListener('change', () => {
      this.sortBy = sortSelect.value;
      this.renderTasks();
    });

    filterBar.appendChild(filterButtons);
    filterBar.appendChild(sortSelect);

    // Tasks list
    this.tasksContainer = document.createElement('div');
    this.tasksContainer.style.cssText = 'flex:1;overflow-y:auto;padding:20px;';

    // Footer
    const footer = document.createElement('div');
    footer.style.cssText = 'padding:15px 20px;background:#fff;border-top:1px solid #ddd;display:flex;justify-content:space-between;align-items:center;';

    this.taskCountLabel = document.createElement('span');
    this.taskCountLabel.style.cssText = 'color:#666;font-size:13px;';

    const clearCompletedBtn = document.createElement('button');
    clearCompletedBtn.textContent = '🗑️ Clear Completed';
    clearCompletedBtn.style.cssText = 'padding:8px 16px;background:#e74c3c;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;transition:background 0.2s;';
    clearCompletedBtn.addEventListener('mouseenter', () => {
      clearCompletedBtn.style.background = '#c0392b';
    });
    clearCompletedBtn.addEventListener('mouseleave', () => {
      clearCompletedBtn.style.background = '#e74c3c';
    });
    clearCompletedBtn.addEventListener('click', () => this.clearCompleted());

    footer.appendChild(this.taskCountLabel);
    footer.appendChild(clearCompletedBtn);

    container.appendChild(header);
    container.appendChild(addSection);
    container.appendChild(filterBar);
    container.appendChild(this.tasksContainer);
    container.appendChild(footer);

    this.filterButtons = filterButtons;
    this.renderTasks();

    return container;
  }

  addTask() {
    const title = this.taskInput.value.trim();
    if (!title) return;

    const task = {
      id: this.nextId++,
      title,
      completed: false,
      priority: this.prioritySelect.value,
      dueDate: this.dueDateInput.value || null,
      category: this.categoryInput.value.trim() || null,
      createdAt: Date.now()
    };

    this.tasks.push(task);
    this.taskInput.value = '';
    this.dueDateInput.value = '';
    this.categoryInput.value = '';
    this.prioritySelect.value = 'medium';

    this.saveTasks();
    this.renderTasks();
  }

  toggleTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.renderTasks();
    }
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.saveTasks();
    this.renderTasks();
  }

  editTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;

    const newTitle = prompt('Edit task:', task.title);
    if (newTitle && newTitle.trim()) {
      task.title = newTitle.trim();
      this.saveTasks();
      this.renderTasks();
    }
  }

  clearCompleted() {
    const completedCount = this.tasks.filter(t => t.completed).length;
    if (completedCount === 0) {
      alert('No completed tasks to clear');
      return;
    }

    if (confirm(`Delete ${completedCount} completed task(s)?`)) {
      this.tasks = this.tasks.filter(t => !t.completed);
      this.saveTasks();
      this.renderTasks();
    }
  }

  renderTasks() {
    // Update filter buttons
    this.filterButtons.querySelectorAll('button').forEach(btn => {
      if (btn.dataset.filter === this.filter) {
        btn.style.background = '#667eea';
        btn.style.color = '#fff';
      } else {
        btn.style.background = '#f0f0f0';
        btn.style.color = '#333';
      }
    });

    // Filter tasks
    let filteredTasks = this.tasks;
    if (this.filter === 'active') {
      filteredTasks = this.tasks.filter(t => !t.completed);
    } else if (this.filter === 'completed') {
      filteredTasks = this.tasks.filter(t => t.completed);
    }

    // Sort tasks
    filteredTasks = [...filteredTasks].sort((a, b) => {
      if (this.sortBy === 'priority') {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      } else if (this.sortBy === 'due') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      } else {
        return b.createdAt - a.createdAt;
      }
    });

    // Clear container
    this.tasksContainer.innerHTML = '';

    // Render tasks
    if (filteredTasks.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.textContent = this.filter === 'completed' ? 'No completed tasks yet' :
        this.filter === 'active' ? 'No active tasks' : 'No tasks yet. Add one above!';
      emptyMsg.style.cssText = 'text-align:center;color:#999;padding:40px;font-size:16px;';
      this.tasksContainer.appendChild(emptyMsg);
    } else {
      filteredTasks.forEach(task => {
        const taskCard = this._createTaskCard(task);
        this.tasksContainer.appendChild(taskCard);
      });
    }

    // Update stats
    const total = this.tasks.length;
    const completed = this.tasks.filter(t => t.completed).length;
    const active = total - completed;
    this.statsLabel.textContent = `${total} total tasks • ${active} active • ${completed} completed`;
    this.taskCountLabel.textContent = `${filteredTasks.length} task(s)`;
  }

  _createTaskCard(task) {
    const card = document.createElement('div');
    card.style.cssText = 'background:#fff;padding:15px;margin-bottom:10px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.08);display:flex;align-items:center;gap:12px;transition:all 0.2s;' +
      (task.completed ? 'opacity:0.6;' : '');

    card.addEventListener('mouseenter', () => {
      card.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08)';
    });

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.style.cssText = 'width:20px;height:20px;cursor:pointer;';
    checkbox.addEventListener('change', () => this.toggleTask(task.id));

    // Content
    const content = document.createElement('div');
    content.style.cssText = 'flex:1;';

    const titleDiv = document.createElement('div');
    titleDiv.textContent = task.title;
    titleDiv.style.cssText = 'font-size:15px;margin-bottom:5px;' +
      (task.completed ? 'text-decoration:line-through;color:#999;' : 'color:#333;font-weight:500;');

    const metaDiv = document.createElement('div');
    metaDiv.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;';

    // Priority badge
    const priorityColors = { low: '#95a5a6', medium: '#f39c12', high: '#e74c3c' };
    const priorityBadge = document.createElement('span');
    priorityBadge.textContent = task.priority.toUpperCase();
    priorityBadge.style.cssText = `background:${priorityColors[task.priority]};color:#fff;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:bold;`;
    metaDiv.appendChild(priorityBadge);

    // Due date
    if (task.dueDate) {
      const dueBadge = document.createElement('span');
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      const isOverdue = dueDate < today && !task.completed;
      dueBadge.textContent = `📅 ${task.dueDate}`;
      dueBadge.style.cssText = `padding:2px 8px;border-radius:3px;font-size:11px;background:${isOverdue ? '#ffe6e6' : '#e8f5e9'};color:${isOverdue ? '#c0392b' : '#27ae60'};`;
      metaDiv.appendChild(dueBadge);
    }

    // Category
    if (task.category) {
      const catBadge = document.createElement('span');
      catBadge.textContent = `🏷️ ${task.category}`;
      catBadge.style.cssText = 'padding:2px 8px;border-radius:3px;font-size:11px;background:#e3f2fd;color:#1976d2;';
      metaDiv.appendChild(catBadge);
    }

    content.appendChild(titleDiv);
    content.appendChild(metaDiv);

    // Actions
    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:8px;';

    const editBtn = document.createElement('button');
    editBtn.textContent = '✏️';
    editBtn.style.cssText = 'padding:6px 10px;background:#3498db;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:14px;';
    editBtn.addEventListener('click', () => this.editTask(task.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑️';
    deleteBtn.style.cssText = 'padding:6px 10px;background:#e74c3c;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:14px;';
    deleteBtn.addEventListener('click', () => {
      if (confirm('Delete this task?')) {
        this.deleteTask(task.id);
      }
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    card.appendChild(checkbox);
    card.appendChild(content);
    card.appendChild(actions);

    return card;
  }

  async saveTasks() {
    try {
      const data = JSON.stringify({ tasks: this.tasks, nextId: this.nextId }, null, 2);
      await this.context.fs.writeFile('/home/user/.tasks.json', data, { encoding: 'utf8' });
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  }

  async loadTasks() {
    try {
      const data = await this.context.fs.readFile('/home/user/.tasks.json', { encoding: 'utf8' });
      const parsed = JSON.parse(data);
      this.tasks = parsed.tasks || [];
      this.nextId = parsed.nextId || 1;
    } catch (error) {
      this.tasks = [];
      this.nextId = 1;
    }
  }

  _createButton(text, onClick, bgColor = '#667eea', hoverColor = '#5568d3') {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = `padding:8px 16px;cursor:pointer;background:${bgColor};color:#fff;border:none;border-radius:4px;transition:background 0.2s;`;
    button.addEventListener('mouseenter', () => {
      button.style.background = hoverColor;
    });
    button.addEventListener('mouseleave', () => {
      button.style.background = bgColor;
    });
    button.addEventListener('click', onClick);
    return button;
  }

  _createFilterButton(text, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = 'padding:8px 16px;cursor:pointer;background:#f0f0f0;color:#333;border:none;border-radius:4px;transition:all 0.2s;font-size:13px;';
    button.addEventListener('click', onClick);
    return button;
  }
}
