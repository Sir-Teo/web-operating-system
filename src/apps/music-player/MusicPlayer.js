export default class MusicPlayer {
  constructor(context) {
    this.context = context;
    this.audio = new Audio();
    this.playlist = [];
    this.currentIndex = -1;
    this.isPlaying = false;
    this.isShuffle = false;
    this.repeatMode = 'none'; // 'none', 'one', 'all'
  }

  async init() {
    // Set up audio event listeners
    this.audio.addEventListener('ended', () => {
      this.handleTrackEnd();
    });

    this.audio.addEventListener('timeupdate', () => {
      if (this.progressBar && this.currentTimeLabel) {
        const progress = (this.audio.currentTime / this.audio.duration) * 100 || 0;
        this.progressBar.value = progress;
        this.currentTimeLabel.textContent = this.formatTime(this.audio.currentTime);
      }
    });

    this.audio.addEventListener('loadedmetadata', () => {
      if (this.durationLabel) {
        this.durationLabel.textContent = this.formatTime(this.audio.duration);
      }
    });

    // Check if an audio file was passed as argument
    if (this.context.args && this.context.args.file) {
      await this.addToPlaylist(this.context.args.file);
      this.playTrack(0);
    }
  }

  render() {
    const container = document.createElement('div');
    container.className = 'music-player-container';
    container.style.cssText = 'display:flex;flex-direction:column;height:100%;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:#fff;';

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'padding:20px;text-align:center;background:rgba(0,0,0,0.2);';
    const title = document.createElement('h2');
    title.textContent = '🎵 Music Player';
    title.style.cssText = 'margin:0;font-size:24px;';
    header.appendChild(title);

    // Now playing section
    const nowPlaying = document.createElement('div');
    nowPlaying.style.cssText = 'padding:30px;text-align:center;flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;';

    const albumArt = document.createElement('div');
    albumArt.style.cssText = 'width:200px;height:200px;background:rgba(0,0,0,0.3);border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;font-size:80px;';
    albumArt.textContent = '🎵';
    this.albumArt = albumArt;

    this.trackNameLabel = document.createElement('div');
    this.trackNameLabel.style.cssText = 'font-size:24px;font-weight:bold;margin-bottom:10px;';
    this.trackNameLabel.textContent = 'No track loaded';

    this.trackInfoLabel = document.createElement('div');
    this.trackInfoLabel.style.cssText = 'font-size:14px;opacity:0.8;';
    this.trackInfoLabel.textContent = '';

    nowPlaying.appendChild(albumArt);
    nowPlaying.appendChild(this.trackNameLabel);
    nowPlaying.appendChild(this.trackInfoLabel);

    // Progress bar
    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = 'padding:0 30px;';

    const progressWrapper = document.createElement('div');
    progressWrapper.style.cssText = 'display:flex;align-items:center;gap:10px;';

    this.currentTimeLabel = document.createElement('span');
    this.currentTimeLabel.textContent = '0:00';
    this.currentTimeLabel.style.cssText = 'font-size:12px;min-width:40px;';

    this.progressBar = document.createElement('input');
    this.progressBar.type = 'range';
    this.progressBar.min = '0';
    this.progressBar.max = '100';
    this.progressBar.value = '0';
    this.progressBar.style.cssText = 'flex:1;height:6px;border-radius:3px;outline:none;';

    this.progressBar.addEventListener('input', () => {
      const seekTime = (this.progressBar.value / 100) * this.audio.duration;
      this.audio.currentTime = seekTime;
    });

    this.durationLabel = document.createElement('span');
    this.durationLabel.textContent = '0:00';
    this.durationLabel.style.cssText = 'font-size:12px;min-width:40px;text-align:right;';

    progressWrapper.appendChild(this.currentTimeLabel);
    progressWrapper.appendChild(this.progressBar);
    progressWrapper.appendChild(this.durationLabel);
    progressContainer.appendChild(progressWrapper);

    // Controls
    const controls = document.createElement('div');
    controls.style.cssText = 'padding:20px;display:flex;justify-content:center;align-items:center;gap:15px;background:rgba(0,0,0,0.2);';

    const shuffleBtn = this._createControlButton('🔀', () => this.toggleShuffle());
    this.shuffleBtn = shuffleBtn;

    const prevBtn = this._createControlButton('⏮️', () => this.previousTrack());

    this.playPauseBtn = this._createControlButton('▶️', () => this.togglePlayPause(), true);

    const nextBtn = this._createControlButton('⏭️', () => this.nextTrack());

    const repeatBtn = this._createControlButton('🔁', () => this.toggleRepeat());
    this.repeatBtn = repeatBtn;

    // Volume control
    const volumeContainer = document.createElement('div');
    volumeContainer.style.cssText = 'display:flex;align-items:center;gap:10px;margin-left:20px;';

    const volumeIcon = document.createElement('span');
    volumeIcon.textContent = '🔊';
    volumeIcon.style.cssText = 'font-size:20px;';

    const volumeSlider = document.createElement('input');
    volumeSlider.type = 'range';
    volumeSlider.min = '0';
    volumeSlider.max = '100';
    volumeSlider.value = '70';
    volumeSlider.style.cssText = 'width:100px;';
    this.audio.volume = 0.7;

    volumeSlider.addEventListener('input', () => {
      this.audio.volume = volumeSlider.value / 100;
    });

    volumeContainer.appendChild(volumeIcon);
    volumeContainer.appendChild(volumeSlider);

    controls.appendChild(shuffleBtn);
    controls.appendChild(prevBtn);
    controls.appendChild(this.playPauseBtn);
    controls.appendChild(nextBtn);
    controls.appendChild(repeatBtn);
    controls.appendChild(volumeContainer);

    // Playlist toolbar
    const playlistToolbar = document.createElement('div');
    playlistToolbar.style.cssText = 'padding:10px 20px;background:rgba(0,0,0,0.3);display:flex;gap:10px;';

    const addBtn = this._createButton('➕ Add Track', async () => {
      const path = prompt('Enter audio file path:', '/home/user/');
      if (path) {
        await this.addToPlaylist(path);
      }
    });

    const clearBtn = this._createButton('🗑️ Clear Playlist', () => {
      if (confirm('Clear entire playlist?')) {
        this.clearPlaylist();
      }
    });

    playlistToolbar.appendChild(addBtn);
    playlistToolbar.appendChild(clearBtn);

    // Playlist
    this.playlistContainer = document.createElement('div');
    this.playlistContainer.style.cssText = 'flex:0 0 200px;overflow-y:auto;background:rgba(0,0,0,0.3);';

    container.appendChild(header);
    container.appendChild(nowPlaying);
    container.appendChild(progressContainer);
    container.appendChild(controls);
    container.appendChild(playlistToolbar);
    container.appendChild(this.playlistContainer);

    return container;
  }

  async addToPlaylist(path) {
    try {
      const data = await this.context.fs.readFile(path);
      const blob = new Blob([data], { type: this.getAudioMimeType(path) });
      const url = URL.createObjectURL(blob);

      const track = {
        path,
        url,
        name: path.split('/').pop()
      };

      this.playlist.push(track);
      this.updatePlaylistUI();

      if (this.currentIndex === -1) {
        this.playTrack(0);
      }
    } catch (error) {
      alert(`Error loading audio: ${error.message}`);
    }
  }

  updatePlaylistUI() {
    this.playlistContainer.innerHTML = '';

    this.playlist.forEach((track, index) => {
      const item = document.createElement('div');
      item.style.cssText = 'padding:12px 20px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.1);transition:background 0.2s;' +
        (index === this.currentIndex ? 'background:rgba(255,255,255,0.2);' : '');

      item.addEventListener('mouseenter', () => {
        if (index !== this.currentIndex) {
          item.style.background = 'rgba(255,255,255,0.1)';
        }
      });

      item.addEventListener('mouseleave', () => {
        if (index !== this.currentIndex) {
          item.style.background = 'transparent';
        }
      });

      item.addEventListener('click', () => {
        this.playTrack(index);
      });

      const name = document.createElement('div');
      name.textContent = `${index + 1}. ${track.name}`;
      name.style.cssText = 'font-size:14px;margin-bottom:4px;';

      const path = document.createElement('div');
      path.textContent = track.path;
      path.style.cssText = 'font-size:11px;opacity:0.6;';

      item.appendChild(name);
      item.appendChild(path);
      this.playlistContainer.appendChild(item);
    });
  }

  playTrack(index) {
    if (index < 0 || index >= this.playlist.length) return;

    this.currentIndex = index;
    const track = this.playlist[index];

    this.audio.src = track.url;
    this.audio.play();
    this.isPlaying = true;
    this.playPauseBtn.textContent = '⏸️';

    this.trackNameLabel.textContent = track.name;
    this.trackInfoLabel.textContent = `Track ${index + 1} of ${this.playlist.length}`;

    this.updatePlaylistUI();
  }

  togglePlayPause() {
    if (this.playlist.length === 0) {
      alert('Playlist is empty. Add some tracks first!');
      return;
    }

    if (this.isPlaying) {
      this.audio.pause();
      this.isPlaying = false;
      this.playPauseBtn.textContent = '▶️';
    } else {
      this.audio.play();
      this.isPlaying = true;
      this.playPauseBtn.textContent = '⏸️';
    }
  }

  nextTrack() {
    if (this.playlist.length === 0) return;

    let nextIndex;
    if (this.isShuffle) {
      nextIndex = Math.floor(Math.random() * this.playlist.length);
    } else {
      nextIndex = (this.currentIndex + 1) % this.playlist.length;
    }

    this.playTrack(nextIndex);
  }

  previousTrack() {
    if (this.playlist.length === 0) return;

    const prevIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
    this.playTrack(prevIndex);
  }

  handleTrackEnd() {
    if (this.repeatMode === 'one') {
      this.audio.currentTime = 0;
      this.audio.play();
    } else if (this.repeatMode === 'all') {
      this.nextTrack();
    } else {
      if (this.currentIndex < this.playlist.length - 1) {
        this.nextTrack();
      } else {
        this.isPlaying = false;
        this.playPauseBtn.textContent = '▶️';
      }
    }
  }

  toggleShuffle() {
    this.isShuffle = !this.isShuffle;
    this.shuffleBtn.style.opacity = this.isShuffle ? '1' : '0.5';
  }

  toggleRepeat() {
    const modes = ['none', 'all', 'one'];
    const currentIdx = modes.indexOf(this.repeatMode);
    this.repeatMode = modes[(currentIdx + 1) % modes.length];

    const icons = { 'none': '🔁', 'all': '🔁', 'one': '🔂' };
    this.repeatBtn.textContent = icons[this.repeatMode];
    this.repeatBtn.style.opacity = this.repeatMode === 'none' ? '0.5' : '1';
  }

  clearPlaylist() {
    this.audio.pause();
    this.audio.src = '';
    this.playlist.forEach(track => URL.revokeObjectURL(track.url));
    this.playlist = [];
    this.currentIndex = -1;
    this.isPlaying = false;
    this.playPauseBtn.textContent = '▶️';
    this.trackNameLabel.textContent = 'No track loaded';
    this.trackInfoLabel.textContent = '';
    this.updatePlaylistUI();
  }

  getAudioMimeType(path) {
    const ext = path.split('.').pop().toLowerCase();
    const mimeTypes = {
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'flac': 'audio/flac',
      'm4a': 'audio/mp4',
      'aac': 'audio/aac'
    };
    return mimeTypes[ext] || 'audio/mpeg';
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  _createButton(text, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = 'padding:8px 16px;cursor:pointer;background:rgba(255,255,255,0.2);color:#fff;border:1px solid rgba(255,255,255,0.3);border-radius:4px;transition:background 0.2s;';
    button.addEventListener('mouseenter', () => {
      button.style.background = 'rgba(255,255,255,0.3)';
    });
    button.addEventListener('mouseleave', () => {
      button.style.background = 'rgba(255,255,255,0.2)';
    });
    button.addEventListener('click', onClick);
    return button;
  }

  _createControlButton(text, onClick, large = false) {
    const button = document.createElement('button');
    button.textContent = text;
    const size = large ? '60px' : '50px';
    const fontSize = large ? '24px' : '20px';
    button.style.cssText = `width:${size};height:${size};cursor:pointer;background:rgba(255,255,255,0.2);color:#fff;border:1px solid rgba(255,255,255,0.3);border-radius:50%;transition:all 0.2s;font-size:${fontSize};display:flex;align-items:center;justify-content:center;padding:0;opacity:0.5;`;

    button.addEventListener('mouseenter', () => {
      button.style.background = 'rgba(255,255,255,0.3)';
      button.style.transform = 'scale(1.1)';
      button.style.opacity = '1';
    });
    button.addEventListener('mouseleave', () => {
      button.style.background = 'rgba(255,255,255,0.2)';
      button.style.transform = 'scale(1)';
      if (button !== this.playPauseBtn) {
        button.style.opacity = '0.5';
      }
    });
    button.addEventListener('click', onClick);

    if (large) {
      button.style.opacity = '1';
    }

    return button;
  }
}
