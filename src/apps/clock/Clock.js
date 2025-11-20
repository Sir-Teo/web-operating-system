export default class Clock {
  constructor(context) {
    this.context = context;
    this.fs = context.fs;
    this.ipc = context.ipc;
    this.process = context.process;

    this.currentTab = 'clock'; // clock, alarm, timer, stopwatch
    this.alarms = [];
    this.timers = [];
    this.stopwatchRunning = false;
    this.stopwatchStartTime = null;
    this.stopwatchElapsed = 0;
    this.stopwatchInterval = null;
    this.timerIntervals = {};
    this.dataPath = '/home/clock-data.json';
  }

  async init() {
    await this.loadData();
    this.startClockUpdate();
  }

  async loadData() {
    try {
      const data = await this.fs.readFile(this.dataPath);
      const parsed = JSON.parse(data);
      this.alarms = parsed.alarms || [];
      // Check for active alarms
      this.checkAlarms();
    } catch (error) {
      this.alarms = [];
      await this.saveData();
    }
  }

  async saveData() {
    const data = {
      alarms: this.alarms
    };
    await this.fs.writeFile(this.dataPath, JSON.stringify(data, null, 2));
  }

  render() {
    const container = document.createElement('div');
    container.className = 'clock-container';
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: white;
    `;

    // Tab navigation
    const tabs = this.createTabs();
    container.appendChild(tabs);

    // Content area
    const content = document.createElement('div');
    content.className = 'clock-content';
    content.style.cssText = `
      flex: 1;
      overflow: auto;
      padding: 30px;
    `;

    this.contentArea = content;
    this.renderTab();
    container.appendChild(content);

    return container;
  }

  createTabs() {
    const tabBar = document.createElement('div');
    tabBar.style.cssText = `
      display: flex;
      background: rgba(0,0,0,0.2);
      padding: 0;
    `;

    const tabs = [
      { id: 'clock', icon: '=P', label: 'Clock' },
      { id: 'alarm', icon: 'ð', label: 'Alarm' },
      { id: 'timer', icon: 'ò', label: 'Timer' },
      { id: 'stopwatch', icon: 'ñ', label: 'Stopwatch' }
    ];

    tabs.forEach(tab => {
      const button = document.createElement('button');
      button.style.cssText = `
        flex: 1;
        padding: 15px;
        border: none;
        background: ${this.currentTab === tab.id ? 'rgba(255,255,255,0.2)' : 'transparent'};
        color: white;
        cursor: pointer;
        font-size: 16px;
        transition: background 0.2s;
        border-bottom: 3px solid ${this.currentTab === tab.id ? 'white' : 'transparent'};
      `;
      button.innerHTML = `${tab.icon} ${tab.label}`;
      button.onmouseover = () => {
        if (this.currentTab !== tab.id) {
          button.style.background = 'rgba(255,255,255,0.1)';
        }
      };
      button.onmouseout = () => {
        if (this.currentTab !== tab.id) {
          button.style.background = 'transparent';
        }
      };
      button.onclick = () => {
        this.currentTab = tab.id;
        this.render();
        // Re-render entire container
        const parent = this.contentArea.parentElement;
        const newRender = this.render();
        parent.replaceWith(newRender);
      };
      tabBar.appendChild(button);
    });

    return tabBar;
  }

  renderTab() {
    this.contentArea.innerHTML = '';

    if (this.currentTab === 'clock') {
      this.renderClock();
    } else if (this.currentTab === 'alarm') {
      this.renderAlarm();
    } else if (this.currentTab === 'timer') {
      this.renderTimer();
    } else if (this.currentTab === 'stopwatch') {
      this.renderStopwatch();
    }
  }

  renderClock() {
    const clockView = document.createElement('div');
    clockView.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
    `;

    // Digital clock
    const digitalClock = document.createElement('div');
    digitalClock.className = 'digital-clock';
    digitalClock.style.cssText = `
      font-size: 120px;
      font-weight: 200;
      margin-bottom: 20px;
      font-variant-numeric: tabular-nums;
      letter-spacing: -5px;
    `;
    this.digitalClockElement = digitalClock;

    // Date display
    const dateDisplay = document.createElement('div');
    dateDisplay.className = 'date-display';
    dateDisplay.style.cssText = `
      font-size: 28px;
      opacity: 0.9;
      margin-bottom: 40px;
    `;
    this.dateDisplayElement = dateDisplay;

    // World clocks
    const worldClocksTitle = document.createElement('h3');
    worldClocksTitle.textContent = 'World Clocks';
    worldClocksTitle.style.cssText = 'margin-bottom: 20px; font-size: 24px;';

    const worldClocks = document.createElement('div');
    worldClocks.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      width: 100%;
      max-width: 800px;
    `;

    const cities = [
      { name: 'New York', timezone: 'America/New_York' },
      { name: 'London', timezone: 'Europe/London' },
      { name: 'Tokyo', timezone: 'Asia/Tokyo' },
      { name: 'Sydney', timezone: 'Australia/Sydney' }
    ];

    this.worldClockElements = [];
    cities.forEach(city => {
      const card = document.createElement('div');
      card.style.cssText = `
        background: rgba(255,255,255,0.15);
        padding: 20px;
        border-radius: 8px;
        text-align: center;
      `;

      const cityName = document.createElement('div');
      cityName.textContent = city.name;
      cityName.style.cssText = 'font-size: 18px; margin-bottom: 10px; font-weight: 500;';

      const timeDisplay = document.createElement('div');
      timeDisplay.style.cssText = 'font-size: 28px; font-variant-numeric: tabular-nums;';
      timeDisplay.dataset.timezone = city.timezone;
      this.worldClockElements.push(timeDisplay);

      card.appendChild(cityName);
      card.appendChild(timeDisplay);
      worldClocks.appendChild(card);
    });

    clockView.appendChild(digitalClock);
    clockView.appendChild(dateDisplay);
    clockView.appendChild(worldClocksTitle);
    clockView.appendChild(worldClocks);

    this.contentArea.appendChild(clockView);
    this.updateClock();
  }

  startClockUpdate() {
    this.clockInterval = setInterval(() => {
      if (this.currentTab === 'clock') {
        this.updateClock();
      }
    }, 1000);
  }

  updateClock() {
    if (!this.digitalClockElement) return;

    const now = new Date();

    // Update main clock
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    this.digitalClockElement.textContent = `${hours}:${minutes}:${seconds}`;

    // Update date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    this.dateDisplayElement.textContent = now.toLocaleDateString('en-US', options);

    // Update world clocks
    this.worldClockElements.forEach(element => {
      const timezone = element.dataset.timezone;
      try {
        const time = now.toLocaleTimeString('en-US', {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        element.textContent = time;
      } catch (e) {
        element.textContent = '--:--:--';
      }
    });
  }

  renderAlarm() {
    const alarmView = document.createElement('div');
    alarmView.style.cssText = 'max-width: 600px; margin: 0 auto;';

    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;';

    const title = document.createElement('h2');
    title.textContent = 'Alarms';
    title.style.cssText = 'margin: 0; font-size: 32px;';

    const addBtn = this.createButton('+ Add Alarm', () => this.showAddAlarmDialog());
    addBtn.style.cssText += 'background: rgba(255,255,255,0.2); padding: 10px 20px;';

    header.appendChild(title);
    header.appendChild(addBtn);
    alarmView.appendChild(header);

    // Alarms list
    if (this.alarms.length === 0) {
      const noAlarms = document.createElement('div');
      noAlarms.textContent = 'No alarms set';
      noAlarms.style.cssText = `
        text-align: center;
        padding: 60px;
        opacity: 0.6;
        font-size: 18px;
      `;
      alarmView.appendChild(noAlarms);
    } else {
      this.alarms.forEach((alarm, index) => {
        const card = this.createAlarmCard(alarm, index);
        alarmView.appendChild(card);
      });
    }

    this.contentArea.appendChild(alarmView);
  }

  createAlarmCard(alarm, index) {
    const card = document.createElement('div');
    card.style.cssText = `
      background: rgba(255,255,255,0.15);
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    const info = document.createElement('div');
    info.style.cssText = 'flex: 1;';

    const time = document.createElement('div');
    time.textContent = alarm.time;
    time.style.cssText = 'font-size: 36px; font-weight: 300; margin-bottom: 5px;';

    const label = document.createElement('div');
    label.textContent = alarm.label || 'Alarm';
    label.style.cssText = 'font-size: 16px; opacity: 0.8;';

    info.appendChild(time);
    info.appendChild(label);

    const controls = document.createElement('div');
    controls.style.cssText = 'display: flex; gap: 10px; align-items: center;';

    const toggle = document.createElement('label');
    toggle.style.cssText = 'position: relative; display: inline-block; width: 50px; height: 26px;';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = alarm.enabled;
    checkbox.style.cssText = 'opacity: 0; width: 0; height: 0;';
    checkbox.onchange = async () => {
      alarm.enabled = checkbox.checked;
      await this.saveData();
    };

    const slider = document.createElement('span');
    slider.style.cssText = `
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: ${alarm.enabled ? '#4CAF50' : '#ccc'};
      transition: .4s;
      border-radius: 26px;
    `;
    const sliderBefore = document.createElement('span');
    sliderBefore.style.cssText = `
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: ${alarm.enabled ? '26px' : '4px'};
      bottom: 4px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    `;
    slider.appendChild(sliderBefore);

    checkbox.onchange = async () => {
      alarm.enabled = checkbox.checked;
      slider.style.backgroundColor = alarm.enabled ? '#4CAF50' : '#ccc';
      sliderBefore.style.left = alarm.enabled ? '26px' : '4px';
      await this.saveData();
    };

    toggle.appendChild(checkbox);
    toggle.appendChild(slider);

    const deleteBtn = this.createButton('=Ñ', async () => {
      if (confirm('Delete this alarm?')) {
        this.alarms.splice(index, 1);
        await this.saveData();
        this.renderTab();
      }
    });
    deleteBtn.style.cssText += 'background: rgba(244,67,54,0.3); padding: 8px 15px;';

    controls.appendChild(toggle);
    controls.appendChild(deleteBtn);

    card.appendChild(info);
    card.appendChild(controls);

    return card;
  }

  showAddAlarmDialog() {
    const dialog = this.createDialog();
    const form = dialog.querySelector('.dialog-content');

    const title = document.createElement('h3');
    title.textContent = 'New Alarm';
    title.style.cssText = 'margin-top: 0; margin-bottom: 20px; color: #333;';
    form.appendChild(title);

    const timeInput = this.createInput('Time', 'time', '07:00');
    const labelInput = this.createInput('Label (optional)', 'text', 'Wake up');

    form.appendChild(timeInput.group);
    form.appendChild(labelInput.group);

    const buttons = document.createElement('div');
    buttons.style.cssText = 'display: flex; gap: 10px; margin-top: 20px;';

    const saveBtn = this.createButton('Save', async () => {
      if (!timeInput.input.value) {
        alert('Please set a time');
        return;
      }

      this.alarms.push({
        id: Date.now(),
        time: timeInput.input.value,
        label: labelInput.input.value || 'Alarm',
        enabled: true
      });

      await this.saveData();
      this.renderTab();
      document.body.removeChild(dialog);
    });
    saveBtn.style.cssText += 'flex: 1; background: #667eea; color: white; padding: 10px;';

    const cancelBtn = this.createButton('Cancel', () => document.body.removeChild(dialog));
    cancelBtn.style.cssText += 'flex: 1; background: #ccc; color: #333; padding: 10px;';

    buttons.appendChild(saveBtn);
    buttons.appendChild(cancelBtn);
    form.appendChild(buttons);

    document.body.appendChild(dialog);
    timeInput.input.focus();
  }

  renderTimer() {
    const timerView = document.createElement('div');
    timerView.style.cssText = 'max-width: 500px; margin: 0 auto; text-align: center;';

    const title = document.createElement('h2');
    title.textContent = 'Timer';
    title.style.cssText = 'margin-bottom: 30px; font-size: 32px;';
    timerView.appendChild(title);

    // Timer input
    const inputGroup = document.createElement('div');
    inputGroup.style.cssText = 'display: flex; gap: 10px; justify-content: center; margin-bottom: 30px;';

    const hoursInput = this.createTimeInput('Hours', 'hours');
    const minutesInput = this.createTimeInput('Minutes', 'minutes');
    const secondsInput = this.createTimeInput('Seconds', 'seconds');

    inputGroup.appendChild(hoursInput);
    inputGroup.appendChild(minutesInput);
    inputGroup.appendChild(secondsInput);
    timerView.appendChild(inputGroup);

    const startBtn = this.createButton('Start Timer', () => {
      const hours = parseInt(hoursInput.querySelector('input').value) || 0;
      const minutes = parseInt(minutesInput.querySelector('input').value) || 0;
      const seconds = parseInt(secondsInput.querySelector('input').value) || 0;
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;

      if (totalSeconds > 0) {
        this.startTimer(totalSeconds);
      } else {
        alert('Please enter a valid time');
      }
    });
    startBtn.style.cssText += 'background: rgba(255,255,255,0.2); padding: 15px 40px; font-size: 18px;';

    timerView.appendChild(startBtn);

    // Active timers
    if (this.timers.length > 0) {
      const activeTitle = document.createElement('h3');
      activeTitle.textContent = 'Active Timers';
      activeTitle.style.cssText = 'margin-top: 40px; margin-bottom: 20px;';
      timerView.appendChild(activeTitle);

      this.timers.forEach((timer, index) => {
        const timerCard = this.createTimerCard(timer, index);
        timerView.appendChild(timerCard);
      });
    }

    this.contentArea.appendChild(timerView);
  }

  createTimeInput(label, id) {
    const group = document.createElement('div');
    group.style.cssText = 'display: flex; flex-direction: column;';

    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    labelEl.style.cssText = 'margin-bottom: 5px; font-size: 14px; opacity: 0.8;';

    const input = document.createElement('input');
    input.type = 'number';
    input.id = id;
    input.min = '0';
    input.max = id === 'hours' ? '23' : '59';
    input.value = '0';
    input.style.cssText = `
      width: 80px;
      padding: 10px;
      font-size: 24px;
      text-align: center;
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 8px;
      background: rgba(255,255,255,0.1);
      color: white;
    `;

    group.appendChild(labelEl);
    group.appendChild(input);
    return group;
  }

  startTimer(seconds) {
    const timer = {
      id: Date.now(),
      totalSeconds: seconds,
      remainingSeconds: seconds,
      startTime: Date.now()
    };

    this.timers.push(timer);

    const intervalId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
      timer.remainingSeconds = timer.totalSeconds - elapsed;

      if (timer.remainingSeconds <= 0) {
        clearInterval(intervalId);
        delete this.timerIntervals[timer.id];
        this.timers = this.timers.filter(t => t.id !== timer.id);
        alert('Timer finished!');
        this.renderTab();
      }
    }, 1000);

    this.timerIntervals[timer.id] = intervalId;
    this.renderTab();
  }

  createTimerCard(timer, index) {
    const card = document.createElement('div');
    card.style.cssText = `
      background: rgba(255,255,255,0.15);
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 10px;
    `;

    const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
    const remaining = Math.max(0, timer.totalSeconds - elapsed);
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;

    const timeDisplay = document.createElement('div');
    timeDisplay.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    timeDisplay.style.cssText = 'font-size: 48px; font-weight: 300; margin-bottom: 10px;';

    const cancelBtn = this.createButton('Cancel', () => {
      clearInterval(this.timerIntervals[timer.id]);
      delete this.timerIntervals[timer.id];
      this.timers.splice(index, 1);
      this.renderTab();
    });
    cancelBtn.style.cssText += 'background: rgba(244,67,54,0.3); padding: 8px 20px;';

    card.appendChild(timeDisplay);
    card.appendChild(cancelBtn);

    // Update timer display
    setTimeout(() => {
      if (this.currentTab === 'timer') {
        this.renderTab();
      }
    }, 1000);

    return card;
  }

  renderStopwatch() {
    const stopwatchView = document.createElement('div');
    stopwatchView.style.cssText = 'max-width: 500px; margin: 0 auto; text-align: center;';

    const title = document.createElement('h2');
    title.textContent = 'Stopwatch';
    title.style.cssText = 'margin-bottom: 40px; font-size: 32px;';
    stopwatchView.appendChild(title);

    // Time display
    const timeDisplay = document.createElement('div');
    timeDisplay.style.cssText = 'font-size: 72px; font-weight: 200; margin-bottom: 40px; font-variant-numeric: tabular-nums;';
    this.stopwatchDisplay = timeDisplay;
    this.updateStopwatchDisplay();
    stopwatchView.appendChild(timeDisplay);

    // Controls
    const controls = document.createElement('div');
    controls.style.cssText = 'display: flex; gap: 20px; justify-content: center;';

    const startStopBtn = this.createButton(
      this.stopwatchRunning ? 'Stop' : 'Start',
      () => this.toggleStopwatch()
    );
    startStopBtn.style.cssText += `
      background: ${this.stopwatchRunning ? 'rgba(244,67,54,0.3)' : 'rgba(76,175,80,0.3)'};
      padding: 15px 40px;
      font-size: 18px;
    `;

    const resetBtn = this.createButton('Reset', () => this.resetStopwatch());
    resetBtn.style.cssText += 'background: rgba(255,255,255,0.2); padding: 15px 40px; font-size: 18px;';

    controls.appendChild(startStopBtn);
    controls.appendChild(resetBtn);
    stopwatchView.appendChild(controls);

    this.contentArea.appendChild(stopwatchView);
  }

  toggleStopwatch() {
    if (this.stopwatchRunning) {
      // Stop
      clearInterval(this.stopwatchInterval);
      this.stopwatchElapsed += Date.now() - this.stopwatchStartTime;
      this.stopwatchRunning = false;
    } else {
      // Start
      this.stopwatchStartTime = Date.now();
      this.stopwatchRunning = true;
      this.stopwatchInterval = setInterval(() => {
        this.updateStopwatchDisplay();
      }, 10);
    }
    this.renderTab();
  }

  resetStopwatch() {
    clearInterval(this.stopwatchInterval);
    this.stopwatchRunning = false;
    this.stopwatchStartTime = null;
    this.stopwatchElapsed = 0;
    this.updateStopwatchDisplay();
    this.renderTab();
  }

  updateStopwatchDisplay() {
    if (!this.stopwatchDisplay) return;

    let total = this.stopwatchElapsed;
    if (this.stopwatchRunning) {
      total += Date.now() - this.stopwatchStartTime;
    }

    const minutes = Math.floor(total / 60000);
    const seconds = Math.floor((total % 60000) / 1000);
    const milliseconds = Math.floor((total % 1000) / 10);

    this.stopwatchDisplay.textContent =
      `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
  }

  checkAlarms() {
    // Check if any alarms should go off
    setInterval(() => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      this.alarms.forEach(alarm => {
        if (alarm.enabled && alarm.time === currentTime) {
          alert(`ð Alarm: ${alarm.label}`);
          alarm.enabled = false;
          this.saveData();
        }
      });
    }, 30000); // Check every 30 seconds
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
      max-width: 400px;
    `;

    dialog.appendChild(content);
    dialog.onclick = (e) => {
      if (e.target === dialog) document.body.removeChild(dialog);
    };

    return dialog;
  }

  createInput(label, type, defaultValue = '') {
    const group = document.createElement('div');
    group.style.cssText = 'margin-bottom: 15px;';

    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    labelEl.style.cssText = 'display: block; margin-bottom: 5px; color: #555; font-weight: 500;';

    const input = document.createElement('input');
    input.type = type;
    input.value = defaultValue;
    input.style.cssText = `
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      box-sizing: border-box;
      color: #333;
    `;

    group.appendChild(labelEl);
    group.appendChild(input);

    return { group, input };
  }

  createButton(text, onClick) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.cssText = `
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: opacity 0.2s;
      font-weight: 600;
    `;
    btn.onmouseover = () => btn.style.opacity = '0.8';
    btn.onmouseout = () => btn.style.opacity = '1';
    btn.onclick = onClick;
    return btn;
  }

  async destroy() {
    clearInterval(this.clockInterval);
    clearInterval(this.stopwatchInterval);
    Object.values(this.timerIntervals).forEach(id => clearInterval(id));
    await this.saveData();
  }
}
