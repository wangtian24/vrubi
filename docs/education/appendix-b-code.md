# Appendix B: Code Reference

*Key functions and data structures in VRubi*

---

## B.1 Project Structure

```
vrubi/
├── src/
│   ├── main.js              # Application entry point
│   ├── camera/
│   │   └── index.js         # Camera capture module
│   ├── vision/
│   │   ├── index.js         # Vision module exports
│   │   ├── cubeDetector.js  # Face region detection
│   │   ├── colorExtractor.js # Color classification
│   │   ├── stateBuilder.js  # Multi-face accumulation
│   │   └── validator.js     # State validation
│   ├── solver/
│   │   └── index.js         # Kociemba solver wrapper
│   ├── render/
│   │   ├── index.js         # Renderer exports
│   │   ├── cube.js          # 3D cube model
│   │   └── animator.js      # Move animation
│   └── utils/
│       └── cubeState.js     # State utilities
├── index.html               # Main HTML page
├── package.json             # Dependencies
└── vite.config.js           # Build config
```

---

## B.2 Vision Module

### colorExtractor.js

```javascript
/**
 * Convert RGB to HSL
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {{ h: number, s: number, l: number }} HSL values
 */
function rgbToHsl(r, g, b) → { h, s, l }

/**
 * Identify cube color from RGB values
 * @param {number} r, g, b - RGB values (0-255)
 * @returns {{ color: string, confidence: number, hsl: object }}
 */
function identifyColor(r, g, b) → { color, confidence, hsl }

/**
 * Sample average color from a region
 * @param {ImageData} imageData - Source image
 * @param {number} x, y - Center coordinates
 * @param {number} radius - Sample radius (default 5)
 * @returns {{ r: number, g: number, b: number }}
 */
function sampleRegion(imageData, x, y, radius) → { r, g, b }

/**
 * Extract 9 colors from a face region
 * @param {ImageData} imageData - Source image
 * @param {Object} bounds - { x, y, width, height }
 * @returns {string[]} Array of 9 color codes
 */
function extractFaceColors(imageData, bounds) → string[]

/**
 * Color extractor class
 */
class ColorExtractor {
  extract(imageData, region) → string[]
  calibrate(samples) → void
}
```

### stateBuilder.js

```javascript
/**
 * Accumulates cube state from multiple face scans
 */
class StateBuilder {
  constructor()
  
  // Reset all accumulated state
  reset() → void
  
  // Add a scanned face with confidence
  addFace(face: string, colors: string[], confidence: number) → void
  
  // Identify face by center color and add automatically
  autoAddFace(colors: string[], confidence: number) → string | null
  
  // Get current accumulated state
  getState() → { faces, confidence, complete, missingFaces }
  
  // Get 54-character state string (if complete)
  getStateString() → string | null
  
  // Check if all 6 faces scanned
  isComplete() → boolean
  
  // Get list of unscanned faces
  getMissingFaces() → string[]
}
```

### validator.js

```javascript
/**
 * Validate a 54-character state string
 * @param {string} state - State string
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
function validateState(state) → { valid, errors, warnings }

/**
 * Validate faces object
 * @param {Object} faces - { U: [], R: [], F: [], D: [], L: [], B: [] }
 */
function validateFaces(faces) → { valid, errors, warnings }

/**
 * Validator class
 */
class StateValidator {
  validate(state: string | object) → { valid, errors, warnings }
  isValid(state) → boolean
}
```

---

## B.3 Solver Module

### solver/index.js

```javascript
/**
 * Initialize solver (loads/generates tables)
 * Must be called before solve()
 * Takes ~0.8s on first call
 */
async function initSolver() → Promise<void>

/**
 * Check if solver is ready
 */
function isSolverReady() → boolean

/**
 * Solve from a scramble move sequence
 * @param {string} state - Move sequence (e.g., "R U R' F2")
 * @returns {string[]} Solution moves
 */
function solve(state: string) → string[]

/**
 * Solve from a facelet state string
 * @param {string} faceletStr - 54-character state
 * @returns {string[]} Solution moves
 */
function solveFromState(faceletStr: string) → string[]

/**
 * Generate random scramble
 * @returns {string[]} Scramble moves
 */
function scramble() → string[]

/**
 * Parse move string to array
 * @param {string} moveStr - "R U R' F2"
 * @returns {string[]} ["R", "U", "R'", "F2"]
 */
function parseMoves(moveStr: string) → string[]

/**
 * Get inverse of move sequence
 * @param {string[]} moves - Original moves
 * @returns {string[]} Reversed and inverted moves
 */
function inverseMoves(moves: string[]) → string[]

/**
 * Validate move sequence
 */
function validateMoves(moves: string[]) → boolean
```

---

## B.4 Render Module

### render/cube.js

```javascript
/**
 * 3D Rubik's cube model
 */
class RubiksCube {
  group: THREE.Group       // Container for all cubies
  cubies: THREE.Mesh[]     // Array of 27 cubie meshes
  
  constructor()
  
  // Create the 27 cubies
  createCube() → void
  
  // Create single cubie at position
  createCubie(x, y, z, size) → THREE.Mesh
  
  // Get cubies in a face layer
  getCubiesInLayer(face: string) → THREE.Mesh[]
  
  // Reset to solved state
  reset() → void
}
```

### render/animator.js

```javascript
/**
 * Animates cube moves
 */
class CubeAnimator {
  cube: RubiksCube
  isAnimating: boolean
  animationDuration: number  // ms per move (default 200)
  
  constructor(cube: RubiksCube)
  
  // Animate a single move, returns promise
  animateMove(move: string) → Promise<void>
  
  // Called each frame to update animation
  update() → void
  
  // Set animation speed
  setDuration(ms: number) → void
}
```

### render/index.js

```javascript
/**
 * Main renderer class
 */
class CubeRenderer {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  cube: RubiksCube
  animator: CubeAnimator
  moveHistory: string[]
  
  constructor(container: HTMLElement)
  
  // Play sequence of moves with animation
  playMoves(moves: string[]) → Promise<void>
  
  // Get moves to reverse current state
  getReverseMoves() → string[]
  
  // Generate random scramble
  generateScramble(length?: number) → string[]
  
  // Reset to solved state
  reset() → void
}
```

---

## B.5 Constants

### Face Definitions

```javascript
const FACES = {
  U: { axis: 'y', layer: +1, direction: -1 },
  D: { axis: 'y', layer: -1, direction: +1 },
  R: { axis: 'x', layer: +1, direction: -1 },
  L: { axis: 'x', layer: -1, direction: +1 },
  F: { axis: 'z', layer: +1, direction: -1 },
  B: { axis: 'z', layer: -1, direction: +1 },
};
```

### Color Definitions

```javascript
const COLORS = {
  W: 0xffffff,  // White
  Y: 0xffff00,  // Yellow
  R: 0xff0000,  // Red
  O: 0xff8c00,  // Orange
  G: 0x00ff00,  // Green
  B: 0x0000ff,  // Blue
  X: 0x111111,  // Black (internal)
};
```

### Face Centers

```javascript
const FACE_CENTERS = {
  U: 'W',  // Up = White
  D: 'Y',  // Down = Yellow
  F: 'G',  // Front = Green
  B: 'B',  // Back = Blue
  R: 'R',  // Right = Red
  L: 'O',  // Left = Orange
};
```

### Opposite Colors

```javascript
const OPPOSITE = {
  'W': 'Y', 'Y': 'W',
  'R': 'O', 'O': 'R',
  'G': 'B', 'B': 'G',
};
```

---

## B.6 Type Definitions

```typescript
// Face letter
type Face = 'U' | 'D' | 'R' | 'L' | 'F' | 'B';

// Color code
type Color = 'W' | 'Y' | 'R' | 'O' | 'G' | 'B' | 'X';

// Move notation
type Move = 'U' | "U'" | 'U2' | 'D' | "D'" | 'D2' |
            'R' | "R'" | 'R2' | 'L' | "L'" | 'L2' |
            'F' | "F'" | 'F2' | 'B' | "B'" | 'B2';

// Bounding box
interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Color identification result
interface ColorResult {
  color: Color;
  confidence: number;
  hsl: { h: number; s: number; l: number };
}

// Validation result
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// State builder result
interface StateResult {
  faces: Record<Face, Color[] | null>;
  confidence: Record<Face, number>;
  complete: boolean;
  missingFaces: Face[];
}
```

---

## B.7 Usage Examples

### Basic Solve Flow

```javascript
import { initSolver, scramble, solve } from './solver';
import { CubeRenderer } from './render';

async function main() {
  // Setup
  const container = document.getElementById('cube');
  const renderer = new CubeRenderer(container);
  await initSolver();
  
  // Scramble
  const scrambleMoves = scramble();
  await renderer.playMoves(scrambleMoves);
  
  // Solve (using reverse moves for demo)
  const solution = renderer.getReverseMoves();
  await renderer.playMoves(solution);
}
```

### Vision Flow

```javascript
import { StateBuilder, ColorExtractor, StateValidator } from './vision';
import { solveFromState } from './solver';

async function scanAndSolve(imageData, bounds) {
  const extractor = new ColorExtractor();
  const builder = new StateBuilder();
  const validator = new StateValidator();
  
  // Extract colors from image
  const colors = extractor.extract(imageData, bounds);
  
  // Add to state builder (auto-identifies face)
  const face = builder.autoAddFace(colors);
  console.log(`Scanned face: ${face}`);
  
  // Repeat for all 6 faces...
  
  if (builder.isComplete()) {
    const state = builder.getStateString();
    const validation = validator.validate(state);
    
    if (validation.valid) {
      const solution = solveFromState(state);
      console.log('Solution:', solution.join(' '));
      return solution;
    } else {
      console.error('Invalid state:', validation.errors);
    }
  }
}
```

### Custom Animation Speed

```javascript
const renderer = new CubeRenderer(container);

// Slow animation (500ms per move)
renderer.animator.setDuration(500);
await renderer.playMoves(['R', 'U', "R'", "U'"]);

// Fast animation (100ms per move)
renderer.animator.setDuration(100);
await renderer.playMoves(['R', 'U', "R'", "U'"]);
```

---

## B.8 Dependencies

```json
{
  "dependencies": {
    "three": "^0.160.0",
    "cubejs": "^1.0.0"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  }
}
```

### Three.js Imports

```javascript
import * as THREE from 'three';

// Used classes:
// THREE.Scene
// THREE.PerspectiveCamera
// THREE.WebGLRenderer
// THREE.Group
// THREE.Mesh
// THREE.BoxGeometry
// THREE.MeshPhongMaterial
// THREE.AmbientLight
// THREE.DirectionalLight
// THREE.Color
// THREE.Matrix4
// THREE.Vector3
```

### cubejs Import

```javascript
import Cube from 'cubejs';

// Main class:
// new Cube()           - Create solved cube
// Cube.initSolver()    - Initialize tables
// Cube.scramble()      - Generate scramble
// Cube.fromString(s)   - Create from facelet string

// Instance methods:
// cube.move(moves)     - Apply moves
// cube.solve()         - Get solution
// cube.isSolved()      - Check if solved
```

---

## B.9 Browser APIs Used

```javascript
// Camera access
navigator.mediaDevices.getUserMedia({ video: true })

// Canvas 2D for color sampling
const ctx = canvas.getContext('2d');
const imageData = ctx.getImageData(x, y, w, h);

// Animation timing
requestAnimationFrame(callback)
performance.now()

// Event listeners
element.addEventListener('mousedown', handler)
window.addEventListener('resize', handler)
```
