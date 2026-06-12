import 'server-only';

import { trackableEvents, trackableItems } from '#shared/utilities/CommonFunctions';
import { pingables } from '#shared/resources/index';

const flattenTrackables = () => {
  const values = new Set<string>();
  Object.values(trackableEvents).forEach((entry) => {
    if (Array.isArray(entry)) entry.forEach((value) => values.add(String(value)));
    else if (typeof entry === 'string') values.add(entry);
  });
  Object.values(trackableItems).forEach((entry) => {
    if (Array.isArray(entry)) entry.forEach((value) => values.add(String(value)));
  });
  Object.keys(trackableEvents).forEach((key) => values.add(key));
  Object.keys(trackableItems).forEach((key) => values.add(key));
  return [...values].sort();
};

const pingableKeys: string[] = (Array.isArray(pingables) ? pingables : Object.keys(pingables as object))
  .map(String)
  .sort();

export function searchTrackables(query = '', limit = 25) {
  const needle = query.trim().toLowerCase();
  const all = flattenTrackables();
  const filtered = needle ? all.filter((value) => value.toLowerCase().includes(needle)) : all;
  return filtered.slice(0, limit);
}

export function searchPingables(query = '', limit = 25) {
  const needle = query.trim().toLowerCase();
  const filtered = needle ? pingableKeys.filter((key) => key.toLowerCase().includes(needle)) : pingableKeys;
  return filtered.slice(0, limit);
}
