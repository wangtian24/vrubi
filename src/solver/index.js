/**
 * Solver Module
 * 
 * Integrates the Kociemba two-phase algorithm via cubejs library.
 * 
 * Usage:
 *   import { initSolver, solve, scramble, isSolverReady } from './solver'
 *   await initSolver()  // Must be called once before solving
 *   const moves = solve(state)  // Returns array of moves
 *   const scrambleMoves = scramble()  // Returns random scramble
 */

let Cube = null;
let solverReady = false;
let initPromise = null;

/**
 * Initialize the solver (loads lookup tables - takes 4-5 seconds)
 * @returns {Promise<void>}
 */
export async function initSolver() {
  if (solverReady) return;
  if (initPromise) return initPromise;
  
  initPromise = new Promise(async (resolve) => {
    try {
      // Dynamic import for cubejs (CommonJS module)
      const cubejs = await import('cubejs');
      Cube = cubejs.default || cubejs;
      
      console.log('🧊 Initializing Kociemba solver (this takes a few seconds)...');
      const start = performance.now();
      
      Cube.initSolver();
      
      const elapsed = ((performance.now() - start) / 1000).toFixed(2);
      console.log(`✅ Solver initialized in ${elapsed}s`);
      
      solverReady = true;
      resolve();
    } catch (error) {
      console.error('❌ Failed to initialize solver:', error);
      throw error;
    }
  });
  
  return initPromise;
}

/**
 * Check if solver is ready
 * @returns {boolean}
 */
export function isSolverReady() {
  return solverReady;
}

/**
 * Solve a cube from the given state
 * @param {string} state - Move sequence that was applied to solved cube (e.g., "R U R' F B2")
 *                        OR can be a Cube instance
 * @returns {string[]} Array of moves to solve the cube
 */
export function solve(state) {
  if (!solverReady || !Cube) {
    throw new Error('Solver not initialized. Call initSolver() first.');
  }
  
  let cube;
  
  if (typeof state === 'string') {
    // Create a cube and apply the scramble moves
    cube = new Cube();
    if (state.trim()) {
      cube.move(state);
    }
  } else if (state && typeof state.solve === 'function') {
    // Already a Cube instance
    cube = state;
  } else {
    throw new Error('Invalid state format. Expected move string or Cube instance.');
  }
  
  if (cube.isSolved()) {
    return [];
  }
  
  // Solve and get solution string
  const solutionStr = cube.solve();
  
  if (!solutionStr) {
    throw new Error('No solution found');
  }
  
  // Parse solution string into array of moves
  return parseMoves(solutionStr);
}

/**
 * Create a new cube instance
 * @returns {Object} Cube instance
 */
export function createCube() {
  if (!Cube) {
    throw new Error('Solver not initialized. Call initSolver() first.');
  }
  return new Cube();
}

/**
 * Generate a random scramble
 * @returns {string[]} Array of scramble moves
 */
export function scramble() {
  if (!solverReady || !Cube) {
    throw new Error('Solver not initialized. Call initSolver() first.');
  }
  
  const scrambleStr = Cube.scramble();
  return parseMoves(scrambleStr);
}

/**
 * Parse a move string into array of moves
 * @param {string} moveStr - Space-separated moves (e.g., "R U R' F2 B")
 * @returns {string[]} Array of individual moves
 */
export function parseMoves(moveStr) {
  if (!moveStr || typeof moveStr !== 'string') return [];
  return moveStr.trim().split(/\s+/).filter(m => m.length > 0);
}

/**
 * Get inverse of a move sequence
 * @param {string[]} moves - Array of moves
 * @returns {string[]} Reversed and inverted moves
 */
export function inverseMoves(moves) {
  return moves.slice().reverse().map(move => {
    if (move.endsWith("'")) return move.slice(0, -1);
    if (move.endsWith("2")) return move;
    return move + "'";
  });
}

/**
 * Validate that a move sequence is valid
 * @param {string[]} moves - Array of moves to validate
 * @returns {boolean}
 */
export function validateMoves(moves) {
  const validMoves = new Set([
    'U', "U'", 'U2',
    'D', "D'", 'D2',
    'R', "R'", 'R2',
    'L', "L'", 'L2',
    'F', "F'", 'F2',
    'B', "B'", 'B2',
  ]);
  
  return moves.every(move => validMoves.has(move));
}
