/**
 * Cube Animator
 * 
 * Handles smooth animation of cube moves.
 */

import * as THREE from 'three';

// Face definitions for rotation - using world axes
const FACES = {
  U: { axis: 'y', layer: 1, direction: -1 },   // Up: rotate around Y, layer y=1
  D: { axis: 'y', layer: -1, direction: 1 },   // Down: rotate around Y, layer y=-1
  R: { axis: 'x', layer: 1, direction: -1 },   // Right: rotate around X, layer x=1
  L: { axis: 'x', layer: -1, direction: 1 },   // Left: rotate around X, layer x=-1
  F: { axis: 'z', layer: 1, direction: -1 },   // Front: rotate around Z, layer z=1
  B: { axis: 'z', layer: -1, direction: 1 },   // Back: rotate around Z, layer z=-1
};

export class CubeAnimator {
  constructor(cube) {
    this.cube = cube;
    this.isAnimating = false;
    this.currentAnimation = null;
    this.animationDuration = 200; // milliseconds per move
  }
  
  /**
   * Animate a single move
   * @param {string} move - Move notation (e.g., "R", "U'", "F2")
   * @returns {Promise} Resolves when animation completes
   */
  animateMove(move) {
    return new Promise(resolve => {
      const face = move[0];
      const isPrime = move.includes("'");
      const isDouble = move.includes("2");
      
      const faceInfo = FACES[face];
      if (!faceInfo) {
        console.warn('Unknown face:', face);
        resolve();
        return;
      }
      
      // Determine total rotation angle
      let targetAngle = (Math.PI / 2) * faceInfo.direction;
      if (isPrime) targetAngle = -targetAngle;
      if (isDouble) targetAngle *= 2;
      
      // Get cubies in this layer
      const cubies = this.cube.getCubiesInLayer(face);
      
      // Create pivot group for rotation at origin
      const pivot = new THREE.Group();
      pivot.position.set(0, 0, 0);
      this.cube.group.add(pivot);
      
      // Attach cubies to pivot (preserves world position)
      cubies.forEach(cubie => {
        pivot.attach(cubie);
      });
      
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
  
  /**
   * Update animation (called each frame)
   */
  update() {
    if (!this.isAnimating || !this.currentAnimation) return;
    
    const anim = this.currentAnimation;
    const elapsed = performance.now() - anim.startTime;
    const progress = Math.min(elapsed / anim.duration, 1);
    
    // Ease-out animation
    const eased = 1 - Math.pow(1 - progress, 3);
    const newAngle = anim.targetAngle * eased;
    const deltaAngle = newAngle - anim.currentAngle;
    
    // Apply rotation around the appropriate axis
    if (anim.axis === 'x') {
      anim.pivot.rotation.x += deltaAngle;
    } else if (anim.axis === 'y') {
      anim.pivot.rotation.y += deltaAngle;
    } else if (anim.axis === 'z') {
      anim.pivot.rotation.z += deltaAngle;
    }
    
    anim.currentAngle = newAngle;
    
    if (progress >= 1) {
      // Animation complete - finalize
      this.finalizeAnimation();
    }
  }
  
  /**
   * Finalize animation - snap positions and cleanup
   */
  finalizeAnimation() {
    const anim = this.currentAnimation;
    if (!anim) return;
    
    // Move cubies back to main group
    anim.cubies.forEach(cubie => {
      // Detach from pivot, attach to cube group
      this.cube.group.attach(cubie);
      
      // Snap position to integer grid
      cubie.position.x = Math.round(cubie.position.x);
      cubie.position.y = Math.round(cubie.position.y);
      cubie.position.z = Math.round(cubie.position.z);
      
      // Snap rotation to nearest 90° increments to prevent floating-point drift
      const snapAngle = (angle) => Math.round(angle / (Math.PI / 2)) * (Math.PI / 2);
      cubie.rotation.x = snapAngle(cubie.rotation.x);
      cubie.rotation.y = snapAngle(cubie.rotation.y);
      cubie.rotation.z = snapAngle(cubie.rotation.z);
    });
    
    // Remove pivot
    this.cube.group.remove(anim.pivot);
    
    this.isAnimating = false;
    this.currentAnimation = null;
    anim.resolve();
  }
  
  /**
   * Set animation duration
   * @param {number} ms - Duration in milliseconds
   */
  setDuration(ms) {
    this.animationDuration = ms;
  }
}
