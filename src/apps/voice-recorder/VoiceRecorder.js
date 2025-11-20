export default class VoiceRecorder {
  constructor(context) {
    this.context = context;
    this.fs = context.fs;
    this.ipc = context.ipc;
    this.process = context.process;

    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.isPaused = false;
    this.recordings = [];
    this.currentAudio = null;
    this.recordingStartTime = null;
    this.timerInterval = null;
    this.dataPath = '/home/recordings/';
    this.metadataPath = '/home/recordings-metadata.json';
  }

  async init() {
    // Ensure recordings directory exists
    try {
      await this.fs.mkdir(this.dataPath, { recursive: true });
    } catch (e) {
      // Directory might already exist
    }

    await this.loadRecordings();
  }

  async loadRecordings() {
    try {
      const data = await this.fs.readFile(this.metadataPath);
      this.recordings = JSON.parse(data);
    } catch (error) {
      this.recordings = [];
      await this.saveRecordings();
    }
  }

  async saveRecordings() {
    await this.fs.writeFile(this.metadataPath, JSON.stringify(this.recordings, null, 2));
  }

  render() {
    const container = document.createElement('div');
    container.className = 'voice-recorder-container';
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100%;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: white;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 20px;
      background: rgba(0,0,0,0.2);
      text-align: center;
    `;

    const title = document.createElement('h2');
    title.textContent = '<™ Voice Recorder';
    title.style.cssText = 'margin: 0; font-size: 28px;';
    header.appendChild(title);

    container.appendChild(header);

    // Main content
    const content = document.createElement('div');
    content.style.cssText = `
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
      overflow: auto;
    `;

    // Recording interface
    const recordingBox = document.createElement('div');
    recordingBox.style.cssText = `
      background: rgba(255,255,255,0.15);
      border-radius: 20px;
      padding: 40px;
      margin-bottom: 30px;
      text-align: center;
      backdrop-filter: blur(10px);
    `;

    // Timer display
    this.timerDisplay = document.createElement('div');
    this.timerDisplay.textContent = '00:00';
    this.timerDisplay.style.cssText = `
      font-size: 48px;
      font-weight: 300;
      margin-bottom: 30px;
      font-variant-numeric: tabular-nums;
    `;
    recordingBox.appendChild(this.timerDisplay);

    // Record button
    this.recordButton = document.createElement('button');
    this.recordButton.style.cssText = `
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: none;
      background: #ff4444;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      margin: 0 10px;
    `;
    this.recordButton.onclick = () => this.toggleRecording();
    this.updateRecordButton();

    // Control buttons
    const controls = document.createElement('div');
    controls.style.cssText = 'display: flex; gap: 15px; justify-content: center; align-items: center;';

    this.pauseButton = document.createElement('button');
    this.pauseButton.textContent = this.isPaused ? '¶' : 'ø';
    this.pauseButton.style.cssText = `
      width: 50px;
      height: 50px;
      border-radius: 50%;
      border: none;
      background: rgba(255,255,255,0.3);
      cursor: pointer;
      font-size: 20px;
      display: ${this.isRecording ? 'block' : 'none'};
    `;
    this.pauseButton.onclick = () => this.togglePause();

    controls.appendChild(this.pauseButton);
    controls.appendChild(this.recordButton);

    recordingBox.appendChild(controls);

    // Recording status
    this.statusText = document.createElement('div');
    this.statusText.textContent = 'Ready to record';
    this.statusText.style.cssText = `
      margin-top: 20px;
      font-size: 16px;
      opacity: 0.9;
    `;
    recordingBox.appendChild(this.statusText);

    content.appendChild(recordingBox);

    // Recordings list
    const recordingsList = document.createElement('div');
    recordingsList.style.cssText = `
      width: 100%;
      max-width: 600px;
    `;

    const listTitle = document.createElement('h3');
    listTitle.textContent = 'Recordings';
    listTitle.style.cssText = 'margin-bottom: 15px; font-size: 20px;';
    recordingsList.appendChild(listTitle);

    this.recordingsContainer = document.createElement('div');
    this.recordingsContainer.style.cssText = 'display: flex; flex-direction: column; gap: 10px;';
    this.renderRecordingsList();
    recordingsList.appendChild(this.recordingsContainer);

    content.appendChild(recordingsList);
    container.appendChild(content);

    return container;
  }

  updateRecordButton() {
    if (this.isRecording) {
      this.recordButton.style.background = '#333';
      this.recordButton.style.borderRadius = '15px';
      this.recordButton.style.width = '60px';
      this.recordButton.style.height = '60px';
    } else {
      this.recordButton.style.background = '#ff4444';
      this.recordButton.style.borderRadius = '50%';
      this.recordButton.style.width = '80px';
      this.recordButton.style.height = '80px';
    }
  }

  async toggleRecording() {
    if (this.isRecording) {
      await this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        await this.saveRecording(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.isPaused = false;
      this.recordingStartTime = Date.now();

      this.startTimer();
      this.updateRecordButton();
      this.pauseButton.style.display = 'block';
      this.statusText.textContent = '=4 Recording...';

    } catch (error) {
      alert('Could not access microphone. Please grant permission.');
      console.error('Error accessing microphone:', error);
    }
  }

  async stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.isPaused = false;
      this.stopTimer();
      this.updateRecordButton();
      this.pauseButton.style.display = 'none';
      this.timerDisplay.textContent = '00:00';
      this.statusText.textContent = 'Recording saved!';

      setTimeout(() => {
        this.statusText.textContent = 'Ready to record';
      }, 2000);
    }
  }

  togglePause() {
    if (!this.mediaRecorder || !this.isRecording) return;

    if (this.isPaused) {
      this.mediaRecorder.resume();
      this.isPaused = false;
      this.pauseButton.textContent = 'ø';
      this.statusText.textContent = '=4 Recording...';
      this.startTimer();
    } else {
      this.mediaRecorder.pause();
      this.isPaused = true;
      this.pauseButton.textContent = '¶';
      this.statusText.textContent = 'ø Paused';
      this.stopTimer();
    }
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      this.timerDisplay.textContent =
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  async saveRecording(audioBlob) {
    const timestamp = Date.now();
    const filename = `recording-${timestamp}.webm`;
    const filepath = this.dataPath + filename;

    // Convert blob to array buffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Save audio file
    await this.fs.writeFile(filepath, uint8Array);

    // Save metadata
    const recording = {
      id: timestamp,
      filename: filename,
      path: filepath,
      date: new Date().toISOString(),
      duration: Math.floor((Date.now() - this.recordingStartTime) / 1000),
      size: uint8Array.length
    };

    this.recordings.unshift(recording);
    await this.saveRecordings();
    this.renderRecordingsList();
  }

  renderRecordingsList() {
    this.recordingsContainer.innerHTML = '';

    if (this.recordings.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = 'No recordings yet';
      empty.style.cssText = `
        text-align: center;
        padding: 30px;
        opacity: 0.6;
      `;
      this.recordingsContainer.appendChild(empty);
      return;
    }

    this.recordings.forEach((recording, index) => {
      const card = this.createRecordingCard(recording, index);
      this.recordingsContainer.appendChild(card);
    });
  }

  createRecordingCard(recording, index) {
    const card = document.createElement('div');
    card.style.cssText = `
      background: rgba(255,255,255,0.15);
      border-radius: 8px;
      padding: 15px;
      display: flex;
      align-items: center;
      gap: 15px;
    `;

    // Info
    const info = document.createElement('div');
    info.style.cssText = 'flex: 1;';

    const date = new Date(recording.date);
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const title = document.createElement('div');
    title.textContent = `Recording ${this.recordings.length - index}`;
    title.style.cssText = 'font-weight: 600; margin-bottom: 5px;';

    const details = document.createElement('div');
    details.textContent = `${dateStr} " ${this.formatDuration(recording.duration)} " ${this.formatSize(recording.size)}`;
    details.style.cssText = 'font-size: 12px; opacity: 0.8;';

    info.appendChild(title);
    info.appendChild(details);

    // Controls
    const controls = document.createElement('div');
    controls.style.cssText = 'display: flex; gap: 8px;';

    const playBtn = this.createIconButton('¶', async () => {
      await this.playRecording(recording);
    });

    const downloadBtn = this.createIconButton('=¾', async () => {
      await this.downloadRecording(recording);
    });

    const deleteBtn = this.createIconButton('=Ñ', async () => {
      if (confirm('Delete this recording?')) {
        await this.deleteRecording(index);
      }
    });

    controls.appendChild(playBtn);
    controls.appendChild(downloadBtn);
    controls.appendChild(deleteBtn);

    card.appendChild(info);
    card.appendChild(controls);

    return card;
  }

  async playRecording(recording) {
    try {
      // Stop current audio if playing
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio = null;
      }

      // Read the audio file
      const audioData = await this.fs.readFile(recording.path);
      const blob = new Blob([audioData], { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);

      // Create and play audio
      this.currentAudio = new Audio(url);
      this.currentAudio.play();

      this.currentAudio.onended = () => {
        URL.revokeObjectURL(url);
        this.currentAudio = null;
      };

    } catch (error) {
      alert('Could not play recording');
      console.error('Error playing recording:', error);
    }
  }

  async downloadRecording(recording) {
    try {
      const audioData = await this.fs.readFile(recording.path);
      const blob = new Blob([audioData], { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = recording.filename;
      a.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Could not download recording');
      console.error('Error downloading recording:', error);
    }
  }

  async deleteRecording(index) {
    const recording = this.recordings[index];

    try {
      // Delete file
      await this.fs.unlink(recording.path);
    } catch (e) {
      console.error('Error deleting file:', e);
    }

    // Remove from list
    this.recordings.splice(index, 1);
    await this.saveRecordings();
    this.renderRecordingsList();
  }

  createIconButton(icon, onClick) {
    const btn = document.createElement('button');
    btn.textContent = icon;
    btn.style.cssText = `
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      cursor: pointer;
      font-size: 16px;
      transition: background 0.2s;
    `;
    btn.onmouseover = () => btn.style.background = 'rgba(255,255,255,0.3)';
    btn.onmouseout = () => btn.style.background = 'rgba(255,255,255,0.2)';
    btn.onclick = onClick;
    return btn;
  }

  formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  async destroy() {
    this.stopTimer();
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
  }
}
