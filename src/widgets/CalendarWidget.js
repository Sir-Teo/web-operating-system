/**
 * CalendarWidget - Display calendar
 */
export class CalendarWidget {
  constructor(kernel, container, config = {}) {
    this.kernel = kernel;
    this.container = container;
    this.config = config;
    this.currentDate = new Date();
    this.selectedDate = new Date();
  }

  async init() {
    this._render();
  }

  _render() {
    this.container.className = 'calendar-widget';

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    this.container.innerHTML = `
      <div class="calendar-header">
        <button class="nav-button" data-nav="prev">◀</button>
        <div class="month-year">${monthNames[month]} ${year}</div>
        <button class="nav-button" data-nav="next">▶</button>
      </div>
      <div class="calendar-grid">
        ${this._renderDayHeaders()}
        ${this._renderDays()}
      </div>
    `;

    // Setup navigation
    this.container.querySelectorAll('.nav-button').forEach(btn => {
      btn.addEventListener('click', () => {
        const direction = btn.dataset.nav;
        if (direction === 'prev') {
          this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        } else {
          this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        }
        this._render();
      });
    });

    // Setup day clicks
    this.container.querySelectorAll('.day').forEach(day => {
      day.addEventListener('click', () => {
        const dayNum = parseInt(day.textContent);
        if (!isNaN(dayNum)) {
          this.selectedDate = new Date(year, month, dayNum);
          this._render();
        }
      });
    });
  }

  _renderDayHeaders() {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return dayNames.map(name => `<div class="day-header">${name}</div>`).join('');
  }

  _renderDays() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const todayDate = today.getDate();

    let html = '';

    // Previous month's days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      html += `<div class="day other-month">${day}</div>`;
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = isCurrentMonth && day === todayDate;
      const classes = ['day'];
      if (isToday) classes.push('today');
      html += `<div class="${classes.join(' ')}">${day}</div>`;
    }

    // Next month's days to fill the grid
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const remainingCells = totalCells - (firstDay + daysInMonth);
    for (let day = 1; day <= remainingCells; day++) {
      html += `<div class="day other-month">${day}</div>`;
    }

    return html;
  }

  showSettings() {
    alert('Calendar settings coming soon!');
  }

  destroy() {
    // Cleanup if needed
  }
}
