# Module 2.2: Spatial Sampling & Noise Reduction

*From noisy pixel observations to robust color classification*

---

## 2.2.1 Why Single-Pixel Sampling Fails

Consider sampling a single pixel from a cube sticker:

```
┌─────────────────────────────────┐
│  Cube sticker (Red)             │
│                                 │
│      ┌───┐                      │
│      │ X │ ← Single pixel       │
│      └───┘                      │
│                                 │
│  Problems:                      │
│  • Sensor noise (random ±5-15) │
│  • Specular highlight (white)   │
│  • Shadow edge (dark)           │
│  • Dust/scratch (wrong color)   │
└─────────────────────────────────┘
```

A single pixel is a **noisy observation** of the true sticker color.

---

## 2.2.2 Statistical Model

We model pixel observations as:

```
Observed_color = True_color + Noise

where Noise ~ N(0, σ²)  for each RGB channel
```

**Typical noise levels** (8-bit camera):
- Low light: σ ≈ 15-25
- Normal light: σ ≈ 5-10
- Bright light: σ ≈ 3-5

### Maximum Likelihood Estimation

Given n pixel samples from the same sticker:

```
p₁, p₂, ..., pₙ  where pᵢ = (Rᵢ, Gᵢ, Bᵢ)
```

The MLE for the true color is the sample mean:

```
μ̂ = (1/n) Σᵢ pᵢ = (R̄, Ḡ, B̄)
```

**Variance reduction**: Var(μ̂) = σ²/n

By averaging n samples, we reduce noise variance by factor of n.

---

## 2.2.3 Region Sampling

Instead of one pixel, we sample a square region centered on each sticker cell:

```
┌─────────────────────────────────────────────────────┐
│               Detected Face Region                   │
│  ┌───────────┬───────────┬───────────┐              │
│  │           │           │           │              │
│  │   ┌───┐   │   ┌───┐   │   ┌───┐   │              │
│  │   │░░░│   │   │░░░│   │   │░░░│   │              │
│  │   └───┘   │   └───┘   │   └───┘   │              │
│  │           │           │           │              │
│  ├───────────┼───────────┼───────────┤              │
│  │           │           │           │              │
│  │   ┌───┐   │   ┌───┐   │   ┌───┐   │              │
│  │   │░░░│   │   │░░░│   │   │░░░│   │              │
│  │   └───┘   │   └───┘   │   └───┘   │              │
│  │           │           │           │              │
│  ├───────────┼───────────┼───────────┤   Legend:    │
│  │           │           │           │   ░░░ = Sample│
│  │   ┌───┐   │   ┌───┐   │   ┌───┐   │         region│
│  │   │░░░│   │   │░░░│   │   │░░░│   │              │
│  │   └───┘   │   └───┘   │   └───┘   │              │
│  │           │           │           │              │
│  └───────────┴───────────┴───────────┘              │
└─────────────────────────────────────────────────────┘
```

### Sample Region Algorithm

```
Algorithm: SampleRegion(imageData, centerX, centerY, radius)
─────────────────────────────────────────────────────────
Input:  Image data, center coordinates, sampling radius
Output: Average RGB color

1. Initialize accumulators:
   R_sum = G_sum = B_sum = count = 0

2. Define bounding box:
   x₀ = max(0, centerX - radius)
   x₁ = min(width - 1, centerX + radius)
   y₀ = max(0, centerY - radius)
   y₁ = min(height - 1, centerY + radius)

3. Accumulate pixel values:
   for y in [y₀, y₁]:
     for x in [x₀, x₁]:
       idx = (y * width + x) * 4
       R_sum += data[idx]
       G_sum += data[idx + 1]
       B_sum += data[idx + 2]
       count += 1

4. Return average:
   return (R_sum/count, G_sum/count, B_sum/count)
```

### Radius Selection

| Radius | Pixels Sampled | Noise Reduction | Risk |
|--------|----------------|-----------------|------|
| 3 | ~49 | 7× | Safe |
| 5 | ~121 | 11× | Safe |
| **8** | **~289** | **17×** | **Good balance** |
| 15 | ~961 | 31× | May cross sticker boundary |

**Trade-off**: Larger radius = more noise reduction, but risk sampling adjacent stickers or black cube body.

---

## 2.2.4 Extracting Face Colors

Given a detected face region, we extract 9 color samples:

```
┌─────────────────────────────────┐
│         Face Bounding Box        │
│                                 │
│    0───────1───────2            │    Sticker indices:
│    │       │       │            │    
│    │   0   │   1   │   2        │    ┌───┬───┬───┐
│    │       │       │            │    │ 0 │ 1 │ 2 │
│    3───────4───────5            │    ├───┼───┼───┤
│    │       │       │            │    │ 3 │ 4 │ 5 │
│    │   3   │   4   │   5        │    ├───┼───┼───┤
│    │       │       │            │    │ 6 │ 7 │ 8 │
│    6───────7───────8            │    └───┴───┴───┘
│    │       │       │            │
│    │   6   │   7   │   8        │    Index 4 = center
│    │       │       │            │
└─────────────────────────────────┘
```

### Sample Position Calculation

For a face region with top-left (x, y) and dimensions (w, h):

```
For sticker at row r, column c (r,c ∈ {0,1,2}):

  sampleX = x + (c + 0.5) × (w/3)
  sampleY = y + (r + 0.5) × (h/3)
  
  index = r × 3 + c
```

**The +0.5 offset** centers the sample within each cell, avoiding edges.

---

## 2.2.5 Multi-Frame Consensus

Real-world cameras produce frame-to-frame variation due to:
- Auto-exposure adjustment
- Auto-white-balance changes  
- Hand shake / cube movement
- Sensor noise

We accumulate multiple frames and vote:

```
Frame 1: [R, R, O, Y, G, G, B, B, W]
Frame 2: [R, R, O, Y, G, G, B, B, W]
Frame 3: [R, O, O, Y, G, G, B, B, W]  ← Frame 3 differs at position 1
Frame 4: [R, R, O, Y, G, G, B, B, W]
Frame 5: [R, R, O, Y, G, G, B, B, W]
─────────────────────────────────────
Consensus:[R, R, O, Y, G, G, B, B, W]  Position 1: R wins 4-1
```

### Weighted Voting Algorithm

```
Algorithm: ComputeConsensus(frameHistory)
───────────────────────────────────────
Input:  Array of frames, each with 9 colors and confidence
Output: Consensus colors and overall confidence

1. For each position i ∈ {0, 1, ..., 8}:
   
   votes = {}  // Map: color → accumulated weight
   
   for each frame in history:
     color = frame.colors[i]
     weight = frame.confidence
     votes[color] += weight
   
   winner = argmax_color(votes[color])
   colors[i] = winner

2. Compute confidence:
   totalConfidence = Σᵢ (maxVotes[i] / numFrames)
   avgConfidence = totalConfidence / 9

3. Return (colors, avgConfidence)
```

### Confidence-Weighted Example

```
Position 1 votes:
  Frame 1: R with confidence 0.85 → votes[R] += 0.85
  Frame 2: R with confidence 0.90 → votes[R] += 0.90
  Frame 3: O with confidence 0.60 → votes[O] += 0.60  ← Low confidence!
  Frame 4: R with confidence 0.88 → votes[R] += 0.88
  Frame 5: R with confidence 0.92 → votes[R] += 0.92

Final votes: R = 3.55, O = 0.60

Winner: R (even though O appeared once, its low confidence de-weighted it)
```

---

## 2.2.6 Face Identification

We identify which face is being shown by its center color:

```
Standard cube orientation (white top, green front):

   Face    Center Color
   ────    ────────────
    U         White
    D         Yellow  
    F         Green
    B         Blue
    R         Red
    L         Orange
```

### Identification Algorithm

```javascript
function identifyFace(colors) {
  const centerColor = colors[4];  // Position 4 is center
  
  const FACE_CENTERS = {
    U: 'W',  // Up = White
    D: 'Y',  // Down = Yellow
    F: 'G',  // Front = Green
    B: 'B',  // Back = Blue
    R: 'R',  // Right = Red
    L: 'O',  // Left = Orange
  };
  
  for (const [face, color] of Object.entries(FACE_CENTERS)) {
    if (color === centerColor) {
      return face;
    }
  }
  
  return null;  // Unknown orientation
}
```

**Important**: Center colors are fixed on a Rubik's cube. The center sticker defines the face identity regardless of scramble state.

---

## 2.2.7 State Accumulation

As the user shows each face, we accumulate:

```
Initial state:
  faces = { U: null, R: null, F: null, D: null, L: null, B: null }

After scanning white face:
  faces = { U: ['W','R','G',...], R: null, F: null, D: null, L: null, B: null }

After scanning all 6:
  faces = { 
    U: ['W','R','G','B','W','O','Y','G','R'],
    R: ['R','W','Y','G','R','B','O','Y','W'],
    F: ['G','Y','R','W','G','O','B','R','Y'],
    D: ['Y','B','O','R','Y','G','W','O','B'],
    L: ['O','G','W','Y','O','R','G','B','W'],
    B: ['B','O','Y','G','B','W','R','Y','O']
  }

Complete: 54 stickers captured
```

### State Builder Class

```javascript
class StateBuilder {
  constructor() {
    this.faces = { U: null, R: null, F: null, D: null, L: null, B: null };
    this.frameHistory = { U: [], R: [], F: [], D: [], L: [], B: [] };
    this.maxHistoryFrames = 5;
  }
  
  addFace(face, colors, confidence) {
    // Add to history
    this.frameHistory[face].push({ colors, confidence });
    if (this.frameHistory[face].length > this.maxHistoryFrames) {
      this.frameHistory[face].shift();  // Keep last N frames
    }
    
    // Compute consensus
    const consensus = this.computeConsensus(face);
    this.faces[face] = consensus.colors;
  }
  
  isComplete() {
    return Object.values(this.faces).every(f => f !== null);
  }
  
  getStateString() {
    // Order: U R F D L B (standard Singmaster)
    return ['U','R','F','D','L','B']
      .map(f => this.faces[f].join(''))
      .join('');
  }
}
```

---

## 2.2.8 Bayesian Interpretation

The multi-frame voting can be viewed as Bayesian inference:

**Prior**: Uniform over 6 colors
```
P(color = c) = 1/6  for c ∈ {W, Y, R, O, G, B}
```

**Likelihood**: Observation given true color (from confidence)
```
P(observe c' | true = c) = { conf     if c' = c
                           { (1-conf)/5  otherwise
```

**Posterior** after n observations:
```
P(true = c | observations) ∝ P(c) × Π P(obsᵢ | c)
```

The weighted voting approximates Maximum A Posteriori (MAP) estimation.

---

## 2.2.9 Handling Partial Occlusion

Sometimes part of a sticker is occluded (finger, lighting artifact):

```
┌─────────────────┐
│  ████  │  OK   │  OK   │    ████ = Occluded
├────────┼───────┼───────┤           (detected as X or wrong color)
│   OK   │   OK  │  OK   │
├────────┼───────┼───────┤
│   OK   │  OK   │  OK   │
└─────────────────────────┘
```

**Strategy**: If a position consistently fails classification (color = X or low confidence), we:
1. Mark as uncertain
2. Request user to show face again
3. Use consensus from other frames

---

## 2.2.10 Complete Extraction Pipeline

```
┌────────────────────────────────────────────────────────────────┐
│                    Color Extraction Pipeline                    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Video Frame                                                   │
│       │                                                        │
│       ▼                                                        │
│  ┌─────────────┐                                              │
│  │ detectCube  │  → Find face bounding box                    │
│  │   Region    │     Output: {x, y, width, height}            │
│  └──────┬──────┘                                              │
│         │                                                      │
│         ▼                                                      │
│  ┌─────────────┐                                              │
│  │ sampleRegion│  → For each of 9 positions                   │
│  │   (×9)      │     Average (2r+1)² pixels                   │
│  └──────┬──────┘     Output: 9 RGB values                     │
│         │                                                      │
│         ▼                                                      │
│  ┌─────────────┐                                              │
│  │identifyColor│  → HSL classification                        │
│  │   (×9)      │     Output: 9 colors + confidences           │
│  └──────┬──────┘                                              │
│         │                                                      │
│         ▼                                                      │
│  ┌─────────────┐                                              │
│  │ identifyFace│  → Which face is this?                       │
│  │             │     Output: face ∈ {U,R,F,D,L,B}             │
│  └──────┬──────┘                                              │
│         │                                                      │
│         ▼                                                      │
│  ┌─────────────┐                                              │
│  │  addFace    │  → Add to history, compute consensus         │
│  │             │     Updates: stateBuilder.faces[face]        │
│  └──────┬──────┘                                              │
│         │                                                      │
│         ▼                                                      │
│  ┌─────────────┐                                              │
│  │ isComplete? │───No──→ Continue scanning                    │
│  └──────┬──────┘                                              │
│         │ Yes                                                  │
│         ▼                                                      │
│  ┌─────────────┐                                              │
│  │getStateString│ → 54-character state                        │
│  └─────────────┘    "WRGBWOYG..."                             │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 2.2.11 Key Takeaways

1. **Single pixels are noisy** — always sample regions and average.

2. **Multi-frame voting** beats single-frame detection, especially under varying lighting.

3. **Confidence-weighting** prevents low-quality observations from corrupting consensus.

4. **Center color identifies face** — this is invariant under any scramble.

5. **State accumulation** builds a complete 54-facelet representation from 6 face scans.

---

## Next Module

[→ Module 2.3: State Representation](./02-3-state-representation.md)

Learn how we encode cube state as a string and validate that it represents a physically achievable configuration.
