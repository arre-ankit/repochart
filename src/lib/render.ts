import pc from 'picocolors';
import type { Contributor, Languages } from './github.js';

const SPARK = '▁▂▃▄▅▆▇█';

function cw(): number {
  return Math.min((process.stdout.columns || 80) - 6, 80);
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function fmtDateLong(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function sampleTo<T>(arr: T[], n: number): T[] {
  if (arr.length === 0 || n <= 0) return [];
  if (arr.length <= n) return arr;
  if (n === 1) return [arr[0]];
  return Array.from({ length: n }, (_, i) =>
    arr[Math.round((i / (n - 1)) * (arr.length - 1))]
  );
}

function spark(values: number[], width: number, color: (s: string) => string): string {
  const max = Math.max(...values, 1);
  return color(
    sampleTo(values, width)
      .map((v) => SPARK[Math.min(Math.floor((v / max) * SPARK.length), SPARK.length - 1)])
      .join('')
  );
}

function hbar(value: number, max: number, width: number, color: (s: string) => string): string {
  const n = Math.max(0, Math.round((value / Math.max(max, 1)) * width));
  return color('█'.repeat(n)) + pc.gray('░'.repeat(width - n));
}

function dateRow(width: number, left: string, right: string): string {
  const gap = Math.max(1, width - left.length - right.length);
  return `  ${pc.gray(left)}${' '.repeat(gap)}${pc.gray(right)}`;
}

// ─── Stars ───────────────────────────────────────────────────────────────────

export function renderStarsChart(
  data: { date: string; cumulative: number }[],
  owner: string,
  repo: string,
  totalStars: number,
  capped = false
): void {
  const width = cw();

  console.log('');
  console.log(`  ${pc.bold('⭐ Stars Growth')} · ${pc.cyan(`${owner}/${repo}`)}`);
  console.log(`  ${pc.gray(`${fmtNum(totalStars)} total stars · ${data.length.toLocaleString()} points sampled`)}`);
  console.log('');

  if (data.length === 0) {
    console.log(pc.gray('  No star data available.'));
    console.log('');
    return;
  }

  console.log(`  ${spark(data.map((d) => d.cumulative), width, pc.yellow)}`);
  console.log(dateRow(width, fmtDate(data[0].date), fmtDate(data[data.length - 1].date)));
  console.log('');

  let peakDate = '';
  let peakDaily = 0;
  for (let i = 1; i < data.length; i++) {
    const daily = data[i].cumulative - data[i - 1].cumulative;
    if (daily > peakDaily) { peakDaily = daily; peakDate = data[i].date; }
  }

  console.log(`  ${pc.gray('First star   ')}${fmtDateLong(data[0].date)}`);
  if (peakDate) {
    console.log(`  ${pc.gray('Peak day     ')}${fmtDateLong(peakDate)}  ${pc.yellow(`+${peakDaily.toLocaleString()} stars`)}`);
  }
  console.log('');
}

// ─── Commits ─────────────────────────────────────────────────────────────────

export function renderCommitsChart(
  data: { week: string; count: number }[],
  owner: string,
  repo: string
): void {
  const width = cw();
  const total = data.reduce((s, d) => s + d.count, 0);

  console.log('');
  console.log(`  ${pc.bold('📊 Commits Activity')} · ${pc.cyan(`${owner}/${repo}`)}`);
  console.log(`  ${pc.gray(`${total.toLocaleString()} commits · ${data.length} weeks`)}`);
  console.log('');

  if (data.length === 0) {
    console.log(pc.gray('  No commit data available.'));
    console.log('');
    return;
  }

  const values = data.map((d) => d.count);
  console.log(`  ${spark(values, width, pc.green)}`);
  console.log(dateRow(width, fmtDate(data[0].week), fmtDate(data[data.length - 1].week)));
  console.log('');

  const max = Math.max(...values);
  const avg = Math.round(total / data.length);
  console.log(`  ${pc.gray('Peak week    ')}${max.toLocaleString()} commits`);
  console.log(`  ${pc.gray('Avg / week   ')}${avg.toLocaleString()} commits`);
  console.log('');
}

// ─── Contributors ─────────────────────────────────────────────────────────────

export function renderContributorsChart(
  contributors: Contributor[],
  owner: string,
  repo: string
): void {
  const top = contributors.slice(0, 15);
  const maxVal = top[0]?.contributions ?? 1;
  const maxLabel = Math.max(...top.map((c) => c.login.length), 4);
  const barWidth = Math.min(cw() - maxLabel - 14, 40);

  console.log('');
  console.log(`  ${pc.bold('👥 Top Contributors')} · ${pc.cyan(`${owner}/${repo}`)}`);
  console.log(`  ${pc.gray(`${contributors.length.toLocaleString()} total contributors`)}`);
  console.log('');

  top.forEach((c, i) => {
    const rank = pc.gray(`${String(i + 1).padStart(2)}  `);
    const label = c.login.padEnd(maxLabel);
    const bar = hbar(c.contributions, maxVal, barWidth, pc.magenta);
    const count = pc.gray(c.contributions.toLocaleString());
    console.log(`  ${rank}${label}  ${bar}  ${count}`);
  });

  console.log('');
}

// ─── Languages ────────────────────────────────────────────────────────────────

const LANG_COLOR: Record<string, (s: string) => string> = {
  TypeScript: pc.blue,
  JavaScript: pc.yellow,
  Python:     pc.blue,
  Go:         pc.cyan,
  Ruby:       pc.red,
  CSS:        pc.magenta,
  HTML:       pc.red,
  Shell:      pc.green,
  Vue:        pc.green,
  Svelte:     pc.red,
  Kotlin:     pc.magenta,
  Swift:      pc.red,
  Rust:       pc.yellow,
  Dart:       pc.cyan,
};

export function renderLanguagesChart(
  languages: Languages,
  owner: string,
  repo: string
): void {
  const total = Object.values(languages).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(languages).sort(([, a], [, b]) => b - a).slice(0, 10);
  const maxLabel = Math.max(...sorted.map(([l]) => l.length), 4);
  const barWidth = Math.min(cw() - maxLabel - 10, 40);

  console.log('');
  console.log(`  ${pc.bold('🌐 Languages')} · ${pc.cyan(`${owner}/${repo}`)}`);
  console.log('');

  sorted.forEach(([lang, bytes]) => {
    const pct = (bytes / total) * 100;
    const label = lang.padEnd(maxLabel);
    const color = LANG_COLOR[lang] ?? pc.white;
    const bar = hbar(bytes, total, barWidth, color);
    const pctStr = `${pct.toFixed(1)}%`.padStart(6);
    console.log(`  ${label}  ${bar}  ${pc.gray(pctStr)}`);
  });

  console.log('');
}
