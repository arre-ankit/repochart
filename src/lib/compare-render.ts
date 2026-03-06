import pc from 'picocolors';
import type { Contributor, Languages, CommitWeek } from './github.js';

const SPARK = '▁▂▃▄▅▆▇█';

function stripAnsi(s: string): string {
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

function visibleLen(s: string): number {
  return stripAnsi(s).length;
}

// Pad OR truncate a string to exactly `width` visible characters.
function fitVisible(s: string, width: number): string {
  const vis = visibleLen(s);
  if (vis < width) return s + ' '.repeat(width - vis);
  if (vis === width) return s;
  // Need to truncate — walk chars keeping a running visible count.
  // We strip ANSI for simplicity; colour in overflowing lines is rare.
  const plain = stripAnsi(s);
  return plain.slice(0, width);
}

function colW(): number {
  const term = process.stdout.columns || 120;
  return Math.max(36, Math.floor((term - 5) / 2));
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

function fmtDate(d: string): string {
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

function sparkLine(values: number[], width: number, color: (s: string) => string): string {
  if (values.length === 0) return color('─'.repeat(width));
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

function sideBySide(left: string[], right: string[], col: number): void {
  const len = Math.max(left.length, right.length);
  const div = pc.gray('│');
  for (let i = 0; i < len; i++) {
    const l = fitVisible(left[i] ?? '', col);
    const r = right[i] ?? '';
    console.log(`${l}  ${div}  ${r}`);
  }
}

function sectionDivider(col: number): void {
  const line = pc.gray('─'.repeat(col));
  const mid = pc.gray('┼');
  console.log(`${line}  ${mid}  ${line}`);
}

export interface CompareData {
  repoA: string;
  repoB: string;
  starsA: { date: string; cumulative: number }[];
  starsB: { date: string; cumulative: number }[];
  totalStarsA: number;
  totalStarsB: number;
  commitsA: CommitWeek[];
  commitsB: CommitWeek[];
  contributorsA: Contributor[];
  contributorsB: Contributor[];
  languagesA: Languages;
  languagesB: Languages;
}

export function renderComparison(d: CompareData): void {
  const col = colW();
  // sparkline fills col minus the 2-char left indent
  const sparkW = col - 2;

  console.log('');

  // ── Header ────────────────────────────────────────────────────────────────
  sideBySide(
    [pc.bold(pc.cyan(d.repoA))],
    [pc.bold(pc.cyan(d.repoB))],
    col
  );
  sectionDivider(col);

  // ── Stars ─────────────────────────────────────────────────────────────────
  console.log('');
  const starsWinner = d.totalStarsA >= d.totalStarsB;
  const starsNumA = starsWinner
    ? pc.green(pc.bold(fmtNum(d.totalStarsA)))
    : pc.dim(fmtNum(d.totalStarsA));
  const starsNumB = !starsWinner
    ? pc.green(pc.bold(fmtNum(d.totalStarsB)))
    : pc.dim(fmtNum(d.totalStarsB));

  sideBySide([pc.bold('⭐ Stars')], [pc.bold('⭐ Stars')], col);
  sideBySide(
    [`  ${starsNumA} total stars`],
    [`  ${starsNumB} total stars`],
    col
  );

  if (d.starsA.length > 0 && d.starsB.length > 0) {
    sideBySide(
      [`  ${sparkLine(d.starsA.map((s) => s.cumulative), sparkW, pc.yellow)}`],
      [`  ${sparkLine(d.starsB.map((s) => s.cumulative), sparkW, pc.yellow)}`],
      col
    );
    sideBySide(
      [`  ${pc.gray('Since  ')}${fmtDate(d.starsA[0].date)}`],
      [`  ${pc.gray('Since  ')}${fmtDate(d.starsB[0].date)}`],
      col
    );
  }

  // ── Commits ───────────────────────────────────────────────────────────────
  console.log('');
  sectionDivider(col);
  console.log('');

  const totalCommitsA = d.commitsA.reduce((s, w) => s + w.count, 0);
  const totalCommitsB = d.commitsB.reduce((s, w) => s + w.count, 0);
  const commitsWinner = totalCommitsA >= totalCommitsB;
  const commitsNumA = commitsWinner
    ? pc.green(pc.bold(totalCommitsA.toLocaleString()))
    : pc.dim(totalCommitsA.toLocaleString());
  const commitsNumB = !commitsWinner
    ? pc.green(pc.bold(totalCommitsB.toLocaleString()))
    : pc.dim(totalCommitsB.toLocaleString());

  const peakA = d.commitsA.length ? Math.max(...d.commitsA.map((w) => w.count)) : 0;
  const peakB = d.commitsB.length ? Math.max(...d.commitsB.map((w) => w.count)) : 0;
  const avgA = d.commitsA.length ? Math.round(totalCommitsA / d.commitsA.length) : 0;
  const avgB = d.commitsB.length ? Math.round(totalCommitsB / d.commitsB.length) : 0;

  sideBySide(
    [pc.bold('📊 Commits') + pc.gray('  last 52 weeks')],
    [pc.bold('📊 Commits') + pc.gray('  last 52 weeks')],
    col
  );
  sideBySide([`  ${commitsNumA} commits`], [`  ${commitsNumB} commits`], col);

  if (d.commitsA.length > 0 || d.commitsB.length > 0) {
    sideBySide(
      [`  ${sparkLine(d.commitsA.map((w) => w.count), sparkW, pc.green)}`],
      [`  ${sparkLine(d.commitsB.map((w) => w.count), sparkW, pc.green)}`],
      col
    );
  }

  sideBySide(
    [`  ${pc.gray('Peak  ')}${peakA.toLocaleString()}  ${pc.gray('Avg  ')}${avgA.toLocaleString()}`],
    [`  ${pc.gray('Peak  ')}${peakB.toLocaleString()}  ${pc.gray('Avg  ')}${avgB.toLocaleString()}`],
    col
  );

  // ── Contributors ──────────────────────────────────────────────────────────
  console.log('');
  sectionDivider(col);
  console.log('');

  const topA = d.contributorsA.slice(0, 8);
  const topB = d.contributorsB.slice(0, 8);
  const maxContribA = topA[0]?.contributions ?? 1;
  const maxContribB = topB[0]?.contributions ?? 1;
  const maxLoginA = Math.max(...topA.map((c) => c.login.length), 4);
  const maxLoginB = Math.max(...topB.map((c) => c.login.length), 4);

  // Line layout: "  " + rank(2) + "  " + login(maxLogin) + "  " + bar(barW) + "  " + count(6)
  // Fixed chars = 2+2+2+2+2 = 10, count reserved = 6  →  barW = col - 10 - maxLogin - 6
  const barWA = Math.max(6, col - 18 - maxLoginA);
  const barWB = Math.max(6, col - 18 - maxLoginB);

  sideBySide(
    [pc.bold('👥 Contributors') + pc.gray(`  ${d.contributorsA.length.toLocaleString()} total`)],
    [pc.bold('👥 Contributors') + pc.gray(`  ${d.contributorsB.length.toLocaleString()} total`)],
    col
  );

  const contribRows = Math.max(topA.length, topB.length);
  for (let i = 0; i < contribRows; i++) {
    const ca = topA[i];
    const cb = topB[i];
    const leftLine = ca
      ? `  ${pc.gray(String(i + 1).padStart(2))}  ${ca.login.padEnd(maxLoginA)}  ${hbar(ca.contributions, maxContribA, barWA, pc.magenta)}  ${pc.gray(ca.contributions.toLocaleString())}`
      : '';
    const rightLine = cb
      ? `  ${pc.gray(String(i + 1).padStart(2))}  ${cb.login.padEnd(maxLoginB)}  ${hbar(cb.contributions, maxContribB, barWB, pc.magenta)}  ${pc.gray(cb.contributions.toLocaleString())}`
      : '';
    sideBySide([leftLine], [rightLine], col);
  }

  // ── Languages ─────────────────────────────────────────────────────────────
  console.log('');
  sectionDivider(col);
  console.log('');

  const LANG_COLOR: Record<string, (s: string) => string> = {
    TypeScript: pc.blue,  JavaScript: pc.yellow, Python: pc.blue,
    Go: pc.cyan,          Ruby: pc.red,           CSS: pc.magenta,
    HTML: pc.red,         Shell: pc.green,        Vue: pc.green,
    Svelte: pc.red,       Kotlin: pc.magenta,     Swift: pc.red,
    Rust: pc.yellow,      Dart: pc.cyan,
  };

  const totalBytesA = Object.values(d.languagesA).reduce((a, b) => a + b, 0);
  const totalBytesB = Object.values(d.languagesB).reduce((a, b) => a + b, 0);
  const langsA = Object.entries(d.languagesA).sort(([, a], [, b]) => b - a).slice(0, 6);
  const langsB = Object.entries(d.languagesB).sort(([, a], [, b]) => b - a).slice(0, 6);
  const maxLangA = Math.max(...langsA.map(([l]) => l.length), 4);
  const maxLangB = Math.max(...langsB.map(([l]) => l.length), 4);

  // Line layout: "  " + lang(maxLang) + "  " + bar(langBarW) + "  " + pct(6)
  // Fixed chars = 2+2+2 = 6, pct = 6  →  langBarW = col - 12 - maxLang
  const langBarWA = Math.max(6, col - 12 - maxLangA);
  const langBarWB = Math.max(6, col - 12 - maxLangB);

  sideBySide([pc.bold('🌐 Languages')], [pc.bold('🌐 Languages')], col);

  const langRows = Math.max(langsA.length, langsB.length);
  for (let i = 0; i < langRows; i++) {
    const la = langsA[i];
    const lb = langsB[i];
    const leftLine = la
      ? `  ${la[0].padEnd(maxLangA)}  ${hbar(la[1], totalBytesA, langBarWA, LANG_COLOR[la[0]] ?? pc.white)}  ${pc.gray(`${((la[1] / totalBytesA) * 100).toFixed(1)}%`.padStart(6))}`
      : '';
    const rightLine = lb
      ? `  ${lb[0].padEnd(maxLangB)}  ${hbar(lb[1], totalBytesB, langBarWB, LANG_COLOR[lb[0]] ?? pc.white)}  ${pc.gray(`${((lb[1] / totalBytesB) * 100).toFixed(1)}%`.padStart(6))}`
      : '';
    sideBySide([leftLine], [rightLine], col);
  }

  console.log('');
}
