/**
 * WebXR Manager - VR/AR Support Foundation
 * 
 * Provides WebXR support for virtual and augmented reality experiences
 */

export class WebXRManager {
  constructor() {
    this.xrSession = null;
    this.xrRefSpace = null;
    this.supported = false;
    this.mode = null; // 'immersive-vr' or 'immersive-ar'
  }

  async initialize() {
    console.log('🥽 Initializing WebXR Manager...');
    
    if (!navigator.xr) {
      console.warn('⚠️  WebXR not supported');
      return false;
    }

    this.supported = true;
    
    // Check for VR support
    this.vrSupported = await navigator.xr.isSessionSupported('immersive-vr');
    
    // Check for AR support
    this.arSupported = await navigator.xr.isSessionSupported('immersive-ar');
    
    console.log(`✅ WebXR initialized (VR: ${this.vrSupported}, AR: ${this.arSupported})`);
    return true;
  }

  async startVRSession(canvas) {
    if (!this.vrSupported) throw new Error('VR not supported');
    
    this.xrSession = await navigator.xr.requestSession('immersive-vr', {
      requiredFeatures: ['local-floor']
    });
    
    this.mode = 'immersive-vr';
    await this.setupSession(canvas);
    
    console.log('✅ VR session started');
    return this.xrSession;
  }

  async startARSession(canvas) {
    if (!this.arSupported) throw new Error('AR not supported');
    
    this.xrSession = await navigator.xr.requestSession('immersive-ar', {
      requiredFeatures: ['local-floor', 'hit-test']
    });
    
    this.mode = 'immersive-ar';
    await this.setupSession(canvas);
    
    console.log('✅ AR session started');
    return this.xrSession;
  }

  async setupSession(canvas) {
    const gl = canvas.getContext('webgl', { xrCompatible: true });
    await gl.makeXRCompatible();
    
    this.xrSession.updateRenderState({
      baseLayer: new XRWebGLLayer(this.xrSession, gl)
    });
    
    this.xrRefSpace = await this.xrSession.requestReferenceSpace('local-floor');
    
    this.xrSession.addEventListener('end', () => {
      console.log('XR session ended');
      this.xrSession = null;
    });
  }

  async endSession() {
    if (this.xrSession) {
      await this.xrSession.end();
      this.xrSession = null;
      this.mode = null;
    }
  }

  isSupported() {
    return this.supported;
  }

  isVRSupported() {
    return this.vrSupported;
  }

  isARSupported() {
    return this.arSupported;
  }

  getActiveSession() {
    return this.xrSession;
  }

  async shutdown() {
    await this.endSession();
    console.log('✅ WebXR Manager shut down');
  }
}

let xrInstance = null;
export function getWebXRManager() {
  if (!xrInstance) xrInstance = new WebXRManager();
  return xrInstance;
}
