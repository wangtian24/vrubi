# Module 3.3: Implementation Details

*From theory to working code*

---

## 3.3.1 Library Choice: cubejs

VRubi uses the **cubejs** library, a JavaScript implementation of the Kociemba algorithm:

```javascript
import Cube from 'cubejs';

// Initialize solver (loads/generates tables)
Cube.initSolver();

// Create a cube and scramble it
const cube = new Cube();
cube.move("R U R' F2 B' L D2");

// Solve
const solution = cube.solve();
console.log(solution);  // "D2 L' B F2 R U' R'"
```

### Why cubejs?

| Library | Language | Size | Init Time | Notes |
|---------|----------|------|-----------|-------|
| **cubejs** | JavaScript | 150KB | ~0.8s | Pure JS, no dependencies |
| min2phase | Java | 300KB | ~1s | Reference implementation |
| kociemba | Python | 500KB | ~2s | Python bindings |

cubejs is optimized for browser environments.

---

## 3.3.2 Initialization

The solver requires **precomputed tables**:

```javascript
export async function initSolver() {
  if (solverReady) return;
  
  console.log('Initializing Kociemba solver...');
  const start = performance.now();
  
  // This generates move tables and pruning tables
  Cube.initSolver();
  
  const elapsed = ((performance.now() - start) / 1000).toFixed(2);
  console.log(`Solver initialized in ${elapsed}s`);
  
  solverReady = true;
}
```

### Table Generation Timeline

```
0.0s  ─── Start
      │
0.1s  ├── Generate move tables
      │     • twist_move[2187][18]
      │     • flip_move[2048][18]
      │     • slice_move[495][18]
      │     • ...
      │
0.4s  ├── Generate Phase 1 pruning tables
      │     • Breadth-first search from goal
      │     • Store distance for each coordinate
      │
0.7s  ├── Generate Phase 2 pruning tables
      │     • Same BFS approach
      │
0.84s ─── Done
```

**One-time cost**: Tables are generated once and reused for all solves.

---

## 3.3.3 State Representation in cubejs

cubejs represents cube state internally using:

```javascript
// Corner permutation (8 values, each 0-7)
cp: [0, 1, 2, 3, 4, 5, 6, 7]  // Solved

// Corner orientation (8 values, each 0-2)
co: [0, 0, 0, 0, 0, 0, 0, 0]  // Solved

// Edge permutation (12 values, each 0-11)
ep: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]  // Solved

// Edge orientation (12 values, each 0-1)
eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]  // Solved
```

### Converting Facelet String to Internal State

```javascript
// Input: 54-character facelet string
// Output: Internal (cp, co, ep, eo) representation

Cube.fromString = function(faceletStr) {
  // Map facelet colors to face indices
  const facelets = faceletStr.split('');
  
  // Determine corner pieces and orientations
  // by examining the 3 facelets at each corner position
  for (let i = 0; i < 8; i++) {
    const [f1, f2, f3] = getCornerFacelets(i, facelets);
    // Find which corner piece this is
    // Determine its orientation (0, 1, or 2)
  }
  
  // Similar for edges...
  
  return new Cube(cp, co, ep, eo);
};
```

---

## 3.3.4 The Solve Function

```javascript
export function solve(state) {
  if (!solverReady) {
    throw new Error('Solver not initialized');
  }
  
  let cube;
  
  if (typeof state === 'string') {
    // Create cube and apply scramble moves
    cube = new Cube();
    cube.move(state);
  } else {
    cube = state;
  }
  
  if (cube.isSolved()) {
    return [];
  }
  
  // Get solution string from Kociemba algorithm
  const solutionStr = cube.solve();
  
  // Parse "R U R' F2" into ["R", "U", "R'", "F2"]
  return parseMoves(solutionStr);
}
```

### Solving from Facelet State

When solving from a scanned cube, we have colors, not moves:

```javascript
export function solveFromState(faceletStr) {
  // Convert color letters (WRYOGB) to face letters (URFDLB)
  const colorToFace = {
    'W': 'U', 'R': 'R', 'G': 'F',
    'Y': 'D', 'O': 'L', 'B': 'B'
  };
  
  const cubejsState = faceletStr
    .split('')
    .map(c => colorToFace[c] || c)
    .join('');
  
  // Create cube from facelet string
  const cube = Cube.fromString(cubejsState);
  
  if (cube.isSolved()) {
    return [];
  }
  
  return parseMoves(cube.solve());
}
```

---

## 3.3.5 Move Parsing and Manipulation

```javascript
/**
 * Parse move string into array
 * "R U R' F2" → ["R", "U", "R'", "F2"]
 */
export function parseMoves(moveStr) {
  if (!moveStr || typeof moveStr !== 'string') return [];
  return moveStr.trim().split(/\s+/).filter(m => m.length > 0);
}

/**
 * Get inverse of a move sequence
 * ["R", "U", "F2"] → ["F2", "U'", "R'"]
 */
export function inverseMoves(moves) {
  return moves.slice().reverse().map(move => {
    if (move.endsWith("'")) return move.slice(0, -1);  // R' → R
    if (move.endsWith("2")) return move;               // R2 → R2
    return move + "'";                                  // R → R'
  });
}

/**
 * Validate moves
 */
export function validateMoves(moves) {
  const validMoves = new Set([
    'U', "U'", 'U2', 'D', "D'", 'D2',
    'R', "R'", 'R2', 'L', "L'", 'L2',
    'F', "F'", 'F2', 'B', "B'", 'B2',
  ]);
  return moves.every(move => validMoves.has(move));
}
```

---

## 3.3.6 Random Scramble Generation

```javascript
export function scramble() {
  // cubejs provides built-in scrambler
  const scrambleStr = Cube.scramble();
  return parseMoves(scrambleStr);
}
```

### Scramble Algorithm

```javascript
// Inside Cube.scramble():
function generateScramble(length = 25) {
  const faces = ['U', 'D', 'R', 'L', 'F', 'B'];
  const mods = ['', "'", '2'];
  const moves = [];
  let lastFace = -1;
  let lastLastFace = -1;
  
  for (let i = 0; i < length; i++) {
    let faceIdx;
    do {
      faceIdx = Math.floor(Math.random() * 6);
    } while (
      faceIdx === lastFace ||  // Don't repeat same face
      (faceIdx === lastLastFace && isOpposite(faceIdx, lastFace))  // Avoid R L R
    );
    
    const mod = mods[Math.floor(Math.random() * 3)];
    moves.push(faces[faceIdx] + mod);
    
    lastLastFace = lastFace;
    lastFace = faceIdx;
  }
  
  return moves.join(' ');
}
```

---

## 3.3.7 Memory Layout

### Move Tables

```
┌─────────────────────────────────────────────────────────────┐
│                    Move Table Structure                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  twist_move: Uint16Array(2187 × 18)                        │
│  ┌─────────────────────────────────────────────────┐       │
│  │ twist=0:  [U→?, U'→?, U2→?, D→?, ..., B2→?]    │       │
│  │ twist=1:  [U→?, U'→?, U2→?, D→?, ..., B2→?]    │       │
│  │ ...                                             │       │
│  │ twist=2186: [...]                               │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
│  Access: new_twist = twist_move[old_twist * 18 + move_idx] │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Pruning Tables

```
┌─────────────────────────────────────────────────────────────┐
│                   Pruning Table Structure                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  twist_flip_prune: Uint8Array(2187 × 2048)                 │
│                                                             │
│  Value at [twist, flip] = minimum moves to reach G₁        │
│                                                             │
│  Packed storage (4 bits per entry):                        │
│  ┌────────────────────────────────────────┐                │
│  │ Byte 0: [dist(0,0), dist(0,1)]        │                │
│  │ Byte 1: [dist(0,2), dist(0,3)]        │                │
│  │ ...                                    │                │
│  └────────────────────────────────────────┘                │
│                                                             │
│  Memory: 2187 × 2048 × 0.5 bytes ≈ 2.2 MB                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3.3.8 Search Implementation

### IDA* in cubejs

```javascript
// Simplified IDA* implementation
function solve() {
  // Compute initial coordinates
  let twist = this.twist();
  let flip = this.flip();
  let slice = this.slice();
  
  // Phase 1: reach G₁
  for (let maxDepth = 0; maxDepth <= 12; maxDepth++) {
    const result = searchPhase1(twist, flip, slice, maxDepth, -1);
    if (result !== null) {
      // Found Phase 1 solution
      break;
    }
  }
  
  // Apply Phase 1 moves, compute Phase 2 coordinates
  // ...
  
  // Phase 2: solve within G₁
  for (let maxDepth = 0; maxDepth <= 18; maxDepth++) {
    const result = searchPhase2(corners, edges_ud, edges_e, maxDepth, -1);
    if (result !== null) {
      return phase1Solution + phase2Solution;
    }
  }
}

function searchPhase1(twist, flip, slice, depth, lastMove) {
  // Pruning check
  const dist = Math.max(
    twist_flip_prune[twist][flip],
    twist_slice_prune[twist][slice],
    flip_slice_prune[flip][slice]
  );
  
  if (dist > depth) return null;  // Can't reach in remaining depth
  
  if (depth === 0) {
    if (twist === 0 && flip === 0 && slice === 0) {
      return [];  // Reached G₁!
    }
    return null;
  }
  
  // Try all 18 moves
  for (let move = 0; move < 18; move++) {
    if (shouldSkip(move, lastMove)) continue;  // Redundancy pruning
    
    const newTwist = twist_move[twist][move];
    const newFlip = flip_move[flip][move];
    const newSlice = slice_move[slice][move];
    
    const result = searchPhase1(newTwist, newFlip, newSlice, depth - 1, move);
    if (result !== null) {
      return [MOVE_NAMES[move], ...result];
    }
  }
  
  return null;
}
```

---

## 3.3.9 Optimizations

### 1. Symmetry Reduction

Cube has 48 symmetries. Store only canonical representatives:

```
Effective table size reduced by up to 48×
```

### 2. Distance Modulo

For pruning tables, we only need distance mod 3:

```
Instead of storing 0-12, store 0-2
This allows 4-bit packing (2 entries per byte)
```

### 3. Move Axis Grouping

Group moves by axis for faster redundancy checking:

```javascript
// Moves that commute are grouped
const AXIS = {
  U: 0, D: 0,  // Y-axis
  R: 1, L: 1,  // X-axis
  F: 2, B: 2,  // Z-axis
};

function shouldSkip(move, lastMove) {
  if (lastMove < 0) return false;
  const m = move / 3 | 0;
  const l = lastMove / 3 | 0;
  // Same face or opposite face that was done first
  return m === l || (m ^ l) === 1 && m > l;
}
```

### 4. Lazy Table Generation

Generate tables on first use, not at module load:

```javascript
let tablesGenerated = false;

function ensureTables() {
  if (!tablesGenerated) {
    generateMoveTables();
    generatePruneTables();
    tablesGenerated = true;
  }
}
```

---

## 3.3.10 Performance Benchmarks

Tested on M1 MacBook Pro (2021):

| Operation | Time |
|-----------|------|
| Table generation | 840ms |
| Average solve | 15ms |
| Worst case solve | 380ms |
| Easy scramble | 3ms |

### Solution Length Distribution

```
Moves   Frequency
─────   ─────────
14      0.1%
15      1.2%
16      5.8%
17      18.4%
18      35.2%
19      28.7%
20      9.1%
21      1.4%
22      0.1%

Average: 18.2 moves
```

---

## 3.3.11 Error Handling

```javascript
export function solveFromState(faceletStr) {
  if (!solverReady || !Cube) {
    throw new Error('Solver not initialized. Call initSolver() first.');
  }
  
  try {
    const cube = Cube.fromString(convertColors(faceletStr));
    
    if (cube.isSolved()) {
      return [];
    }
    
    const solutionStr = cube.solve();
    
    if (!solutionStr) {
      throw new Error('No solution found');
    }
    
    return parseMoves(solutionStr);
  } catch (error) {
    console.error('Failed to solve from state:', error);
    
    // Possible causes:
    // - Invalid facelet string (wrong length, bad colors)
    // - Impossible cube state (edge/corner violations)
    // - Parity error (cube was assembled wrong)
    
    throw error;
  }
}
```

---

## 3.3.12 Integration Example

Complete flow from scanned state to solution:

```javascript
import { initSolver, solveFromState } from './solver';
import { StateBuilder } from './vision/stateBuilder';
import { StateValidator } from './vision/validator';

async function solveCube(stateBuilder) {
  // Step 1: Get facelet string
  const faceletStr = stateBuilder.getStateString();
  // "WGOBWRYOGROGBRRBYWGYGOGYRBRYBWYOYGWRBYWOBGRYOOWBGBWOO"
  
  // Step 2: Validate
  const validator = new StateValidator();
  const validation = validator.validate(faceletStr);
  
  if (!validation.valid) {
    throw new Error(`Invalid state: ${validation.errors.join(', ')}`);
  }
  
  // Step 3: Solve
  await initSolver();
  const solution = solveFromState(faceletStr);
  // ["D2", "L'", "B", "F2", "R", "U'", "R'"]
  
  return solution;
}
```

---

## 3.3.13 Key Takeaways

1. **cubejs** provides production-ready Kociemba implementation in JavaScript.

2. **~0.8s initialization** for table generation, then fast solves.

3. **Coordinate conversion** maps facelet strings to internal representation.

4. **Move manipulation** (parse, inverse, validate) supports animation.

5. **Error handling** catches invalid states before solving.

6. **Typical solve: 15ms, 18 moves**.

---

## Next Module

[→ Module 4.1: Cube Geometry](./04-1-geometry.md)

Learn how we represent and render the 3D cube using Three.js.
