/**
 * Camera Module
 * 
 * Handles camera/video capture for cube scanning.
 * Input: Browser MediaStream API
 * Output: Canvas frames at consistent FPS
 */

export class CameraCapture {
  constructor(options = {}) {
    this.videoElement = null;
    this.canvasElement = null;
    this.ctx = null;
    this.stream = null;
    this.isCapturing = false;
    this.frameCallbacks = [];
    this.animationFrameId = null;
    
    // Configuration
    this.config = {
      width: options.width || 640,
      height: options.height || 480,
      facingMode: options.facingMode || 'environment', // 'user' for front camera
      frameRate: options.frameRate || 30,
    };
  }
  
  /**
   * Initialize camera and create video/canvas elements
   * @param {HTMLElement} container - Container to append video preview
   * @returns {Promise<void>}
   */
  async init(container) {
    // Create video element
    this.videoElement = document.createElement('video');
    this.videoElement.setAttribute('playsinline', '');
    this.videoElement.setAttribute('autoplay', '');
    this.videoElement.style.width = '100%';
    this.videoElement.style.height = '100%';
    this.videoElement.style.objectFit = 'cover';
    
    // Create canvas for frame capture
    this.canvasElement = document.createElement('canvas');
    this.canvasElement.width = this.config.width;
    this.canvasElement.height = this.config.height;
    this.ctx = this.canvasElement.getContext('2d', { willReadFrequently: true });
    
    // Add video to container if provided
    if (container) {
      container.innerHTML = '';
      container.appendChild(this.videoElement);
    }
  }
  
  /**
   * Start camera capture
   * @returns {Promise<void>}
   */
  async start() {
    if (this.isCapturing) return;
    
    try {
      const constraints = {
        video: {
          width: { ideal: this.config.width },
          height: { ideal: this.config.height },
          facingMode: this.config.facingMode,
          frameRate: { ideal: this.config.frameRate }
        },
        audio: false
      };
      
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement.srcObject = this.stream;
      
      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        this.videoElement.onloadedmetadata = () => {
          this.videoElement.play().then(resolve).catch(reject);
        };
        this.videoElement.onerror = reject;
      });
      
      this.isCapturing = true;
      this.captureLoop();
      
      console.log('📷 Camera started');
    } catch (error) {
      console.error('Failed to start camera:', error);
      throw error;
    }
  }
  
  /**
   * Stop camera capture
   */
  stop() {
    this.isCapturing = false;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    
    console.log('📷 Camera stopped');
  }
  
  /**
   * Main capture loop
   */
  captureLoop() {
    if (!this.isCapturing) return;
    
    // Draw current frame to canvas
    if (this.videoElement.readyState >= 2) {
      this.ctx.drawImage(
        this.videoElement,
        0, 0,
        this.canvasElement.width,
        this.canvasElement.height
      );
      
      // Get frame data and notify callbacks
      const imageData = this.ctx.getImageData(
        0, 0,
        this.canvasElement.width,
        this.canvasElement.height
      );
      
      this.frameCallbacks.forEach(cb => {
        try {
          cb(imageData, this.canvasElement);
        } catch (e) {
          console.error('Frame callback error:', e);
        }
      });
    }
    
    this.animationFrameId = requestAnimationFrame(() => this.captureLoop());
  }
  
  /**
   * Register a callback to receive frames
   * @param {Function} callback - Function(imageData, canvas)
   * @returns {Function} Unsubscribe function
   */
  onFrame(callback) {
    this.frameCallbacks.push(callback);
    return () => {
      const idx = this.frameCallbacks.indexOf(callback);
      if (idx !== -1) this.frameCallbacks.splice(idx, 1);
    };
  }
  
  /**
   * Get current frame as ImageData
   * @returns {ImageData|null}
   */
  getFrame() {
    if (!this.isCapturing || this.videoElement.readyState < 2) {
      return null;
    }
    
    this.ctx.drawImage(
      this.videoElement,
      0, 0,
      this.canvasElement.width,
      this.canvasElement.height
    );
    
    return this.ctx.getImageData(
      0, 0,
      this.canvasElement.width,
      this.canvasElement.height
    );
  }
  
  /**
   * Get the video element (for display)
   * @returns {HTMLVideoElement}
   */
  getVideoElement() {
    return this.videoElement;
  }
  
  /**
   * Get the canvas element (for processing)
   * @returns {HTMLCanvasElement}
   */
  getCanvasElement() {
    return this.canvasElement;
  }
  
  /**
   * Check if camera is available
   * @returns {Promise<boolean>}
   */
  static async isAvailable() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some(device => device.kind === 'videoinput');
    } catch {
      return false;
    }
  }
  
  /**
   * List available cameras
   * @returns {Promise<MediaDeviceInfo[]>}
   */
  static async listCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch {
      return [];
    }
  }
}
