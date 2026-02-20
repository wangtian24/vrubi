# CLAUDE.md — VRubi: Video-to-Rubik's Solver

## Project Vision
A web app that takes camera/video input of someone showing all faces of a Rubik's cube, recognizes the cube state, solves it, and animates the solution in 3D.

**Input:** Video/camera feed of hand-held cube being rotated to show all 6 faces  
**Output:** 3D animated solution from recognized starting state

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Browser (Client-Side)                 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   Camera    │───▶│   Vision    │───▶│   Solver    │  │
│  │   Module    │    │   Module    │    │   Module    │  │
│  └─────────────┘    └─────────────┘    └─────────────┘  │
│        │                   │                   │         │
│        │                   ▼                   │         │
│        │           ┌─────────────┐             │         │
│        └──────────▶│  3D Render  │◀────────────┘         │
│                    │   Module    │                       │
│                    └─────────────┘                       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Modules & Boundaries

### 1. Camera Module (`src/camera/`)
**Input:** Browser MediaStream API  
**Output:** Canvas frames at consistent FPS  
**Boundary:** Just captures frames. No processing.  
**Verifiable:** Can see live camera feed in browser.

### 2. Vision Module (`src/vision/`)
**Input:** Canvas frames  
**Output:** Cube state object `{ faces: { U, D, L, R, F, B }, confidence: number }`  
**Boundary:** Detects cube, extracts colors, tracks orientation, builds state.  
**Verifiable:** Given test images, outputs correct color mapping.

Sub-components:
- `cubeDetector.js` — Find cube in frame (contours, bounding box)
- `colorExtractor.js` — Sample 9 cells per visible face, map to RGBYOW
- `stateBuilder.js` — Accumulate faces over frames, track which face is which
- `validator.js` — Validate state (9 of each color, valid pieces exist)

### 3. Solver Module (`src/solver/`)
**Input:** Cube state object  
**Output:** Move sequence string (e.g., "R U R' U' R' F R2 U' R' U' R U R' F'")  
**Boundary:** Pure algorithm. No UI.  
**Verifiable:** Given known state, outputs solution that solves it.

Options:
- `kociemba.js` — WASM port of Kociemba algorithm
- `simple-solver.js` — Fallback beginner method (slower but simpler)

### 4. Render Module (`src/render/`)
**Input:** Initial state + move sequence  
**Output:** Three.js animated 3D cube  
**Boundary:** Just renders and animates. No solving logic.  
**Verifiable:** Can render a known state, play known moves, end state matches.

## Tech Stack
- **Framework:** Vanilla JS + Vite (fast, simple)
- **Camera:** WebRTC / getUserMedia
- **Vision:** OpenCV.js (color detection, contours)
- **Solver:** kociemba WASM or custom implementation
- **3D:** Three.js
- **Testing:** Vitest + Playwright for e2e

## Roadmap

### Phase 1: Foundation (Est: 2-3 hours)
- [ ] **1.1** Project scaffolding (Vite, folder structure, basic HTML)
- [ ] **1.2** Three.js cube renderer (static cube, can set colors)
- [ ] **1.3** Cube animation (can play a single move like "R")
- [ ] **1.4** Full animation sequence (play move list)

**Verification:** Can render a solved cube, play "R U R' U'" and see correct animation.

### Phase 2: Solver Integration (Est: 1-2 hours)
- [ ] **2.1** Integrate kociemba WASM (or find JS port)
- [ ] **2.2** State format: define canonical cube state representation
- [ ] **2.3** Solver API: `solve(state) → moves[]`
- [ ] **2.4** Connect solver → renderer

**Verification:** Hardcode a scrambled state, solve() returns moves, animation solves it.

### Phase 3: Vision Pipeline (Est: 3-4 hours)
- [ ] **3.1** Camera feed to canvas
- [ ] **3.2** Static image color extraction (given cube photo, extract 9 colors)
- [ ] **3.3** Multi-frame state building (track faces as cube rotates)
- [ ] **3.4** State validation and error correction

**Verification:** Record test video, pipeline extracts correct state.

### Phase 4: Integration & Polish (Est: 2-3 hours)
- [ ] **4.1** Full pipeline: camera → vision → solver → render
- [ ] **4.2** UI: instructions, progress indicator, controls
- [ ] **4.3** Error handling and edge cases
- [ ] **4.4** Mobile-friendly layout

**Verification:** End-to-end demo works with real cube.

### Phase 5: Stretch Goals
- [ ] AR overlay (show solution on real cube via camera)
- [ ] Voice guidance ("Now turn the right face clockwise")
- [ ] Multiple solving methods (beginner vs speedcuber)

## File Structure
```
vrubi/
├── CLAUDE.md           # This file
├── PROGRESS.md         # Timestamped progress journal
├── WORK_RULES.md       # Autonomous work rules
├── package.json
├── vite.config.js
├── index.html
├── src/
│   ├── main.js
│   ├── camera/
│   │   └── index.js
│   ├── vision/
│   │   ├── index.js
│   │   ├── cubeDetector.js
│   │   ├── colorExtractor.js
│   │   ├── stateBuilder.js
│   │   └── validator.js
│   ├── solver/
│   │   └── index.js
│   ├── render/
│   │   ├── index.js
│   │   ├── cube.js
│   │   └── animator.js
│   └── utils/
│       └── cubeState.js
├── tests/
│   ├── solver.test.js
│   ├── render.test.js
│   └── vision.test.js
├── assets/
│   └── test-images/    # Test cube images for vision testing
└── docs/
    └── design.md       # Detailed design decisions
```

## State Representation
```javascript
// Canonical state: 54-character string
// Order: U(9) R(9) F(9) D(9) L(9) B(9)
// Colors: W=White, Y=Yellow, R=Red, O=Orange, B=Blue, G=Green
// Solved state: "WWWWWWWWWRRRRRRRRRGGGGGGGGGYYYYYYYYYBBBBBBBBBOOOOOOOOOO"
//                    (this may need adjustment based on kociemba format)

// Face layout (looking at face):
// 0 1 2
// 3 4 5  (4 = center)
// 6 7 8
```

## Commands
```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run test     # Run tests
npm run lint     # Lint code
```

## Notes for Autonomous Development
- Each phase should be committable and working
- Write tests before or alongside implementation
- If stuck on vision, hardcode state to keep renderer/solver progressing
- Check in frequently with progress updates
- If any step takes >2x estimated time, pause and reassess
