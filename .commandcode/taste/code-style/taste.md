# code-style
- Errors first, happy path last — guard clauses up top, main logic at the bottom. Confidence: 0.90
- Never nest deeper than 2-3 levels (ideally 1 level max); flatten with early `return`, `continue`, `break`. Confidence: 0.90
- Avoid switch/case and else — use if guard clauses with early returns almost always. Confidence: 0.90
- Always name async results — never bare `await Promise.all(...)` or `return Promise.all(...)`; name describes what was collected. Confidence: 0.85
- Max 1 level of nesting inside any function; extract a helper if level 2 is needed. Confidence: 0.85
- No generic names like `result`, `data`, `nested`, `items` — use descriptive names for what the variable actually contains. Confidence: 0.85
- Use Biome for linting and formatting. Confidence: 0.85
