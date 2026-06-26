/**
 * SFTP upload script.
 *
 * Reads FTP_HOST, FTP_USER, and FTP_PASSWORD from ~/.env,
 * builds, and uploads all release files via SFTP.
 */

import { spawnSync, execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const REMOTE_DIR = '/spotify.marcel-sauer.de';

function loadEnv() {
  const vars = {};
  const envPath = join(homedir(), '.env');
  try {
    const text = readFileSync(envPath, 'utf-8');
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      vars[key] = val;
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(`Create ${envPath} with:\n` +
          '  FTP_SERVER=your-server.com\n' +
          '  FTP_USER=your_username\n' +
          '  FTP_PASSWORD=your_password');
    } else {
      console.error('Error reading .env:', err.message);
    }
    process.exit(1);
  }
  return vars;
}

const ENV = loadEnv();
const SERVER = ENV.FTP_SERVER;
const USER = ENV.FTP_USER;
const PASS = ENV.FTP_PASSWORD;

if (!SERVER || !USER || !PASS) {
  console.error('FTP_SERVER, FTP_USER, and FTP_PASSWORD must be set in ~/.env.');
  process.exit(1);
}


execSync('npm run build', { stdio: 'inherit' });

const FILES = [
  'dist/index.html',
  'dist/impressum.html',
  'dist/datenschutz.html',
  'favicon.svg',
  'sample_podcast_data.json',
  'robots.txt',
  'sitemap.xml',
  'doc/1.png',
  'doc/2.png',
  'doc/3.png',
  'doc/4.png',
  'doc/5.png',
  'doc/6.png',
];

let ok = 0;
let fail = 0;

for (const file of FILES) {
  if (!existsSync(file)) {
    console.warn(`⚠  Skipping (not found): ${file}`);
    continue;
  }

  const remoteName = file.replace(/^dist\//, '');
  const target = `ftp://${SERVER}/${REMOTE_DIR}/${remoteName}`;

  const r = spawnSync('curl', [
    '-s', '--show-error', '--ssl',
    '-u', `${USER}:${PASS}`,
    '--ftp-create-dirs',
    '-T', file,
    target,
  ], { timeout: 30000, stdio: 'pipe' });

  if (r.status === 0) {
    console.log(`✓  ${file}`);
    ok++;
  } else {
    const msg = r.stderr?.toString().trim() || r.stdout?.toString().trim() || `exit code ${r.status}`;
    console.error(`✗  ${file}: ${msg}`);
    fail++;
  }
}

console.log(`\n── Done. ${ok} uploaded, ${fail} failed.`);
process.exit(fail ? 1 : 0);
