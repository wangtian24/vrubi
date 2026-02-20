/**
 * VRubi - Main Application Entry Point
 * 
 * Supports two modes:
 * 1. Cube Mode: Interactive 3D cube with scramble/solve
 * 2. Scan Mode: Camera-based cube state detection
 */

import { CubeRenderer } from './render/index.js';
import { initSolver, solve, scramble, isSolverReady, solveFromState, inverseMoves } from './solver/index.js';
import { CameraCapture } from './camera/index.js';
import { CubeDetector, ColorExtractor, StateBuilder, StateValidator, drawDetectionOverlay, debugDrawSamples } from './vision/index.js';

// ====== State ======
let currentMode = 'cube'; // 'cube' or 'scan'
let currentScramble = [];
let renderer = null;
let camera = null;
let detector = null;
let extractor = null;
let stateBuilder = null;
let validator = null;

// ====== UI Elements ======
const cubeContainer = document.getElementById('cube-container');
const cameraContainer = document.getElementById('camera-container');
const cameraOverlay = document.getElementById('camera-overlay');
const overlayCtx = cameraOverlay.getContext('2d');

const modeCube = document.getElementById('mode-cube');
const modeScan = document.getElementById('mode-scan');
const cubeControls = document.getElementById('cube-controls');
const scanControls = document.getElementById('scan-controls');

const btnScramble = document.getElementById('btn-scramble');
const btnSolve = document.getElementById('btn-solve');
const btnReset = document.getElementById('btn-reset');

const btnStartCamera = document.getElementById('btn-start-camera');
const btnCapture = document.getElementById('btn-capture');
const btnUseState = document.getElementById('btn-use-state');

const status = document.getElementById('status');
const detectedFace = document.getElementById('detected-face');
const scannedFaces = document.getElementById('scanned-faces');

// ====== Utility Functions ======
function showStatus(message, duration = 2000) {
  status.textContent = message;
  status.classList.add('visible');
  if (duration > 0) {
    setTimeout(() => status.classList.remove('visible'), duration);
  }
}

function setButtonsEnabled(enabled, buttons) {
  buttons.forEach(btn => { btn.disabled = !enabled; });
}

// ====== Mode Switching ======
function switchMode(mode) {
  currentMode = mode;
  
  if (mode === 'cube') {
    cubeContainer.style.display = 'block';
    cameraContainer.style.display = 'none';
    cubeControls.classList.remove('hidden');
    scanControls.classList.add('hidden');
    modeCube.classList.add('active');
    modeScan.classList.remove('active');
    
    // Stop camera if running
    if (camera && camera.isCapturing) {
      camera.stop();
    }
  } else {
    cubeContainer.style.display = 'none';
    cameraContainer.style.display = 'block';
    cubeControls.classList.add('hidden');
    scanControls.classList.remove('hidden');
    modeCube.classList.remove('active');
    modeScan.classList.add('active');
    
    // Initialize vision components if needed
    if (!detector) {
      detector = new CubeDetector();
      extractor = new ColorExtractor();
      stateBuilder = new StateBuilder();
      validator = new StateValidator();
    }
  }
}

modeCube.addEventListener('click', () => switchMode('cube'));
modeScan.addEventListener('click', () => switchMode('scan'));

// ====== Cube Mode Logic ======
async function initCubeMode() {
  renderer = new CubeRenderer(cubeContainer);
  
  showStatus('Initializing solver...', 0);
  setButtonsEnabled(false, [btnScramble, btnSolve, btnReset]);
  
  try {
    await initSolver();
    showStatus('Ready! Click Scramble to begin.', 3000);
    setButtonsEnabled(true, [btnScramble, btnSolve, btnReset]);
  } catch (error) {
    console.error('Failed to init solver:', error);
    showStatus('Solver failed to load. Using simple mode.', 5000);
    setButtonsEnabled(true, [btnScramble, btnSolve, btnReset]);
  }
}

btnScramble.addEventListener('click', async () => {
  setButtonsEnabled(false, [btnScramble, btnSolve, btnReset]);
  showStatus('Scrambling...', 0);
  
  renderer.reset();
  
  let scrambleMoves;
  if (isSolverReady()) {
    scrambleMoves = scramble();
  } else {
    scrambleMoves = renderer.generateScramble(20);
  }
  
  currentScramble = scrambleMoves;
  await renderer.playMoves(scrambleMoves);
  
  showStatus(`Scrambled: ${scrambleMoves.length} moves`);
  setButtonsEnabled(true, [btnScramble, btnSolve, btnReset]);
});

btnSolve.addEventListener('click', async () => {
  if (currentScramble.length === 0) {
    showStatus('Cube is already solved!');
    return;
  }
  
  setButtonsEnabled(false, [btnScramble, btnSolve, btnReset]);
  showStatus('Solving...', 0);
  
  let solution;
  
  if (isSolverReady()) {
    try {
      const scrambleStr = currentScramble.join(' ');
      solution = solve(scrambleStr);
      showStatus(`Solution found: ${solution.length} moves`);
    } catch (error) {
      console.error('Solve error:', error);
      solution = renderer.getReverseMoves();
      showStatus('Using reverse scramble');
    }
  } else {
    solution = renderer.getReverseMoves();
    showStatus('Solving (simple mode)...');
  }
  
  if (solution.length === 0) {
    showStatus('Cube is already solved!');
    setButtonsEnabled(true, [btnScramble, btnSolve, btnReset]);
    return;
  }
  
  await renderer.playMoves(solution);
  currentScramble = [];
  showStatus('Solved! 🎉');
  setButtonsEnabled(true, [btnScramble, btnSolve, btnReset]);
});

btnReset.addEventListener('click', () => {
  renderer.reset();
  currentScramble = [];
  showStatus('Reset to solved state');
});

// ====== Scan Mode Logic ======
function updateFaceIndicator(colors) {
  detectedFace.innerHTML = '';
  colors.forEach(color => {
    const cell = document.createElement('div');
    cell.className = `face-cell color-${color}`;
    detectedFace.appendChild(cell);
  });
}

function updateScannedFacesUI() {
  const scanned = stateBuilder.getScannedFaces();
  const cells = scannedFaces.querySelectorAll('.scanned-face');
  cells.forEach(cell => {
    const face = cell.textContent;
    if (scanned.includes(face)) {
      cell.classList.add('done');
    } else {
      cell.classList.remove('done');
    }
  });
}

function processFrame(imageData, canvas) {
  // Resize overlay canvas to match
  if (cameraOverlay.width !== canvas.width) {
    cameraOverlay.width = canvas.width;
    cameraOverlay.height = canvas.height;
  }
  
  // Clear overlay
  overlayCtx.clearRect(0, 0, cameraOverlay.width, cameraOverlay.height);
  
  // Detect cube region
  const region = detector.detect(imageData);
  if (!region) return;
  
  // Extract colors
  const colors = extractor.extract(imageData, region);
  
  // Draw overlay
  drawDetectionOverlay(overlayCtx, region);
  debugDrawSamples(overlayCtx, region, colors);
  
  // Update UI
  updateFaceIndicator(colors);
}

btnStartCamera.addEventListener('click', async () => {
  if (!camera) {
    camera = new CameraCapture({ width: 640, height: 480 });
    await camera.init(cameraContainer);
  }
  
  if (camera.isCapturing) {
    camera.stop();
    btnStartCamera.textContent = '📷 Start Camera';
    btnCapture.disabled = true;
  } else {
    try {
      await camera.start();
      btnStartCamera.textContent = '⏹️ Stop Camera';
      btnCapture.disabled = false;
      
      // Register frame callback
      camera.onFrame(processFrame);
      
      // Reset state builder
      stateBuilder.reset();
      updateScannedFacesUI();
      
      showStatus('Camera started. Show cube faces to scan.');
    } catch (error) {
      console.error('Camera error:', error);
      showStatus('Failed to start camera. Check permissions.');
    }
  }
});

btnCapture.addEventListener('click', () => {
  if (!camera || !camera.isCapturing) return;
  
  const imageData = camera.getFrame();
  if (!imageData) return;
  
  const region = detector.detect(imageData);
  if (!region) {
    showStatus('No cube detected');
    return;
  }
  
  const colors = extractor.extract(imageData, region);
  const face = stateBuilder.autoAddFace(colors, region.confidence);
  
  if (face) {
    showStatus(`Captured face: ${face}`);
    updateScannedFacesUI();
    
    if (stateBuilder.isComplete()) {
      btnUseState.disabled = false;
      showStatus('All faces scanned! Click "Use State" to solve.');
    }
  } else {
    showStatus('Could not identify face. Try again.');
  }
});

btnUseState.addEventListener('click', async () => {
  const state = stateBuilder.getState();
  
  if (!state.complete) {
    showStatus('Scan all 6 faces first');
    return;
  }
  
  const validation = validator.validate(state.faces);
  
  if (!validation.valid) {
    showStatus(`Invalid state: ${validation.errors[0]}`);
    console.error('Validation errors:', validation.errors);
    return;
  }
  
  if (validation.warnings.length > 0) {
    console.warn('Validation warnings:', validation.warnings);
  }
  
  // Stop camera
  if (camera && camera.isCapturing) {
    camera.stop();
    btnStartCamera.textContent = '📷 Start Camera';
    btnCapture.disabled = true;
  }
  
  // Switch to cube mode
  switchMode('cube');
  
  // Convert scanned state to scramble moves
  const stateStr = stateBuilder.getStateString();
  
  if (isSolverReady()) {
    try {
      showStatus('Computing solution...', 0);
      
      // Solve from the scanned state
      const solution = solveFromState(stateStr);
      
      if (solution.length === 0) {
        showStatus('Cube is already solved! 🎉');
        return;
      }
      
      // Get the inverse to set up the cube visually
      // (We scramble the visual cube to match the scanned state)
      const setupMoves = inverseMoves(solution);
      currentScramble = setupMoves;
      
      await renderer.playMoves(setupMoves);
      
      showStatus(`State loaded! ${solution.length} moves to solve.`);
    } catch (error) {
      console.error('Failed to set state:', error);
      showStatus('Failed to load state. Invalid cube configuration.');
    }
  } else {
    showStatus('Solver not ready. Try again.');
  }
});

// ====== Initialize ======
async function init() {
  await initCubeMode();
}

init();
console.log('🎲 VRubi starting...');
