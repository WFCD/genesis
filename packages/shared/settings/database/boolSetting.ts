export const BOOL_CHANNEL_SETTINGS = new Set([
  'ephemerate',
  'allowCustom',
  'allowInline',
  'settings.cc.ping',
  'deleteExpired',
  'delete_after_respond',
  'respond_to_settings',
  'createPrivateChannel',
  'defaultRoomsLocked',
  'defaultNoText',
  'defaultShown',
]);

/** Normalize a settings-table val to `'0'` / `'1'` when it represents a boolean. */
export const normalizeStoredBool = (value: unknown): '0' | '1' | undefined => {
  if (value === undefined || value === null) return undefined;
  if (value === true || value === 1 || value === '1') return '1';
  if (value === false || value === 0 || value === '0') return '0';

  const lowered = String(value).trim().toLowerCase();
  if (lowered === 'true') return '1';
  if (lowered === 'false' || lowered === '') return '0';

  return undefined;
};

export const asStoredBool = (value: unknown): '0' | '1' => normalizeStoredBool(value) ?? '0';

export const asBool = (value: unknown, fallback: unknown): boolean => {
  const normalized = normalizeStoredBool(value);
  if (normalized !== undefined) return normalized === '1';
  return Boolean(fallback);
};
