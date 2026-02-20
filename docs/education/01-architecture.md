# Module 1: System Architecture

*The complete pipeline from photons to solutions*

---

## 1.1 Problem Statement

Given a video stream of a physical Rubik's cube, we want to:

1. **Extract** the current state of the cube (54 colored facelets)
2. **Validate** that the state is physically achievable
3. **Solve** for an optimal or near-optimal move sequence
4. **Visualize** the solution as an animated 3D rendering

This is a classic instance of the **perception-reasoning-action** loop found throughout robotics and AI systems.

---

## 1.2 Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 INPUT STAGE                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│    Camera/Video                                                                 │
│         │                                                                       │
│         ▼                                                                       │
│    ┌─────────┐     getUserMedia API                                            │
│    │  Frame  │     Resolution: 640×480 typical                                 │
│    │ (t=k)   │     Format: RGBA, 8-bit per channel                             │
│    └────┬────┘                                                                  │
│         │                                                                       │
├─────────┼───────────────────────────────────────────────────────────────────────┤
│         │                    PERCEPTION STAGE                                   │
├─────────┼───────────────────────────────────────────────────────────────────────┤
│         ▼                                                                       │
│    ┌──────────────┐                                                            │
│    │ CubeDetector │  Locates cube face in frame                                │
│    │              │  Output: bounding box {x, y, w, h}                         │
│    └──────┬───────┘                                                            │
│           │                                                                     │
│           ▼                                                                     │
│    ┌────────────────┐                                                          │
│    │ ColorExtractor │  Samples 9 regions, classifies colors                    │
│    │                │  Output: ['W','R','B','G','O','Y','W','R','G']           │
│    └──────┬─────────┘                                                          │
│           │                                                                     │
│           ▼                                                                     │
│    ┌──────────────┐                                                            │
│    │ StateBuilder │  Accumulates 6 faces over time                             │
│    │              │  Multi-frame voting for robustness                         │
│    └──────┬───────┘                                                            │
│           │                                                                     │
│           ▼                                                                     │
│    ┌───────────────┐                                                           │
│    │ StateValidator│  Checks color counts, center colors, parity               │
│    │               │  Output: {valid: bool, errors: [], warnings: []}          │
│    └───────┬───────┘                                                           │
│            │                                                                    │
├────────────┼────────────────────────────────────────────────────────────────────┤
│            │                    REASONING STAGE                                 │
├────────────┼────────────────────────────────────────────────────────────────────┤
│            ▼                                                                    │
│    ┌─────────────────┐                                                         │
│    │  Kociemba Solver│  Two-phase IDA* search                                  │
│    │                 │  Output: ["R", "U", "R'", "F2", ...]                    │
│    │                 │  Guarantee: ≤22 moves (usually ≤19)                     │
│    └────────┬────────┘                                                         │
│             │                                                                   │
├─────────────┼───────────────────────────────────────────────────────────────────┤
│             │                    ACTION STAGE                                   │
├─────────────┼───────────────────────────────────────────────────────────────────┤
│             ▼                                                                   │
│    ┌──────────────┐                                                            │
│    │ CubeRenderer │  Three.js scene with 27 cubies                             │
│    │              │  Animates moves sequentially                               │
│    └──────┬───────┘                                                            │
│           │                                                                     │
│           ▼                                                                     │
│    ┌──────────────┐                                                            │
│    │ CubeAnimator │  Smooth rotation with easing                               │
│    │              │  200ms per move, pivot-based                               │
│    └──────────────┘                                                            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1.3 Data Representations

At each stage, data is transformed into a more abstract representation:

### Stage 1: Raw Pixels
```
Frame[y][x] = (R, G, B, A)  where R,G,B,A ∈ [0, 255]
Size: 640 × 480 × 4 = 1,228,800 bytes
```

### Stage 2: Sampled Colors
```
Face = [c₀, c₁, c₂, c₃, c₄, c₅, c₆, c₇, c₈]  where cᵢ ∈ {W, Y, R, O, G, B}
Size: 9 bytes per face
```

### Stage 3: Complete State
```
State = U[9] ⊕ R[9] ⊕ F[9] ⊕ D[9] ⊕ L[9] ⊕ B[9]
Size: 54 bytes (one character per facelet)
Example: "WWWWWWWWWRRRRRRRRRGGGGGGGGGYYYYYYYYYYOOOOOOOOOOBBBBBBBBB"
```

### Stage 4: Solution
```
Solution = [m₀, m₁, ..., mₙ]  where mᵢ ∈ {U, U', U2, D, D', D2, R, R', L, L', F, F', B, B', ...}
Size: ≤22 moves, typically 17-19
```

### Stage 5: Animation State
```
CubieTransform = {
  position: Vector3(x, y, z),      // Grid position ∈ {-1, 0, 1}³
  rotation: Euler(rx, ry, rz)      // Cumulative rotation
}
Size: 27 cubies × 6 floats = 162 floats
```

---

## 1.4 Complexity Analysis

### Time Complexity

| Component | Operation | Complexity | Explanation |
|-----------|-----------|------------|-------------|
| Detection | Find cube region | O(1) | Center-based heuristic |
| Extraction | Sample 9 colors | O(r²) | r = sample radius ≈ 8 |
| Classification | HSL lookup | O(1) | Decision tree |
| Validation | Check constraints | O(1) | Fixed 54 elements |
| Solver Init | Load tables | O(T) | T ≈ 2MB table size |
| Solve Phase 1 | IDA* search | O(b^d₁) | b ≈ 13, d₁ ≤ 12 |
| Solve Phase 2 | IDA* search | O(b^d₂) | b ≈ 10, d₂ ≤ 18 |
| Animation | Per move | O(9) | Rotate 9 cubies |

**Effective solve time**: 10-400ms on modern hardware

### Space Complexity

| Component | Memory | Notes |
|-----------|--------|-------|
| Frame buffer | 1.2 MB | Single frame |
| State history | 270 bytes | 5 frames × 54 bytes |
| Pruning tables | ~2 MB | Loaded once at init |
| 3D scene | ~50 KB | 27 cubies, textures |

---

## 1.5 Design Decisions

### Why Client-Side?

The entire pipeline runs in the browser:

1. **Privacy**: No video leaves the device
2. **Latency**: No network round-trip for solving
3. **Offline**: Works without internet after initial load
4. **Simplicity**: Single deployment, no server costs

**Trade-off**: Initial solver load time (~0.8s for table generation)

### Why HSL over RGB?

Human color perception is non-uniform in RGB space. In HSL:
- **Hue** isolates chromatic information
- **Saturation** separates colors from white/black
- **Lightness** handles shadows uniformly

See [Module 2.1](./02-1-color-space.md) for mathematical details.

### Why Kociemba over Other Solvers?

| Solver | Optimality | Speed | Memory |
|--------|------------|-------|--------|
| Thistlethwaite | ≤52 moves | Fast | Low |
| **Kociemba** | **≤22 moves** | **Medium** | **Medium** |
| Optimal (God's Number) | ≤20 moves | Slow | High |

Kociemba provides near-optimal solutions with practical speed.

### Why Three.js?

- Hardware-accelerated WebGL rendering
- Mature ecosystem with good documentation
- Scene graph abstraction simplifies pivot-based animation
- Cross-platform (desktop, mobile, tablet)

---

## 1.6 Error Handling Strategy

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Camera    │────▶│   Vision    │────▶│   Solver    │
│   Errors    │     │   Errors    │     │   Errors    │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       ▼                   ▼                   ▼
  Permission         Color ambiguity      Invalid state
  denied             (lighting)           (bad scan)
       │                   │                   │
       ▼                   ▼                   ▼
  Show message       Multi-frame          Fallback to
  "Enable camera"    consensus            reverse moves
```

**Graceful degradation**: If camera unavailable, users can still:
- Use the 3D cube directly
- Manually input state (future feature)
- View pre-loaded examples

---

## 1.7 Module Dependencies

```
                    ┌─────────────┐
                    │   main.js   │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
  ┌──────────┐      ┌──────────┐      ┌──────────┐
  │  camera  │      │  vision  │      │  render  │
  └──────────┘      └────┬─────┘      └────┬─────┘
                         │                 │
              ┌──────────┼──────────┐      │
              │          │          │      │
              ▼          ▼          ▼      │
        ┌─────────┐ ┌─────────┐ ┌─────┐   │
        │detector │ │extractor│ │state│   │
        └─────────┘ └─────────┘ │build│   │
                               └──┬──┘   │
                                  │      │
                    ┌─────────────┼──────┘
                    │             │
                    ▼             ▼
              ┌──────────┐  ┌──────────┐
              │ validator│  │  solver  │
              └──────────┘  └──────────┘
                                 │
                                 ▼
                            ┌─────────┐
                            │ cubejs  │  (external)
                            └─────────┘
```

---

## 1.8 Performance Targets

| Metric | Target | Achieved |
|--------|--------|----------|
| Solver init | < 2s | 0.84s |
| Solve time | < 1s | 0.01-0.4s |
| Animation FPS | 60 | 60 |
| Mobile responsive | Yes | Yes |
| Offline capable | Yes | Yes |

---

## Next Module

[→ Module 2.1: Color Space Theory](./02-1-color-space.md)

Learn how we transform RGB pixels into reliable color classifications using the HSL color space.
