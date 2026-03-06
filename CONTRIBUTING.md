# Contributing to RepoChart

Thanks for your interest in contributing! Here's how to get started.

## Prerequisites

- [Node.js](https://nodejs.org) v18+
- [pnpm](https://pnpm.io)
- [GitHub CLI](https://cli.github.com) installed and authenticated (`gh auth login`)

## Setup

```bash
git clone https://github.com/your-username/repochart.git
cd repochart
pnpm install
pnpm build
```

## Development Workflow

```bash
pnpm build       # compile TypeScript → dist/
```

Run the CLI locally after building:

```bash
pnpm link
repochart vercel/next.js --overview
```

## Submitting Changes

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Run `pnpm build` — all must pass
4. Commit using [Conventional Commits](https://www.conventionalcommits.org): `feat:`, `fix:`, `docs:`, `refactor:`, etc.
5. Open a pull request against `main`

## Reporting Issues

Open a [GitHub Issue](../../issues) with steps to reproduce, expected behavior, and actual behavior.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Questions

Reach out at arre.ankit@gmail.com or [@arre_ankit](https://x.com/arre_ankit) on X.
