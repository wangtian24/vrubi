/**
 * State Validator
 * 
 * Validates that a detected cube state is physically possible.
 * Checks color counts, center colors, and piece constraints.
 */

// Expected color counts
const EXPECTED_COUNTS = {
  W: 9, Y: 9, R: 9, O: 9, G: 9, B: 9
};

// Valid center colors for each face
const VALID_CENTERS = {
  U: 'W', D: 'Y', F: 'G', B: 'B', R: 'R', L: 'O'
};

// Opposite faces (these centers can never be on same corner/edge)
const OPPOSITE_FACES = {
  W: 'Y', Y: 'W',
  R: 'O', O: 'R',
  G: 'B', B: 'G'
};

/**
 * Validate a complete 54-character state string
 * @param {string} state - 54-character cube state
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export function validateState(state) {
  const errors = [];
  const warnings = [];
  
  // Basic format check
  if (typeof state !== 'string') {
    return { valid: false, errors: ['State must be a string'], warnings };
  }
  
  if (state.length !== 54) {
    return { 
      valid: false, 
      errors: [`State must be 54 characters, got ${state.length}`],
      warnings 
    };
  }
  
  // Count colors
  const counts = {};
  for (const char of state) {
    counts[char] = (counts[char] || 0) + 1;
  }
  
  // Check color counts
  for (const [color, expected] of Object.entries(EXPECTED_COUNTS)) {
    const actual = counts[color] || 0;
    if (actual !== expected) {
      errors.push(`Expected ${expected} ${color}, got ${actual}`);
    }
  }
  
  // Check for invalid characters
  const validColors = new Set(Object.keys(EXPECTED_COUNTS));
  for (const char of state) {
    if (!validColors.has(char)) {
      errors.push(`Invalid color: ${char}`);
    }
  }
  
  // Check center colors (positions 4, 13, 22, 31, 40, 49)
  const centers = {
    U: state[4],   // Position 4 in U face
    R: state[13],  // Position 4 in R face
    F: state[22],  // Position 4 in F face
    D: state[31],  // Position 4 in D face
    L: state[40],  // Position 4 in L face
    B: state[49],  // Position 4 in B face
  };
  
  for (const [face, expectedColor] of Object.entries(VALID_CENTERS)) {
    if (centers[face] !== expectedColor) {
      errors.push(`Face ${face} has wrong center: expected ${expectedColor}, got ${centers[face]}`);
    }
  }
  
  // Check edge pieces (no opposite colors on same edge)
  const edgeWarnings = validateEdges(state);
  warnings.push(...edgeWarnings);
  
  // Check corner pieces (no opposite colors on same corner)
  const cornerWarnings = validateCorners(state);
  warnings.push(...cornerWarnings);
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate edge pieces
 * @param {string} state - 54-character state
 * @returns {string[]} Array of warnings
 */
function validateEdges(state) {
  const warnings = [];
  
  // Edge indices [face1_pos, face2_pos]
  // Order: U(0-8), R(9-17), F(18-26), D(27-35), L(36-44), B(45-53)
  const edges = [
    [1, 46],   // U-B
    [3, 37],   // U-L
    [5, 10],   // U-R
    [7, 19],   // U-F
    [21, 14],  // F-R
    [23, 41],  // F-L
    [25, 28],  // F-D
    [12, 48],  // R-B
    [16, 30],  // R-D
    [39, 52],  // L-B
    [43, 32],  // L-D
    [50, 34],  // B-D
  ];
  
  edges.forEach(([i1, i2], idx) => {
    const c1 = state[i1];
    const c2 = state[i2];
    if (OPPOSITE_FACES[c1] === c2) {
      warnings.push(`Edge ${idx + 1} has opposite colors: ${c1}-${c2}`);
    }
  });
  
  return warnings;
}

/**
 * Validate corner pieces
 * @param {string} state - 54-character state
 * @returns {string[]} Array of warnings
 */
function validateCorners(state) {
  const warnings = [];
  
  // Corner indices [face1_pos, face2_pos, face3_pos]
  const corners = [
    [0, 38, 47],   // U-L-B
    [2, 45, 11],   // U-B-R
    [6, 18, 36],   // U-F-L
    [8, 9, 20],    // U-R-F
    [26, 44, 27],  // F-L-D
    [24, 29, 17],  // F-D-R
    [35, 42, 51],  // D-L-B
    [33, 53, 15],  // D-B-R
  ];
  
  corners.forEach(([i1, i2, i3], idx) => {
    const colors = [state[i1], state[i2], state[i3]];
    
    // Check for opposite colors
    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        if (OPPOSITE_FACES[colors[i]] === colors[j]) {
          warnings.push(`Corner ${idx + 1} has opposite colors: ${colors.join('-')}`);
          break;
        }
      }
    }
  });
  
  return warnings;
}

/**
 * Validate a faces object (not string)
 * @param {Object} faces - Object with U, D, F, B, R, L arrays
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export function validateFaces(faces) {
  // Convert to state string and validate
  const faceOrder = ['U', 'R', 'F', 'D', 'L', 'B'];
  
  let state = '';
  for (const face of faceOrder) {
    const faceColors = faces[face];
    if (!faceColors || !Array.isArray(faceColors) || faceColors.length !== 9) {
      return {
        valid: false,
        errors: [`Face ${face} is missing or invalid`],
        warnings: []
      };
    }
    state += faceColors.join('');
  }
  
  return validateState(state);
}

export class StateValidator {
  constructor() {
    this.lastResult = null;
  }
  
  /**
   * Validate state
   * @param {string|Object} state - State string or faces object
   * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
   */
  validate(state) {
    if (typeof state === 'string') {
      this.lastResult = validateState(state);
    } else if (typeof state === 'object') {
      this.lastResult = validateFaces(state);
    } else {
      this.lastResult = {
        valid: false,
        errors: ['Invalid state format'],
        warnings: []
      };
    }
    
    return this.lastResult;
  }
  
  /**
   * Quick check if state is valid
   * @param {string|Object} state
   * @returns {boolean}
   */
  isValid(state) {
    return this.validate(state).valid;
  }
}
