import figlet from 'figlet';
import pc from 'picocolors';

export function showBanner(): void {
  const width = process.stdout.columns || 80;
  const font: figlet.Fonts = width >= 100 ? 'ANSI Shadow' : 'Small';

  try {
    const text = figlet.textSync('RepoPulse', { font });
    console.log(pc.white(text));
  } catch {
    const fallback = figlet.textSync('RepoPulse', { font: 'Standard' });
    console.log(pc.white(fallback));
  }

  console.log(pc.gray('  GitHub repository analytics charts\n'));
}
