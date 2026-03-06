import ora from 'ora';
import pc from 'picocolors';
import { confirm, cancel } from '@clack/prompts';
import { ensureGhReady } from '../lib/setup.js';
import {
  checkGhAuth,
  fetchStargazersSampled,
  fetchCommitActivity,
  fetchContributors,
  fetchLanguages,
  fetchRepoInfo,
} from '../lib/github.js';
import {
  renderStarsChart,
  renderCommitsChart,
  renderContributorsChart,
  renderLanguagesChart,
  renderOwnerAvatar,
} from '../lib/render.js';
import { generateStarsSVG as buildStarsSVG } from '../lib/charts.js';
import { processStarsData } from '../lib/process.js';

type ChartType = 'stars' | 'commits' | 'contributors' | 'languages';

interface RepoOptions {
  chart: ChartType;
  overview?: boolean;
  readmeStars?: boolean;
  output?: string;
  all?: boolean;
}

export async function handleRepo(repo: string, options: RepoOptions): Promise<void> {
  const parts = repo.split('/');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    console.error(pc.red('Error: Repository must be in owner/repo format (e.g., vercel/next.js)'));
    process.exit(1);
  }

  const [owner, repoName] = parts;

  await ensureGhReady();

  const authSpinner = ora({ text: 'Checking gh auth...', color: 'gray' }).start();
  try {
    await checkGhAuth();
    authSpinner.stop();
  } catch {
    authSpinner.stop();
    console.log('');
    const shouldLogin = await confirm({
      message: 'Not logged in to GitHub CLI. Run gh auth login now?',
      initialValue: true,
    });
    if (shouldLogin !== true) {
      cancel('Run `gh auth login` then re-run repochart.');
      process.exit(0);
    }
    const { spawn } = await import('child_process');
    await new Promise<void>((resolve, reject) => {
      const proc = spawn('gh', ['auth', 'login'], { stdio: 'inherit' });
      proc.on('close', (code) => (code === 0 ? resolve() : reject()));
      proc.on('error', reject);
    }).catch(() => {
      console.error(pc.red('Authentication failed. Run `gh auth login` manually.'));
      process.exit(1);
    });
  }

  const spinner = ora({
    text: `Fetching data for ${pc.cyan(`${owner}/${repoName}`)}...`,
    color: 'cyan',
  }).start();

  try {
    // ── Overview: all charts ──────────────────────────────────────────────────
    if (options.overview) {
      spinner.text = 'Fetching repo info...';
      const repoInfo = await fetchRepoInfo(owner, repoName);

      spinner.text = `Fetching all stats for ${pc.cyan(`${owner}/${repoName}`)}...`;
      const [{ stargazers, capped }, weeks, contributors, languages] = await Promise.all([
        fetchStargazersSampled(owner, repoName, repoInfo.stargazers_count),
        fetchCommitActivity(owner, repoName),
        fetchContributors(owner, repoName),
        fetchLanguages(owner, repoName),
      ]);
      spinner.stop();

      await renderOwnerAvatar({ owner, repo: repoName });
      renderStarsChart(processStarsData(stargazers), owner, repoName, repoInfo.stargazers_count, capped);
      renderCommitsChart(weeks, owner, repoName);
      renderContributorsChart(contributors, owner, repoName);
      renderLanguagesChart(languages, owner, repoName);
      return;
    }

    // ── README SVG ────────────────────────────────────────────────────────────
    if (options.readmeStars) {
      spinner.text = 'Fetching repo info...';
      const repoInfo = await fetchRepoInfo(owner, repoName);

      spinner.text = `Sampling star history (${fmtNum(repoInfo.stargazers_count)} stars)...`;
      const { stargazers } = await fetchStargazersSampled(owner, repoName, repoInfo.stargazers_count);
      const starsData = processStarsData(stargazers);

      spinner.text = 'Generating SVG...';
      const outputPath = options.output ?? 'stars.svg';
      await buildStarsSVG(starsData, owner, repoName, repoInfo.stargazers_count, outputPath);

      spinner.succeed(`Generated ${pc.green(outputPath)}`);
      console.log(`\n${pc.gray('README embed:')}`);
      console.log(pc.cyan(`![Stars Growth](${outputPath})`));
      return;
    }

    // ── Terminal charts ───────────────────────────────────────────────────────
    switch (options.chart) {
      case 'stars': {
        spinner.text = 'Fetching repo info...';
        const repoInfo = await fetchRepoInfo(owner, repoName);

        spinner.text = `Sampling star history (${fmtNum(repoInfo.stargazers_count)} stars)...`;
        const { stargazers, capped } = await fetchStargazersSampled(owner, repoName, repoInfo.stargazers_count);
        spinner.stop();

        await renderOwnerAvatar({ owner, repo: repoName });
        renderStarsChart(processStarsData(stargazers), owner, repoName, repoInfo.stargazers_count, capped);
        break;
      }

      case 'commits': {
        spinner.text = 'Fetching commit activity...';
        const weeks = await fetchCommitActivity(owner, repoName);
        spinner.stop();

        await renderOwnerAvatar({ owner, repo: repoName });
        renderCommitsChart(weeks, owner, repoName);
        break;
      }

      case 'contributors': {
        spinner.text = 'Fetching contributors...';
        const contributors = await fetchContributors(owner, repoName);
        spinner.stop();

        await renderOwnerAvatar({ owner, repo: repoName });
        renderContributorsChart(contributors, owner, repoName);
        break;
      }

      case 'languages': {
        spinner.text = 'Fetching languages...';
        const languages = await fetchLanguages(owner, repoName);
        spinner.stop();

        await renderOwnerAvatar({ owner, repo: repoName });
        renderLanguagesChart(languages, owner, repoName);
        break;
      }

      default: {
        spinner.fail(`Unknown chart type: ${options.chart}`);
        console.error(pc.red('Supported types: stars, commits, contributors, languages'));
        process.exit(1);
      }
    }
  } catch (err) {
    spinner.fail('Failed to fetch data');
    console.error(pc.red((err as Error).message));
    process.exit(1);
  }
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}




