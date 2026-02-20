# Module 3.1: Group Theory Foundations

*The mathematical structure of the Rubik's Cube*

---

## 3.1.1 What is a Group?

A **group** (G, ∘) is a set G with a binary operation ∘ satisfying:

1. **Closure**: For all a, b ∈ G, a ∘ b ∈ G
2. **Associativity**: (a ∘ b) ∘ c = a ∘ (b ∘ c)
3. **Identity**: There exists e ∈ G such that e ∘ a = a ∘ e = a
4. **Inverse**: For each a ∈ G, there exists a⁻¹ such that a ∘ a⁻¹ = e

### Example: The Rubik's Cube Group

- **Set G**: All reachable cube configurations
- **Operation ∘**: Applying one scramble after another
- **Identity e**: The solved cube
- **Inverse**: For any scramble, there's a solution

---

## 3.1.2 Permutations

A cube move **permutes** (rearranges) the positions of pieces. 

### Permutation Notation

We use **cycle notation** to describe permutations:

```
(1 2 3) means: 1 → 2, 2 → 3, 3 → 1

Example: The move R (right face clockwise) permutes corners as:
  (UFR URB DRB DFR) = positions cycle through

In detail:
  UFR → URB   (front-right corner goes to back-right)
  URB → DRB   (back-right goes to down-back-right)
  DRB → DFR   (down-back-right goes to down-front-right)
  DFR → UFR   (down-front-right goes back to up-front-right)
```

### The Symmetric Group Sₙ

The **symmetric group Sₙ** is the group of all permutations of n elements.

```
|Sₙ| = n!

S₃ has 3! = 6 elements:
  (), (1 2), (1 3), (2 3), (1 2 3), (1 3 2)
```

---

## 3.1.3 The Cube as Permutations

The Rubik's cube has:
- 8 corner pieces (can be permuted)
- 12 edge pieces (can be permuted)
- 6 center pieces (fixed in standard cube)

### Corner Permutations

```
Corner Positions (labeled 0-7):

        ┌─────────┐
       0│         │1
        │    U    │
       3│         │2
        └────┬────┘
             │
    ┌────────┼────────┐
    │        │        │
   3│   L    │   F   2│   R    │1
   7│        │       6│        │5
    └────────┴────────┘
             │
        ┌────┴────┐
       7│         │6
        │    D    │
       4│         │5
        └─────────┘

Position mapping:
  0 = ULB (Up-Left-Back)
  1 = URB (Up-Right-Back)
  2 = URF (Up-Right-Front)
  3 = ULF (Up-Left-Front)
  4 = DLB (Down-Left-Back)
  5 = DRB (Down-Right-Back)
  6 = DRF (Down-Right-Front)
  7 = DLF (Down-Left-Front)
```

### Edge Permutations

```
Edge Positions (labeled 0-11):

          ┌─────────┐
          │    0    │
          │ 3     1 │
          │    2    │
          └────┬────┘
               │
      ┌────────┼────────┐
      │   3    │   2    │   1    │   0
      │11    8 │ 8    9 │ 9   10 │10   11
      │        │        │        │
      └────────┴────────┴────────┘
               │
          ┌────┴────┐
          │    6    │
          │ 7     5 │
          │    4    │
          └─────────┘

Edge mapping:
  0 = UB, 1 = UR, 2 = UF, 3 = UL
  4 = DB, 5 = DR, 6 = DF, 7 = DL
  8 = FL, 9 = FR, 10 = BR, 11 = BL
```

---

## 3.1.4 Generators

The cube group is **generated** by 6 basic moves:

```
G = ⟨U, D, R, L, F, B⟩
```

Every reachable configuration can be expressed as a product (sequence) of these generators.

### Move Effects

**U (Up clockwise)**:
```
Corners: (0 1 2 3) - cycles the 4 top corners
Edges:   (0 1 2 3) - cycles the 4 top edges
```

**R (Right clockwise)**:
```
Corners: (1 5 6 2) - cycles the 4 right corners
Edges:   (1 5 9 10) - cycles the 4 right edges
```

**F (Front clockwise)**:
```
Corners: (2 6 7 3) - cycles the 4 front corners
Edges:   (2 6 8 9) - cycles the 4 front edges
```

### Derived Moves

- U' (U-prime): U inverse (counterclockwise) = U³
- U2: Half turn = U ∘ U
- Similarly for all faces

**Total basic moves**: 6 faces × 3 variants = 18 moves

---

## 3.1.5 Orientations

Pieces have both **position** and **orientation**.

### Corner Orientation

Each corner has 3 possible orientations (0, 1, 2):

```
        ┌───┐                ┌───┐                ┌───┐
        │ U │                │ F │                │ R │
      ┌─┴───┴─┐            ┌─┴───┴─┐            ┌─┴───┴─┐
      │F│   │R│            │R│   │U│            │U│   │F│
      └─────────┘            └─────────┘            └─────────┘
      twist = 0             twist = 1             twist = 2
      (U color on top)      (F color on top)      (R color on top)
```

**Convention**: Count clockwise twists when looking at corner from outside the cube.

### Edge Orientation

Each edge has 2 possible orientations (0 or 1 = flipped):

```
      ┌───┐            ┌───┐
      │ U │            │ F │
    ──┤   ├──        ──┤   ├──
      │ F │            │ U │
      └───┘            └───┘
    flip = 0          flip = 1
    (U/D color        (U/D color
     on U/D face)      on F/B face)
```

---

## 3.1.6 State Space Size

The number of reachable configurations:

### Counting Argument

```
Corner positions:      8! = 40,320
Corner orientations:   3⁷ = 2,187     (last determined by others)
Edge positions:        12! = 479,001,600
Edge orientations:     2¹¹ = 2,048    (last determined by others)

Naive product:  8! × 3⁷ × 12! × 2¹¹ = 519,024,039,293,878,272,000

But parity constraints divide by 12:
  • Corner orientation sum ≡ 0 (mod 3)  → divide by 3
  • Edge orientation sum ≡ 0 (mod 2)    → divide by 2
  • Even permutation parity             → divide by 2

Final: 519,024,039,293,878,272,000 / 12 = 43,252,003,274,489,856,000
```

### The Magic Number

```
|G| = 43,252,003,274,489,856,000
    ≈ 4.3 × 10¹⁹
    = 43 quintillion
```

If you tried one configuration per second, it would take **1.4 trillion years** to try them all.

---

## 3.1.7 Subgroups

A **subgroup** H ⊆ G is a subset that is itself a group under the same operation.

### Important Subgroups

**G₁ = ⟨U, D, R², L², F², B²⟩**

This is the subgroup reachable using only half-turns of R, L, F, B (but full turns of U, D).

```
|G₁| = 19,508,428,800 ≈ 2 × 10¹⁰
```

**Why is G₁ special?**
- Edge orientation is preserved (no flipping)
- Corner orientation is preserved (no twisting)
- Only positions change

This is the key to the **Kociemba algorithm** (Module 3.2).

### Subgroup Lattice

```
                    G (full cube group)
                    |G| ≈ 4.3 × 10¹⁹
                         │
                         │ (Phase 1 reduction)
                         ▼
                    G₁ = ⟨U, D, R², L², F², B²⟩
                    |G₁| ≈ 2 × 10¹⁰
                         │
                         │ (Phase 2 reduction)
                         ▼
                    {e} (solved state)
```

---

## 3.1.8 Cosets

Given subgroup H ⊆ G and element g ∈ G, the **left coset** is:

```
gH = {g ∘ h : h ∈ H}
```

Cosets partition G:

```
G = H ∪ g₁H ∪ g₂H ∪ ... ∪ gₖH  (disjoint union)

where k = |G|/|H| is the index [G:H]
```

### Cosets in Cube Solving

The Kociemba algorithm uses cosets:

```
Phase 1: Find path from state s to some state in G₁
         i.e., find g₁ such that s ∘ g₁ ∈ G₁

Phase 2: Find path from s ∘ g₁ to identity within G₁
```

---

## 3.1.9 Cayley Graph

The **Cayley graph** visualizes the group structure:

- **Vertices**: Group elements (cube states)
- **Edges**: Connect states differing by one generator move

```
Small example (partial view):

        [U]
    ┌────┼────┐
    │    │    │
   [UF]──●──[UR]     ● = solved state
    │    │    │
    └────┼────┘
        [U']

Each state has 18 neighbors (one per basic move)
```

### Graph Diameter

**God's Number**: The maximum distance from any state to solved.

```
God's Number = 20 (in half-turn metric)
             = 26 (in quarter-turn metric)

Every cube can be solved in ≤20 moves (proven by computer in 2010).
```

---

## 3.1.10 Conjugacy and Commutators

### Conjugation

The conjugate of a by x is:

```
a^x = x⁻¹ a x
```

**Interpretation**: Do x, then a, then undo x. The effect of a is "transported" to a different location.

**Cube example**:
```
R^U = U⁻¹ R U

This does R, but "as if" rotated by U.
Result: affects front face instead of right face.
```

### Commutators

The commutator of a and b is:

```
[a, b] = a b a⁻¹ b⁻¹
```

**Key property**: Commutators move few pieces.

**Cube example**:
```
[R, U] = R U R⁻¹ U⁻¹

This 4-move sequence cycles just 3 corners (mostly).
Commutators are the basis of human solving methods.
```

---

## 3.1.11 Symmetry

The cube has 48 symmetries (rotations and reflections).

### Rotation Symmetry Group

```
M = ⟨x, y⟩  where:
  x = rotate entire cube around x-axis (R becomes F)
  y = rotate entire cube around y-axis (F becomes L)

|M| = 24 rotational symmetries (orientation-preserving)

With reflections: |M| = 48
```

### Symmetry Reduction

Many cube positions are equivalent under symmetry:

```
If state s can be solved in k moves,
then all 48 symmetric copies of s can also be solved in k moves.

This reduces effective search space by up to 48×.
```

---

## 3.1.12 Key Takeaways

1. **Group structure**: Cube states form a group under move composition.

2. **Generators**: 6 face moves generate all 4.3×10¹⁹ configurations.

3. **Permutations + Orientations**: Complete state = piece positions + piece orientations.

4. **Parity constraints**: Only 1/12 of naive arrangements are reachable.

5. **Subgroups**: G₁ (half-turn subgroup) is key to two-phase solving.

6. **God's Number = 20**: No position requires more than 20 moves.

---

## References

- Joyner, D. (2008). *Adventures in Group Theory: Rubik's Cube, Merlin's Machine, and Other Mathematical Toys*
- Rokicki, T., et al. (2010). "God's Number is 20"
- [Cube Explorer](http://kociemba.org/cube.htm) by Herbert Kociemba

---

## Next Module

[→ Module 3.2: The Kociemba Algorithm](./03-2-kociemba.md)

See how group theory enables efficient solving through the two-phase search strategy.
