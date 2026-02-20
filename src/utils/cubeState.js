/**
 * Cube State Utilities
 * 
 * Canonical state representation and manipulation.
 */

// Solved state: U(9) R(9) F(9) D(9) L(9) B(9)
export const SOLVED_STATE = 'WWWWWWWWWRRRRRRRRRGGGGGGGGGYYYYYYYYYBBBBBBBBBOOOOOOOOOO';

// Face indices in state string
export const FACE_OFFSETS = {
  U: 0,
  R: 9,
  F: 18,
  D: 27,
  L: 36,
  B: 45
};

// Color mapping
export const COLORS = {
  W: 'white',
  Y: 'yellow',
  R: 'red',
  O: 'orange',
  B: 'blue',
  G: 'green'
};

/**
 * Get a face from state string
 * @param {string} state - 54-character state
 * @param {string} face - Face letter (U, R, F, D, L, B)
 * @returns {string} 9-character face string
 */
export function getFace(state, face) {
  const offset = FACE_OFFSETS[face];
  return state.slice(offset, offset + 9);
}

/**
 * Check if state represents a solved cube
 * @param {string} state - 54-character state
 * @returns {boolean}
 */
export function isSolved(state) {
  return state === SOLVED_STATE;
}

/**
 * Validate state format
 * @param {string} state - State to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateFormat(state) {
  const errors = [];
  
  if (typeof state !== 'string') {
    errors.push('State must be a string');
    return { valid: false, errors };
  }
  
  if (state.length !== 54) {
    errors.push(`State must be 54 characters, got ${state.length}`);
  }
  
  const validColors = new Set(['W', 'Y', 'R', 'O', 'B', 'G']);
  const colorCounts = {};
  
  for (const char of state) {
    if (!validColors.has(char)) {
      errors.push(`Invalid color: ${char}`);
    }
    colorCounts[char] = (colorCounts[char] || 0) + 1;
  }
  
  for (const color of validColors) {
    if (colorCounts[color] !== 9) {
      errors.push(`Expected 9 ${color}, got ${colorCounts[color] || 0}`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}
