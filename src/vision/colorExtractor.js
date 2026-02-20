/**
 * Color Extractor
 * 
 * Extracts and identifies Rubik's cube colors from image regions.
 * Maps RGB values to standard cube colors: W, Y, R, O, G, B
 */

// Standard cube colors in HSL-like representation for better matching
const CUBE_COLORS = {
  W: { name: 'White',  rgb: [255, 255, 255], hue: null, sat: 0 },
  Y: { name: 'Yellow', rgb: [255, 255, 0],   hue: 60,  sat: 100 },
  R: { name: 'Red',    rgb: [255, 0, 0],     hue: 0,   sat: 100 },
  O: { name: 'Orange', rgb: [255, 140, 0],   hue: 33,  sat: 100 },
  G: { name: 'Green',  rgb: [0, 255, 0],     hue: 120, sat: 100 },
  B: { name: 'Blue',   rgb: [0, 0, 255],     hue: 240, sat: 100 },
};

/**
 * Convert RGB to HSL
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {{ h: number, s: number, l: number }}
 */
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  
  if (max === min) {
    return { h: 0, s: 0, l: l * 100 };
  }
  
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  
  let h;
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g: h = ((b - r) / d + 2) / 6; break;
    case b: h = ((r - g) / d + 4) / 6; break;
  }
  
  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Identify cube color from RGB values
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {{ color: string, confidence: number, hsl: object }}
 */
export function identifyColor(r, g, b) {
  const hsl = rgbToHsl(r, g, b);
  
  // White detection: high lightness, low saturation
  if (hsl.l > 70 && hsl.s < 25) {
    return { color: 'W', confidence: 0.9, hsl };
  }
  
  // Black/dark detection (cube body, not a face color)
  if (hsl.l < 20) {
    return { color: 'X', confidence: 0.5, hsl }; // X = unknown/black
  }
  
  // Color detection by hue (for saturated colors)
  if (hsl.s > 30) {
    // Yellow: hue 45-75
    if (hsl.h >= 45 && hsl.h < 75) {
      return { color: 'Y', confidence: 0.85, hsl };
    }
    
    // Orange: hue 15-45
    if (hsl.h >= 15 && hsl.h < 45) {
      return { color: 'O', confidence: 0.8, hsl };
    }
    
    // Red: hue 0-15 or 345-360
    if (hsl.h < 15 || hsl.h >= 345) {
      return { color: 'R', confidence: 0.85, hsl };
    }
    
    // Green: hue 75-165
    if (hsl.h >= 75 && hsl.h < 165) {
      return { color: 'G', confidence: 0.85, hsl };
    }
    
    // Blue: hue 180-260
    if (hsl.h >= 180 && hsl.h < 260) {
      return { color: 'B', confidence: 0.85, hsl };
    }
  }
  
  // Fallback: compare to standard colors by RGB distance
  let bestMatch = 'X';
  let bestDist = Infinity;
  
  for (const [code, def] of Object.entries(CUBE_COLORS)) {
    const dist = Math.sqrt(
      Math.pow(r - def.rgb[0], 2) +
      Math.pow(g - def.rgb[1], 2) +
      Math.pow(b - def.rgb[2], 2)
    );
    if (dist < bestDist) {
      bestDist = dist;
      bestMatch = code;
    }
  }
  
  const confidence = Math.max(0.3, 1 - bestDist / 441); // 441 = max RGB distance
  return { color: bestMatch, confidence, hsl };
}

/**
 * Sample average color from a region of ImageData
 * @param {ImageData} imageData - Source image data
 * @param {number} x - Region center X
 * @param {number} y - Region center Y
 * @param {number} radius - Sampling radius
 * @returns {{ r: number, g: number, b: number }}
 */
export function sampleRegion(imageData, x, y, radius = 5) {
  const { data, width, height } = imageData;
  let r = 0, g = 0, b = 0, count = 0;
  
  const x0 = Math.max(0, Math.floor(x - radius));
  const x1 = Math.min(width - 1, Math.floor(x + radius));
  const y0 = Math.max(0, Math.floor(y - radius));
  const y1 = Math.min(height - 1, Math.floor(y + radius));
  
  for (let py = y0; py <= y1; py++) {
    for (let px = x0; px <= x1; px++) {
      const idx = (py * width + px) * 4;
      r += data[idx];
      g += data[idx + 1];
      b += data[idx + 2];
      count++;
    }
  }
  
  if (count === 0) return { r: 0, g: 0, b: 0 };
  
  return {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count)
  };
}

/**
 * Extract 9 colors from a face region
 * @param {ImageData} imageData - Source image
 * @param {Object} bounds - Face bounding box { x, y, width, height }
 * @returns {string[]} Array of 9 color codes (e.g., ['W', 'R', 'B', ...])
 */
export function extractFaceColors(imageData, bounds) {
  const { x, y, width, height } = bounds;
  const colors = [];
  
  // Sample 9 positions in 3x3 grid
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const sampleX = x + (col + 0.5) * (width / 3);
      const sampleY = y + (row + 0.5) * (height / 3);
      
      const rgb = sampleRegion(imageData, sampleX, sampleY, 8);
      const result = identifyColor(rgb.r, rgb.g, rgb.b);
      colors.push(result.color);
    }
  }
  
  return colors;
}

/**
 * Debug: draw sampling points on canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} bounds - Face bounding box
 * @param {string[]} colors - Detected colors
 */
export function debugDrawSamples(ctx, bounds, colors) {
  const { x, y, width, height } = bounds;
  
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);
  
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const idx = row * 3 + col;
      const sampleX = x + (col + 0.5) * (width / 3);
      const sampleY = y + (row + 0.5) * (height / 3);
      
      // Draw sample circle
      ctx.beginPath();
      ctx.arc(sampleX, sampleY, 8, 0, Math.PI * 2);
      ctx.fillStyle = getColorHex(colors[idx]);
      ctx.fill();
      ctx.stroke();
      
      // Draw color label
      ctx.fillStyle = colors[idx] === 'Y' || colors[idx] === 'W' ? '#000' : '#fff';
      ctx.fillText(colors[idx], sampleX, sampleY);
    }
  }
}

/**
 * Get hex color for a cube color code
 */
function getColorHex(code) {
  const map = {
    W: '#ffffff',
    Y: '#ffff00',
    R: '#ff0000',
    O: '#ff8c00',
    G: '#00ff00',
    B: '#0000ff',
    X: '#333333',
  };
  return map[code] || '#888888';
}

export class ColorExtractor {
  constructor() {
    this.calibration = null;
  }
  
  /**
   * Extract colors from a detected cube region
   * @param {ImageData} imageData - Source image
   * @param {Object} region - Detected cube region
   * @returns {string[]} Array of 9 color codes
   */
  extract(imageData, region) {
    return extractFaceColors(imageData, region);
  }
  
  /**
   * Calibrate color detection with known colors
   * @param {Object[]} samples - Array of { rgb, expectedColor }
   */
  calibrate(samples) {
    // TODO: Implement calibration for different lighting conditions
    this.calibration = samples;
  }
}
