/**
 * State Builder
 * 
 * Accumulates faces over frames, tracks which face is which.
 * TODO: Implement in Phase 3
 */

export class StateBuilder {
  constructor() {
    this.faces = { U: null, D: null, L: null, R: null, F: null, B: null };
  }
  
  addFace(face, colors) {
    // TODO: Add detected face to state
  }
  
  getState() {
    // TODO: Return current accumulated state
    return this.faces;
  }
  
  isComplete() {
    return Object.values(this.faces).every(f => f !== null);
  }
}
