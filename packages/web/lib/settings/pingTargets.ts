import 'server-only';

import type { TrackingOptions } from '#shared/settings/database/repositories/TrackingRepository';

export function parsePingTargetBody(body: { targets?: unknown; target?: unknown }) {
  const raw = Array.isArray(body.targets) ? body.targets : typeof body.target === 'string' ? [body.target] : [];

  const targets = raw.map((value) => String(value).trim()).filter(Boolean);
  if (!targets.length) return null;

  // Event vs item split only affects worker cache keys; DB rows use item_or_type either way.
  return { events: targets, items: [] } satisfies TrackingOptions;
}
