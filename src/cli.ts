import { readFileSync } from 'fs';
import { join } from 'path';
import { Command } from 'commander';
import { showBanner } from './lib/banner.js';
import { handleRepo } from './commands/repo.js';

const pkg = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf-8')
) as { version: string };

const isVersionOrHelp = process.argv.some((a) => a === '-v' || a === '--version');
if (!isVersionOrHelp) showBanner();

const program = new Command();

program
  .name('repopulse')
  .description('GitHub repository analytics charts')
  .version(pkg.version, '-v, --version')
  .helpOption('-h, --help')
  .argument('<repo>', 'Repository in owner/repo format (e.g., vercel/next.js)')
  .option('--chart <type>', 'Chart type: stars | commits | contributors | languages', 'stars')
  .option('--readme-stars', 'Generate a stars.svg badge for README embedding')
  .option('--output <path>', 'Output file path (default: <type>-chart.png or stars.svg)')
  .option('--all', 'Fetch all pages — may be slow for large repos')
  .action(handleRepo);

program.parse();
