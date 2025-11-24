/**
 * Video Conferencing System
 * Built-in WebRTC video and audio conferencing
 */

import SimplePeer from 'simple-peer/simplepeer.min.js';
import { Logger } from '../utils/Logger.js';
import { eventBus } from '../utils/EventBus.js';

export class VideoConferencing {
  constructor(meshNetwork) {
    this.meshNetwork = meshNetwork;
    this.logger = new Logger('VideoConferencing');

    this.localStream = null;
    this.peers = new Map();
    this.screenShareStream = null;
    this.isInCall = false;
  }

  async initialize() {
    this.logger.info('Initializing Video Conferencing...');
    return true;
  }

  async startCall(peerIds) {
    this.logger.info('Starting video call...');

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      this.isInCall = true;

      for (const peerId of peerIds) {
        await this._connectVideoPeer(peerId);
      }

      eventBus.emit('call-started', { peerIds });

      return { success: true, stream: this.localStream };
    } catch (error) {
      this.logger.error('Failed to start call:', error);
      throw error;
    }
  }

  async _connectVideoPeer(peerId) {
    const peer = new SimplePeer({
      initiator: true,
      stream: this.localStream,
      trickle: true
    });

    peer.on('stream', (remoteStream) => {
      eventBus.emit('peer-stream', { peerId, stream: remoteStream });
    });

    peer.on('signal', (signal) => {
      this.meshNetwork.sendMessage(peerId, {
        type: 'video-signal',
        data: signal
      });
    });

    this.peers.set(peerId, peer);
  }

  async startScreenShare() {
    try {
      this.screenShareStream = await navigator.mediaDevices.getDisplayMedia({
        video: true
      });

      // Replace video track
      if (this.localStream) {
        const videoTrack = this.screenShareStream.getVideoTracks()[0];
        const sender = this.localStream.getVideoTracks()[0];

        for (const peer of this.peers.values()) {
          peer.replaceTrack(sender, videoTrack, this.localStream);
        }
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Screen share failed:', error);
      throw error;
    }
  }

  stopScreenShare() {
    if (this.screenShareStream) {
      this.screenShareStream.getTracks().forEach(track => track.stop());
      this.screenShareStream = null;
    }
  }

  toggleMute() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }

  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }

  async endCall() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    this.stopScreenShare();

    for (const peer of this.peers.values()) {
      peer.destroy();
    }

    this.peers.clear();
    this.isInCall = false;

    eventBus.emit('call-ended');
  }
}

export default VideoConferencing;
