# RepoPulse

GitHub repository analytics charts — right from your terminal.

```
repopulse vercel/next.js --chart stars
repopulse vercel/next.js --chart commits
repopulse vercel/next.js --chart contributors
repopulse vercel/next.js --chart languages
repopulse vercel/next.js --readme-stars
```

## Prerequisites

Requires the [GitHub CLI](https://cli.github.com) to be installed and authenticated:

```bash
brew install gh   # macOS
gh auth login
```

## Install

```bash
pnpm install
pnpm build
npm link   # or: node dist/cli.js
```

## Usage

```
repopulse <owner/repo> [options]

Arguments:
  <repo>              Repository in owner/repo format (e.g., vercel/next.js)

Options:
  --chart <type>      Chart type: stars | commits | contributors | languages  (default: stars)
  --readme-stars      Generate a stars.svg badge for README embedding
  --output <path>     Output file path
  --all               Fetch all pages (may be slow for large repos)
  -v, --version       Output the version number
  -h, --help          Display help
```

## Charts

| Flag | Output | Description |
|------|--------|-------------|
| `--chart stars` | `stars-chart.png` | Cumulative star growth over time |
| `--chart commits` | `commits-chart.png` | Weekly commit activity |
| `--chart contributors` | `contributors-chart.png` | Top 20 contributors by commits |
| `--chart languages` | `languages-chart.png` | Language breakdown (doughnut) |
| `--readme-stars` | `stars.svg` | Dark-theme SVG badge for README |

## README Stars Badge

```bash
repopulse vercel/next.js --readme-stars
```

Outputs `stars.svg` and prints the embed snippet:

```markdown
![Stars Growth](./stars.svg)
```

Drop it in your README for a live-looking stars chart — similar to GitHub Readme Stats.

## Authentication

RepoPulse uses the **GitHub CLI** (`gh`) for all API calls — no tokens to manage. Just run `gh auth login` once and you're set. Authenticated requests get 5,000 req/hour vs 60 for unauthenticated.

## Examples

```bash
# Stars chart
repopulse ankitlb/commandcode --chart stars

# Full commit history
repopulse vercel/next.js --chart commits --all

# Language breakdown
repopulse microsoft/vscode --chart languages

# README badge
repopulse facebook/react --readme-stars --output react-stars.svg
```

## Development

```bash
pnpm install
pnpm build        # compile TypeScript → dist/
pnpm test         # run vitest
```
