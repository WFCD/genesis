const CYCLE_TYPE_PREFIXES = ['cetus.', 'earth.', 'cambion.', 'solaris.', 'duviri.'];

export const isCycleNotificationType = (trackableType: string) =>
  CYCLE_TYPE_PREFIXES.some((prefix) => trackableType.startsWith(prefix));

/** Resolve webhook message expiry from embed timestamp / data. */
export const resolveNotificationExpiry = (embed: {
  timestamp?: Date | number | string | null;
  data?: { timestamp?: string | null };
}): Date | null => {
  const raw = embed?.timestamp ?? embed?.data?.timestamp;
  if (raw == null) return null;
  const date = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  if (date.getTime() <= Date.now()) return null;
  return date;
};
