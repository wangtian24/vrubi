# Appendix A: Notation Reference

*Standard conventions for describing Rubik's cube states and moves*

---

## A.1 Face Names

```
        ┌───────┐
        │       │
        │   U   │   U = Up
        │       │
┌───────┼───────┼───────┬───────┐
│       │       │       │       │
│   L   │   F   │   R   │   B   │
│       │       │       │       │
└───────┼───────┼───────┴───────┘
        │       │
        │   D   │   D = Down
        │       │
        └───────┘

L = Left    F = Front    R = Right    B = Back
```

---

## A.2 Move Notation (Singmaster)

### Basic Moves

| Notation | Meaning |
|----------|---------|
| U | Up face 90° clockwise (looking at face) |
| D | Down face 90° clockwise |
| R | Right face 90° clockwise |
| L | Left face 90° clockwise |
| F | Front face 90° clockwise |
| B | Back face 90° clockwise |

### Modifiers

| Notation | Meaning |
|----------|---------|
| X' | Counterclockwise (prime) |
| X2 | Half turn (180°) |

### Examples

```
R   = Right face clockwise
R'  = Right face counterclockwise  
R2  = Right face 180° (direction doesn't matter)

U R U' R' = "Sexy move" - common trigger in solving
```

### Wide Moves (Optional)

| Notation | Meaning |
|----------|---------|
| r | R + middle slice (2 layers) |
| u | U + equator slice (2 layers) |
| Rw | Same as r (alternate notation) |

### Rotations (Optional)

| Notation | Meaning |
|----------|---------|
| x | Rotate entire cube on R axis |
| y | Rotate entire cube on U axis |
| z | Rotate entire cube on F axis |

---

## A.3 Facelet Indexing

Each face has 9 facelets, numbered 0-8:

```
Single face layout:

    ┌───┬───┬───┐
    │ 0 │ 1 │ 2 │
    ├───┼───┼───┤
    │ 3 │ 4 │ 5 │   Index 4 = center
    ├───┼───┼───┤
    │ 6 │ 7 │ 8 │
    └───┴───┴───┘

Reading order: left-to-right, top-to-bottom
```

---

## A.4 State String Format

54-character string in face order: **U R F D L B**

```
Position:  000000000011111111112222222222333333333344444444445555
           012345678901234567890123456789012345678901234567890123

Faces:     UUUUUUUUURRRRRRRRRRFFFFFFFFFDDDDDDDDDDLLLLLLLLLBBBBBBBBB
           |__U(9)__||__R(9)__||__F(9)__||__D(9)__||__L(9)__||__B(9)__|

Solved:    WWWWWWWWWRRRRRRRRRGGGGGGGGGYYYYYYYYOOOOOOOOOOBBBBBBBBB
           (using color letters instead of face letters)
```

### Index Reference

| Face | Index Range | Center |
|------|-------------|--------|
| U | 0-8 | 4 |
| R | 9-17 | 13 |
| F | 18-26 | 22 |
| D | 27-35 | 31 |
| L | 36-44 | 40 |
| B | 45-53 | 49 |

---

## A.5 Color Letters

| Letter | Color | Standard Face |
|--------|-------|---------------|
| W | White | U (Up) |
| Y | Yellow | D (Down) |
| R | Red | R (Right) |
| O | Orange | L (Left) |
| G | Green | F (Front) |
| B | Blue | B (Back) |

---

## A.6 Unfolded Cube Diagram

```
                        ┌───┬───┬───┐
                        │ 0 │ 1 │ 2 │
                        ├───┼───┼───┤
                        │ 3 │ 4 │ 5 │  U face (indices 0-8)
                        ├───┼───┼───┤
                        │ 6 │ 7 │ 8 │
            ┌───┬───┬───┼───┼───┼───┼───┬───┬───┬───┬───┬───┐
            │36 │37 │38 │18 │19 │20 │ 9 │10 │11 │45 │46 │47 │
            ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
            │39 │40 │41 │21 │22 │23 │12 │13 │14 │48 │49 │50 │
            ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
            │42 │43 │44 │24 │25 │26 │15 │16 │17 │51 │52 │53 │
            └───┴───┴───┼───┼───┼───┼───┴───┴───┴───┴───┴───┘
                  L     │27 │28 │29 │     R           B
                        ├───┼───┼───┤
                        │30 │31 │32 │  D face (indices 27-35)
                        ├───┼───┼───┤
                        │33 │34 │35 │
                        └───┴───┴───┘
                              F
```

---

## A.7 Piece Positions

### Corners (8 pieces, 3 colors each)

| Position | Facelets | Solved Colors |
|----------|----------|---------------|
| ULB | 0, 38, 47 | W, O, B |
| URB | 2, 45, 11 | W, B, R |
| UFL | 6, 18, 36 | W, G, O |
| UFR | 8, 9, 20 | W, R, G |
| DLB | 35, 42, 51 | Y, O, B |
| DRB | 33, 53, 15 | Y, B, R |
| DFL | 26, 44, 27 | G, O, Y |
| DFR | 24, 29, 17 | G, Y, R |

### Edges (12 pieces, 2 colors each)

| Position | Facelets | Solved Colors |
|----------|----------|---------------|
| UB | 1, 46 | W, B |
| UL | 3, 37 | W, O |
| UR | 5, 10 | W, R |
| UF | 7, 19 | W, G |
| DB | 34, 50 | Y, B |
| DL | 32, 43 | Y, O |
| DR | 30, 16 | Y, R |
| DF | 28, 25 | Y, G |
| FL | 23, 41 | G, O |
| FR | 21, 14 | G, R |
| BL | 39, 52 | O, B |
| BR | 12, 48 | R, B |

---

## A.8 Opposite Pairs

Colors on opposite faces:

```
W ↔ Y   (Up ↔ Down)
R ↔ O   (Right ↔ Left)
G ↔ B   (Front ↔ Back)
```

**Rule**: Opposite colors can never appear on the same edge or corner piece.

---

## A.9 Coordinate Ranges

| Coordinate | Range | Count | Notes |
|------------|-------|-------|-------|
| twist | 0-2186 | 2187 | 3⁷ corner orientations |
| flip | 0-2047 | 2048 | 2¹¹ edge orientations |
| slice | 0-494 | 495 | C(12,4) E-slice positions |
| corners | 0-40319 | 40320 | 8! corner permutations |
| edges | 0-40319 | 40320 | 8! edge permutations |
| slice_perm | 0-23 | 24 | 4! E-slice permutation |

---

## A.10 Move Tables

### Move Index

| Index | Move | Index | Move |
|-------|------|-------|------|
| 0 | U | 9 | L |
| 1 | U' | 10 | L' |
| 2 | U2 | 11 | L2 |
| 3 | D | 12 | F |
| 4 | D' | 13 | F' |
| 5 | D2 | 14 | F2 |
| 6 | R | 15 | B |
| 7 | R' | 16 | B' |
| 8 | R2 | 17 | B2 |

### G₁ Moves (Phase 2)

Only these 10 moves preserve G₁:

```
U, U', U2, D, D', D2, R2, L2, F2, B2
```

(No quarter turns of R, L, F, B)

---

## A.11 Example States

### Solved State
```
WWWWWWWWWRRRRRRRRRGGGGGGGGGYYYYYYYYOOOOOOOOOOBBBBBBBBB
```

### Superflip (all edges flipped)
```
WBWOWRWGWRYRGRORBGOGYGWGBGYBYOYRYOGOBOBWOWRBYRYGRGOBY
```

### Checkerboard Pattern
```
WYWYWYWYWRGRGRGRGRGBGBGBGBGBYBYBYBYBOROBOROBORYRYRYRYR
(Not achievable from solved - illustration only)
```

---

## A.12 Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                   VRUBI QUICK REFERENCE                      │
├─────────────────────────────────────────────────────────────┤
│ FACES:   U=Up  D=Down  R=Right  L=Left  F=Front  B=Back    │
│ COLORS:  W=White Y=Yellow R=Red O=Orange G=Green B=Blue    │
│                                                             │
│ MOVES:   X = clockwise    X' = counter    X2 = half-turn   │
│                                                             │
│ STATE:   54 chars, order URFDLB, 9 per face                │
│          Centers at indices: 4, 13, 22, 31, 40, 49         │
│                                                             │
│ SOLVED:  WWWWWWWWWRRRRRRRRRGGGGGGGGGYYYYYYYYOOOOOOOOOOBBB...│
│                                                             │
│ OPPOSITES: W↔Y  R↔O  G↔B (never on same piece)            │
└─────────────────────────────────────────────────────────────┘
```
