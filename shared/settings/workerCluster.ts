/** Locale value for guild-wide cache jobs (pings, guild map) — all workers poll these. */
export const GLOBAL_WORKER_LOCALE = '';

export const getWorkerId = () =>
  process.env.WORKER_ID?.trim() || process.env.LOCALES?.split(',')[0]?.trim() || 'en';

export const getExpectedWorkerCount = () => {
  const cluster = process.env.WORKER_CLUSTER || getWorkerId();
  const ids = cluster
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  return ids.length || 1;
};
