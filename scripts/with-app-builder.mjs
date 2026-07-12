/**
 * electron-builder's "installing production dependencies" step can wipe
 * hoisted app-builder-bin in npm workspaces. Keep a backup and restore it.
 */
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules', 'app-builder-bin');
const exe = join(src, 'win', 'x64', 'app-builder.exe');
const bak = join(root, '.cache', 'app-builder-bin');

function ensurePresent() {
  if (existsSync(exe)) return true;
  if (!existsSync(join(bak, 'win', 'x64', 'app-builder.exe'))) return false;
  mkdirSync(dirname(src), { recursive: true });
  rmSync(src, { recursive: true, force: true });
  cpSync(bak, src, { recursive: true });
  return existsSync(exe);
}

if (!existsSync(exe)) {
  console.error('app-builder.exe missing — run: npm install app-builder-bin@5.0.0-alpha.10 --force');
  process.exit(1);
}

mkdirSync(dirname(bak), { recursive: true });
rmSync(bak, { recursive: true, force: true });
cpSync(src, bak, { recursive: true });

const args = process.argv.slice(2);
if (!args.length) {
  console.error('Usage: node scripts/with-app-builder.mjs <command> [args...]');
  process.exit(1);
}

const timer = setInterval(() => {
  if (!existsSync(exe)) {
    console.warn('Restoring app-builder-bin after electron-builder pruned it…');
    ensurePresent();
  }
}, 250);

const [cmd, ...cmdArgs] = args;
const result = spawnSync(cmd, cmdArgs, {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

clearInterval(timer);
ensurePresent();
process.exit(result.status ?? 1);
