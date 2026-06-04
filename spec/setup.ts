/** Mocha bootstrap — keep tests CI-safe (no live DB, no process exit on fatal logs). */
process.env.NODE_ENV ??= 'test';
process.env.SCOPE ??= 'BOT';
process.env.LOG_LEVEL ??= 'ERROR';
