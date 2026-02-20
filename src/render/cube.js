/**
 * Rubik's Cube 3D Model
 * 
 * Creates and manages the 3D cube geometry and state.
 */

import * as THREE from 'three';

// Standard cube colors
const COLORS = {
  W: 0xffffff, // White - Up
  Y: 0xffff00, // Yellow - Down
  R: 0xff0000, // Red - Right
  O: 0xff8c00, // Orange - Left
  B: 0x0000ff, // Blue - Back
  G: 0x00ff00, // Green - Front
  X: 0x111111, // Black - internal
};

// Face definitions: which axis and direction
const FACES = {
  U: { axis: 'y', layer: 1, direction: -1 },
  D: { axis: 'y', layer: -1, direction: 1 },
  R: { axis: 'x', layer: 1, direction: -1 },
  L: { axis: 'x', layer: -1, direction: 1 },
  F: { axis: 'z', layer: 1, direction: -1 },
  B: { axis: 'z', layer: -1, direction: 1 },
};

export class RubiksCube {
  constructor() {
    this.group = new THREE.Group();
    this.cubies = [];
    this.createCube();
  }
  
  createCube() {
    const size = 0.95;
    const gap = 0.05;
    
    // Create 27 cubies (3x3x3)
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const cubie = this.createCubie(x, y, z, size);
          cubie.userData = { x, y, z };
          this.cubies.push(cubie);
          this.group.add(cubie);
        }
      }
    }
  }
  
  createCubie(x, y, z, size) {
    const geometry = new THREE.BoxGeometry(size, size, size);
    
    // Determine colors for each face based on position
    const materials = [
      new THREE.MeshPhongMaterial({ color: x === 1 ? COLORS.R : COLORS.X, side: THREE.DoubleSide }),  // +X (Right)
      new THREE.MeshPhongMaterial({ color: x === -1 ? COLORS.O : COLORS.X, side: THREE.DoubleSide }), // -X (Left)
      new THREE.MeshPhongMaterial({ color: y === 1 ? COLORS.W : COLORS.X, side: THREE.DoubleSide }),  // +Y (Up)
      new THREE.MeshPhongMaterial({ color: y === -1 ? COLORS.Y : COLORS.X, side: THREE.DoubleSide }), // -Y (Down)
      new THREE.MeshPhongMaterial({ color: z === 1 ? COLORS.G : COLORS.X, side: THREE.DoubleSide }),  // +Z (Front)
      new THREE.MeshPhongMaterial({ color: z === -1 ? COLORS.B : COLORS.X, side: THREE.DoubleSide }), // -Z (Back)
    ];
    
    const cubie = new THREE.Mesh(geometry, materials);
    cubie.position.set(x, y, z);
    
    return cubie;
  }
  
  /**
   * Get cubies in a specific layer
   * @param {string} face - Face letter (U, D, R, L, F, B)
   * @returns {THREE.Mesh[]} Array of cubies in that layer
   */
  getCubiesInLayer(face) {
    const { axis, layer } = FACES[face];
    return this.cubies.filter(cubie => {
      const pos = cubie.position;
      return Math.round(pos[axis]) === layer;
    });
  }
  
  /**
   * Apply a move to update cubie positions (after animation)
   * @param {string} move - Move notation (e.g., "R", "U'", "F2")
   */
  applyMove(move) {
    const face = move[0];
    const isPrime = move.includes("'");
    const isDouble = move.includes("2");
    
    const { axis, direction } = FACES[face];
    const cubies = this.getCubiesInLayer(face);
    
    let angle = (Math.PI / 2) * direction;
    if (isPrime) angle = -angle;
    if (isDouble) angle *= 2;
    
    // Rotate each cubie's position and orientation
    const rotationMatrix = new THREE.Matrix4();
    if (axis === 'x') rotationMatrix.makeRotationX(angle);
    if (axis === 'y') rotationMatrix.makeRotationY(angle);
    if (axis === 'z') rotationMatrix.makeRotationZ(angle);
    
    cubies.forEach(cubie => {
      cubie.position.applyMatrix4(rotationMatrix);
      cubie.position.round(); // Snap to grid
      cubie.rotation.setFromRotationMatrix(
        rotationMatrix.multiply(new THREE.Matrix4().makeRotationFromEuler(cubie.rotation))
      );
    });
  }
  
  /**
   * Reset cube to solved state
   */
  reset() {
    // Remove all cubies
    this.cubies.forEach(cubie => this.group.remove(cubie));
    this.cubies = [];
    
    // Recreate
    this.createCube();
  }
  
  /**
   * Set cube state from 54-character string
   * This is a placeholder - will be implemented properly in Phase 2
   */
  setState(state) {
    // TODO: Parse state string and set cubie colors
    console.log('setState not yet implemented:', state);
  }
}
