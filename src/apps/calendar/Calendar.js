export default class Calendar {
  constructor(context) {
    this.context = context;
    this.currentDate = new Date();
    this.selectedDate = null;
    this.events = {}; // Format: { 'YYYY-MM-DD': [{ title, time, description }] }
    this.calendarGrid = null;
  }

  async init() {
    // Load events from storage
    await this.loadEvents();
  }

  render() {
    const container = document.createElement('div');
    container.className = 'calendar-container';
    container.style.cssText = 'display:flex;height:100%;background:#f5f5f5;';

    // Main calendar area
    const mainArea = document.createElement('div');
    mainArea.style.cssText = 'flex:1;display:flex;flex-direction:column;padding:20px;';

    // Header with navigation
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;background:#fff;padding:15px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);';

    const navLeft = document.createElement('div');
    navLeft.style.cssText = 'display:flex;gap:10px;';

    const prevBtn = this._createButton('◀ Previous', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.renderCalendarGrid();
    });

    const todayBtn = this._createButton('📅 Today', () => {
      this.currentDate = new Date();
      this.renderCalendarGrid();
    });

    const nextBtn = this._createButton('Next ▶', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.renderCalendarGrid();
    });

    navLeft.appendChild(prevBtn);
    navLeft.appendChild(todayBtn);
    navLeft.appendChild(nextBtn);

    this.monthYearLabel = document.createElement('div');
    this.monthYearLabel.style.cssText = 'font-size:20px;font-weight:bold;color:#333;';

    header.appendChild(navLeft);
    header.appendChild(this.monthYearLabel);

    // Calendar grid
    this.calendarGrid = document.createElement('div');
    this.calendarGrid.style.cssText = 'flex:1;background:#fff;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);overflow:hidden;';

    mainArea.appendChild(header);
    mainArea.appendChild(this.calendarGrid);

    // Sidebar for events
    const sidebar = document.createElement('div');
    sidebar.style.cssText = 'width:300px;background:#fff;border-left:1px solid #ddd;display:flex;flex-direction:column;';

    const sidebarHeader = document.createElement('div');
    sidebarHeader.style.cssText = 'padding:20px;border-bottom:1px solid #ddd;background:#4a90e2;color:#fff;';
    const sidebarTitle = document.createElement('h3');
    sidebarTitle.textContent = 'Events';
    sidebarTitle.style.cssText = 'margin:0;';
    sidebarHeader.appendChild(sidebarTitle);

    this.eventsContainer = document.createElement('div');
    this.eventsContainer.style.cssText = 'flex:1;overflow-y:auto;padding:15px;';

    const addEventBtn = this._createButton('➕ Add Event', () => this.showAddEventDialog());
    addEventBtn.style.cssText = 'margin:15px;padding:10px;cursor:pointer;background:#4a90e2;color:#fff;border:none;border-radius:4px;font-size:14px;font-weight:bold;';

    sidebar.appendChild(sidebarHeader);
    sidebar.appendChild(this.eventsContainer);
    sidebar.appendChild(addEventBtn);

    container.appendChild(mainArea);
    container.appendChild(sidebar);

    this.renderCalendarGrid();
    this.updateEventsDisplay();

    return container;
  }

  renderCalendarGrid() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    this.monthYearLabel.textContent = new Date(year, month).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    this.calendarGrid.innerHTML = '';

    // Create calendar table
    const table = document.createElement('div');
    table.style.cssText = 'display:grid;grid-template-columns:repeat(7, 1fr);height:100%;';

    // Day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
      const header = document.createElement('div');
      header.textContent = day;
      header.style.cssText = 'padding:15px;text-align:center;font-weight:bold;background:#f0f0f0;border:1px solid #ddd;color:#666;';
      table.appendChild(header);
    });

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement('div');
      empty.style.cssText = 'border:1px solid #ddd;background:#fafafa;';
      table.appendChild(empty);
    }

    // Day cells
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement('div');
      const dateStr = this.formatDate(new Date(year, month, day));
      const isToday = dateStr === this.formatDate(today);
      const hasEvents = this.events[dateStr] && this.events[dateStr].length > 0;

      cell.style.cssText = 'border:1px solid #ddd;padding:8px;cursor:pointer;transition:background 0.2s;position:relative;min-height:80px;' +
        (isToday ? 'background:#e3f2fd;' : 'background:#fff;');

      const dayNum = document.createElement('div');
      dayNum.textContent = day;
      dayNum.style.cssText = 'font-weight:bold;margin-bottom:5px;' +
        (isToday ? 'color:#1976d2;' : 'color:#333;');

      cell.appendChild(dayNum);

      if (hasEvents) {
        const eventIndicator = document.createElement('div');
        eventIndicator.style.cssText = 'display:flex;flex-direction:column;gap:2px;';

        this.events[dateStr].slice(0, 3).forEach(event => {
          const dot = document.createElement('div');
          dot.textContent = event.title.substring(0, 15) + (event.title.length > 15 ? '...' : '');
          dot.style.cssText = 'background:#4a90e2;color:#fff;padding:2px 5px;border-radius:3px;font-size:10px;';
          eventIndicator.appendChild(dot);
        });

        if (this.events[dateStr].length > 3) {
          const more = document.createElement('div');
          more.textContent = `+${this.events[dateStr].length - 3} more`;
          more.style.cssText = 'font-size:9px;color:#666;padding:2px 5px;';
          eventIndicator.appendChild(more);
        }

        cell.appendChild(eventIndicator);
      }

      cell.addEventListener('mouseenter', () => {
        cell.style.background = isToday ? '#bbdefb' : '#f5f5f5';
      });

      cell.addEventListener('mouseleave', () => {
        cell.style.background = isToday ? '#e3f2fd' : '#fff';
      });

      cell.addEventListener('click', () => {
        this.selectedDate = dateStr;
        this.updateEventsDisplay();
      });

      table.appendChild(cell);
    }

    this.calendarGrid.appendChild(table);
  }

  showAddEventDialog() {
    const dateStr = this.selectedDate || this.formatDate(new Date());
    const title = prompt('Event title:');
    if (!title) return;

    const time = prompt('Event time (e.g., 10:00 AM):', '09:00 AM');
    const description = prompt('Description (optional):', '');

    if (!this.events[dateStr]) {
      this.events[dateStr] = [];
    }

    this.events[dateStr].push({
      title,
      time: time || '',
      description: description || ''
    });

    this.saveEvents();
    this.renderCalendarGrid();
    this.updateEventsDisplay();
  }

  updateEventsDisplay() {
    this.eventsContainer.innerHTML = '';

    const dateToShow = this.selectedDate || this.formatDate(new Date());
    const dateObj = new Date(dateToShow);
    const dateLabel = document.createElement('div');
    dateLabel.textContent = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    dateLabel.style.cssText = 'font-weight:bold;margin-bottom:15px;padding-bottom:10px;border-bottom:2px solid #4a90e2;color:#333;';
    this.eventsContainer.appendChild(dateLabel);

    const events = this.events[dateToShow] || [];

    if (events.length === 0) {
      const noEvents = document.createElement('div');
      noEvents.textContent = 'No events for this day';
      noEvents.style.cssText = 'color:#999;font-style:italic;padding:10px;text-align:center;';
      this.eventsContainer.appendChild(noEvents);
    } else {
      events.forEach((event, index) => {
        const eventCard = document.createElement('div');
        eventCard.style.cssText = 'background:#f8f9fa;padding:12px;margin-bottom:10px;border-radius:6px;border-left:4px solid #4a90e2;';

        const eventTitle = document.createElement('div');
        eventTitle.textContent = event.title;
        eventTitle.style.cssText = 'font-weight:bold;margin-bottom:5px;color:#333;';

        const eventTime = document.createElement('div');
        eventTime.textContent = '🕒 ' + event.time;
        eventTime.style.cssText = 'font-size:12px;color:#666;margin-bottom:5px;';

        const eventDesc = document.createElement('div');
        eventDesc.textContent = event.description;
        eventDesc.style.cssText = 'font-size:12px;color:#666;margin-top:5px;';

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '🗑️ Delete';
        deleteBtn.style.cssText = 'margin-top:8px;padding:4px 8px;background:#e74c3c;color:#fff;border:none;border-radius:3px;cursor:pointer;font-size:11px;';
        deleteBtn.addEventListener('click', () => {
          if (confirm('Delete this event?')) {
            events.splice(index, 1);
            if (events.length === 0) {
              delete this.events[dateToShow];
            }
            this.saveEvents();
            this.renderCalendarGrid();
            this.updateEventsDisplay();
          }
        });

        eventCard.appendChild(eventTitle);
        if (event.time) eventCard.appendChild(eventTime);
        if (event.description) eventCard.appendChild(eventDesc);
        eventCard.appendChild(deleteBtn);

        this.eventsContainer.appendChild(eventCard);
      });
    }
  }

  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async saveEvents() {
    try {
      const data = JSON.stringify(this.events, null, 2);
      await this.context.fs.writeFile('/home/user/.calendar-events.json', data, { encoding: 'utf8' });
    } catch (error) {
      console.error('Error saving events:', error);
    }
  }

  async loadEvents() {
    try {
      const data = await this.context.fs.readFile('/home/user/.calendar-events.json', { encoding: 'utf8' });
      this.events = JSON.parse(data);
    } catch (error) {
      // File doesn't exist yet, use empty events
      this.events = {};
    }
  }

  _createButton(text, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = 'padding:8px 16px;cursor:pointer;background:#fff;border:1px solid #ddd;border-radius:4px;transition:all 0.2s;color:#333;font-size:14px;';
    button.addEventListener('mouseenter', () => {
      button.style.background = '#f0f0f0';
    });
    button.addEventListener('mouseleave', () => {
      button.style.background = '#fff';
    });
    button.addEventListener('click', onClick);
    return button;
  }
}
