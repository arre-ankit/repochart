# RepoChart

GitHub repository analytics charts — right from your terminal.

```
repochart vercel/next.js --chart stars
repochart vercel/next.js --chart commits
repochart vercel/next.js --chart contributors
repochart vercel/next.js --chart languages
repochart vercel/next.js --overview
repochart compare vercel/next.js facebook/react
repochart vercel/next.js --readme-stars
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
repochart <owner/repo> [options]

Arguments:
  <repo>              Repository in owner/repo format (e.g., vercel/next.js)

Options:
  --chart <type>      Chart type: stars | commits | contributors | languages  (default: stars)
  --overview          Show all stats at once: stars, commits, contributors, languages
  --readme-stars      Generate a stars.svg badge for README embedding
  --output <path>     Output file path
  --all               Fetch all pages (may be slow for large repos)
  -v, --version       Output the version number
  -h, --help          Display help
```

## Charts

| Flag | Description |
|------|-------------|
| `--chart stars` | Cumulative star growth over time |
| `--chart commits` | Weekly commit activity (last 52 weeks) |
| `--chart contributors` | Top 15 contributors by commits |
| `--chart languages` | Language breakdown |
| `--overview` | All four charts in one command |
| `compare <repo1> <repo2>` | Side-by-side comparison of two repos |
| `--readme-stars` | Dark-theme SVG badge for README |

## Compare two repos side by side

```bash
repochart compare vercel/next.js facebook/react
```

Fetches stars, commits, contributors, and languages for both repos in parallel and renders them side by side in the terminal. The winner in each numeric category (total stars, total commits) is highlighted in green.

## Overview — all stats at once

```bash
repochart vercel/next.js --overview
```

Fetches stars, commits, contributors, and languages in parallel and renders all four charts in your terminal.

## README Stars Badge

```bash
repochart vercel/next.js --readme-stars
```

Outputs `stars.svg` and prints the embed snippet:

```markdown
![Stars Growth](./stars.svg)
```

## Authentication

RepoChart uses the **GitHub CLI** (`gh`) for all API calls — no tokens to manage. Just run `gh auth login` once and you're set. Authenticated requests get 5,000 req/hour vs 60 for unauthenticated.

## Examples

```bash
# All stats in one shot
repochart vercel/next.js --overview

# Stars chart
repochart ankitlb/commandcode --chart stars

# Full commit history
repochart vercel/next.js --chart commits --all

# Language breakdown
repochart microsoft/vscode --chart languages

# README badge
repochart facebook/react --readme-stars --output react-stars.svg
```

## Development

```bash
pnpm install
pnpm build        # compile TypeScript → dist/
pnpm test         # run vitest
```
