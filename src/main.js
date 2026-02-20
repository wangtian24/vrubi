/**
 * VRubi - Main Application Entry Point
 * 
 * This is the entry point that wires up all modules:
 * - Camera: captures video frames (Phase 3)
 * - Vision: extracts cube state from frames (Phase 3)
 * - Solver: computes solution moves using Kociemba algorithm
 * - Render: displays 3D cube and animations
 */

import { CubeRenderer } from './render/index.js';
import { initSolver, solve, scramble, isSolverReady } from './solver/index.js';

// Initialize the renderer
const container = document.getElementById('cube-container');
const renderer = new CubeRenderer(container);

// UI elements
const btnScramble = document.getElementById('btn-scramble');
const btnSolve = document.getElementById('btn-solve');
const btnReset = document.getElementById('btn-reset');
const status = document.getElementById('status');

// Track current scramble for solving
let currentScramble = [];

function showStatus(message, duration = 2000) {
  status.textContent = message;
  status.classList.add('visible');
  if (duration > 0) {
    setTimeout(() => status.classList.remove('visible'), duration);
  }
}

function setButtonsEnabled(enabled) {
  btnScramble.disabled = !enabled;
  btnSolve.disabled = !enabled;
  btnReset.disabled = !enabled;
}

// Initialize solver on page load
async function init() {
  showStatus('Initializing solver...', 0);
  setButtonsEnabled(false);
  
  try {
    await initSolver();
    showStatus('Ready! Click Scramble to begin.', 3000);
    setButtonsEnabled(true);
  } catch (error) {
    console.error('Failed to init solver:', error);
    showStatus('Solver failed to load. Using simple mode.', 5000);
    setButtonsEnabled(true);
  }
}

btnScramble.addEventListener('click', async () => {
  setButtonsEnabled(false);
  showStatus('Scrambling...', 0);
  
  // Reset cube first
  renderer.reset();
  
  // Generate scramble using solver if available, otherwise random
  let scrambleMoves;
  if (isSolverReady()) {
    scrambleMoves = scramble();
  } else {
    scrambleMoves = renderer.generateScramble(20);
  }
  
  currentScramble = scrambleMoves;
  
  // Animate the scramble
  await renderer.playMoves(scrambleMoves);
  
  showStatus(`Scrambled: ${scrambleMoves.length} moves`);
  setButtonsEnabled(true);
});

btnSolve.addEventListener('click', async () => {
  if (currentScramble.length === 0) {
    showStatus('Cube is already solved!');
    return;
  }
  
  setButtonsEnabled(false);
  showStatus('Solving...', 0);
  
  let solution;
  
  if (isSolverReady()) {
    try {
      // Convert scramble array to string for solver
      const scrambleStr = currentScramble.join(' ');
      solution = solve(scrambleStr);
      showStatus(`Solution found: ${solution.length} moves`);
    } catch (error) {
      console.error('Solve error:', error);
      // Fallback to reverse moves
      solution = renderer.getReverseMoves();
      showStatus('Using reverse scramble');
    }
  } else {
    // No solver available - use reverse moves
    solution = renderer.getReverseMoves();
    showStatus('Solving (simple mode)...');
  }
  
  if (solution.length === 0) {
    showStatus('Cube is already solved!');
    setButtonsEnabled(true);
    return;
  }
  
  // Animate the solution
  await renderer.playMoves(solution);
  
  currentScramble = [];
  showStatus('Solved! 🎉');
  setButtonsEnabled(true);
});

btnReset.addEventListener('click', () => {
  renderer.reset();
  currentScramble = [];
  showStatus('Reset to solved state');
});

// Start initialization
init();
console.log('🎲 VRubi starting...');
