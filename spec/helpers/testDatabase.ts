import mysql from 'mysql2/promise';

import Database from '#shared/settings/Database';

import { ensureLocalTestMariaDb } from '../../scripts/ensure-test-mariadb';

let testDatabase: Database | undefined;

const connectionOpts = () => ({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'genesis',
  password: process.env.MYSQL_PASSWORD ?? 'genesis',
  database: process.env.MYSQL_DB || 'genesis',
});

/** True when integration specs should run (CI service or local `npm run test:db`). */
export const isTestMariaDbEnabled = () => process.env.TEST_MARIADB === '1';

/** Wait for MariaDB to accept connections (CI service startup). */
export async function waitForMariaDB(maxMs = 60_000) {
  const started = Date.now();
  const opts = connectionOpts();
  let lastError: Error | undefined;

  while (Date.now() - started < maxMs) {
    try {
      const conn = await mysql.createConnection(opts);
      await conn.query('SELECT 1');
      await conn.end();
      return;
    } catch (e) {
      lastError = e as Error;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  throw new Error(
    `MariaDB not ready at ${opts.host}:${opts.port}/${opts.database} after ${maxMs}ms: ${lastError?.message}`
  );
}

/** Connect, apply schema + integrations, and expose the database facade. */
export async function setupTestDatabase() {
  await ensureLocalTestMariaDb();
  await waitForMariaDB();
  testDatabase = await Database.build();
  await testDatabase.guilds.createSchema();
  return testDatabase;
}

export function getTestDatabase(): Database {
  if (!testDatabase) {
    throw new Error('Test database not initialized — set TEST_MARIADB=1 and ensure MariaDB is running');
  }
  return testDatabase;
}

export async function teardownTestDatabase() {
  if (testDatabase) {
    await testDatabase.db.end();
    testDatabase = undefined;
  }
}
