# Module 3.2: The Kociemba Algorithm

*Two-phase search for near-optimal solutions*

---

## 3.2.1 The Two-Phase Strategy

Herbert Kociemba's algorithm (1992) solves the cube in two phases:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Two-Phase Strategy                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   PHASE 1                           PHASE 2                     │
│   ───────                           ───────                     │
│   Start: Any scrambled state        Start: State in G₁          │
│   Goal:  Reach subgroup G₁          Goal:  Reach solved state   │
│   Moves: All 18 moves               Moves: Only G₁ moves        │
│          (U,U',U2,D,D',D2,                 (U,U',U2,D,D',D2,    │
│           R,R',R2,L,L',L2,                  R2,L2,F2,B2)        │
│           F,F',F2,B,B',B2)                                      │
│                                                                 │
│         ┌───────┐        ┌───────┐        ┌───────┐            │
│         │ Start │──P1───▶│  G₁   │──P2───▶│Solved │            │
│         └───────┘        └───────┘        └───────┘            │
│                                                                 │
│   |G| ≈ 4×10¹⁹          |G₁| ≈ 2×10¹⁰                          │
│   Phase 1 ≤ 12 moves    Phase 2 ≤ 18 moves                     │
│   Combined: typically 17-19 moves, max 22                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Why Two Phases?

**Problem**: Searching directly for optimal solution (depth 20) in a graph with branching factor ~13 is infeasible: 13²⁰ ≈ 10²³ nodes.

**Solution**: Break into two easier subproblems:
- Phase 1: Shallow search (depth ≤ 12) to reach G₁
- Phase 2: Moderate search within smaller group G₁

---

## 3.2.2 The Subgroup G₁

G₁ is defined as:

```
G₁ = ⟨U, D, R², L², F², B²⟩
```

**Characterization**: A state is in G₁ if and only if:

1. **All edges are oriented** (flip = 0)
2. **All corners are oriented** (twist = 0)
3. **Middle-layer edges (FL, FR, BL, BR) are in the middle layer**

### G₁ Invariants

```
┌────────────────────────────────────────────────────────────┐
│  Invariant 1: Edge Orientation                             │
│  ─────────────────────────────────────────                 │
│  All 12 edges have flip = 0                                │
│  (No edge has its U/D color on an F/B face)                │
│                                                            │
│  Invariant 2: Corner Orientation                           │
│  ─────────────────────────────────────────                 │
│  All 8 corners have twist = 0                              │
│  (U/D color of each corner is on U/D face)                 │
│                                                            │
│  Invariant 3: E-Slice Edges                                │
│  ─────────────────────────────────────────                 │
│  The 4 "equator" edges (FL, FR, BL, BR) are                │
│  somewhere in the middle layer (positions 8-11)            │
└────────────────────────────────────────────────────────────┘
```

### Size of G₁

```
Corner positions:     8!  = 40,320
Edge positions:       8! × C(12,4) = 40,320 × 495 = 19,958,400
  (8 non-E-slice edges in 8 positions, times E-slice arrangement)

Wait, more carefully:
  - U/D edges (8): can be in any of 8 U/D positions: 8!
  - E edges (4): can be in any of 4 E positions: 4!
  - Corners (8): can be in any of 8 positions: 8!
  - Parity constraint: divide by 2

|G₁| = (8! × 4! × 8!) / 2 = 19,508,428,800
```

---

## 3.2.3 Coordinate Representation

Instead of storing full cube state, we use compact **coordinates**:

### Phase 1 Coordinates

| Coordinate | Description | Range |
|------------|-------------|-------|
| **twist** | Corner orientation | 0 to 3⁷-1 = 0-2186 |
| **flip** | Edge orientation | 0 to 2¹¹-1 = 0-2047 |
| **slice** | E-slice edge positions | 0 to C(12,4)-1 = 0-494 |

**Total Phase 1 states**: 2187 × 2048 × 495 ≈ 2.2 × 10⁹

### Phase 2 Coordinates

| Coordinate | Description | Range |
|------------|-------------|-------|
| **corners** | Corner permutation | 0 to 8!-1 = 0-40319 |
| **edges_ud** | U/D edge permutation | 0 to 8!-1 = 0-40319 |
| **edges_e** | E-slice edge permutation | 0 to 4!-1 = 0-23 |

**Total Phase 2 states**: 40320 × 40320 × 24 / 2 ≈ 2 × 10¹⁰

---

## 3.2.4 Encoding Coordinates

### Twist Coordinate (Corner Orientation)

Each corner has twist ∈ {0, 1, 2}. We encode 7 corners in base 3:

```
twist = Σᵢ₌₀⁶ (corner_twist[i] × 3ⁱ)

Example:
  Corners 0-6 have twists [0, 1, 2, 0, 1, 2, 1]
  twist = 0×1 + 1×3 + 2×9 + 0×27 + 1×81 + 2×243 + 1×729
        = 0 + 3 + 18 + 0 + 81 + 486 + 729 = 1317
```

**Note**: Corner 7's twist is determined by sum ≡ 0 (mod 3).

### Flip Coordinate (Edge Orientation)

Each edge has flip ∈ {0, 1}. Encode 11 edges in binary:

```
flip = Σᵢ₌₀¹⁰ (edge_flip[i] × 2ⁱ)

Range: 0 to 2047
```

### Slice Coordinate (E-Slice Position)

Which 4 of the 12 edge positions contain E-slice edges?

```
This is a combination: C(12, 4) = 495 possibilities

Encoding uses combinatorial number system:
  slice = Σⱼ C(posⱼ, j+1) for sorted positions [pos₀ < pos₁ < pos₂ < pos₃]
```

---

## 3.2.5 Move Tables

To search efficiently, we precompute how coordinates change with each move:

```
move_table[coord_type][coord_value][move] → new_coord_value
```

### Example: Twist Move Table

```
twist_move[2187][18]  // 2187 twist values × 18 moves

twist_move[1317][R] = 1580  // After R, twist 1317 becomes 1580
```

**Table size**: 2187 × 18 × 2 bytes ≈ 79 KB

### All Move Tables

| Table | Size | Memory |
|-------|------|--------|
| twist_move | 2187 × 18 | 79 KB |
| flip_move | 2048 × 18 | 74 KB |
| slice_move | 495 × 18 | 18 KB |
| corners_move | 40320 × 10 | 807 KB |
| edges_ud_move | 40320 × 10 | 807 KB |
| edges_e_move | 24 × 10 | 240 B |

**Total**: ~2 MB

---

## 3.2.6 Pruning Tables

**Pruning tables** store minimum moves to reach G₁ (phase 1) or solved (phase 2):

```
prune[coordinate] = minimum_moves_to_goal
```

### Phase 1 Pruning

We use multiple pruning tables and take the maximum:

```
prune_twist_flip[twist][flip]    // 2187 × 2048 entries
prune_twist_slice[twist][slice]  // 2187 × 495 entries
prune_flip_slice[flip][slice]    // 2048 × 495 entries

h(state) = max(prune_twist_flip[twist,flip],
               prune_twist_slice[twist,slice],
               prune_flip_slice[flip,slice])
```

### Admissibility

These heuristics are **admissible** (never overestimate):

```
h(s) ≤ actual_distance(s, goal)
```

This guarantees IDA* finds optimal solutions within each phase.

---

## 3.2.7 IDA* Search

**Iterative Deepening A*** (IDA*) combines depth-first search with A* pruning:

```
Algorithm: IDA*(start, goal, heuristic)
────────────────────────────────────────
1. threshold ← h(start)

2. Loop:
   result ← DFS(start, 0, threshold)
   if result = FOUND: return solution
   if result = ∞: return NOT_FOUND
   threshold ← result  // Increase depth limit

3. DFS(state, g, threshold):
   f ← g + h(state)
   if f > threshold: return f  // Pruned
   if state = goal: return FOUND
   
   min_threshold ← ∞
   for each move m:
     child ← apply(state, m)
     if not redundant(m):  // Prune R after R', etc.
       result ← DFS(child, g+1, threshold)
       if result = FOUND: return FOUND
       min_threshold ← min(min_threshold, result)
   
   return min_threshold
```

### Why IDA*?

| Algorithm | Space | Optimality | Notes |
|-----------|-------|------------|-------|
| BFS | O(bᵈ) | Yes | Runs out of memory |
| DFS | O(d) | No | Finds suboptimal solutions |
| A* | O(bᵈ) | Yes | Runs out of memory |
| **IDA*** | **O(d)** | **Yes** | Linear space, re-expands nodes |

---

## 3.2.8 Redundancy Elimination

Some move sequences are redundant:

```
R R' = identity      (cancel)
R R R R = identity   (4 quarter turns)
R R' L = L R R'      (commutative on opposite faces)
```

### Move Restriction Rules

After move m, don't immediately do:
1. The same face (R after R → do R2 instead)
2. The inverse (R' after R)
3. The opposite face if already done (L after R L → do R L first)

This reduces effective branching factor from 18 to ~13.

---

## 3.2.9 Complete Algorithm

```
Algorithm: Kociemba(cube_state)
───────────────────────────────
Input:  Cube state (facelet string or coordinates)
Output: Solution move sequence

// Initialization (done once at startup)
1. Generate move tables
2. Generate pruning tables

// Phase 1: Reduce to G₁
3. Compute coordinates: (twist, flip, slice) from cube_state
4. solution1 ← IDA*(
     start = (twist, flip, slice),
     goal = (0, 0, 0),  // All oriented, E-slice in place
     heuristic = phase1_prune,
     moves = all 18
   )

// Phase 2: Solve within G₁
5. Apply solution1 to cube_state to get intermediate_state
6. Compute coordinates: (corners, edges_ud, edges_e) from intermediate_state
7. solution2 ← IDA*(
     start = (corners, edges_ud, edges_e),
     goal = (0, 0, 0),  // Solved permutation
     heuristic = phase2_prune,
     moves = {U, U', U2, D, D', D2, R2, L2, F2, B2}
   )

8. Return solution1 + solution2
```

---

## 3.2.10 Performance Analysis

### Search Depth

| Phase | Average Depth | Max Depth |
|-------|---------------|-----------|
| Phase 1 | 7-8 | 12 |
| Phase 2 | 10-12 | 18 |
| **Total** | **17-19** | **22** |

### Time Complexity

```
Phase 1: O(13^d₁) where d₁ ≤ 12
Phase 2: O(10^d₂) where d₂ ≤ 18

Worst case: ~10⁹ nodes, but pruning reduces dramatically.
Typical: ~10⁵ - 10⁶ nodes, solving in 10-100ms.
```

### Space Complexity

```
Move tables: ~2 MB
Pruning tables: ~2 MB (compressed)
Search stack: O(d) = O(30)

Total: ~4 MB (fits in L3 cache on modern CPUs)
```

---

## 3.2.11 Optimality vs Near-Optimality

Kociemba finds solutions of length ≤22, but **God's Number is 20**.

```
┌────────────────────────────────────────────────────────────┐
│          Solution Quality                                  │
├────────────────────────────────────────────────────────────┤
│  Optimal (God's Number = 20):                              │
│    - Requires searching full state space                   │
│    - ~10⁵ times slower than Kociemba                       │
│    - Used for research, not real-time                      │
│                                                            │
│  Kociemba (≤22 moves):                                     │
│    - 2 extra moves worst case                              │
│    - 0-1 extra moves typical                               │
│    - ~1000× faster than optimal                            │
│    - Practical for real-time applications                  │
└────────────────────────────────────────────────────────────┘
```

### Improving Solutions

To find shorter solutions, repeat with different Phase 1 lengths:

```
for phase1_limit in [7, 8, 9, 10, 11, 12]:
  solution ← solve_with_limit(phase1_limit)
  if len(solution) < best:
    best ← solution
```

---

## 3.2.12 Visualization

```
                     Full State Space G
                     |G| ≈ 4.3 × 10¹⁹
                            │
                            │
    ┌───────────────────────┴───────────────────────┐
    │                                               │
    ▼                                               │
┌─────────┐                                         │
│ Random  │ ←── You are here                        │
│  State  │                                         │
└────┬────┘                                         │
     │                                              │
     │ Phase 1: ~7-12 moves                         │
     │ Using all 18 moves                           │
     │ Searching in coset space                     │
     │                                              │
     ▼                                              │
┌─────────────────────────────────────────────┐     │
│               Subgroup G₁                   │     │
│           |G₁| ≈ 2 × 10¹⁰                   │     │
│                                             │     │
│   ┌─────────┐                               │     │
│   │ Phase 1 │                               │     │
│   │ Result  │                               │     │
│   └────┬────┘                               │     │
│        │                                    │     │
│        │ Phase 2: ~10-18 moves              │     │
│        │ Using only 10 G₁ moves             │     │
│        │                                    │     │
│        ▼                                    │     │
│   ┌─────────┐                               │     │
│   │ SOLVED  │                               │     │
│   │    ●    │                               │     │
│   └─────────┘                               │     │
│                                             │     │
└─────────────────────────────────────────────┘     │
                                                    │
                    Complement of G₁ ───────────────┘
                    (states outside G₁)
```

---

## 3.2.13 Key Takeaways

1. **Two phases** divide the problem: reach G₁, then solve within G₁.

2. **Coordinate representation** compresses state to small integers.

3. **Move tables** enable O(1) state transitions.

4. **Pruning tables** provide admissible heuristics for IDA*.

5. **IDA*** finds optimal solutions with linear space.

6. **≤22 moves** guaranteed, typically 17-19 in practice.

---

## Next Module

[→ Module 3.3: Implementation Details](./03-3-implementation.md)

See how these concepts are implemented in code, including table generation and optimization techniques.
