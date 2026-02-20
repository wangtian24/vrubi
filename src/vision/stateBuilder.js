/**
 * State Builder
 * 
 * Accumulates cube face data over multiple frames.
 * Tracks which faces have been scanned and builds complete cube state.
 */

// Face mapping: standard cube orientation
// When holding cube with WHITE on top, GREEN facing you:
// U = White (top), D = Yellow (bottom)
// F = Green (front), B = Blue (back)
// R = Red (right), L = Orange (left)
const FACE_CENTERS = {
  U: 'W', // Up = White
  D: 'Y', // Down = Yellow
  F: 'G', // Front = Green
  B: 'B', // Back = Blue
  R: 'R', // Right = Red
  L: 'O', // Left = Orange
};

export class StateBuilder {
  constructor() {
    this.reset();
  }
  
  /**
   * Reset all state
   */
  reset() {
    // Store detected faces
    this.faces = {
      U: null, // Array of 9 colors
      D: null,
      F: null,
      B: null,
      R: null,
      L: null,
    };
    
    // Confidence scores for each face
    this.confidence = {
      U: 0, D: 0, F: 0, B: 0, R: 0, L: 0,
    };
    
    // Frame history for averaging
    this.frameHistory = {
      U: [], D: [], F: [], B: [], R: [], L: [],
    };
    
    this.maxHistoryFrames = 5;
  }
  
  /**
   * Add a detected face
   * @param {string} face - Face letter (U, D, F, B, R, L)
   * @param {string[]} colors - Array of 9 color codes
   * @param {number} confidence - Detection confidence (0-1)
   */
  addFace(face, colors, confidence = 0.8) {
    if (!this.faces.hasOwnProperty(face)) {
      console.warn('Invalid face:', face);
      return;
    }
    
    if (!Array.isArray(colors) || colors.length !== 9) {
      console.warn('Invalid colors array, expected 9 elements');
      return;
    }
    
    // Add to history
    this.frameHistory[face].push({ colors, confidence });
    if (this.frameHistory[face].length > this.maxHistoryFrames) {
      this.frameHistory[face].shift();
    }
    
    // Compute consensus from history
    const consensus = this.computeConsensus(face);
    if (consensus) {
      this.faces[face] = consensus.colors;
      this.confidence[face] = consensus.confidence;
    }
  }
  
  /**
   * Compute consensus colors from frame history
   * @param {string} face - Face letter
   * @returns {Object|null} { colors, confidence }
   */
  computeConsensus(face) {
    const history = this.frameHistory[face];
    if (history.length === 0) return null;
    
    // Vote for each position
    const colors = [];
    let totalConfidence = 0;
    
    for (let i = 0; i < 9; i++) {
      const votes = {};
      history.forEach(frame => {
        const color = frame.colors[i];
        votes[color] = (votes[color] || 0) + frame.confidence;
      });
      
      // Find winning color
      let maxVotes = 0;
      let winner = 'X';
      for (const [color, count] of Object.entries(votes)) {
        if (count > maxVotes) {
          maxVotes = count;
          winner = color;
        }
      }
      
      colors.push(winner);
      totalConfidence += maxVotes / history.length;
    }
    
    return {
      colors,
      confidence: totalConfidence / 9
    };
  }
  
  /**
   * Identify which face is being shown based on center color
   * @param {string[]} colors - 9 colors from detection
   * @returns {string|null} Face letter or null if unknown
   */
  identifyFace(colors) {
    if (!colors || colors.length !== 9) return null;
    
    const centerColor = colors[4]; // Center is position 4
    
    // Find face with matching center
    for (const [face, color] of Object.entries(FACE_CENTERS)) {
      if (color === centerColor) {
        return face;
      }
    }
    
    return null;
  }
  
  /**
   * Auto-add a detected face by identifying it from center color
   * @param {string[]} colors - 9 colors from detection
   * @param {number} confidence - Detection confidence
   * @returns {string|null} Identified face or null
   */
  autoAddFace(colors, confidence = 0.8) {
    const face = this.identifyFace(colors);
    if (face) {
      this.addFace(face, colors, confidence);
    }
    return face;
  }
  
  /**
   * Get the current accumulated state
   * @returns {Object} State with faces and confidence
   */
  getState() {
    return {
      faces: { ...this.faces },
      confidence: { ...this.confidence },
      complete: this.isComplete(),
      missingFaces: this.getMissingFaces(),
    };
  }
  
  /**
   * Get state as 54-character string (if complete)
   * Order: U(9) R(9) F(9) D(9) L(9) B(9)
   * @returns {string|null}
   */
  getStateString() {
    if (!this.isComplete()) return null;
    
    return [
      ...this.faces.U,
      ...this.faces.R,
      ...this.faces.F,
      ...this.faces.D,
      ...this.faces.L,
      ...this.faces.B,
    ].join('');
  }
  
  /**
   * Check if all faces have been scanned
   * @returns {boolean}
   */
  isComplete() {
    return Object.values(this.faces).every(f => f !== null);
  }
  
  /**
   * Get list of missing faces
   * @returns {string[]}
   */
  getMissingFaces() {
    return Object.entries(this.faces)
      .filter(([_, colors]) => colors === null)
      .map(([face, _]) => face);
  }
  
  /**
   * Get scanned faces
   * @returns {string[]}
   */
  getScannedFaces() {
    return Object.entries(this.faces)
      .filter(([_, colors]) => colors !== null)
      .map(([face, _]) => face);
  }
  
  /**
   * Get a specific face
   * @param {string} face - Face letter
   * @returns {string[]|null}
   */
  getFace(face) {
    return this.faces[face] || null;
  }
  
  /**
   * Get confidence for a face
   * @param {string} face - Face letter
   * @returns {number}
   */
  getFaceConfidence(face) {
    return this.confidence[face] || 0;
  }
}
