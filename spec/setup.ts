/**
 * Mocha bootstrap — keep tests CI-safe (no live DB, no process exit on fatal logs).
 * Integration specs run when TEST_MARIADB=1 (set in CI and via `npm run test:db`).
 */
process.env.NODE_ENV ??= 'test';
process.env.SCOPE ??= 'BOT';
process.env.LOG_LEVEL ??= 'ERROR';
