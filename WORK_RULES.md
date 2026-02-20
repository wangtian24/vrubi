# Work Rules for Autonomous Development

## Core Principles

### 1. Always Be Verifiable
- Every step must have a clear verification criteria
- Don't move to next step until current step is verified
- If verification fails 3 times, stop and ask

### 2. Commit Early, Commit Often
- Commit after each completed sub-step (1.1, 1.2, etc.)
- Use conventional commits: `feat:`, `fix:`, `docs:`, `test:`
- Push after each phase completion at minimum

### 3. Journal Everything
- Update PROGRESS.md with timestamp for every step
- Include: what was done, verification result, any issues
- Note any deviations from plan

### 4. Time Boundaries
- If a single step exceeds 2x estimated time: STOP and reassess
- If total runtime exceeds 8 hours: take stock, update progress, pause
- Check wall clock every 30 minutes

### 5. Error Handling
- If a command fails: try once more, then log and move on or ask
- If tests fail: fix up to 3 attempts, then document and ask
- If build breaks: revert to last working commit, analyze

### 6. Communication Protocol
- **Progress update:** Discord after each phase completion
- **Blocker:** Discord immediately if stuck >30 min
- **Question:** Discord for uncertain decisions (especially if $ involved)
- **Completion:** Discord with summary and links

### 7. Resource Limits
- No external paid APIs without asking
- No `npm install` of packages >10MB without checking necessity
- No operations that could run indefinitely (always set timeouts)

### 8. Safety Rails
- Never force push
- Never delete without backup
- Run tests before committing
- Keep dev server in background, check it's not frozen

## Verification Checklist Per Phase

### Phase 1 Verification
- [ ] `npm run dev` starts without errors
- [ ] Browser shows a 3D cube
- [ ] Cube colors can be set programmatically
- [ ] Single move animation works (R, U, etc.)
- [ ] Move sequence plays correctly

### Phase 2 Verification
- [ ] `solve()` returns valid move string
- [ ] Known scrambles produce correct solutions
- [ ] Solver handles edge cases (already solved, etc.)

### Phase 3 Verification
- [ ] Camera feed displays in browser
- [ ] Test image → correct color extraction
- [ ] Multiple frames → accumulated state

### Phase 4 Verification
- [ ] End-to-end: camera → solution animation
- [ ] UI is usable without instructions
- [ ] Works on mobile viewport

## Recovery Procedures

### If dev server crashes:
```bash
# Kill any hanging processes
pkill -f vite
# Restart
npm run dev
```

### If npm install hangs:
```bash
# Kill and clean
pkill -f npm
rm -rf node_modules package-lock.json
npm install
```

### If state is corrupted:
```bash
# See recent commits
git log --oneline -10
# Reset to last known good
git reset --hard <commit>
```

## Progress Update Template

```markdown
## [Phase X.Y] — [Timestamp]

**Status:** ✅ Complete | 🔄 In Progress | ❌ Blocked

**What was done:**
- ...

**Verification:**
- [ ] Criteria 1
- [ ] Criteria 2

**Issues encountered:**
- ...

**Next:** Phase X.Z

**Time spent:** Xm
```
