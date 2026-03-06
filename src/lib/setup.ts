import { intro, outro, confirm, select, spinner, note, cancel } from '@clack/prompts';
import { spawn, execSync } from 'child_process';
import pc from 'picocolors';
import os from 'os';

type Platform = 'macos' | 'linux-apt' | 'linux-dnf' | 'linux-pacman' | 'windows' | 'unknown';

interface InstallOption {
  label: string;
  hint: string;
  cmd: string[];
}

function detectPlatform(): Platform {
  const platform = os.platform();
  if (platform === 'darwin') return 'macos';
  if (platform === 'win32') return 'windows';
  if (platform === 'linux') {
    try {
      execSync('which apt-get', { stdio: 'ignore' });
      return 'linux-apt';
    } catch {}
    try {
      execSync('which dnf', { stdio: 'ignore' });
      return 'linux-dnf';
    } catch {}
    try {
      execSync('which pacman', { stdio: 'ignore' });
      return 'linux-pacman';
    } catch {}
  }
  return 'unknown';
}

function getInstallOptions(platform: Platform): InstallOption[] {
  const options: InstallOption[] = [];

  if (platform === 'macos') {
    options.push(
      { label: 'Homebrew', hint: 'brew install gh', cmd: ['brew', 'install', 'gh'] },
      { label: 'MacPorts', hint: 'sudo port install gh', cmd: ['sudo', 'port', 'install', 'gh'] }
    );
  } else if (platform === 'linux-apt') {
    options.push({
      label: 'apt (Debian/Ubuntu)',
      hint: 'sudo apt install gh',
      cmd: ['sudo', 'apt', 'install', '-y', 'gh'],
    });
  } else if (platform === 'linux-dnf') {
    options.push({
      label: 'dnf (Fedora/RHEL)',
      hint: 'sudo dnf install gh',
      cmd: ['sudo', 'dnf', 'install', '-y', 'gh'],
    });
  } else if (platform === 'linux-pacman') {
    options.push({
      label: 'pacman (Arch)',
      hint: 'sudo pacman -S github-cli',
      cmd: ['sudo', 'pacman', '-S', '--noconfirm', 'github-cli'],
    });
  } else if (platform === 'windows') {
    options.push(
      { label: 'winget', hint: 'winget install GitHub.cli', cmd: ['winget', 'install', 'GitHub.cli'] },
      { label: 'Scoop', hint: 'scoop install gh', cmd: ['scoop', 'install', 'gh'] },
      { label: 'Chocolatey', hint: 'choco install gh', cmd: ['choco', 'install', 'gh'] }
    );
  }

  return options;
}

function runCommand(cmd: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const [bin, ...args] = cmd;
    const proc = spawn(bin, args, { stdio: 'inherit' });
    proc.on('error', (err) => {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(new Error(`Command not found: ${bin}`));
      } else {
        reject(err);
      }
    });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${bin} exited with code ${code}`));
    });
  });
}

function isGhInstalled(): boolean {
  try {
    execSync('gh --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export async function ensureGhReady(): Promise<void> {
  if (isGhInstalled()) return;

  console.log('');
  intro(pc.bgWhite(pc.black(' RepoPulse setup ')));

  note(
    `${pc.bold('GitHub CLI (gh)')} is required but not installed.\n` +
      `It handles authentication so you never need to manage tokens.`,
    'Missing dependency'
  );

  const shouldInstall = await confirm({
    message: 'Install GitHub CLI now?',
    initialValue: true,
  });

  if (shouldInstall !== true) {
    cancel('Install gh manually from https://cli.github.com and re-run repopulse.');
    process.exit(0);
  }

  const platform = detectPlatform();
  const options = getInstallOptions(platform);

  if (options.length === 0) {
    cancel(
      `Could not detect a supported package manager.\nInstall gh manually: https://cli.github.com`
    );
    process.exit(1);
  }

  let installCmd: string[];

  if (options.length === 1) {
    installCmd = options[0].cmd;
    note(`Will run: ${pc.cyan(options[0].hint)}`, 'Install command');
  } else {
    const choice = await select({
      message: 'Choose a package manager:',
      options: options.map((o) => ({
        value: o.cmd.join(' '),
        label: o.label,
        hint: o.hint,
      })),
    });

    if (typeof choice !== 'string') {
      cancel('Installation cancelled.');
      process.exit(0);
    }

    installCmd = choice.split(' ');
  }

  const s = spinner();
  s.start('Installing GitHub CLI...');

  try {
    await runCommand(installCmd);
    s.stop('GitHub CLI installed.');
  } catch (err) {
    s.stop('Installation failed.');
    cancel((err as Error).message);
    process.exit(1);
  }

  if (!isGhInstalled()) {
    cancel('gh was not found after install. You may need to restart your terminal.');
    process.exit(1);
  }

  note(
    `You'll be prompted to authenticate with GitHub.\n` +
      `This only needs to happen once.`,
    'Next: authenticate'
  );

  const shouldAuth = await confirm({
    message: 'Run gh auth login now?',
    initialValue: true,
  });

  if (shouldAuth !== true) {
    cancel('Run `gh auth login` then re-run repopulse.');
    process.exit(0);
  }

  try {
    await runCommand(['gh', 'auth', 'login']);
  } catch (err) {
    cancel(`Authentication failed: ${(err as Error).message}`);
    process.exit(1);
  }

  outro(pc.green('✔ GitHub CLI is ready. Continuing…'));
  console.log('');
}
