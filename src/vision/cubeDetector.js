/**
 * Cube Detector
 * 
 * Detects Rubik's cube face in camera frame.
 * Uses color clustering and edge detection to find 3x3 grid.
 * 
 * For MVP: Uses manual region selection / center detection
 * Future: OpenCV.js for robust contour detection
 */

/**
 * Simple edge detection using Sobel-like operator
 * @param {ImageData} imageData - Source image
 * @returns {Uint8ClampedArray} Edge magnitude array
 */
function detectEdges(imageData) {
  const { data, width, height } = imageData;
  const edges = new Uint8ClampedArray(width * height);
  
  // Convert to grayscale and apply simple Sobel
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // Get grayscale values of neighbors
      const getGray = (ox, oy) => {
        const i = ((y + oy) * width + (x + ox)) * 4;
        return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      };
      
      // Sobel X
      const gx = -getGray(-1, -1) + getGray(1, -1)
               - 2*getGray(-1, 0) + 2*getGray(1, 0)
               - getGray(-1, 1) + getGray(1, 1);
      
      // Sobel Y
      const gy = -getGray(-1, -1) - 2*getGray(0, -1) - getGray(1, -1)
               + getGray(-1, 1) + 2*getGray(0, 1) + getGray(1, 1);
      
      edges[y * width + x] = Math.min(255, Math.sqrt(gx*gx + gy*gy));
    }
  }
  
  return edges;
}

/**
 * Find potential cube region using center detection
 * Assumes cube is roughly centered in frame
 * @param {ImageData} imageData - Source image
 * @param {Object} options - Detection options
 * @returns {Object|null} Detected region or null
 */
export function detectCubeRegion(imageData, options = {}) {
  const { width, height } = imageData;
  
  const {
    minSize = 0.2,  // Minimum face size as fraction of image
    maxSize = 0.8,  // Maximum face size as fraction of image
    centerBias = true, // Prefer center of frame
  } = options;
  
  // For MVP: Return center region
  // TODO: Use edge detection to find actual cube boundaries
  
  const minDim = Math.min(width, height);
  const size = minDim * 0.5; // Assume cube takes ~50% of smaller dimension
  
  return {
    x: (width - size) / 2,
    y: (height - size) / 2,
    width: size,
    height: size,
    confidence: 0.7, // Fixed confidence for MVP
    method: 'center'
  };
}

/**
 * Detect color blocks in region that look like cube stickers
 * @param {ImageData} imageData - Source image
 * @param {Object} region - Region to search
 * @returns {Object[]} Array of detected color blocks
 */
export function detectColorBlocks(imageData, region) {
  const { data, width } = imageData;
  const blocks = [];
  
  const cellW = region.width / 3;
  const cellH = region.height / 3;
  
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const x = region.x + col * cellW + cellW / 2;
      const y = region.y + row * cellH + cellH / 2;
      
      const idx = (Math.floor(y) * width + Math.floor(x)) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      blocks.push({
        row,
        col,
        x,
        y,
        rgb: { r, g, b }
      });
    }
  }
  
  return blocks;
}

/**
 * Draw detection overlay on canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} region - Detected region
 */
export function drawDetectionOverlay(ctx, region) {
  if (!region) return;
  
  const { x, y, width, height } = region;
  
  // Draw main bounding box
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);
  
  // Draw 3x3 grid lines
  ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
  ctx.lineWidth = 1;
  
  const cellW = width / 3;
  const cellH = height / 3;
  
  // Vertical lines
  for (let i = 1; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * cellW, y);
    ctx.lineTo(x + i * cellW, y + height);
    ctx.stroke();
  }
  
  // Horizontal lines
  for (let i = 1; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x, y + i * cellH);
    ctx.lineTo(x + width, y + i * cellH);
    ctx.stroke();
  }
  
  // Draw corner markers
  const markerSize = 10;
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 3;
  
  const corners = [
    [x, y],
    [x + width, y],
    [x, y + height],
    [x + width, y + height]
  ];
  
  corners.forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.moveTo(cx - markerSize, cy);
    ctx.lineTo(cx + markerSize, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - markerSize);
    ctx.lineTo(cx, cy + markerSize);
    ctx.stroke();
  });
}

export class CubeDetector {
  constructor(options = {}) {
    this.options = options;
    this.lastRegion = null;
  }
  
  /**
   * Detect cube face in frame
   * @param {ImageData} imageData - Source frame
   * @returns {Object|null} Detected region or null
   */
  detect(imageData) {
    const region = detectCubeRegion(imageData, this.options);
    this.lastRegion = region;
    return region;
  }
  
  /**
   * Get last detected region
   * @returns {Object|null}
   */
  getLastRegion() {
    return this.lastRegion;
  }
  
  /**
   * Set detection region manually
   * @param {Object} region - Region bounds
   */
  setRegion(region) {
    this.lastRegion = region;
  }
}
