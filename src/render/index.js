/**
 * Cube Renderer Module
 * 
 * Handles 3D rendering and animation of the Rubik's cube using Three.js.
 */

import * as THREE from 'three';
import { RubiksCube } from './cube.js';
import { CubeAnimator } from './animator.js';

export class CubeRenderer {
  constructor(container) {
    this.container = container;
    this.moveHistory = [];
    
    this.init();
    this.animate();
  }
  
  init() {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f0f1a);
    
    // Camera
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(5, 4, 5);
    this.camera.lookAt(0, 0, 0);
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    this.scene.add(directionalLight);
    
    // Create cube
    this.cube = new RubiksCube();
    this.scene.add(this.cube.group);
    
    // Animator
    this.animator = new CubeAnimator(this.cube);
    
    // Handle resize
    window.addEventListener('resize', () => this.onResize());
    
    // Add orbit controls via mouse
    this.addMouseControls();
  }
  
  addMouseControls() {
    let isDragging = false;
    let previousMouse = { x: 0, y: 0 };
    let rotation = { x: Math.PI / 6, y: Math.PI / 4 };
    
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
      
      rotation.y += deltaX * 0.01;
      rotation.x += deltaY * 0.01;
      rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotation.x));
      
      const radius = 7;
      this.camera.position.x = radius * Math.cos(rotation.x) * Math.sin(rotation.y);
      this.camera.position.y = radius * Math.sin(rotation.x);
      this.camera.position.z = radius * Math.cos(rotation.x) * Math.cos(rotation.y);
      this.camera.lookAt(0, 0, 0);
      
      previousMouse = { x: e.clientX, y: e.clientY };
    });
  }
  
  onResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    this.animator.update();
    this.renderer.render(this.scene, this.camera);
  }
  
  /**
   * Play a sequence of moves with animation
   * @param {string[]} moves - Array of move notations (e.g., ["R", "U", "R'"])
   * @returns {Promise} Resolves when all moves complete
   */
  async playMoves(moves) {
    for (const move of moves) {
      await this.animator.animateMove(move);
      this.cube.applyMove(move);
    }
    this.moveHistory.push(...moves);
  }
  
  /**
   * Get the reverse of all moves played (for simple solve)
   * @returns {string[]} Reversed moves
   */
  getReverseMoves() {
    return this.moveHistory.slice().reverse().map(move => {
      if (move.endsWith("'")) return move.slice(0, -1);
      if (move.endsWith("2")) return move;
      return move + "'";
    });
  }
  
  /**
   * Generate a random scramble
   * @param {number} length - Number of moves
   * @returns {string[]} Scramble moves
   */
  generateScramble(length = 20) {
    const faces = ['R', 'L', 'U', 'D', 'F', 'B'];
    const modifiers = ['', "'", '2'];
    const scramble = [];
    let lastFace = '';
    
    for (let i = 0; i < length; i++) {
      let face;
      do {
        face = faces[Math.floor(Math.random() * faces.length)];
      } while (face === lastFace);
      
      const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
      scramble.push(face + modifier);
      lastFace = face;
    }
    
    this.moveHistory = []; // Reset history before scramble
    return scramble;
  }
  
  /**
   * Reset cube to solved state
   */
  reset() {
    this.cube.reset();
    this.moveHistory = [];
  }
  
  /**
   * Set cube state from string
   * @param {string} state - 54-character state string
   */
  setState(state) {
    this.cube.setState(state);
    this.moveHistory = [];
  }
}
