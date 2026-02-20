# Module 2.3: State Representation

*Encoding cube configurations and validating physical possibility*

---

## 2.3.1 Facelet Notation

The Rubik's cube has 54 colored facelets (stickers). We represent state as a 54-character string following the **Singmaster notation**:

```
Face Order: U R F D L B (Up, Right, Front, Down, Left, Back)

Each face contributes 9 characters, read left-to-right, top-to-bottom:

        ┌───┬───┬───┐
        │ 0 │ 1 │ 2 │
        ├───┼───┼───┤
        │ 3 │ 4 │ 5 │   ← Face U (indices 0-8)
        ├───┼───┼───┤
        │ 6 │ 7 │ 8 │
        └───┴───┴───┘
              │
    ┌─────────┼─────────┐
    │         │         │
┌───┴───┬───┬─┴─┬───┬───┴───┐
│36│37│38│18│19│20│ 9│10│11│45│46│47│
├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
│39│40│41│21│22│23│12│13│14│48│49│50│
├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
│42│43│44│24│25│26│15│16│17│51│52│53│
└───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
     L         F         R         B
              │
        ┌───┬─┴─┬───┐
        │27│28│29│
        ├───┼───┼───┤
        │30│31│32│   ← Face D (indices 27-35)
        ├───┼───┼───┤
        │33│34│35│
        └───┴───┴───┘
```

### Index to Face Mapping

| Index Range | Face | Description |
|-------------|------|-------------|
| 0-8 | U | Up (White) |
| 9-17 | R | Right (Red) |
| 18-26 | F | Front (Green) |
| 27-35 | D | Down (Yellow) |
| 36-44 | L | Left (Orange) |
| 45-53 | B | Back (Blue) |

### Center Positions

Centers are at index 4 of each face:

| Face | Center Index | Fixed Color |
|------|--------------|-------------|
| U | 4 | W (White) |
| R | 13 | R (Red) |
| F | 22 | G (Green) |
| D | 31 | Y (Yellow) |
| L | 40 | O (Orange) |
| B | 49 | B (Blue) |

---

## 2.3.2 Solved State

The solved cube has each face showing a single color:

```
Solved state string:
"WWWWWWWWWRRRRRRRRRGGGGGGGGGYYYYYYYYYBBBBBBBBB OOOOOOOOO"
 ↑        ↑        ↑        ↑        ↑        ↑
 U(9)     R(9)     F(9)     D(9)     L(9)     B(9)

Note: Using standard color scheme (W top, G front)
      Actual string: "WWWWWWWWWRRRRRRRRRGGGGGGGGGYYYYYYYYOOOOOOOOOOBBBBBBBBB"
```

---

## 2.3.3 Validation Constraints

Not every 54-character string represents a valid cube state. We must verify:

### Constraint 1: Color Counts

Each color must appear exactly 9 times:

```
Valid:   W×9, Y×9, R×9, O×9, G×9, B×9  ✓
Invalid: W×8, Y×10, R×9, O×9, G×9, B×9  ✗ (impossible physically)
```

### Constraint 2: Center Colors

Centers must match the standard orientation:

```
state[4]  = W  (U center)
state[13] = R  (R center)
state[22] = G  (F center)
state[31] = Y  (D center)
state[40] = O  (L center)
state[49] = B  (B center)
```

**Why?** Center pieces cannot move relative to each other on a standard cube.

### Constraint 3: Edge Piece Validity

There are 12 edge pieces, each with 2 colors. Opposite colors cannot appear on the same edge:

```
Opposite pairs:
  W ↔ Y  (Up ↔ Down)
  R ↔ O  (Right ↔ Left)
  G ↔ B  (Front ↔ Back)

Invalid edge: W-Y (impossible - would require broken cube)
Valid edge:   W-R, W-G, W-O, W-B, etc.
```

### Constraint 4: Corner Piece Validity

There are 8 corner pieces, each with 3 colors. No two of the three can be opposite:

```
Invalid corner: W-Y-R (W and Y are opposite)
Invalid corner: R-O-G (R and O are opposite)
Valid corner:   W-R-G, W-R-B, W-O-G, W-O-B, etc.
```

---

## 2.3.4 Edge and Corner Indices

### Edge Locations (12 edges × 2 facelets each)

```
Edge    Facelet Indices    Colors (solved)
────    ───────────────    ───────────────
UB      [1, 46]            W-B
UL      [3, 37]            W-O
UR      [5, 10]            W-R
UF      [7, 19]            W-G
FR      [21, 14]           G-R
FL      [23, 41]           G-O
FD      [25, 28]           G-Y
RB      [12, 48]           R-B
RD      [16, 30]           R-Y
LB      [39, 52]           O-B
LD      [43, 32]           O-Y
BD      [50, 34]           B-Y
```

### Corner Locations (8 corners × 3 facelets each)

```
Corner   Facelet Indices     Colors (solved)
──────   ────────────────    ───────────────
ULB      [0, 38, 47]         W-O-B
URB      [2, 45, 11]         W-B-R
UFL      [6, 18, 36]         W-G-O
UFR      [8, 9, 20]          W-R-G
DFL      [26, 44, 27]        G-O-Y
DFR      [24, 29, 17]        G-Y-R
DLB      [35, 42, 51]        Y-O-B
DRB      [33, 53, 15]        Y-B-R
```

---

## 2.3.5 Parity Constraints

Beyond color constraints, valid cube states must satisfy **parity** conditions:

### Edge Orientation Parity

Each edge can be "flipped" or "not flipped". The total flip count must be even:

```
Σ (edge_flip[i]) ≡ 0 (mod 2)
```

**Intuition**: Any move flips 0 or 4 edges, preserving parity.

### Corner Orientation Parity

Each corner can be twisted 0, 1, or 2 times (clockwise). The sum must be divisible by 3:

```
Σ (corner_twist[i]) ≡ 0 (mod 3)
```

**Intuition**: Any move twists corners by amounts summing to 0 mod 3.

### Permutation Parity

The permutation of edges and corners combined must be even:

```
sign(edge_permutation) × sign(corner_permutation) = +1
```

**Intuition**: Every move is an even permutation.

---

## 2.3.6 Validation Algorithm

```
Algorithm: ValidateState(state)
────────────────────────────────
Input:  54-character state string
Output: { valid: bool, errors: [], warnings: [] }

1. Check length:
   if len(state) ≠ 54:
     errors.add("Length must be 54")
     return {valid: false, errors, warnings}

2. Count colors:
   counts = {}
   for char in state:
     counts[char] = counts[char] + 1
   
   for color in {W, Y, R, O, G, B}:
     if counts[color] ≠ 9:
       errors.add(f"Expected 9 {color}, got {counts[color]}")

3. Check centers:
   expectedCenters = {4:'W', 13:'R', 22:'G', 31:'Y', 40:'O', 49:'B'}
   for idx, expected in expectedCenters:
     if state[idx] ≠ expected:
       errors.add(f"Center at {idx} should be {expected}")

4. Check edges for opposite colors:
   edges = [[1,46], [3,37], [5,10], ...]  // 12 edges
   for [i, j] in edges:
     if areOpposite(state[i], state[j]):
       warnings.add(f"Edge has opposite colors")

5. Check corners for opposite colors:
   corners = [[0,38,47], [2,45,11], ...]  // 8 corners
   for [i, j, k] in corners:
     colors = {state[i], state[j], state[k]}
     for c1 in colors:
       for c2 in colors:
         if areOpposite(c1, c2):
           warnings.add(f"Corner has opposite colors")

6. Return:
   valid = (errors.length == 0)
   return {valid, errors, warnings}
```

### Helper: Opposite Color Check

```javascript
const OPPOSITE = {
  'W': 'Y', 'Y': 'W',
  'R': 'O', 'O': 'R',
  'G': 'B', 'B': 'G'
};

function areOpposite(c1, c2) {
  return OPPOSITE[c1] === c2;
}
```

---

## 2.3.7 State String Format

The final 54-character string encodes the complete cube state:

```
Position:  0         1         2         3         4         5
           0123456789012345678901234567890123456789012345678901234
           
Solved:    WWWWWWWWWRRRRRRRRRGGGGGGGGGYYYYYYYYOOOOOOOOOOBBBBBBBBB
           |_U(9)__||__R(9)__||__F(9)__||__D(9)__||__L(9)__||__B(9)__|

Scrambled: WGOBWRYOGROGBRRBYWGYGOGYRBRYBWYOYGWRBYWOBGRYOOWBGBWOO
           (example - actual will vary)
```

### Converting Between Representations

```javascript
// Faces object → State string
function facesToString(faces) {
  return ['U','R','F','D','L','B']
    .map(f => faces[f].join(''))
    .join('');
}

// State string → Faces object
function stringToFaces(state) {
  return {
    U: state.slice(0, 9).split(''),
    R: state.slice(9, 18).split(''),
    F: state.slice(18, 27).split(''),
    D: state.slice(27, 36).split(''),
    L: state.slice(36, 45).split(''),
    B: state.slice(45, 54).split('')
  };
}
```

---

## 2.3.8 Group-Theoretic View

The valid cube states form a mathematical **group** under composition of moves:

**Rubik's Cube Group G**:
- **Elements**: All reachable cube configurations (~4.3 × 10¹⁹)
- **Identity**: Solved state
- **Operation**: Applying move sequences
- **Inverse**: Every scramble has a solution

The state string is one **representation** of group elements. The solver operates on a more compact **coordinate representation** (see Module 3.2).

### State Space Size

```
Total permutations of 54 facelets:    54! / (9!)⁶ ≈ 1.1 × 10⁵⁴

Physically reachable states:          43,252,003,274,489,856,000
                                      ≈ 4.3 × 10¹⁹

Ratio:                                Only ~10⁻³⁵ of arrangements are valid!
```

Most color arrangements are **not** physically achievable.

---

## 2.3.9 Error Recovery

When validation fails, we have options:

```
┌─────────────────┐
│ Validation Fail │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Color count wrong?                  │
│   → Bad scan, rescan face           │
├─────────────────────────────────────┤
│ Wrong center color?                 │
│   → Misidentified face, relabel     │
├─────────────────────────────────────┤
│ Opposite colors on edge/corner?     │
│   → Physically impossible,          │
│     likely color misclassification  │
│   → Rescan with better lighting     │
├─────────────────────────────────────┤
│ Parity violation?                   │
│   → Cube was disassembled wrong     │
│   → Or detection error              │
└─────────────────────────────────────┘
```

---

## 2.3.10 Complete Example

Let's trace through a full validation:

**Input state**: `"WGOBWRYOGROGBRRBYWGYGOGYRBRYBWYOYGWRBYWOBGRYOOWBGBWOO"`

**Step 1: Length** ✓ (54 characters)

**Step 2: Color counts**
```
W: 9 ✓   Y: 9 ✓   R: 9 ✓   O: 9 ✓   G: 9 ✓   B: 9 ✓
```

**Step 3: Centers**
```
state[4]  = 'W' ✓ (U)
state[13] = 'B' ✗ (expected R)  ERROR!
```

This state has an invalid center—likely the faces were scanned in wrong order or mislabeled.

---

## 2.3.11 Key Takeaways

1. **54-character string** encodes complete cube state (U-R-F-D-L-B order).

2. **Color counts** must be exactly 9 each.

3. **Centers are fixed** and identify face orientation.

4. **Edge/corner constraints** prevent physically impossible configurations.

5. **Parity constraints** are subtle but real—some "random" arrangements are unreachable.

6. **Validation is essential** before passing state to solver.

---

## Next Module

[→ Module 3.1: Group Theory Foundations](./03-1-group-theory.md)

Dive into the mathematical structure underlying the Rubik's cube—permutation groups, generators, and why there are exactly 43 quintillion valid states.
