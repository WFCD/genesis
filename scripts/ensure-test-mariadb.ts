/**
 * Local helper: start compose MariaDB when integration tests need it.
 * CI provides its own service container — skipped when GITHUB_ACTIONS/CI is set.
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import mysql from 'mysql2/promise';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const connectionOpts = () => ({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'genesis',
  password: process.env.MYSQL_PASSWORD ?? 'genesis',
  database: process.env.MYSQL_DB || 'genesis',
  connectTimeout: 2000,
});

const isCi = () => Boolean(process.env.CI || process.env.GITHUB_ACTIONS);
const skipCompose = () => process.env.TEST_NO_COMPOSE === '1';

export async function pingTestMariaDB() {
  try {
    const conn = await mysql.createConnection(connectionOpts());
    await conn.query('SELECT 1');
    await conn.end();
    return true;
  } catch {
    return false;
  }
}

/** Start `docker compose up -d mariadb` when not in CI and nothing answers on MYSQL_HOST. */
export async function ensureLocalTestMariaDb() {
  if (await pingTestMariaDB()) return;
  if (isCi() || skipCompose()) return;

  console.log('[test] MariaDB not reachable — starting docker compose service mariadb…');
  try {
    execSync('docker compose up -d mariadb', { cwd: repoRoot, stdio: 'inherit' });
  } catch (e) {
    const err = e as Error & { stderr?: Buffer };
    throw new Error(
      `Could not start MariaDB via docker compose. Is Docker running?\n${err.message}${err.stderr ? `\n${err.stderr}` : ''}`
    );
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  await ensureLocalTestMariaDb();
  const ready = await pingTestMariaDB();
  if (!ready) {
    process.exitCode = 1;
    console.error('[test] MariaDB still not reachable after compose start');
  }
}
