# Module 4.2: Transformations & Animation

*Rotating layers smoothly in 3D space*

---

## 4.2.1 Rotation Matrices

A rotation in 3D is represented by a 3×3 orthogonal matrix with determinant +1.

### Rotation Around X-Axis

```
       ┌ 1    0       0    ┐
Rx(θ) = │ 0  cos(θ) -sin(θ) │
       └ 0  sin(θ)  cos(θ) ┘
```

### Rotation Around Y-Axis

```
       ┌  cos(θ)  0  sin(θ) ┐
Ry(θ) = │    0     1    0    │
       └ -sin(θ)  0  cos(θ) ┘
```

### Rotation Around Z-Axis

```
       ┌ cos(θ) -sin(θ)  0 ┐
Rz(θ) = │ sin(θ)  cos(θ)  0 │
       └   0       0      1 ┘
```

### Face Rotations

| Move | Axis | Angle (clockwise from outside) |
|------|------|-------------------------------|
| U | Y | -90° = -π/2 |
| U' | Y | +90° = +π/2 |
| U2 | Y | 180° = π |
| D | Y | +90° = +π/2 |
| R | X | -90° = -π/2 |
| L | X | +90° = +π/2 |
| F | Z | -90° = -π/2 |
| B | Z | +90° = +π/2 |

---

## 4.2.2 Pivot-Based Animation

Instead of rotating each cubie individually, we use a **pivot group**:

```
Before Animation:
                            
  Scene                     
    │                       
    └── CubeGroup           
          ├── Cubie (0,1,1)  ─┐
          ├── Cubie (1,1,1)   │ These 9 will rotate
          ├── Cubie (-1,1,1)  │ (U layer, y=+1)
          ├── Cubie (0,1,0)   │
          ├── Cubie (1,1,0)   │
          ├── Cubie (-1,1,0)  │
          ├── Cubie (0,1,-1)  │
          ├── Cubie (1,1,-1)  │
          ├── Cubie (-1,1,-1)─┘
          ├── ... (other 18 cubies)


During Animation:

  Scene
    │
    └── CubeGroup
          │
          ├── Pivot (rotating)  ←── This rotates around Y
          │     ├── Cubie (0,1,1)
          │     ├── Cubie (1,1,1)
          │     ├── ... (9 cubies)
          │
          ├── ... (other 18 cubies, stationary)


After Animation:

  Scene
    │
    └── CubeGroup
          ├── Cubie (0,1,-1)  ← Was (0,1,1), now rotated
          ├── Cubie (-1,1,1)  ← Was (1,1,1)
          ├── ...
```

### Why Pivot?

1. **Single rotation** applies to all 9 cubies
2. **No per-cubie math** during animation
3. **Automatic world transform** via Three.js scene graph

---

## 4.2.3 Animation Implementation

```javascript
class CubeAnimator {
  constructor(cube) {
    this.cube = cube;
    this.isAnimating = false;
    this.currentAnimation = null;
    this.animationDuration = 200;  // ms per move
  }
  
  animateMove(move) {
    return new Promise(resolve => {
      // Parse move
      const face = move[0];
      const isPrime = move.includes("'");
      const isDouble = move.includes("2");
      
      const faceInfo = FACES[face];
      
      // Compute rotation angle
      let targetAngle = (Math.PI / 2) * faceInfo.direction;
      if (isPrime) targetAngle = -targetAngle;
      if (isDouble) targetAngle *= 2;
      
      // Get cubies in this layer
      const cubies = this.cube.getCubiesInLayer(face);
      
      // Create pivot at origin
      const pivot = new THREE.Group();
      this.cube.group.add(pivot);
      
      // Attach cubies to pivot (THREE.js handles transform)
      cubies.forEach(cubie => pivot.attach(cubie));
      
      // Store animation state
      this.currentAnimation = {
        pivot,
        cubies,
        axis: faceInfo.axis,
        targetAngle,
        currentAngle: 0,
        startTime: performance.now(),
        duration: this.animationDuration * (isDouble ? 1.5 : 1),
        resolve
      };
      
      this.isAnimating = true;
    });
  }
}
```

---

## 4.2.4 Frame Update

Called every frame (~60 times per second):

```javascript
update() {
  if (!this.isAnimating || !this.currentAnimation) return;
  
  const anim = this.currentAnimation;
  const elapsed = performance.now() - anim.startTime;
  const progress = Math.min(elapsed / anim.duration, 1);
  
  // Apply easing
  const eased = this.easeOutCubic(progress);
  const newAngle = anim.targetAngle * eased;
  const deltaAngle = newAngle - anim.currentAngle;
  
  // Rotate pivot around appropriate axis
  if (anim.axis === 'x') anim.pivot.rotation.x += deltaAngle;
  if (anim.axis === 'y') anim.pivot.rotation.y += deltaAngle;
  if (anim.axis === 'z') anim.pivot.rotation.z += deltaAngle;
  
  anim.currentAngle = newAngle;
  
  // Check completion
  if (progress >= 1) {
    this.finalizeAnimation();
  }
}

easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}
```

---

## 4.2.5 Easing Functions

**Easing** makes animation feel natural:

```
Linear (no easing):
  t=0.0  │█░░░░░░░░░│
  t=0.25 │██░░░░░░░░│
  t=0.5  │█████░░░░░│
  t=0.75 │███████░░░│
  t=1.0  │██████████│

Ease-out Cubic:
  t=0.0  │█░░░░░░░░░│
  t=0.25 │████░░░░░░│  Fast start
  t=0.5  │███████░░░│  Slowing down
  t=0.75 │█████████░│  Almost there
  t=1.0  │██████████│  Gentle stop
```

### Mathematical Definition

```
Ease-out cubic: f(t) = 1 - (1-t)³

  f(0) = 0
  f(1) = 1
  f'(0) = 3     (fast initial velocity)
  f'(1) = 0     (stops smoothly)
```

### Comparison

| Easing | Formula | Feel |
|--------|---------|------|
| Linear | t | Mechanical, robotic |
| Ease-out quadratic | 1-(1-t)² | Smooth deceleration |
| **Ease-out cubic** | **1-(1-t)³** | **Snappy start, gentle stop** |
| Ease-in-out | 3t²-2t³ | Symmetric acceleration |

---

## 4.2.6 Finalizing Animation

When animation completes, we must:

1. **Detach cubies** from pivot back to main group
2. **Snap positions** to integer grid
3. **Snap rotations** to 90° increments
4. **Remove pivot**

```javascript
finalizeAnimation() {
  const anim = this.currentAnimation;
  
  // Move cubies back to cube group
  anim.cubies.forEach(cubie => {
    // THREE.js attach preserves world transform
    this.cube.group.attach(cubie);
    
    // Snap position to grid
    cubie.position.x = Math.round(cubie.position.x);
    cubie.position.y = Math.round(cubie.position.y);
    cubie.position.z = Math.round(cubie.position.z);
    
    // Snap rotation to 90° increments
    const snap = angle => Math.round(angle / (Math.PI/2)) * (Math.PI/2);
    cubie.rotation.x = snap(cubie.rotation.x);
    cubie.rotation.y = snap(cubie.rotation.y);
    cubie.rotation.z = snap(cubie.rotation.z);
  });
  
  // Remove pivot
  this.cube.group.remove(anim.pivot);
  
  // Reset state
  this.isAnimating = false;
  this.currentAnimation = null;
  anim.resolve();
}
```

---

## 4.2.7 Why Snap?

Floating-point arithmetic introduces small errors:

```
After 4 rotations of 90°:
  Expected: position = (1, 1, 1)
  Actual:   position = (0.9999999, 1.0000001, 0.9999998)
  
After 100 moves:
  Errors accumulate → cube visibly "drifts"
```

**Snapping** resets positions to exact integers, preventing drift.

---

## 4.2.8 Numerical Stability

### The Problem

```
Rotation matrix composition accumulates error:

R₁ × R₂ × R₃ × ... × R₁₀₀ 

Each multiplication introduces ~10⁻¹⁵ error (IEEE 754 double)
After 100 ops: error ≈ 10⁻¹³

This seems small, but:
  - Rotation matrices must be orthogonal (RᵀR = I)
  - Small errors make matrix non-orthogonal
  - Repeated application causes scaling/skewing
```

### Our Solution

1. **Per-move snapping** resets to exact values
2. **Integer positions** (no accumulated transforms)
3. **Euler angles** snapped to 90° multiples

---

## 4.2.9 Sequencing Multiple Moves

```javascript
async playMoves(moves) {
  for (const move of moves) {
    await this.animator.animateMove(move);
    // Each move completes before next starts
  }
}
```

### Timeline

```
Time →
─────────────────────────────────────────────────────────
│       R        │       U        │       R'       │
│  0-200ms       │  200-400ms     │  400-600ms     │
│  rotate        │  rotate        │  rotate        │
│  snap          │  snap          │  snap          │
─────────────────────────────────────────────────────────
```

---

## 4.2.10 Direction Convention

The **direction** determines clockwise vs counterclockwise:

```
FACES = {
  U: { axis: 'y', direction: -1 },  // Looking from +Y (above)
  D: { axis: 'y', direction: +1 },  // Looking from -Y (below)
  R: { axis: 'x', direction: -1 },  // Looking from +X (right)
  L: { axis: 'x', direction: +1 },  // Looking from -X (left)
  F: { axis: 'z', direction: -1 },  // Looking from +Z (front)
  B: { axis: 'z', direction: +1 },  // Looking from -Z (back)
}
```

### Explanation

Standard cube notation: "clockwise when looking at that face".

For U face (looking down the -Y axis):
- Clockwise = rotate by -π/2 around Y axis
- Hence direction = -1

---

## 4.2.11 Transform Hierarchy

Three.js uses a scene graph where transforms compose:

```
World transform of a cubie:

T_world = T_scene × T_cubeGroup × T_pivot × T_local

During animation:
  T_pivot changes (rotation animates)
  T_local stays constant

After finalization:
  T_pivot removed (pivot deleted)
  T_local updated to absorb pivot's transform
```

### attach() vs add()

```javascript
// add(): Sets new parent, keeps LOCAL transform
parent.add(child);
// Child's world position CHANGES

// attach(): Sets new parent, preserves WORLD transform
parent.attach(child);
// Child's world position STAYS THE SAME
// Local transform adjusted automatically
```

We use `attach()` to move cubies between pivot and cube group without visual jump.

---

## 4.2.12 Complete Animation Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Animation Flow                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. animateMove("R") called                                         │
│     │                                                               │
│     ▼                                                               │
│  2. Parse move: face=R, clockwise, angle=-π/2                       │
│     │                                                               │
│     ▼                                                               │
│  3. Get 9 cubies where x=+1                                         │
│     │                                                               │
│     ▼                                                               │
│  4. Create pivot group at origin                                    │
│     │                                                               │
│     ▼                                                               │
│  5. Attach 9 cubies to pivot (world pos preserved)                  │
│     │                                                               │
│     ▼                                                               │
│  6. Start animation loop                                            │
│     │                                                               │
│     ├──── Frame 1: pivot.rotation.x = -0.15                        │
│     ├──── Frame 2: pivot.rotation.x = -0.45                        │
│     ├──── Frame 3: pivot.rotation.x = -0.82                        │
│     ├──── ...                                                       │
│     ├──── Frame 12: pivot.rotation.x = -1.57 (≈ -π/2)              │
│     │                                                               │
│     ▼                                                               │
│  7. Finalize:                                                       │
│     ├── Detach cubies back to cube group                           │
│     ├── Snap positions to integer grid                             │
│     ├── Snap rotations to 90° multiples                            │
│     └── Remove pivot                                                │
│     │                                                               │
│     ▼                                                               │
│  8. Resolve promise                                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4.2.13 Performance Considerations

### What's Fast

- Pivot rotation: O(1) - single transform update
- Scene graph traversal: O(n) but n=27 is tiny
- GPU rendering: Parallel, handles millions of triangles

### What's Slow (Avoided)

- Modifying geometry: Would require GPU re-upload
- Creating new meshes: Memory allocation
- Complex shaders: We use simple Phong materials

### Actual Performance

```
Per frame breakdown (16.67ms budget @ 60fps):
  Animation update:    0.05ms
  Scene traversal:     0.10ms
  Draw calls:          0.50ms
  GPU rasterization:   1.00ms
  ──────────────────────────
  Total:               1.65ms
  
  Headroom:           ~15ms (plenty!)
```

---

## 4.2.14 Key Takeaways

1. **Rotation matrices** describe 3D rotations mathematically.

2. **Pivot groups** simplify multi-object rotation.

3. **Easing functions** make animation feel natural.

4. **Snapping** prevents floating-point drift.

5. **attach()** preserves world position when reparenting.

6. **Animation is fast** — most time is GPU-limited.

---

## Next Module

[→ Module 5: Integration](./05-integration.md)

See how all the pieces connect to form the complete application.
