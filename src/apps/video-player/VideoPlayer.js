export default class VideoPlayer {
  constructor(context) {
    this.context = context;
    this.fs = context.fs;
    this.args = context.args;

    this.videoUrl = null;
    this.playlist = [];
    this.currentIndex = 0;
    this.isPlaying = false;
    this.volume = 1;
    this.playbackRate = 1;
  }

  async init() {
    // Check if a video file was passed as argument
    if (this.args && this.args.file) {
      try {
        const videoData = await this.fs.readFile(this.args.file);
        this.videoUrl = URL.createObjectURL(new Blob([videoData]));
      } catch (error) {
        console.error('Failed to load video:', error);
      }
    }
  }

  render() {
    const container = document.createElement('div');
    container.className = 'video-player-app';
    container.innerHTML = `
      <div class="video-player-layout">
        <div class="video-container">
          ${this.videoUrl ? `
            <video class="video-element" controls>
              <source src="${this.videoUrl}" type="video/mp4">
              Your browser does not support the video tag.
            </video>
          ` : `
            <div class="empty-video">
              <div class="empty-icon">🎬</div>
              <div class="empty-text">No video loaded</div>
              <button class="load-video-btn">Load Video</button>
              <div class="sample-videos">
                <h4>Try these sample videos:</h4>
                <button class="sample-btn" data-url="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4">Big Buck Bunny</button>
                <button class="sample-btn" data-url="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4">Elephants Dream</button>
                <button class="sample-btn" data-url="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4">For Bigger Blazes</button>
              </div>
            </div>
          `}
        </div>
        <div class="controls-panel">
          <div class="playback-controls">
            <button class="control-btn prev-btn" title="Previous">⏮️</button>
            <button class="control-btn play-pause-btn" title="Play/Pause">${this.isPlaying ? '⏸️' : '▶️'}</button>
            <button class="control-btn next-btn" title="Next">⏭️</button>
            <button class="control-btn stop-btn" title="Stop">⏹️</button>
          </div>
          <div class="volume-control">
            <span class="volume-icon">🔊</span>
            <input type="range" class="volume-slider" min="0" max="1" step="0.1" value="${this.volume}">
          </div>
          <div class="speed-control">
            <label>Speed:</label>
            <select class="speed-select">
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1" selected>1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>
          </div>
          <div class="extra-controls">
            <button class="control-btn fullscreen-btn" title="Fullscreen">⛶</button>
            <button class="control-btn pip-btn" title="Picture-in-Picture">📺</button>
          </div>
        </div>
        <div class="playlist-panel">
          <h3>Playlist</h3>
          <div class="playlist-items">
            ${this.renderPlaylist()}
          </div>
          <button class="add-to-playlist-btn">+ Add to Playlist</button>
        </div>
      </div>
    `;

    this.attachEventListeners(container);
    return container;
  }

  renderPlaylist() {
    if (this.playlist.length === 0) {
      return '<div class="empty-playlist">No videos in playlist</div>';
    }

    return this.playlist.map((item, index) => `
      <div class="playlist-item ${index === this.currentIndex ? 'active' : ''}" data-index="${index}">
        <span class="playlist-number">${index + 1}</span>
        <span class="playlist-title">${item.name}</span>
        <button class="remove-playlist-btn" data-index="${index}">×</button>
      </div>
    `).join('');
  }

  attachEventListeners(container) {
    const video = container.querySelector('.video-element');

    if (video) {
      // Video events
      video.addEventListener('play', () => {
        this.isPlaying = true;
        this.updatePlayButton();
      });

      video.addEventListener('pause', () => {
        this.isPlaying = false;
        this.updatePlayButton();
      });

      video.addEventListener('ended', () => {
        this.playNext();
      });

      // Play/Pause button
      const playPauseBtn = container.querySelector('.play-pause-btn');
      if (playPauseBtn) {
        playPauseBtn.addEventListener('click', () => {
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
        });
      }

      // Stop button
      const stopBtn = container.querySelector('.stop-btn');
      if (stopBtn) {
        stopBtn.addEventListener('click', () => {
          video.pause();
          video.currentTime = 0;
        });
      }

      // Previous/Next buttons
      const prevBtn = container.querySelector('.prev-btn');
      if (prevBtn) {
        prevBtn.addEventListener('click', () => this.playPrevious());
      }

      const nextBtn = container.querySelector('.next-btn');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => this.playNext());
      }

      // Volume control
      const volumeSlider = container.querySelector('.volume-slider');
      if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
          this.volume = parseFloat(e.target.value);
          video.volume = this.volume;
          this.updateVolumeIcon();
        });
      }

      // Playback speed
      const speedSelect = container.querySelector('.speed-select');
      if (speedSelect) {
        speedSelect.addEventListener('change', (e) => {
          this.playbackRate = parseFloat(e.target.value);
          video.playbackRate = this.playbackRate;
        });
      }

      // Fullscreen
      const fullscreenBtn = container.querySelector('.fullscreen-btn');
      if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
          if (video.requestFullscreen) {
            video.requestFullscreen();
          } else if (video.webkitRequestFullscreen) {
            video.webkitRequestFullscreen();
          }
        });
      }

      // Picture-in-Picture
      const pipBtn = container.querySelector('.pip-btn');
      if (pipBtn) {
        pipBtn.addEventListener('click', async () => {
          try {
            if (document.pictureInPictureElement) {
              await document.exitPictureInPicture();
            } else {
              await video.requestPictureInPicture();
            }
          } catch (error) {
            console.error('PiP error:', error);
          }
        });
      }
    }

    // Load video button
    const loadVideoBtn = container.querySelector('.load-video-btn');
    if (loadVideoBtn) {
      loadVideoBtn.addEventListener('click', () => this.loadVideoFile());
    }

    // Sample video buttons
    container.querySelectorAll('.sample-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.loadVideoFromUrl(btn.dataset.url, btn.textContent);
      });
    });

    // Add to playlist button
    const addToPlaylistBtn = container.querySelector('.add-to-playlist-btn');
    if (addToPlaylistBtn) {
      addToPlaylistBtn.addEventListener('click', () => this.loadVideoFile(true));
    }

    // Playlist item click
    container.querySelectorAll('.playlist-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('remove-playlist-btn')) {
          const index = parseInt(item.dataset.index);
          this.playFromPlaylist(index);
        }
      });
    });

    // Remove from playlist
    container.querySelectorAll('.remove-playlist-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index);
        this.removeFromPlaylist(index);
      });
    });
  }

  async loadVideoFile(addToPlaylist = false) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';

    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        const url = URL.createObjectURL(file);
        if (addToPlaylist) {
          this.playlist.push({ name: file.name, url: url });
          this.refresh();
        } else {
          this.videoUrl = url;
          this.playlist = [{ name: file.name, url: url }];
          this.currentIndex = 0;
          this.refresh();
        }
      }
    });

    input.click();
  }

  loadVideoFromUrl(url, name) {
    this.videoUrl = url;
    this.playlist = [{ name: name, url: url }];
    this.currentIndex = 0;
    this.refresh();
  }

  playFromPlaylist(index) {
    if (index >= 0 && index < this.playlist.length) {
      this.currentIndex = index;
      this.videoUrl = this.playlist[index].url;
      this.refresh();

      // Auto-play after loading
      setTimeout(() => {
        const video = document.querySelector('.video-element');
        if (video) {
          video.play();
        }
      }, 100);
    }
  }

  playNext() {
    if (this.playlist.length > 0) {
      this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
      this.playFromPlaylist(this.currentIndex);
    }
  }

  playPrevious() {
    if (this.playlist.length > 0) {
      this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
      this.playFromPlaylist(this.currentIndex);
    }
  }

  removeFromPlaylist(index) {
    this.playlist.splice(index, 1);
    if (this.currentIndex >= this.playlist.length) {
      this.currentIndex = Math.max(0, this.playlist.length - 1);
    }
    this.refresh();
  }

  updatePlayButton() {
    const playPauseBtn = document.querySelector('.play-pause-btn');
    if (playPauseBtn) {
      playPauseBtn.textContent = this.isPlaying ? '⏸️' : '▶️';
    }
  }

  updateVolumeIcon() {
    const volumeIcon = document.querySelector('.volume-icon');
    if (volumeIcon) {
      if (this.volume === 0) {
        volumeIcon.textContent = '🔇';
      } else if (this.volume < 0.5) {
        volumeIcon.textContent = '🔉';
      } else {
        volumeIcon.textContent = '🔊';
      }
    }
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
