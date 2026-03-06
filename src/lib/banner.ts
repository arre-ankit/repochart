import figlet from 'figlet';
import pc from 'picocolors';

export function showBanner(): void {
  const width = process.stdout.columns || 80;
  const font: figlet.Fonts = width >= 100 ? 'ANSI Shadow' : 'Small';

  try {
    const text = figlet.textSync('RepoChart', { font });
    console.log(pc.cyan(text));
  } catch {
    const fallback = figlet.textSync('RepoChart', { font: 'Standard' });
    console.log(pc.cyan(fallback));
  }

  console.log(pc.gray('  GitHub repository analytics · in your terminal\n'));
}
