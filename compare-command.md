# Plan: `repochart compare` — side-by-side repo comparison

## Usage
```
repochart compare vercel/next.js facebook/react
```

## Files to create / modify

| File | Action |
|------|--------|
| `src/commands/compare.ts` | **new** — fetch handler |
| `src/lib/compare-render.ts` | **new** — side-by-side rendering |
| `src/cli.ts` | add `compare` subcommand |
| `README.md` | document the command |

---

## 1. `src/cli.ts` — add subcommand

```ts
import { handleCompare } from './commands/compare.js';

program
  .command('compare <repo1> <repo2>')
  .description('Compare two repositories side by side in the terminal')
  .action(handleCompare);
```

The existing default command (single repo) stays unchanged.

---

## 2. `src/commands/compare.ts`

- Validate both repos are `owner/repo` format
- `ensureGhReady()` + `checkGhAuth()`
- Fetch both repos **fully in parallel** with `Promise.all`:
  ```ts
  const [infoA, infoB] = await Promise.all([fetchRepoInfo, fetchRepoInfo]);
  const [starsA, starsB, commitsA, commitsB, contribA, contribB, langsA, langsB]
    = await Promise.all([...8 fetches...]);
  ```
- Call `renderComparison(...)` from `compare-render.ts`

---

## 3. `src/lib/compare-render.ts` — layout engine

### Core helpers

```ts
function stripAnsi(s: string): string  // strip \x1b[...m codes
function padVisible(s: string, width: number): string  // pad to visible width
function colWidth(): number  // Math.floor((terminal - 5) / 2), min 30
```

### `sideBySide(left: string[], right: string[], col: number)`
Zips two line arrays, pads left column to `col` visible chars, joins with `  │  ` divider.

### `renderComparison(data)` — sections rendered in order:

**Header**
```
  vercel/next.js                    │  facebook/react
  ──────────────────────────────────┼──────────────────────────────────
```

**⭐ Stars**
- Section label row
- Total stars (highlighted if one is larger)
- Sparkline (each column gets `colWidth - 4` chars)
- First star date

**📊 Commits (last 52w)**
- Section label row
- Total commits count
- Sparkline
- Peak week / avg per week

**👥 Top Contributors** (top 8 each)
- Section label row
- One row per rank: `login  ████░░  count`
- Bar width = `colWidth - login_len - 12`
- Both sides share the same rank positions (zip)

**🌐 Languages** (top 6 each)
- Section label row
- One row per language: `Lang  ████░░  pct%`
- Each side independent (different langs per repo)

### Winner highlights
For scalar comparisons (total stars, total commits), use `pc.green` on the larger value and `pc.dim` on the smaller.

---

## 4. Data flow

```
compare.ts
  └─ fetchRepoInfo x2          (parallel)
  └─ fetchStargazersSampled x2 (parallel)
  └─ fetchCommitActivity x2    (parallel)
  └─ fetchContributors x2      (parallel)
  └─ fetchLanguages x2         (parallel)
  └─ processStarsData x2       (local)
  └─ renderComparison(...)
```

`processStarsData` is duplicated from `repo.ts` — extract it to a shared `src/lib/process.ts` utility so both commands can import it.

---

## 5. Shared utility — `src/lib/process.ts`

Move `processStarsData` out of `repo.ts` into here, export it. Import in both `repo.ts` and `compare.ts`.

---

## Verification

```bash
pnpm build                                    # must pass clean
repochart compare vercel/next.js facebook/react
repochart compare microsoft/vscode torvalds/linux
```

Expected: two columns separated by `│`, all 4 sections, winner highlighted in green.
