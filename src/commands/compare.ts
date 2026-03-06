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
import { processStarsData } from '../lib/process.js';
import { renderComparison } from '../lib/compare-render.js';

function parseRepo(raw: string): [string, string] | null {
  const parts = raw.split('/');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return [parts[0], parts[1]];
}

export async function handleCompare(repo1: string, repo2: string): Promise<void> {
  const a = parseRepo(repo1);
  const b = parseRepo(repo2);

  if (!a || !b) {
    console.error(pc.red('Both repos must be in owner/repo format (e.g., vercel/next.js)'));
    process.exit(1);
  }

  const [ownerA, nameA] = a;
  const [ownerB, nameB] = b;

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
    text: `Fetching ${pc.cyan(`${ownerA}/${nameA}`)} and ${pc.cyan(`${ownerB}/${nameB}`)}...`,
    color: 'cyan',
  }).start();

  try {
    const [infoA, infoB] = await Promise.all([
      fetchRepoInfo(ownerA, nameA),
      fetchRepoInfo(ownerB, nameB),
    ]);

    spinner.text = `Fetching all stats in parallel...`;

    const [
      { stargazers: sgA },
      { stargazers: sgB },
      commitsA,
      commitsB,
      contributorsA,
      contributorsB,
      languagesA,
      languagesB,
    ] = await Promise.all([
      fetchStargazersSampled(ownerA, nameA, infoA.stargazers_count),
      fetchStargazersSampled(ownerB, nameB, infoB.stargazers_count),
      fetchCommitActivity(ownerA, nameA),
      fetchCommitActivity(ownerB, nameB),
      fetchContributors(ownerA, nameA),
      fetchContributors(ownerB, nameB),
      fetchLanguages(ownerA, nameA),
      fetchLanguages(ownerB, nameB),
    ]);

    spinner.stop();

    renderComparison({
      repoA: `${ownerA}/${nameA}`,
      repoB: `${ownerB}/${nameB}`,
      starsA: processStarsData(sgA),
      starsB: processStarsData(sgB),
      totalStarsA: infoA.stargazers_count,
      totalStarsB: infoB.stargazers_count,
      commitsA,
      commitsB,
      contributorsA,
      contributorsB,
      languagesA,
      languagesB,
    });
  } catch (err) {
    spinner.fail('Failed to fetch data');
    console.error(pc.red((err as Error).message));
    process.exit(1);
  }
}
