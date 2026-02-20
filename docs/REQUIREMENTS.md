
## Educational Content (Phase 5)

**Goal:** Under 100 slides teaching how VRubi works end-to-end.  
**Audience:** Experienced engineer with strong math background.

### Outline

**Part 1: Vision & Detection (~25 slides)**
- Color spaces (RGB vs HSV vs LAB)
- K-means clustering for unsupervised color detection
- Cube localization (edge detection, contour finding)
- Handling real-world noise (lighting, shadows, angles)
- Alternative: CNN-based tile detection

**Part 2: Cube Theory & Solving (~40 slides)**
- Group theory primer (permutation groups, generators)
- Cube state representation (54 facelets, 20 cubies)
- The cube group: |G| = 43,252,003,274,489,856,000
- God's Number = 20 (proof sketch)
- Kociemba's Two-Phase Algorithm:
  - Phase 1: Reduce to ⟨U,D,R²,L²,F²,B²⟩ subgroup
  - Phase 2: Solve within restricted moves
  - Pruning tables & IDA* search
- Move notation and sequences

**Part 3: 3D Rendering (~20 slides)**
- Scene graph and coordinate systems
- Transformation matrices (translate, rotate, scale)
- Quaternions vs Euler angles (gimbal lock)
- The pivot trick for face rotation
- Animation: easing functions, interpolation
- WebGL pipeline (brief)

**Part 4: Putting It Together (~10 slides)**
- System architecture diagram
- Data flow: video → frames → colors → state → solution → animation
- Performance considerations
- Extensions and variations

### Format
- Reveal.js or similar (runs in browser)
- Code snippets with syntax highlighting
- Interactive demos where possible (e.g., rotate cube, step through algorithm)
- Math rendered with KaTeX/MathJax

