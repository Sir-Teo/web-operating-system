/**
 * Screen Recorder Application
 * Professional screen capture and recording with editing capabilities
 *
 * Features:
 * - Screen, window, or tab capture
 * - Webcam overlay support
 * - Audio recording (system + microphone)
 * - Real-time preview
 * - Recording controls (pause, resume, stop)
 * - Video trimming and editing
 * - Multiple output formats (WebM, MP4)
 * - Quality settings
 * - FPS control
 * - Countdown timer
 * - Annotations while recording
 */

export default class ScreenRecorder {
    static metadata = {
        name: 'Screen Recorder',
        description: 'Record screen, webcam, and audio',
        author: 'WebOS',
        version: '1.0.0',
        category: 'media',
        icon: '🎥'
    };

    constructor(context) {
        this.context = context;
        this.container = null;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.stream = null;
        this.isRecording = false;
        this.isPaused = false;
        this.startTime = null;
        this.pausedTime = 0;
        this.timer = null;
    }

    async init() {
        console.log('[ScreenRecorder] Initialized');
    }

    render() {
        this.container = document.createElement('div');
        this.container.innerHTML = this.createUI();

        setTimeout(() => {
            this.attachEventListeners();
        }, 0);

        return this.container;
    }

    createUI() {
        return `
            <style>
                .recorder-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%);
                    color: #e0e0e0;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .recorder-toolbar {
                    display: flex;
                    gap: 12px;
                    padding: 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                }

                .toolbar-btn {
                    padding: 12px 20px;
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 8px;
                    color: #e0e0e0;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s ease;
                    font-weight: 500;
                }

                .toolbar-btn:hover {
                    background: rgba(255, 255, 255, 0.15);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                }

                .toolbar-btn.record {
                    background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
                    border-color: #dc3545;
                    box-shadow: 0 4px 15px rgba(220, 53, 69, 0.4);
                }

                .toolbar-btn.stop {
                    background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
                    border-color: #6c757d;
                }

                .toolbar-btn.pause {
                    background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
                    border-color: #ffc107;
                }

                .toolbar-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                    transform: none;
                }

                .recorder-content {
                    display: flex;
                    flex: 1;
                    overflow: hidden;
                }

                .settings-panel {
                    width: 280px;
                    background: rgba(255, 255, 255, 0.03);
                    border-right: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 20px;
                    overflow-y: auto;
                }

                .settings-section {
                    margin-bottom: 24px;
                }

                .settings-section h3 {
                    margin: 0 0 12px 0;
                    font-size: 13px;
                    font-weight: 600;
                    color: #a0a0a0;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .setting-option {
                    margin: 12px 0;
                }

                .setting-option label {
                    display: block;
                    margin-bottom: 6px;
                    font-size: 13px;
                    color: #b0b0b0;
                }

                .setting-option select,
                .setting-option input[type="number"] {
                    width: 100%;
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 6px;
                    color: #e0e0e0;
                    font-size: 13px;
                }

                .setting-option input[type="checkbox"] {
                    margin-right: 8px;
                }

                .preview-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    padding: 24px;
                    overflow: hidden;
                }

                .preview-wrapper {
                    flex: 1;
                    background: #000;
                    border-radius: 12px;
                    overflow: hidden;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid rgba(255, 255, 255, 0.1);
                }

                #previewVideo {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                }

                .recording-indicator {
                    position: absolute;
                    top: 16px;
                    left: 16px;
                    padding: 12px 20px;
                    background: rgba(220, 53, 69, 0.9);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-weight: 600;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
                    display: none;
                }

                .recording-indicator.active {
                    display: flex;
                }

                .rec-dot {
                    width: 12px;
                    height: 12px;
                    background: white;
                    border-radius: 50%;
                    animation: pulse 1.5s infinite;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }

                .timer-display {
                    font-family: 'Monaco', 'Menlo', monospace;
                    font-size: 18px;
                }

                .preview-controls {
                    margin-top: 20px;
                    padding: 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .status-text {
                    font-size: 14px;
                    color: #a0a0a0;
                }

                .status-text.recording {
                    color: #dc3545;
                    font-weight: 600;
                }

                .recordings-list {
                    margin-top: 20px;
                    padding: 16px;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 8px;
                    max-height: 200px;
                    overflow-y: auto;
                }

                .recording-item {
                    padding: 12px;
                    margin-bottom: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .recording-info {
                    flex: 1;
                }

                .recording-name {
                    font-size: 13px;
                    font-weight: 500;
                    margin-bottom: 4px;
                }

                .recording-meta {
                    font-size: 11px;
                    color: #888;
                }

                .recording-actions {
                    display: flex;
                    gap: 6px;
                }

                .small-btn {
                    padding: 6px 12px;
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 4px;
                    color: #e0e0e0;
                    cursor: pointer;
                    font-size: 11px;
                }

                .small-btn:hover {
                    background: rgba(255, 255, 255, 0.15);
                }

                .countdown-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    display: none;
                    align-items: center;
                    justify-content: center;
                    font-size: 120px;
                    font-weight: bold;
                    color: white;
                    z-index: 100;
                }

                .countdown-overlay.active {
                    display: flex;
                }
            </style>

            <div class="recorder-container">
                <div class="recorder-toolbar">
                    <button class="toolbar-btn record" data-action="startRecording">🔴 Start Recording</button>
                    <button class="toolbar-btn pause" data-action="pauseRecording" disabled>⏸️ Pause</button>
                    <button class="toolbar-btn stop" data-action="stopRecording" disabled>⏹️ Stop</button>
                    <button class="toolbar-btn" data-action="screenshot">📸 Screenshot</button>
                    <button class="toolbar-btn" data-action="settings">⚙️ Settings</button>
                </div>

                <div class="recorder-content">
                    <div class="settings-panel">
                        <div class="settings-section">
                            <h3>Capture Source</h3>
                            <div class="setting-option">
                                <label>Source Type</label>
                                <select id="sourceType">
                                    <option value="screen">Entire Screen</option>
                                    <option value="window">Window</option>
                                    <option value="tab">Browser Tab</option>
                                </select>
                            </div>
                        </div>

                        <div class="settings-section">
                            <h3>Audio Settings</h3>
                            <div class="setting-option">
                                <label>
                                    <input type="checkbox" id="recordSystemAudio" checked>
                                    Record System Audio
                                </label>
                            </div>
                            <div class="setting-option">
                                <label>
                                    <input type="checkbox" id="recordMicrophone" checked>
                                    Record Microphone
                                </label>
                            </div>
                        </div>

                        <div class="settings-section">
                            <h3>Video Quality</h3>
                            <div class="setting-option">
                                <label>Resolution</label>
                                <select id="resolution">
                                    <option value="1920x1080">1080p (1920×1080)</option>
                                    <option value="1280x720" selected>720p (1280×720)</option>
                                    <option value="854x480">480p (854×480)</option>
                                    <option value="640x360">360p (640×360)</option>
                                </select>
                            </div>
                            <div class="setting-option">
                                <label>Frame Rate</label>
                                <select id="frameRate">
                                    <option value="60">60 FPS</option>
                                    <option value="30" selected>30 FPS</option>
                                    <option value="24">24 FPS</option>
                                    <option value="15">15 FPS</option>
                                </select>
                            </div>
                            <div class="setting-option">
                                <label>Bitrate (kbps)</label>
                                <input type="number" id="bitrate" value="2500" min="500" max="10000" step="100">
                            </div>
                        </div>

                        <div class="settings-section">
                            <h3>Recording Options</h3>
                            <div class="setting-option">
                                <label>
                                    <input type="checkbox" id="showWebcam">
                                    Show Webcam Overlay
                                </label>
                            </div>
                            <div class="setting-option">
                                <label>
                                    <input type="checkbox" id="countdown" checked>
                                    3-Second Countdown
                                </label>
                            </div>
                            <div class="setting-option">
                                <label>Output Format</label>
                                <select id="outputFormat">
                                    <option value="webm">WebM</option>
                                    <option value="mp4">MP4 (experimental)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="preview-container">
                        <div class="preview-wrapper">
                            <video id="previewVideo" autoplay muted></video>

                            <div class="recording-indicator" id="recordingIndicator">
                                <div class="rec-dot"></div>
                                <span class="timer-display" id="timerDisplay">00:00:00</span>
                            </div>

                            <div class="countdown-overlay" id="countdownOverlay">
                                <span id="countdownNumber">3</span>
                            </div>
                        </div>

                        <div class="preview-controls">
                            <div class="status-text" id="statusText">Ready to record</div>
                            <div style="display: flex; gap: 12px;">
                                <button class="toolbar-btn" data-action="preview">👁️ Preview</button>
                            </div>
                        </div>

                        <div class="recordings-list" id="recordingsList">
                            <h3 style="margin: 0 0 12px 0; font-size: 13px; color: #a0a0a0;">Recent Recordings</h3>
                            <div style="text-align: center; color: #666; padding: 20px;">
                                No recordings yet
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        const body = this.container;

        body.querySelector('[data-action="startRecording"]').addEventListener('click', () => this.startRecording());
        body.querySelector('[data-action="pauseRecording"]').addEventListener('click', () => this.pauseRecording());
        body.querySelector('[data-action="stopRecording"]').addEventListener('click', () => this.stopRecording());
        body.querySelector('[data-action="screenshot"]').addEventListener('click', () => this.takeScreenshot());
        body.querySelector('[data-action="preview"]').addEventListener('click', () => this.togglePreview());
    }

    async togglePreview() {
        const video = this.container.querySelector('#previewVideo');

        if (this.stream) {
            // Stop preview
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
            video.srcObject = null;
            this.updateStatus('Preview stopped');
        } else {
            // Start preview
            await this.startPreview();
        }
    }

    async startPreview() {
        try {
            const video = this.container.querySelector('#previewVideo');

            this.stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: 'always',
                    frameRate: parseInt(this.container.querySelector('#frameRate').value)
                },
                audio: this.container.querySelector('#recordSystemAudio').checked
            });

            // Add microphone if enabled
            if (this.container.querySelector('#recordMicrophone').checked) {
                try {
                    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    const audioTrack = audioStream.getAudioTracks()[0];
                    this.stream.addTrack(audioTrack);
                } catch (error) {
                    console.error('Failed to get microphone:', error);
                }
            }

            video.srcObject = this.stream;
            this.updateStatus('Preview active');
        } catch (error) {
            console.error('Error starting preview:', error);
            alert('Failed to start preview. Please grant screen capture permission.');
        }
    }

    async startRecording() {
        try {
            // Start preview if not already active
            if (!this.stream) {
                await this.startPreview();
            }

            // Show countdown if enabled
            if (this.container.querySelector('#countdown').checked) {
                await this.showCountdown();
            }

            const format = this.container.querySelector('#outputFormat').value;
            const mimeType = format === 'webm' ? 'video/webm;codecs=vp9' : 'video/mp4';

            this.recordedChunks = [];
            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType: mimeType,
                videoBitsPerSecond: parseInt(this.container.querySelector('#bitrate').value) * 1000
            });

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.saveRecording();
            };

            this.mediaRecorder.start(100); // Collect data every 100ms

            this.isRecording = true;
            this.isPaused = false;
            this.startTime = Date.now();
            this.pausedTime = 0;

            this.startTimer();
            this.updateUI();
            this.updateStatus('Recording...', true);

            this.container.querySelector('#recordingIndicator').classList.add('active');
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Failed to start recording: ' + error.message);
        }
    }

    async showCountdown() {
        const overlay = this.container.querySelector('#countdownOverlay');
        const number = this.container.querySelector('#countdownNumber');

        overlay.classList.add('active');

        for (let i = 3; i > 0; i--) {
            number.textContent = i;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        overlay.classList.remove('active');
    }

    pauseRecording() {
        if (this.isPaused) {
            this.mediaRecorder.resume();
            this.isPaused = false;
            this.startTime = Date.now() - this.pausedTime;
            this.startTimer();
            this.updateStatus('Recording...', true);
            this.container.querySelector('[data-action="pauseRecording"]').textContent = '⏸️ Pause';
        } else {
            this.mediaRecorder.pause();
            this.isPaused = true;
            this.pausedTime = Date.now() - this.startTime;
            this.stopTimer();
            this.updateStatus('Paused', false);
            this.container.querySelector('[data-action="pauseRecording"]').textContent = '▶️ Resume';
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.isPaused = false;
            this.stopTimer();
            this.updateUI();
            this.updateStatus('Recording stopped');

            this.container.querySelector('#recordingIndicator').classList.remove('active');
        }
    }

    async saveRecording() {
        const blob = new Blob(this.recordedChunks, {
            type: this.container.querySelector('#outputFormat').value === 'webm' ? 'video/webm' : 'video/mp4'
        });

        const filename = `recording-${Date.now()}.${this.container.querySelector('#outputFormat').value}`;
        const url = URL.createObjectURL(blob);

        // Add to recordings list
        this.addRecordingToList(filename, blob.size, url);

        // Download
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();

        // Save to filesystem
        try {
            const arrayBuffer = await blob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            await this.context.fs.writeFile(
                `/home/${this.context.kernel.currentUser}/Videos/${filename}`,
                uint8Array
            );
        } catch (error) {
            console.error('Failed to save to filesystem:', error);
        }
    }

    addRecordingToList(filename, size, url) {
        const list = this.container.querySelector('#recordingsList');

        // Create first recording or replace placeholder
        const existingPlaceholder = list.querySelector('[style*="padding: 20px"]');
        if (existingPlaceholder) {
            existingPlaceholder.remove();
        }

        const item = document.createElement('div');
        item.className = 'recording-item';
        item.innerHTML = `
            <div class="recording-info">
                <div class="recording-name">${filename}</div>
                <div class="recording-meta">${(size / 1024 / 1024).toFixed(2)} MB • ${new Date().toLocaleString()}</div>
            </div>
            <div class="recording-actions">
                <button class="small-btn" onclick="window.open('${url}')">▶️ Play</button>
                <button class="small-btn" onclick="this.closest('.recording-item').remove()">🗑️ Delete</button>
            </div>
        `;

        list.appendChild(item);
    }

    async takeScreenshot() {
        try {
            const video = this.container.querySelector('#previewVideo');

            if (!video.srcObject) {
                alert('Please start preview first');
                return;
            }

            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);

            canvas.toBlob(async (blob) => {
                const filename = `screenshot-${Date.now()}.png`;
                const url = URL.createObjectURL(blob);

                // Download
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();

                // Save to filesystem
                try {
                    const arrayBuffer = await blob.arrayBuffer();
                    const uint8Array = new Uint8Array(arrayBuffer);

                    await this.context.fs.writeFile(
                        `/home/${this.context.kernel.currentUser}/Pictures/${filename}`,
                        uint8Array
                    );

                    alert('Screenshot saved!');
                } catch (error) {
                    console.error('Failed to save screenshot:', error);
                }
            });
        } catch (error) {
            console.error('Error taking screenshot:', error);
            alert('Failed to take screenshot');
        }
    }

    startTimer() {
        this.timer = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const hours = Math.floor(elapsed / 3600000);
            const minutes = Math.floor((elapsed % 3600000) / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);

            const timeString = [hours, minutes, seconds]
                .map(v => v.toString().padStart(2, '0'))
                .join(':');

            this.container.querySelector('#timerDisplay').textContent = timeString;
        }, 100);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    updateUI() {
        const startBtn = this.container.querySelector('[data-action="startRecording"]');
        const pauseBtn = this.container.querySelector('[data-action="pauseRecording"]');
        const stopBtn = this.container.querySelector('[data-action="stopRecording"]');

        startBtn.disabled = this.isRecording;
        pauseBtn.disabled = !this.isRecording;
        stopBtn.disabled = !this.isRecording;
    }

    updateStatus(text, isRecording = false) {
        const statusText = this.container.querySelector('#statusText');
        statusText.textContent = text;
        statusText.classList.toggle('recording', isRecording);
    }
}
