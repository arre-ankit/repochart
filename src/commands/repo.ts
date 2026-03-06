import ora from 'ora';
import pc from 'picocolors';
import { confirm, cancel } from '@clack/prompts';
import { ensureGhReady } from '../lib/setup.js';
import {
  checkGhAuth,
  fetchStargazersSampled,
  fetchCommits,
  fetchContributors,
  fetchLanguages,
  fetchRepoInfo,
  type Stargazer,
  type Commit,
} from '../lib/github.js';
import {
  renderStarsChart,
  renderCommitsChart,
  renderContributorsChart,
  renderLanguagesChart,
} from '../lib/render.js';
import { generateStarsSVG as buildStarsSVG } from '../lib/charts.js';

type ChartType = 'stars' | 'commits' | 'contributors' | 'languages';

interface RepoOptions {
  chart: ChartType;
  readmeStars?: boolean;
  output?: string;
  all?: boolean;
}

const DEFAULT_COMMIT_PAGES = 10;

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
      cancel('Run `gh auth login` then re-run repopulse.');
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
    // ── README SVG ────────────────────────────────────────────────────────────
    if (options.readmeStars) {
      spinner.text = 'Fetching repo info...';
      const repoInfo = await fetchRepoInfo(owner, repoName);

      spinner.text = `Sampling star history (${fmtNum(repoInfo.stargazers_count)} stars)...`;
      const stargazers = await fetchStargazersSampled(owner, repoName, repoInfo.stargazers_count);
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
        const stargazers = await fetchStargazersSampled(owner, repoName, repoInfo.stargazers_count);
        spinner.stop();

        renderStarsChart(processStarsData(stargazers), owner, repoName, repoInfo.stargazers_count);
        break;
      }

      case 'commits': {
        const maxPages = options.all ? Infinity : DEFAULT_COMMIT_PAGES;
        spinner.text = 'Fetching commits...';
        const commits = await fetchCommits(owner, repoName, maxPages);
        spinner.stop();

        renderCommitsChart(processCommitsData(commits), owner, repoName);
        if (!options.all && commits.length >= maxPages * 100) {
          console.log(pc.yellow('  ⚠  Showing partial history. Use --all for the full dataset.\n'));
        }
        break;
      }

      case 'contributors': {
        spinner.text = 'Fetching contributors...';
        const contributors = await fetchContributors(owner, repoName);
        spinner.stop();

        renderContributorsChart(contributors, owner, repoName);
        break;
      }

      case 'languages': {
        spinner.text = 'Fetching languages...';
        const languages = await fetchLanguages(owner, repoName);
        spinner.stop();

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

function processStarsData(stargazers: Stargazer[]): { date: string; cumulative: number }[] {
  const byDay = new Map<string, number>();
  for (const s of stargazers) {
    const d = s.starred_at.split('T')[0];
    byDay.set(d, (byDay.get(d) ?? 0) + 1);
  }
  let cum = 0;
  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, n]) => { cum += n; return { date, cumulative: cum }; });
}

function processCommitsData(commits: Commit[]): { week: string; count: number }[] {
  const byWeek = new Map<string, number>();
  for (const c of commits) {
    const w = weekStart(new Date(c.commit.author.date));
    byWeek.set(w, (byWeek.get(w) ?? 0) + 1);
  }
  return Array.from(byWeek.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, count]) => ({ week, count }));
}

function weekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  return d.toISOString().split('T')[0];
}
