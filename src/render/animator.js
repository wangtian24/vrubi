/**
 * Cube Animator
 * 
 * Handles smooth animation of cube moves.
 */

import * as THREE from 'three';

// Face definitions for rotation
const FACES = {
  U: { axis: new THREE.Vector3(0, 1, 0), layer: 1, axisName: 'y' },
  D: { axis: new THREE.Vector3(0, -1, 0), layer: -1, axisName: 'y' },
  R: { axis: new THREE.Vector3(1, 0, 0), layer: 1, axisName: 'x' },
  L: { axis: new THREE.Vector3(-1, 0, 0), layer: -1, axisName: 'x' },
  F: { axis: new THREE.Vector3(0, 0, 1), layer: 1, axisName: 'z' },
  B: { axis: new THREE.Vector3(0, 0, -1), layer: -1, axisName: 'z' },
};

export class CubeAnimator {
  constructor(cube) {
    this.cube = cube;
    this.isAnimating = false;
    this.animationQueue = [];
    this.currentAnimation = null;
    this.animationSpeed = 5; // Radians per second
  }
  
  /**
   * Animate a single move
   * @param {string} move - Move notation
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
      
      // Determine rotation angle
      let targetAngle = Math.PI / 2;
      if (isPrime) targetAngle = -targetAngle;
      if (isDouble) targetAngle *= 2;
      
      // Get cubies in this layer
      const cubies = this.cube.getCubiesInLayer(face);
      
      // Create pivot group for rotation
      const pivot = new THREE.Group();
      this.cube.group.add(pivot);
      
      // Move cubies to pivot
      cubies.forEach(cubie => {
        pivot.attach(cubie);
      });
      
      this.currentAnimation = {
        pivot,
        cubies,
        axis: faceInfo.axis.clone(),
        targetAngle,
        currentAngle: 0,
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
    const delta = (1 / 60) * this.animationSpeed; // Approximate 60fps
    const step = Math.sign(anim.targetAngle) * Math.min(delta, Math.abs(anim.targetAngle - anim.currentAngle));
    
    if (Math.abs(anim.currentAngle) >= Math.abs(anim.targetAngle) - 0.001) {
      // Animation complete - snap to final position
      const remaining = anim.targetAngle - anim.currentAngle;
      anim.pivot.rotateOnAxis(anim.axis, remaining);
      
      // Move cubies back to main group
      anim.cubies.forEach(cubie => {
        this.cube.group.attach(cubie);
        // Snap position to grid
        cubie.position.x = Math.round(cubie.position.x);
        cubie.position.y = Math.round(cubie.position.y);
        cubie.position.z = Math.round(cubie.position.z);
      });
      
      // Remove pivot
      this.cube.group.remove(anim.pivot);
      
      this.isAnimating = false;
      this.currentAnimation = null;
      anim.resolve();
    } else {
      // Continue animation
      anim.pivot.rotateOnAxis(anim.axis, step);
      anim.currentAngle += step;
    }
  }
  
  /**
   * Set animation speed
   * @param {number} speed - Radians per second
   */
  setSpeed(speed) {
    this.animationSpeed = speed;
  }
}
