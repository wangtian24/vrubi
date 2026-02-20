/**
 * Vision Module
 * 
 * Complete vision pipeline for detecting cube state from camera.
 * 
 * Pipeline:
 * 1. CubeDetector - Find cube face in frame
 * 2. ColorExtractor - Extract 9 colors from detected region
 * 3. StateBuilder - Accumulate faces over multiple frames
 * 4. StateValidator - Validate detected state
 */

import { CubeDetector, detectCubeRegion, drawDetectionOverlay } from './cubeDetector.js';
import { ColorExtractor, identifyColor, extractFaceColors, debugDrawSamples } from './colorExtractor.js';
import { StateBuilder } from './stateBuilder.js';
import { StateValidator, validateState, validateFaces } from './validator.js';

// Re-export all components
export { CubeDetector, detectCubeRegion, drawDetectionOverlay };
export { ColorExtractor, identifyColor, extractFaceColors, debugDrawSamples };
export { StateBuilder };
export { StateValidator, validateState, validateFaces };

/**
 * Main Vision Pipeline
 * Combines all components for end-to-end cube detection
 */
export class VisionPipeline {
  constructor() {
    this.detector = new CubeDetector();
    this.extractor = new ColorExtractor();
    this.stateBuilder = new StateBuilder();
    this.validator = new StateValidator();
    
    this.isProcessing = false;
    this.debugMode = false;
    this.onFaceDetected = null;
    this.onStateComplete = null;
  }
  
  /**
   * Process a single frame
   * @param {ImageData} imageData - Frame to process
   * @param {CanvasRenderingContext2D} ctx - Optional context for debug overlay
   * @returns {Object} Processing result
   */
  processFrame(imageData, ctx = null) {
    // Detect cube region
    const region = this.detector.detect(imageData);
    if (!region) {
      return { detected: false };
    }
    
    // Extract colors
    const colors = this.extractor.extract(imageData, region);
    
    // Auto-identify and add face
    const face = this.stateBuilder.autoAddFace(colors, region.confidence);
    
    // Draw debug overlay if enabled
    if (this.debugMode && ctx) {
      drawDetectionOverlay(ctx, region);
      debugDrawSamples(ctx, region, colors);
    }
    
    // Check if complete
    const state = this.stateBuilder.getState();
    
    // Callbacks
    if (face && this.onFaceDetected) {
      this.onFaceDetected(face, colors);
    }
    
    if (state.complete && this.onStateComplete) {
      const stateStr = this.stateBuilder.getStateString();
      const validation = this.validator.validate(stateStr);
      this.onStateComplete(stateStr, validation);
    }
    
    return {
      detected: true,
      region,
      colors,
      face,
      state
    };
  }
  
  /**
   * Get current state
   * @returns {Object}
   */
  getState() {
    return this.stateBuilder.getState();
  }
  
  /**
   * Get state as string (if complete)
   * @returns {string|null}
   */
  getStateString() {
    return this.stateBuilder.getStateString();
  }
  
  /**
   * Reset pipeline
   */
  reset() {
    this.stateBuilder.reset();
  }
  
  /**
   * Enable/disable debug mode
   * @param {boolean} enabled
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }
  
  /**
   * Validate current state
   * @returns {Object} Validation result
   */
  validateState() {
    const stateStr = this.stateBuilder.getStateString();
    if (!stateStr) {
      return { valid: false, errors: ['State not complete'], warnings: [] };
    }
    return this.validator.validate(stateStr);
  }
}
