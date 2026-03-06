import { createCanvas } from '@napi-rs/canvas';
import { Chart, registerables } from 'chart.js';
import type { ChartConfiguration } from 'chart.js';
import { writeFile } from 'fs/promises';
import type { Contributor, Languages } from './github.js';

Chart.register(...registerables);

function sampleData<T>(data: T[], maxPoints: number): T[] {
  if (data.length <= maxPoints) return data;
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, i) => i % step === 0 || i === data.length - 1);
}

function fmtDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function fmtNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(Math.round(n));
}

function fmtDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

async function renderChart(
  config: ChartConfiguration,
  width: number,
  height: number,
  outputPath: string,
  background = 'white'
): Promise<void> {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  new Chart(ctx as unknown as CanvasRenderingContext2D, config);

  const buffer = canvas.toBuffer('image/png');
  await writeFile(outputPath, buffer);
}

export async function generateStarsChart(
  data: { date: string; cumulative: number }[],
  outputPath: string
): Promise<void> {
  const sampled = sampleData(data, 100);

  await renderChart(
    {
      type: 'line',
      data: {
        labels: sampled.map((d) => fmtDateLabel(d.date)),
        datasets: [
          {
            label: 'Total Stars',
            data: sampled.map((d) => d.cumulative),
            borderColor: '#58a6ff',
            backgroundColor: 'rgba(88, 166, 255, 0.12)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
          },
        ],
      },
      options: {
        responsive: false,
        animation: false,
        plugins: {
          legend: { display: true, position: 'top' },
          title: {
            display: true,
            text: '⭐ Stars Growth',
            font: { size: 18, weight: 'bold' },
            padding: { bottom: 20 },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { maxTicksLimit: 10, maxRotation: 45 },
          },
          y: {
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { callback: (v) => fmtNumber(Number(v)) },
          },
        },
      },
    },
    900,
    450,
    outputPath
  );
}

export async function generateCommitsChart(
  data: { week: string; count: number }[],
  outputPath: string
): Promise<void> {
  const sampled = sampleData(data, 52);

  await renderChart(
    {
      type: 'bar',
      data: {
        labels: sampled.map((d) => fmtDateLabel(d.week)),
        datasets: [
          {
            label: 'Commits per Week',
            data: sampled.map((d) => d.count),
            backgroundColor: 'rgba(63, 185, 80, 0.8)',
            borderColor: '#3fb950',
            borderWidth: 1,
            borderRadius: 3,
          },
        ],
      },
      options: {
        responsive: false,
        animation: false,
        plugins: {
          legend: { display: true, position: 'top' },
          title: {
            display: true,
            text: '📊 Commits Activity',
            font: { size: 18, weight: 'bold' },
            padding: { bottom: 20 },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { maxTicksLimit: 12, maxRotation: 45 } },
          y: { grid: { color: 'rgba(0,0,0,0.05)' }, beginAtZero: true },
        },
      },
    },
    900,
    450,
    outputPath
  );
}

export async function generateContributorsChart(
  contributors: Contributor[],
  outputPath: string
): Promise<void> {
  const top20 = contributors.slice(0, 20);

  await renderChart(
    {
      type: 'bar',
      data: {
        labels: top20.map((c) => c.login),
        datasets: [
          {
            label: 'Contributions',
            data: top20.map((c) => c.contributions),
            backgroundColor: 'rgba(188, 140, 255, 0.8)',
            borderColor: '#bc8cff',
            borderWidth: 1,
            borderRadius: 3,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: false,
        animation: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: '👥 Top Contributors',
            font: { size: 18, weight: 'bold' },
            padding: { bottom: 20 },
          },
        },
        scales: {
          x: { grid: { color: 'rgba(0,0,0,0.05)' }, beginAtZero: true },
          y: { grid: { display: false } },
        },
      },
    },
    900,
    600,
    outputPath
  );
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Elixir: '#6e4a7e',
};

function langColor(lang: string): string {
  if (LANG_COLORS[lang]) return LANG_COLORS[lang];
  const hash = lang.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return `hsl(${Math.abs(hash) % 360}, 60%, 50%)`;
}

export async function generateLanguagesChart(
  languages: Languages,
  outputPath: string
): Promise<void> {
  const total = Object.values(languages).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  await renderChart(
    {
      type: 'doughnut',
      data: {
        labels: sorted.map(([lang, bytes]) => `${lang} (${((bytes / total) * 100).toFixed(1)}%)`),
        datasets: [
          {
            data: sorted.map(([, bytes]) => bytes),
            backgroundColor: sorted.map(([lang]) => langColor(lang)),
            borderWidth: 2,
            borderColor: 'white',
          },
        ],
      },
      options: {
        responsive: false,
        animation: false,
        plugins: {
          legend: {
            display: true,
            position: 'right',
            labels: { font: { size: 12 }, padding: 12 },
          },
          title: {
            display: true,
            text: '🌐 Languages',
            font: { size: 18, weight: 'bold' },
            padding: { bottom: 20 },
          },
        },
      },
    },
    700,
    500,
    outputPath
  );
}

export async function generateStarsSVG(
  data: { date: string; cumulative: number }[],
  owner: string,
  repo: string,
  totalStars: number,
  outputPath: string
): Promise<void> {
  const svg = buildStarsSVG(data, owner, repo, totalStars);
  await writeFile(outputPath, svg, 'utf-8');
}

function buildStarsSVG(
  data: { date: string; cumulative: number }[],
  owner: string,
  repo: string,
  totalStars: number
): string {
  const W = 800;
  const H = 300;
  const pad = { top: 70, right: 40, bottom: 50, left: 65 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;

  const sampled = sampleData(data, 80);
  if (sampled.length < 2) {
    sampled.push({ date: new Date().toISOString().split('T')[0], cumulative: totalStars });
  }

  const maxVal = Math.max(...sampled.map((d) => d.cumulative), 1);

  const toX = (i: number) => pad.left + (i / (sampled.length - 1)) * cW;
  const toY = (v: number) => pad.top + cH - (v / maxVal) * cH;

  const pts = sampled.map((d, i) => ({ x: toX(i), y: toY(d.cumulative) }));
  const linePath = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');
  const fillPath = `${linePath} L${pts[pts.length - 1].x.toFixed(1)},${(pad.top + cH).toFixed(1)} L${pad.left},${(pad.top + cH).toFixed(1)} Z`;

  const gridLines = Array.from({ length: 5 }, (_, i) => ({
    y: pad.top + (i / 4) * cH,
    value: maxVal * (1 - i / 4),
  }));

  const xIdxs = [0, Math.floor(sampled.length / 2), sampled.length - 1];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#58a6ff" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#58a6ff" stop-opacity="0.02"/>
    </linearGradient>
    <clipPath id="chartClip">
      <rect x="${pad.left}" y="${pad.top}" width="${cW}" height="${cH}"/>
    </clipPath>
  </defs>

  <rect width="${W}" height="${H}" fill="#0d1117" rx="10" ry="10"/>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="none" stroke="#30363d" stroke-width="1" rx="10" ry="10"/>

  <text x="${W / 2}" y="28" text-anchor="middle" fill="#e6edf3" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" font-size="15" font-weight="600">&#11088; Stars Growth &#183; ${owner}/${repo}</text>
  <text x="${W / 2}" y="50" text-anchor="middle" fill="#8b949e" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" font-size="12">${fmtNumber(totalStars)} total stars</text>

  ${gridLines
    .map(
      ({ y, value }) => `
  <line x1="${pad.left}" y1="${y.toFixed(1)}" x2="${W - pad.right}" y2="${y.toFixed(1)}" stroke="#21262d" stroke-width="1"/>
  <text x="${pad.left - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" fill="#8b949e" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" font-size="10">${fmtNumber(value)}</text>`
    )
    .join('')}

  <g clip-path="url(#chartClip)">
    <path d="${fillPath}" fill="url(#areaGrad)"/>
    <path d="${linePath}" fill="none" stroke="#58a6ff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top + cH}" stroke="#30363d" stroke-width="1"/>
  <line x1="${pad.left}" y1="${pad.top + cH}" x2="${W - pad.right}" y2="${pad.top + cH}" stroke="#30363d" stroke-width="1"/>

  ${xIdxs
    .filter((i) => i < sampled.length)
    .map(
      (i) =>
        `<text x="${toX(i).toFixed(1)}" y="${(pad.top + cH + 18).toFixed(1)}" text-anchor="middle" fill="#8b949e" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" font-size="10">${fmtDateShort(sampled[i].date)}</text>`
    )
    .join('\n  ')}
</svg>`;
}
