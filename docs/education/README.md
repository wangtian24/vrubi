# VRubi: A Technical Deep Dive

**From Camera Input to Optimal Solutions — The Mathematics and Engineering of a Video-Based Rubik's Cube Solver**

---

## Overview

This educational series explores the complete pipeline of VRubi, a web application that:

1. Captures video of a physical Rubik's cube
2. Extracts the cube's state through computer vision
3. Computes an optimal solution using the Kociemba algorithm
4. Renders an animated 3D visualization of the solution

Each module assumes familiarity with undergraduate-level linear algebra, probability, and algorithms. Graduate-level topics (group theory, optimization) are introduced as needed.

---

## Module Index

### Foundations

| Module | Title | Topics |
|--------|-------|--------|
| [1. System Architecture](./01-architecture.md) | Pipeline Overview | End-to-end flow, complexity analysis, design decisions |

### Computer Vision

| Module | Title | Topics |
|--------|-------|--------|
| [2.1 Color Space Theory](./02-1-color-space.md) | HSL and Color Classification | RGB→HSL transform, decision boundaries, perceptual uniformity |
| [2.2 Spatial Sampling](./02-2-sampling.md) | Noise Reduction | Region averaging, multi-frame consensus, Bayesian voting |
| [2.3 State Representation](./02-3-state-representation.md) | Cube State Formalism | Facelet notation, validation constraints, parity |

### Solving Algorithm

| Module | Title | Topics |
|--------|-------|--------|
| [3.1 Group Theory](./03-1-group-theory.md) | Mathematical Foundations | Rubik's group structure, generators, orbits |
| [3.2 Kociemba Algorithm](./03-2-kociemba.md) | Two-Phase Search | Subgroup decomposition, coordinates, pruning |
| [3.3 Implementation](./03-3-implementation.md) | Engineering the Solver | Move tables, memory layout, optimizations |

### 3D Graphics

| Module | Title | Topics |
|--------|-------|--------|
| [4.1 Cube Geometry](./04-1-geometry.md) | 3D Model Construction | Cubie representation, layer indexing, materials |
| [4.2 Transformations](./04-2-transformations.md) | Rotation Mathematics | Rotation matrices, pivot animation, numerical stability |

### Integration

| Module | Title | Topics |
|--------|-------|--------|
| [5. Integration](./05-integration.md) | Putting It Together | Data flow, error handling, performance |

### Reference

| Document | Description |
|----------|-------------|
| [Appendix A: Notation](./appendix-a-notation.md) | Move notation, facelet indexing, state format |
| [Appendix B: Code Reference](./appendix-b-code.md) | Key functions and data structures |

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              VRubi Pipeline                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐│
│  │  Camera  │───▶│  Vision  │───▶│ Validator│───▶│  Solver  │───▶│Renderer││
│  │  Module  │    │  Module  │    │          │    │ (Kociemba)│    │(Three) ││
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘    └────────┘│
│       │              │                │               │              │      │
│       ▼              ▼                ▼               ▼              ▼      │
│   Video Frame    54 Colors      Valid State     Move Sequence   Animation  │
│   (RGB pixels)   (W,Y,R,O,G,B)  (constraints)   (≤22 moves)    (3D scene)  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Complexity Summary

| Stage | Time Complexity | Space Complexity | Notes |
|-------|-----------------|------------------|-------|
| Color Extraction | O(p) | O(1) | p = pixels sampled per face |
| State Validation | O(1) | O(1) | Fixed 54 facelets |
| Solver Init | O(1) | O(2 MB) | Precomputed tables |
| Solve | O(n · b^d) | O(d) | IDA*, d ≤ 22, effective b ≈ 13 |
| Render (per move) | O(9) | O(1) | 9 cubies per layer |

---

## Prerequisites

- **Linear Algebra**: Matrices, rotations in ℝ³, eigenvalues (for quaternions)
- **Probability**: Bayes' theorem, maximum likelihood estimation
- **Algorithms**: Graph search (BFS, A*, IDA*), dynamic programming
- **Group Theory**: Basic definitions (groups, subgroups, cosets) — introduced in Module 3.1

---

## How to Read

**Sequential path** (recommended for first read):
1 → 2.1 → 2.2 → 2.3 → 3.1 → 3.2 → 3.3 → 4.1 → 4.2 → 5

**By interest**:
- *Computer Vision focus*: 2.1 → 2.2 → 2.3
- *Algorithm focus*: 3.1 → 3.2 → 3.3
- *Graphics focus*: 4.1 → 4.2

---

## About

Built by Tsuki (AI) for educational purposes.  
Source code: [github.com/wangtian24/vrubi](https://github.com/wangtian24/vrubi)

---

*"The Rubik's Cube is a perfect intersection of mathematics, computer science, and human ingenuity."*
