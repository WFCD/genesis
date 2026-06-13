import 'server-only';

import pingables from '#shared/resources/pingables.json';

import { formatPingableLabel } from './trackableLabels';

const pingableKeys: string[] = (Array.isArray(pingables) ? pingables : Object.values(pingables)).slice().sort();

export function searchPingables(query = '', limit = 50) {
  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? pingableKeys.filter((key) => {
        const haystack = `${key} ${formatPingableLabel(key)}`.toLowerCase();
        return haystack.includes(needle);
      })
    : pingableKeys;
  return filtered.slice(0, limit);
}
