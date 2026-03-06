# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# cli
See [cli/taste.md](cli/taste.md)

# typescript
See [typescript/taste.md](typescript/taste.md)
# architecture
- Use pure functions only — no classes, `this`, `new` (except `Map`/`Set`/`Error`), or OOP patterns. Confidence: 0.90
- No prototypes, inheritance, instance methods, or stateful objects with methods. Confidence: 0.90
- Use plain objects and arrays for data; compose functions instead of inheriting. Confidence: 0.85
- Pass state explicitly as parameters; keep data transforms immutable. Confidence: 0.85
- Functions with more than one parameter should be passed as an object for readability. Confidence: 0.90

# code-style
See [code-style/taste.md](code-style/taste.md)
# workflow
- Dev loop order: `pnpm test` → `pnpm lint` → `pnpm typecheck` (`tsc --noEmit`) → `pnpm build` → commit. Confidence: 0.85
- Always run `pnpm build` as it catches circular deps and export issues other checks miss. Confidence: 0.85
- Write tests for new functionality before committing. Confidence: 0.85

# slash-commands
- Prefer creating slash commands at user-level (global, `~/.commandcode/commands/`) rather than project-level. Confidence: 0.75

# plans
- Write plan files inside the project directory (e.g., `./plans/` or `.commandcode/plans/` within the repo), not globally in `~/.commandcode/plans/`. Confidence: 0.75

# git
- Follow Conventional Commits format: `<type>: <description>` with optional body. Confidence: 0.90
- Conventional Commit types to use: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`. Confidence: 0.90

# github-api
- Use the GitHub CLI (`gh api`) for GitHub API calls instead of direct fetch + token management; `gh` handles auth automatically via `gh auth login`. Confidence: 0.70
- When gh CLI is not installed, use clack prompts to offer inline installation (detect OS/package manager) and run `gh auth login` before continuing. Confidence: 0.70
- Default GitHub data fetching to a small page limit (e.g., 10 pages) for speed; provide an `--all` flag for exhaustive fetching. Confidence: 0.70

# canvas
- Use `@napi-rs/canvas` instead of `canvas` (node-canvas) or `chartjs-node-canvas` for server-side canvas rendering; it uses NAPI-RS (ABI-stable, prebuilt binaries for all platforms, no system Cairo required). Confidence: 0.70

# terminal-output
- Prefer rendering output directly in the terminal over saving to files when possible. Confidence: 0.65
