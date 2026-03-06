import type { Stargazer } from './github.js';

export function processStarsData(stargazers: Stargazer[]): { date: string; cumulative: number }[] {
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
