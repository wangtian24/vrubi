# Module 5: Integration

*Connecting vision, solving, and rendering into a complete application*

---

## 5.1 Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          VRubi Complete Pipeline                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐                                                            │
│  │   Camera    │                                                            │
│  │   Stream    │                                                            │
│  └──────┬──────┘                                                            │
│         │ Video frames (640×480 RGBA)                                       │
│         ▼                                                                   │
│  ┌─────────────┐                                                            │
│  │   Cube      │  detectCubeRegion()                                        │
│  │  Detector   │───────────────────▶ {x, y, width, height}                 │
│  └──────┬──────┘                                                            │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────┐                                                            │
│  │   Color     │  extractFaceColors()                                       │
│  │  Extractor  │───────────────────▶ ['R','W','G','B','R','O','Y','W','G'] │
│  └──────┬──────┘                     (9 colors per face)                   │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────┐                                                            │
│  │   State     │  autoAddFace(), getStateString()                          │
│  │   Builder   │───────────────────▶ "WRGBWOYG..." (54 chars)              │
│  └──────┬──────┘                     after 6 faces scanned                 │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────┐                                                            │
│  │   State     │  validate()                                                │
│  │  Validator  │───────────────────▶ {valid: true/false, errors, warnings} │
│  └──────┬──────┘                                                            │
│         │                                                                   │
│         │ if valid                                                          │
│         ▼                                                                   │
│  ┌─────────────┐                                                            │
│  │   Kociemba  │  solveFromState()                                          │
│  │   Solver    │───────────────────▶ ["R", "U", "R'", "F2", ...] (≤22)     │
│  └──────┬──────┘                                                            │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────┐                                                            │
│  │   Cube      │  playMoves()                                               │
│  │  Renderer   │───────────────────▶ 3D animation at 60fps                 │
│  └─────────────┘                                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5.2 Module Interfaces

### Vision → Solver Interface

```javascript
// StateBuilder output
const stateString = stateBuilder.getStateString();
// "WGOBWRYOGROGBRRBYWGYGOGYRBRYBWYOYGWRBYWOBGRYOOWBGBWOO"

// Validator check
const validation = validator.validate(stateString);
// { valid: true, errors: [], warnings: [] }

// Solver input (same string format)
const solution = solveFromState(stateString);
// ["D2", "L'", "B", "F2", "R", "U'", "R'"]
```

### Solver → Renderer Interface

```javascript
// Solver output
const solution = ["D2", "L'", "B", "F2", "R", "U'", "R'"];

// Renderer input (same format)
await renderer.playMoves(solution);
```

**Key design**: Standardized move notation (Singmaster) connects all modules.

---

## 5.3 Application State Machine

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        Application States                                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                         ┌─────────────┐                                  │
│                         │   LOADING   │                                  │
│                         │  (init)     │                                  │
│                         └──────┬──────┘                                  │
│                                │ Solver tables ready                     │
│                                ▼                                         │
│                         ┌─────────────┐                                  │
│              ┌─────────▶│    IDLE     │◀─────────┐                       │
│              │          │  (solved)   │          │                       │
│              │          └──────┬──────┘          │                       │
│              │                 │                 │                       │
│              │     Scramble    │    Scan        │                       │
│              │        │        │      │         │                       │
│              │        ▼        │      ▼         │                       │
│              │  ┌──────────┐   │  ┌──────────┐  │                       │
│              │  │SCRAMBLING│   │  │ SCANNING │  │                       │
│              │  └────┬─────┘   │  └────┬─────┘  │                       │
│              │       │         │       │        │                       │
│              │       ▼         │       ▼        │                       │
│              │  ┌──────────┐   │  ┌──────────┐  │                       │
│   Reset      │  │SCRAMBLED │   │  │  STATE   │  │   Reset               │
│              │  │ (waiting)│   │  │ CAPTURED │  │                       │
│              │  └────┬─────┘   │  └────┬─────┘  │                       │
│              │       │         │       │        │                       │
│              │  Solve│         │       │ Solve  │                       │
│              │       └────┬────┘       │        │                       │
│              │            ▼            │        │                       │
│              │      ┌───────────┐      │        │                       │
│              │      │  SOLVING  │◀─────┘        │                       │
│              │      │ (computing)│               │                       │
│              │      └─────┬─────┘               │                       │
│              │            │                     │                       │
│              │            ▼                     │                       │
│              │      ┌───────────┐               │                       │
│              │      │ ANIMATING │               │                       │
│              │      │ (playing) │               │                       │
│              │      └─────┬─────┘               │                       │
│              │            │                     │                       │
│              └────────────┴─────────────────────┘                       │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 5.4 Error Handling Strategy

### Error Types and Responses

```javascript
async function solveCube() {
  try {
    // Stage 1: Validation
    const validation = validator.validate(stateString);
    if (!validation.valid) {
      throw new ValidationError(validation.errors);
    }
    
    // Stage 2: Solving
    const solution = solveFromState(stateString);
    
    // Stage 3: Animation
    await renderer.playMoves(solution);
    
  } catch (error) {
    if (error instanceof ValidationError) {
      // Bad scan - show rescan prompt
      showMessage("Invalid cube state. Please rescan.");
      
    } else if (error instanceof SolverError) {
      // Impossible state (parity error)
      showMessage("This cube state is unsolvable.");
      
    } else if (error instanceof AnimationError) {
      // Rendering issue
      console.error("Animation failed:", error);
      // Cube state might be inconsistent, reset
      renderer.reset();
    }
  }
}
```

### Validation Error Recovery

```
┌────────────────────────────────────────────────────────────────┐
│ Error: "Expected 9 White, got 8"                               │
├────────────────────────────────────────────────────────────────┤
│ Cause: One white sticker misdetected (probably as Yellow)      │
│ Recovery:                                                      │
│   1. Identify which face has wrong count                       │
│   2. Clear that face from StateBuilder                         │
│   3. Prompt user to rescan that face                          │
│   4. Use better lighting / steadier hold                       │
└────────────────────────────────────────────────────────────────┘
```

---

## 5.5 Performance Budget

```
┌────────────────────────────────────────────────────────────────┐
│                    Performance Budget                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Initialization (once)                                         │
│  ─────────────────────                                         │
│  Three.js scene setup:     50ms                                │
│  Solver table generation:  840ms                               │
│  Camera permission:        user-dependent                      │
│  ───────────────────────────────                               │
│  Total init:               ~1 second                           │
│                                                                │
│  Per-Frame (target: 60fps = 16.67ms)                          │
│  ────────────────────────────────────                          │
│  Animation update:         0.05ms                              │
│  Scene traversal:          0.10ms                              │
│  WebGL draw calls:         0.50ms                              │
│  GPU work:                 1.00ms                              │
│  ───────────────────────────────                               │
│  Total per frame:          ~1.65ms (90% headroom)             │
│                                                                │
│  Per-Solve                                                     │
│  ─────────                                                     │
│  Coordinate computation:   0.1ms                               │
│  IDA* search:              15ms average, 400ms worst          │
│  Move parsing:             0.01ms                              │
│  ───────────────────────────────                               │
│  Total solve:              ~15-400ms                           │
│                                                                │
│  Per-Animation-Sequence                                        │
│  ──────────────────────                                        │
│  18 moves × 200ms each:    ~3.6 seconds                        │
│  (non-blocking, renders during)                                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 5.6 Main Application Code

```javascript
// main.js - Application entry point

import { CubeRenderer } from './render';
import { initSolver, solveFromState, scramble, inverseMoves } from './solver';
import { StateBuilder } from './vision/stateBuilder';
import { ColorExtractor } from './vision/colorExtractor';
import { CubeDetector } from './vision/cubeDetector';
import { StateValidator } from './vision/validator';

class VRubiApp {
  constructor() {
    this.renderer = null;
    this.stateBuilder = new StateBuilder();
    this.colorExtractor = new ColorExtractor();
    this.cubeDetector = new CubeDetector();
    this.validator = new StateValidator();
    this.solverReady = false;
  }
  
  async init() {
    // Initialize 3D renderer
    const container = document.getElementById('cube-container');
    this.renderer = new CubeRenderer(container);
    
    // Initialize solver (loads tables)
    this.setStatus('Initializing solver...');
    await initSolver();
    this.solverReady = true;
    this.setStatus('Ready');
    
    // Set up UI handlers
    this.setupUI();
  }
  
  setupUI() {
    document.getElementById('scramble-btn').onclick = () => this.scramble();
    document.getElementById('solve-btn').onclick = () => this.solve();
    document.getElementById('reset-btn').onclick = () => this.reset();
    document.getElementById('scan-btn').onclick = () => this.toggleScanMode();
  }
  
  async scramble() {
    const moves = scramble();
    this.setStatus(`Scrambling: ${moves.join(' ')}`);
    await this.renderer.playMoves(moves);
    this.setStatus('Scrambled. Click Solve to see solution.');
  }
  
  async solve() {
    if (!this.solverReady) {
      this.setStatus('Solver not ready');
      return;
    }
    
    // Get reverse moves (simple solve for demo)
    const solution = this.renderer.getReverseMoves();
    
    if (solution.length === 0) {
      this.setStatus('Already solved!');
      return;
    }
    
    this.setStatus(`Solving: ${solution.join(' ')}`);
    await this.renderer.playMoves(solution);
    this.setStatus('Solved!');
  }
  
  reset() {
    this.renderer.reset();
    this.stateBuilder.reset();
    this.setStatus('Reset to solved state');
  }
  
  // Vision integration
  async solveFromScan() {
    const stateString = this.stateBuilder.getStateString();
    
    // Validate
    const validation = this.validator.validate(stateString);
    if (!validation.valid) {
      this.setStatus(`Invalid: ${validation.errors[0]}`);
      return;
    }
    
    // Solve
    try {
      const solution = solveFromState(stateString);
      this.setStatus(`Solution: ${solution.join(' ')}`);
      
      // First, set the cube to the scanned state
      const setupMoves = inverseMoves(solution);
      await this.renderer.playMoves(setupMoves);
      
      // Then animate the solution
      await this.renderer.playMoves(solution);
      this.setStatus('Solved!');
      
    } catch (error) {
      this.setStatus(`Error: ${error.message}`);
    }
  }
  
  setStatus(msg) {
    document.getElementById('status').textContent = msg;
  }
}

// Start application
const app = new VRubiApp();
app.init();
```

---

## 5.7 HTML Structure

```html
<!DOCTYPE html>
<html>
<head>
  <title>VRubi - Rubik's Cube Solver</title>
  <style>
    body { 
      margin: 0; 
      background: #0f0f1a; 
      color: white;
      font-family: system-ui;
    }
    #app { 
      display: flex; 
      flex-direction: column;
      height: 100vh; 
    }
    #cube-container { 
      flex: 1; 
    }
    #controls { 
      padding: 1rem;
      display: flex;
      gap: 0.5rem;
      justify-content: center;
    }
    button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
    }
    #status {
      text-align: center;
      padding: 0.5rem;
      opacity: 0.7;
    }
  </style>
</head>
<body>
  <div id="app">
    <div id="cube-container"></div>
    <div id="controls">
      <button id="scramble-btn">🎲 Scramble</button>
      <button id="solve-btn">✨ Solve</button>
      <button id="reset-btn">🔄 Reset</button>
      <button id="scan-btn">📷 Scan</button>
    </div>
    <div id="status">Loading...</div>
  </div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

---

## 5.8 Build Configuration

```javascript
// vite.config.js
export default {
  root: '.',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 5173,
    open: true,
  },
};
```

```json
// package.json
{
  "name": "vrubi",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "three": "^0.160.0",
    "cubejs": "^1.0.0"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  }
}
```

---

## 5.9 Deployment

```bash
# Development
npm run dev
# Opens http://localhost:5173

# Production build
npm run build
# Outputs to dist/

# Preview production build
npm run preview

# Deploy (example: GitHub Pages)
npm run build
cd dist
git init
git add .
git commit -m "Deploy"
git push -f git@github.com:username/vrubi.git main:gh-pages
```

---

## 5.10 Future Enhancements

```
┌────────────────────────────────────────────────────────────────┐
│                    Phase 5: Stretch Goals                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  AR Overlay                                                    │
│  ──────────                                                    │
│  • Draw solution moves on real cube via camera                │
│  • Use WebXR or ARCore/ARKit                                  │
│  • Highlight which face to turn                               │
│                                                                │
│  Voice Guidance                                                │
│  ──────────────                                                │
│  • "Turn the right face clockwise"                            │
│  • Web Speech API for TTS                                     │
│  • Pace guidance to user's solving speed                      │
│                                                                │
│  Multiple Solving Methods                                      │
│  ────────────────────────                                      │
│  • Beginner method (layer-by-layer)                           │
│  • CFOP (for speedcubers)                                     │
│  • Show different approaches to same scramble                 │
│                                                                │
│  Solution Playback Controls                                    │
│  ──────────────────────────                                    │
│  • Pause / play / step forward / step back                    │
│  • Speed control (0.5x to 4x)                                 │
│  • Jump to specific move                                      │
│                                                                │
│  Statistics & History                                          │
│  ────────────────────                                          │
│  • Track solve times                                          │
│  • Store scramble history                                     │
│  • Average move counts                                        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 5.11 Key Takeaways

1. **Clean interfaces** between modules enable independent development and testing.

2. **Standardized notation** (Singmaster moves) connects vision, solver, and renderer.

3. **State machine** clarifies application flow and valid transitions.

4. **Error handling** at each stage prevents cascading failures.

5. **Performance budget** ensures smooth user experience.

6. **Modular architecture** enables future enhancements.

---

## Congratulations!

You've completed the VRubi educational series. You now understand:

- **Color detection** in HSL space with multi-frame consensus
- **Cube state representation** and validation
- **Group theory** underlying the Rubik's cube
- **Kociemba two-phase algorithm** for near-optimal solving
- **3D rendering** with Three.js and pivot-based animation

Go build something amazing! 🧊
