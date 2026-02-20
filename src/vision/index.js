/**
 * Vision Module
 * 
 * Detects cube in frame, extracts colors, builds state.
 * Input: Canvas frames
 * Output: Cube state object { faces: { U, D, L, R, F, B }, confidence: number }
 * 
 * TODO: Implement in Phase 3
 */

export { CubeDetector } from './cubeDetector.js';
export { ColorExtractor } from './colorExtractor.js';
export { StateBuilder } from './stateBuilder.js';
export { StateValidator } from './validator.js';

/**
 * Main vision pipeline
 */
export class VisionPipeline {
  constructor() {
    // TODO: Initialize sub-components
  }
  
  processFrame(imageData) {
    // TODO: Implement frame processing
    return null;
  }
  
  getState() {
    // TODO: Return accumulated cube state
    return null;
  }
}
