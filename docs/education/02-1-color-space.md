# Module 2.1: Color Space Theory

*From RGB pixels to perceptually meaningful color classification*

---

## 2.1.1 The Problem with RGB

When a camera captures an image, each pixel is represented as an RGB triplet:

```
pixel = (R, G, B)  where R, G, B ∈ [0, 255]
```

This creates a 3D color cube:

```
                    (255,255,255) White
                         ╱╲
                        ╱  ╲
                       ╱    ╲
           Yellow ────╱──────╲──── Cyan
           (255,255,0)        (0,255,255)
                     ╱╲      ╱╲
                    ╱  ╲    ╱  ╲
                   ╱    ╲  ╱    ╲
          Red ────╱──────╲╱──────╲──── Blue
       (255,0,0) ╱       ╱╲       ╲  (0,0,255)
                ╱       ╱  ╲       ╲
               ╱       ╱    ╲       ╲
              ╱       ╱      ╲       ╲
   Magenta ──╱───────╱────────╲───────╲── Green
   (255,0,255)      ╱          ╲      (0,255,0)
                   ╱            ╲
                  ╱              ╲
                 ╱                ╲
                ╱__________________╲
              (0,0,0) Black
```

**Problem**: Euclidean distance in RGB space does not correlate well with human color perception.

Example: Consider these two pairs of colors:

```
Pair A: (255, 0, 0) and (200, 0, 0)     # Both "red"
        Euclidean distance = 55

Pair B: (100, 100, 0) and (100, 100, 55) # Yellow vs "greenish"
        Euclidean distance = 55
```

Same mathematical distance, but Pair B represents a more noticeable perceptual difference.

---

## 2.1.2 The HSL Color Model

HSL (Hue, Saturation, Lightness) separates chromatic information from intensity:

```
         Lightness = 1 (White)
              ╱╲
             ╱  ╲
            ╱    ╲         Hue: Angular position (0-360°)
           ╱  ○   ╲        Saturation: Distance from center
          ╱   │    ╲       Lightness: Height in cone
         ╱────┼─────╲
        ╱     │      ╲
       ╱      │       ╲
      ╱───────●────────╲   ← Saturation = 1.0 (edge)
     ╱   S=0  │  S=1    ╲
    ╱    (gray)         ╲
   ╱                      ╲
  ╱________________________╲
         Lightness = 0 (Black)


        Top View (Hue wheel at L=0.5):
        
              Red (0°)
                │
                │
    Magenta ────┼──── Yellow (60°)
     (300°)     │
                │
      Blue ─────┼───── Green (120°)
     (240°)     │
                │
            Cyan (180°)
```

### Mathematical Definition

Given RGB values normalized to [0, 1]:

```
r = R/255,  g = G/255,  b = B/255

max = max(r, g, b)
min = min(r, g, b)
Δ = max - min
```

**Lightness:**
```
L = (max + min) / 2
```

**Saturation:**
```
        ⎧ 0                      if Δ = 0
S =     ⎨ Δ / (1 - |2L - 1|)     otherwise
        ⎩
```

**Hue:**
```
        ⎧ undefined              if Δ = 0
        ⎪ 60° × ((g-b)/Δ mod 6)  if max = r
H =     ⎨ 60° × ((b-r)/Δ + 2)    if max = g
        ⎪ 60° × ((r-g)/Δ + 4)    if max = b
        ⎩
```

### Implementation

```javascript
function rgbToHsl(r, g, b) {
  r /= 255;  g /= 255;  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  
  if (max === min) {
    return { h: 0, s: 0, l: l * 100 };  // Achromatic
  }
  
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  
  let h;
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g: h = ((b - r) / d + 2) / 6; break;
    case b: h = ((r - g) / d + 4) / 6; break;
  }
  
  return { h: h * 360, s: s * 100, l: l * 100 };
}
```

---

## 2.1.3 Decision Boundaries for Cube Colors

A standard Rubik's cube has six colors:

| Color | Abbrev | Typical Hue | Saturation | Lightness |
|-------|--------|-------------|------------|-----------|
| White | W | any | < 25% | > 70% |
| Yellow | Y | 45-75° | > 30% | any |
| Orange | O | 15-45° | > 30% | any |
| Red | R | 0-15° or 345-360° | > 30% | any |
| Green | G | 75-165° | > 30% | any |
| Blue | B | 180-260° | > 30% | any |

### Decision Tree

```
                    Input: (H, S, L)
                           │
                           ▼
                    ┌──────────────┐
                    │  L > 70% AND │───Yes──▶ WHITE
                    │  S < 25%     │
                    └──────┬───────┘
                           │ No
                           ▼
                    ┌──────────────┐
                    │   L < 20%    │───Yes──▶ BLACK (invalid)
                    └──────┬───────┘
                           │ No
                           ▼
                    ┌──────────────┐
                    │   S > 30%    │───No───▶ UNCERTAIN
                    └──────┬───────┘
                           │ Yes
                           ▼
               ┌───────────────────────┐
               │    Classify by Hue    │
               └───────────┬───────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   H < 15° OR         15° ≤ H < 45°      45° ≤ H < 75°
   H ≥ 345°               │                  │
        │                  │                  │
        ▼                  ▼                  ▼
       RED              ORANGE            YELLOW
        
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   75° ≤ H < 165°    180° ≤ H < 260°    260° ≤ H < 345°
        │                  │                  │
        ▼                  ▼                  ▼
      GREEN              BLUE             MAGENTA
                                         (invalid)
```

### Hue Boundary Visualization

```
         0°                                         360°
         │                                           │
    RED  │  ORANGE  │  YELLOW  │  GREEN  │   BLUE   │  RED
         │          │          │         │          │
    ─────┼──────────┼──────────┼─────────┼──────────┼─────
         0    15    45    75   120  165  180   260  345  360
                              
Legend:
█████ = High confidence region
░░░░░ = Transition zone (lower confidence)

         0°       15°       45°       75°      165°      180°      260°      345°
         │         │         │         │         │         │         │         │
    RED  │░░░░░░░░░│ ORANGE  │░░░░░░░░░│░░░░░░░░░│░░░░░░░░░│         │░░░░░░░░░│
         │         │█████████│         │         │         │         │         │
    ─────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴────
                              YELLOW    GREEN                BLUE
                              █████████ █████████████████████████████████████████
```

---

## 2.1.4 Handling Edge Cases

### White Detection

White is not defined by hue but by high lightness and low saturation:

```
isWhite(H, S, L) = (L > 70) AND (S < 25)
```

**Rationale**: Under any hue, if a color is very bright and desaturated, it appears white to humans.

### Shadow Handling

Shadows reduce lightness while preserving hue (approximately):

```
Original:  H=60°, S=80%, L=60%   → Yellow
Shadow:    H=58°, S=75%, L=35%   → Still Yellow (darker)
```

By classifying on hue rather than absolute RGB, we achieve shadow invariance.

### Red Wraparound

Red straddles the 0°/360° boundary:

```javascript
function isRed(h) {
  return h < 15 || h >= 345;
}
```

This handles the discontinuity in the hue wheel.

---

## 2.1.5 Confidence Scoring

Not all classifications are equally certain. We assign confidence based on distance from decision boundaries:

```
confidence(H, S, L) = min(
  distanceFromHueBoundary(H) / 15,    // Hue confidence
  S / 30,                              // Saturation confidence
  1.0                                  // Cap at 100%
)
```

**Example confidence values:**

| Input HSL | Classification | Confidence |
|-----------|----------------|------------|
| (30°, 90%, 50%) | Orange | 100% (center of range) |
| (44°, 85%, 55%) | Yellow (edge) | 93% |
| (15°, 40%, 45%) | Orange (low sat) | 80% |
| (0°, 95%, 50%) | Red | 100% |

---

## 2.1.6 RGB Fallback

When HSL classification fails (e.g., very low saturation), we fall back to RGB Euclidean distance:

```javascript
function rgbDistance(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt(
    (r1 - r2) ** 2 + 
    (g1 - g2) ** 2 + 
    (b1 - b2) ** 2
  );
}

// Maximum possible distance in RGB space
const MAX_DIST = Math.sqrt(255**2 + 255**2 + 255**2);  // ≈ 441.67

// Confidence from distance
confidence = Math.max(0.3, 1 - distance / MAX_DIST);
```

**Reference colors for fallback:**

| Color | RGB |
|-------|-----|
| White | (255, 255, 255) |
| Yellow | (255, 255, 0) |
| Red | (255, 0, 0) |
| Orange | (255, 140, 0) |
| Green | (0, 255, 0) |
| Blue | (0, 0, 255) |

---

## 2.1.7 Perceptual Uniformity

HSL is better than RGB but still not perceptually uniform. For reference:

| Color Space | Perceptual Uniformity | Computation Cost |
|-------------|----------------------|------------------|
| RGB | Poor | Trivial |
| HSL | Moderate | Low |
| HSV | Moderate | Low |
| CIE Lab | Good | Medium |
| CIEDE2000 | Excellent | High |

**Why not CIE Lab?** For Rubik's cube colors (primary colors with high saturation), HSL provides sufficient discrimination at lower computational cost.

---

## 2.1.8 Complete Classification Algorithm

```
Algorithm: ClassifyColor(R, G, B)
────────────────────────────────────
Input:  RGB pixel values
Output: (color ∈ {W,Y,R,O,G,B,X}, confidence ∈ [0,1])

1. Convert to HSL:
   (H, S, L) ← RGB_to_HSL(R, G, B)

2. Check for white:
   if L > 70 AND S < 25:
     return (W, 0.9)

3. Check for black/invalid:
   if L < 20:
     return (X, 0.5)

4. Check saturation threshold:
   if S < 30:
     goto step 6 (fallback)

5. Classify by hue:
   if H < 15 OR H ≥ 345:     return (R, 0.85)
   if 15 ≤ H < 45:           return (O, 0.80)
   if 45 ≤ H < 75:           return (Y, 0.85)
   if 75 ≤ H < 165:          return (G, 0.85)
   if 180 ≤ H < 260:         return (B, 0.85)

6. Fallback to RGB distance:
   bestColor ← argmin_c(||RGB - reference_c||)
   confidence ← max(0.3, 1 - minDist/441)
   return (bestColor, confidence)
```

---

## 2.1.9 Key Takeaways

1. **HSL separates concerns**: Hue for color identity, saturation for color/gray distinction, lightness for brightness.

2. **Hue is circular**: Red wraps around 0°/360°, requiring special handling.

3. **White is special**: Defined by lightness+saturation, not hue.

4. **Confidence matters**: Not all detections are equal; downstream components should weight by confidence.

5. **Fallback exists**: RGB distance as backup when HSL classification is uncertain.

---

## Next Module

[→ Module 2.2: Spatial Sampling](./02-2-sampling.md)

Learn how we combine multiple pixel samples to reduce noise and handle varying lighting conditions.
