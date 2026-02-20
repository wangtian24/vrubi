# Module 4.1: Cube Geometry

*Representing a Rubik's cube in 3D space*

---

## 4.1.1 Cubie Model

A Rubik's cube consists of 27 smaller cubes called **cubies**:

```
                    3×3×3 = 27 cubies
                    
        Top Layer (y = +1):           Middle Layer (y = 0):
        ┌─────┬─────┬─────┐           ┌─────┬─────┬─────┐
        │ ULB │ UB  │ URB │           │  L  │  ─  │  R  │
        ├─────┼─────┼─────┤           ├─────┼─────┼─────┤
        │ UL  │  U  │ UR  │           │ FL  │ CTR │ FR  │
        ├─────┼─────┼─────┤           ├─────┼─────┼─────┤
        │ ULF │ UF  │ URF │           │  F  │  ─  │  B  │
        └─────┴─────┴─────┘           └─────┴─────┴─────┘
        
        Bottom Layer (y = -1):
        ┌─────┬─────┬─────┐
        │ DLB │ DB  │ DRB │
        ├─────┼─────┼─────┤
        │ DL  │  D  │ DR  │
        ├─────┼─────┼─────┤
        │ DLF │ DF  │ DRF │
        └─────┴─────┴─────┘
```

### Cubie Types

| Type | Count | Visible Faces | Example |
|------|-------|---------------|---------|
| Corner | 8 | 3 | ULB, URF |
| Edge | 12 | 2 | UB, FR |
| Center | 6 | 1 | U, R, F |
| Core | 1 | 0 | (hidden) |

---

## 4.1.2 Coordinate System

We use a right-handed coordinate system centered at the cube:

```
              +Y (Up)
               │
               │
               │
               │
               └───────────── +X (Right)
              ╱
             ╱
            ╱
           +Z (Front, toward viewer)


Face Orientations:
  +X face = Right (Red)
  -X face = Left (Orange)
  +Y face = Up (White)
  -Y face = Down (Yellow)
  +Z face = Front (Green)
  -Z face = Back (Blue)
```

### Position Encoding

Each cubie has position (x, y, z) where x, y, z ∈ {-1, 0, +1}:

```javascript
// Create cubies at all 27 positions
for (let x = -1; x <= 1; x++) {
  for (let y = -1; y <= 1; y++) {
    for (let z = -1; z <= 1; z++) {
      createCubie(x, y, z);
    }
  }
}
```

### Position to Cubie Type

```javascript
function getCubieType(x, y, z) {
  const nonZero = (x !== 0) + (y !== 0) + (z !== 0);
  switch (nonZero) {
    case 3: return 'corner';  // (±1, ±1, ±1)
    case 2: return 'edge';    // One coordinate is 0
    case 1: return 'center';  // Two coordinates are 0
    case 0: return 'core';    // (0, 0, 0)
  }
}
```

---

## 4.1.3 Face Materials

Each cubie face gets a color based on its outward direction:

```
Face Direction    Color (Solved)    Hex Code
──────────────    ──────────────    ────────
+X (Right)        Red               #FF0000
-X (Left)         Orange            #FF8C00
+Y (Up)           White             #FFFFFF
-Y (Down)         Yellow            #FFFF00
+Z (Front)        Green             #00FF00
-Z (Back)         Blue              #0000FF
Internal          Black             #111111
```

### Material Assignment

```javascript
function createCubie(x, y, z) {
  const geometry = new THREE.BoxGeometry(0.95, 0.95, 0.95);
  
  // 6 materials for 6 faces of the box
  // BoxGeometry face order: +X, -X, +Y, -Y, +Z, -Z
  const materials = [
    new THREE.MeshPhongMaterial({ 
      color: x === +1 ? 0xff0000 : 0x111111  // +X: Red if on right face
    }),
    new THREE.MeshPhongMaterial({ 
      color: x === -1 ? 0xff8c00 : 0x111111  // -X: Orange if on left face
    }),
    new THREE.MeshPhongMaterial({ 
      color: y === +1 ? 0xffffff : 0x111111  // +Y: White if on top
    }),
    new THREE.MeshPhongMaterial({ 
      color: y === -1 ? 0xffff00 : 0x111111  // -Y: Yellow if on bottom
    }),
    new THREE.MeshPhongMaterial({ 
      color: z === +1 ? 0x00ff00 : 0x111111  // +Z: Green if on front
    }),
    new THREE.MeshPhongMaterial({ 
      color: z === -1 ? 0x0000ff : 0x111111  // -Z: Blue if on back
    }),
  ];
  
  const cubie = new THREE.Mesh(geometry, materials);
  cubie.position.set(x, y, z);
  
  return cubie;
}
```

---

## 4.1.4 Gap Between Cubies

To see individual cubies, we make them slightly smaller than 1 unit:

```
                 1.0 unit
    ├─────────────────────────┤
    
    ┌────────────┐   ┌────────────┐
    │            │   │            │
    │   0.95     │0.05│   0.95     │
    │            │   │            │
    └────────────┘   └────────────┘
    
    Cubie size: 0.95 × 0.95 × 0.95
    Gap: 0.05 between adjacent cubies
```

This creates visible seams that make the cube look realistic.

---

## 4.1.5 Layer Selection

To rotate a face, we need to identify which cubies belong to that layer:

```
Face    Axis    Layer Value    Selection Criterion
────    ────    ───────────    ───────────────────
U       Y       +1             y ≈ +1
D       Y       -1             y ≈ -1
R       X       +1             x ≈ +1
L       X       -1             x ≈ -1
F       Z       +1             z ≈ +1
B       Z       -1             z ≈ -1
```

### Implementation

```javascript
const FACES = {
  U: { axis: 'y', layer: +1 },
  D: { axis: 'y', layer: -1 },
  R: { axis: 'x', layer: +1 },
  L: { axis: 'x', layer: -1 },
  F: { axis: 'z', layer: +1 },
  B: { axis: 'z', layer: -1 },
};

getCubiesInLayer(face) {
  const { axis, layer } = FACES[face];
  return this.cubies.filter(cubie => {
    // Use Math.round to handle floating-point imprecision
    return Math.round(cubie.position[axis]) === layer;
  });
}
```

### Layer Visualization

```
           R layer (x = +1)               U layer (y = +1)
           
              +Y                              +Z
               │                               │
    +Z ────────┼───                 -X ────────┼──── +X
               │                               │
               │                              -Z
           
    ┌─────┬─────┬─────┐           ┌─────┬─────┬─────┐
    │ URB │ UR  │ URF │           │ ULB │ UB  │ URB │
    ├─────┼─────┼─────┤           ├─────┼─────┼─────┤
    │ BR  │  R  │ FR  │           │ UL  │  U  │ UR  │
    ├─────┼─────┼─────┤           ├─────┼─────┼─────┤
    │ DRB │ DR  │ DRF │           │ ULF │ UF  │ URF │
    └─────┴─────┴─────┘           └─────┴─────┴─────┘
    
    9 cubies per layer
```

---

## 4.1.6 Scene Setup

The complete Three.js scene setup:

```javascript
class CubeRenderer {
  constructor(container) {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f0f1a);  // Dark blue
    
    // Camera
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(5, 4, 5);  // Isometric-ish view
    this.camera.lookAt(0, 0, 0);
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);
    
    // Lighting
    this.addLighting();
    
    // Cube
    this.cube = new RubiksCube();
    this.scene.add(this.cube.group);
  }
  
  addLighting() {
    // Ambient light (soft overall illumination)
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);
    
    // Directional light (sun-like, casts shadows)
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(5, 10, 7);
    this.scene.add(directional);
  }
}
```

---

## 4.1.7 Camera Controls

Mouse-based orbit controls:

```javascript
addMouseControls() {
  let isDragging = false;
  let previousMouse = { x: 0, y: 0 };
  let rotation = { x: Math.PI / 6, y: Math.PI / 4 };  // Initial angles
  
  this.container.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMouse = { x: e.clientX, y: e.clientY };
  });
  
  window.addEventListener('mouseup', () => {
    isDragging = false;
  });
  
  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - previousMouse.x;
    const deltaY = e.clientY - previousMouse.y;
    
    // Update rotation angles
    rotation.y += deltaX * 0.01;
    rotation.x += deltaY * 0.01;
    
    // Clamp vertical rotation
    rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, rotation.x));
    
    // Convert spherical to Cartesian coordinates
    const radius = 7;
    this.camera.position.x = radius * Math.cos(rotation.x) * Math.sin(rotation.y);
    this.camera.position.y = radius * Math.sin(rotation.x);
    this.camera.position.z = radius * Math.cos(rotation.x) * Math.cos(rotation.y);
    this.camera.lookAt(0, 0, 0);
    
    previousMouse = { x: e.clientX, y: e.clientY };
  });
}
```

### Spherical Coordinates

```
Camera position in spherical coordinates (r, θ, φ):
  r = distance from origin (7 units)
  θ = rotation.x (elevation angle)
  φ = rotation.y (azimuth angle)

Conversion to Cartesian:
  x = r × cos(θ) × sin(φ)
  y = r × sin(θ)
  z = r × cos(θ) × cos(φ)
```

---

## 4.1.8 Rendering Loop

```javascript
animate() {
  requestAnimationFrame(() => this.animate());
  
  // Update any ongoing animations
  this.animator.update();
  
  // Render the scene
  this.renderer.render(this.scene, this.camera);
}
```

### Frame Budget

At 60 FPS, each frame has ~16.67ms:

```
┌────────────────────────────────────────────────────┐
│                   Frame Budget                      │
├────────────────────────────────────────────────────┤
│                                                    │
│  0ms ────┬──── Animation update (~0.1ms)          │
│          │                                         │
│          ├──── Scene graph traversal (~0.5ms)     │
│          │                                         │
│          ├──── GPU draw calls (~1-2ms)            │
│          │                                         │
│          └──── Buffer swap                         │
│                                                    │
│ 16.67ms ─────                                      │
│                                                    │
│  Plenty of headroom for smooth animation!          │
└────────────────────────────────────────────────────┘
```

---

## 4.1.9 Resizing

Handle window resize:

```javascript
onResize() {
  const width = this.container.clientWidth;
  const height = this.container.clientHeight;
  
  // Update camera aspect ratio
  this.camera.aspect = width / height;
  this.camera.updateProjectionMatrix();
  
  // Update renderer size
  this.renderer.setSize(width, height);
}

// Add listener
window.addEventListener('resize', () => this.onResize());
```

---

## 4.1.10 Cube Reset

Reset to solved state:

```javascript
reset() {
  // Remove all cubies
  this.cubies.forEach(cubie => this.group.remove(cubie));
  this.cubies = [];
  
  // Recreate with original positions and orientations
  this.createCube();
  this.moveHistory = [];
}
```

---

## 4.1.11 Complete Cube Class

```javascript
export class RubiksCube {
  constructor() {
    this.group = new THREE.Group();
    this.cubies = [];
    this.createCube();
  }
  
  createCube() {
    const size = 0.95;
    
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const cubie = this.createCubie(x, y, z, size);
          cubie.userData = { x, y, z };  // Store original position
          this.cubies.push(cubie);
          this.group.add(cubie);
        }
      }
    }
  }
  
  createCubie(x, y, z, size) {
    const geometry = new THREE.BoxGeometry(size, size, size);
    const materials = this.getMaterials(x, y, z);
    const cubie = new THREE.Mesh(geometry, materials);
    cubie.position.set(x, y, z);
    return cubie;
  }
  
  getMaterials(x, y, z) {
    const COLORS = {
      R: 0xff0000, O: 0xff8c00, W: 0xffffff,
      Y: 0xffff00, G: 0x00ff00, B: 0x0000ff,
      X: 0x111111  // Internal (black)
    };
    
    return [
      new THREE.MeshPhongMaterial({ color: x === +1 ? COLORS.R : COLORS.X }),
      new THREE.MeshPhongMaterial({ color: x === -1 ? COLORS.O : COLORS.X }),
      new THREE.MeshPhongMaterial({ color: y === +1 ? COLORS.W : COLORS.X }),
      new THREE.MeshPhongMaterial({ color: y === -1 ? COLORS.Y : COLORS.X }),
      new THREE.MeshPhongMaterial({ color: z === +1 ? COLORS.G : COLORS.X }),
      new THREE.MeshPhongMaterial({ color: z === -1 ? COLORS.B : COLORS.X }),
    ];
  }
  
  getCubiesInLayer(face) {
    const { axis, layer } = FACES[face];
    return this.cubies.filter(c => Math.round(c.position[axis]) === layer);
  }
  
  reset() {
    this.cubies.forEach(c => this.group.remove(c));
    this.cubies = [];
    this.createCube();
  }
}
```

---

## 4.1.12 Key Takeaways

1. **27 cubies** at positions (x, y, z) ∈ {-1, 0, +1}³

2. **6 materials per cubie**, colored by outward direction

3. **0.95 size** creates visible gaps between cubies

4. **Layer selection** by filtering on position coordinate

5. **Spherical camera** orbits around cube center

6. **60 FPS rendering** with plenty of frame budget

---

## Next Module

[→ Module 4.2: Transformations](./04-2-transformations.md)

Learn how we animate face rotations using 3D transformations and pivot groups.
