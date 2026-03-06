import { spawn } from 'child_process';

function ghSpawn(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('gh', args);
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

    proc.on('error', (err) => {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(new Error('GitHub CLI (gh) not found. Install it: https://cli.github.com'));
      } else {
        reject(err);
      }
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `gh exited with code ${code}`));
      } else {
        resolve(stdout);
      }
    });
  });
}

async function ghApiSingle<T>(endpoint: string, extraHeaders: string[] = []): Promise<T> {
  const args = ['api', endpoint];
  for (const h of extraHeaders) args.push('--header', h);
  const raw = await ghSpawn(args);
  return JSON.parse(raw) as T;
}

async function ghApiPaginated<T>(
  endpoint: string,
  extraHeaders: string[] = [],
  maxPages = Infinity
): Promise<T[]> {
  const results: T[] = [];
  let page = 1;

  while (page <= maxPages) {
    const sep = endpoint.includes('?') ? '&' : '?';
    const url = `${endpoint}${sep}per_page=100&page=${page}`;
    const data = await ghApiSingle<T[]>(url, extraHeaders);

    if (!Array.isArray(data) || data.length === 0) break;
    results.push(...data);
    if (data.length < 100) break;
    page++;
  }

  return results;
}

export async function checkGhAuth(): Promise<void> {
  await ghSpawn(['auth', 'status']).catch(() => {
    throw new Error('Not authenticated with GitHub CLI. Run: gh auth login');
  });
}

export interface Stargazer {
  starred_at: string;
  user: { login: string };
}

export interface Commit {
  commit: { author: { date: string; name: string } };
}

export interface Contributor {
  login: string;
  contributions: number;
  avatar_url: string;
}

export type Languages = Record<string, number>;

export interface RepoInfo {
  name: string;
  full_name: string;
  stargazers_count: number;
  description: string | null;
}

export async function fetchStargazers(
  owner: string,
  repo: string,
  maxPages?: number
): Promise<Stargazer[]> {
  return ghApiPaginated<Stargazer>(
    `/repos/${owner}/${repo}/stargazers`,
    ['Accept: application/vnd.github.v3.star+json'],
    maxPages
  );
}

// GitHub's stargazers API is hard-capped at 400 pages (40,000 results).
const GH_STARGAZERS_MAX_PAGES = 400;

/**
 * Fast sampled fetch: picks N evenly-spaced pages across the accessible star
 * history and fetches them all in parallel — no sequential page walking.
 *
 * Note: GitHub caps the stargazers endpoint at 400 pages (40k stars). For
 * repos with more stars, only the first 40k are accessible via this API.
 */
export async function fetchStargazersSampled(
  owner: string,
  repo: string,
  totalStars: number,
  targetPoints = 500
): Promise<{ stargazers: Stargazer[]; capped: boolean }> {
  const rawPages = Math.max(1, Math.ceil(totalStars / 100));
  const capped = rawPages > GH_STARGAZERS_MAX_PAGES;
  const totalPages = Math.min(rawPages, GH_STARGAZERS_MAX_PAGES);
  const pagesToFetch = Math.min(totalPages, Math.ceil(targetPoints / 100));

  const pageNums =
    pagesToFetch === 1
      ? [1]
      : Array.from({ length: pagesToFetch }, (_, i) =>
          Math.round(1 + (i / (pagesToFetch - 1)) * (totalPages - 1))
        );

  const unique = [...new Set(pageNums)];

  const results = await Promise.all(
    unique.map((page) =>
      ghApiSingle<Stargazer[]>(
        `/repos/${owner}/${repo}/stargazers?per_page=100&page=${page}`,
        ['Accept: application/vnd.github.v3.star+json']
      ).catch(() => [] as Stargazer[])
    )
  );

  const stargazers = results.flat().sort((a, b) => a.starred_at.localeCompare(b.starred_at));
  return { stargazers, capped };
}

interface CommitActivityWeek {
  week: number;  // Unix timestamp
  total: number;
  days: number[];
}

export interface CommitWeek {
  week: string;  // ISO date string
  count: number;
}

export async function fetchCommitActivity(
  owner: string,
  repo: string
): Promise<CommitWeek[]> {
  const data = await ghApiSingle<CommitActivityWeek[]>(
    `/repos/${owner}/${repo}/stats/commit_activity`
  );
  return data
    .filter((w) => w.total > 0)
    .map((w) => ({
      week: new Date(w.week * 1000).toISOString().split('T')[0],
      count: w.total,
    }));
}

export async function fetchContributors(owner: string, repo: string): Promise<Contributor[]> {
  return ghApiPaginated<Contributor>(`/repos/${owner}/${repo}/contributors`);
}

export async function fetchLanguages(owner: string, repo: string): Promise<Languages> {
  return ghApiSingle<Languages>(`/repos/${owner}/${repo}/languages`);
}

export async function fetchRepoInfo(owner: string, repo: string): Promise<RepoInfo> {
  return ghApiSingle<RepoInfo>(`/repos/${owner}/${repo}`);
}
