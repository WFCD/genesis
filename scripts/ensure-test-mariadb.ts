/**
 * Start compose MariaDB when local dev/tests need it.
 * CI provides its own service container — skipped when GITHUB_ACTIONS/CI is set.
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import mysql from 'mysql2/promise';

import { mysqlConnectionOptions } from '../packages/shared/settings/mysqlConnection';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const connectionOpts = () => ({
  ...mysqlConnectionOptions(),
  connectTimeout: 2000,
});

const isCi = () => Boolean(process.env.CI || process.env.GITHUB_ACTIONS);
const skipCompose = () => process.env.TEST_NO_COMPOSE === '1' || process.env.DEV_NO_COMPOSE === '1';

const assertHostReachableFromHost = () => {
  const host = process.env.MYSQL_HOST?.trim();
  if (host === 'mariadb') {
    console.error(
      '[db] MYSQL_HOST=mariadb only works inside Docker Compose services.\n' +
        '     For npm run dev on the host, set MYSQL_HOST=127.0.0.1 in .env.local.'
    );
    process.exit(1);
  }
};

export async function pingMariaDB() {
  try {
    const conn = await mysql.createConnection(connectionOpts());
    await conn.query('SELECT 1');
    await conn.end();
    return true;
  } catch {
    return false;
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Start `docker compose up -d --wait mariadb` when not in CI and nothing answers on MYSQL_HOST. */
export async function ensureLocalMariaDb(label = 'db') {
  assertHostReachableFromHost();

  if (await pingMariaDB()) return;
  if (isCi() || skipCompose()) return;

  console.log(`[${label}] MariaDB not reachable — starting docker compose service mariadb…`);
  try {
    execSync('docker compose up -d --wait mariadb', { cwd: repoRoot, stdio: 'inherit' });
  } catch (e) {
    const err = e as Error & { stderr?: Buffer };
    throw new Error(
      `Could not start MariaDB via docker compose. Is Docker running?\n${err.message}${err.stderr ? `\n${err.stderr}` : ''}`
    );
  }

  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (await pingMariaDB()) return;
    await sleep(1000);
  }

  throw new Error(
    `[${label}] MariaDB still not reachable after compose start (${connectionOpts().host}:${connectionOpts().port}).`
  );
}

/** @deprecated use pingMariaDB */
export const pingTestMariaDB = pingMariaDB;

/** @deprecated use ensureLocalMariaDb */
export const ensureLocalTestMariaDb = () => ensureLocalMariaDb('test');

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const label = process.env.SCOPE?.toLowerCase() === 'web' ? 'dev' : process.env.NODE_ENV === 'test' ? 'test' : 'dev';
  try {
    await ensureLocalMariaDb(label);
  } catch (e) {
    console.error((e as Error).message);
    process.exitCode = 1;
  }
}
