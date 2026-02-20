/**
 * VRubi - Main Application Entry Point
 * 
 * This is the entry point that wires up all modules:
 * - Camera: captures video frames
 * - Vision: extracts cube state from frames
 * - Solver: computes solution moves
 * - Render: displays 3D cube and animations
 */

import { CubeRenderer } from './render/index.js';

// Initialize the renderer
const container = document.getElementById('cube-container');
const renderer = new CubeRenderer(container);

// Wire up controls
const btnScramble = document.getElementById('btn-scramble');
const btnSolve = document.getElementById('btn-solve');
const btnReset = document.getElementById('btn-reset');
const status = document.getElementById('status');

function showStatus(message, duration = 2000) {
  status.textContent = message;
  status.classList.add('visible');
  if (duration > 0) {
    setTimeout(() => status.classList.remove('visible'), duration);
  }
}

btnScramble.addEventListener('click', async () => {
  btnScramble.disabled = true;
  showStatus('Scrambling...', 0);
  
  // Generate random scramble (20 moves)
  const scramble = renderer.generateScramble(20);
  await renderer.playMoves(scramble);
  
  showStatus(`Scrambled: ${scramble.join(' ')}`);
  btnScramble.disabled = false;
});

btnSolve.addEventListener('click', async () => {
  btnSolve.disabled = true;
  showStatus('Solving...', 0);
  
  // For now, just reverse the last scramble (Phase 2 will add real solver)
  const solution = renderer.getReverseMoves();
  if (solution.length === 0) {
    showStatus('Cube is already solved!');
    btnSolve.disabled = false;
    return;
  }
  
  await renderer.playMoves(solution);
  showStatus('Solved!');
  btnSolve.disabled = false;
});

btnReset.addEventListener('click', () => {
  renderer.reset();
  showStatus('Reset to solved state');
});

// Log startup
console.log('🎲 VRubi initialized');
showStatus('Ready! Click Scramble to begin.', 3000);
