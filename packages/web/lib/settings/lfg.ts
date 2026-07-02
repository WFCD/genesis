import platformMap from '#shared/resources/platformMap.json';

export type LfgPlatform = { name: string; value: string };

export const lfgPlatforms = platformMap as LfgPlatform[];

export const lfgSettingKey = (platform: string) => platform === 'pc' ? 'lfgChannel' : `lfgChannel.${platform}`;

export const LFG_SETTING_KEYS = lfgPlatforms.map((platform) => lfgSettingKey(platform.value));

export const pickLfgSettings = (settings: Record<string, string | undefined>) => Object.fromEntries(LFG_SETTING_KEYS.map((key) => [key, settings[key] ?? '']));

export const buildLfgSettingsPatch = (lfgSettings: Record<string, string | undefined>) => Object.fromEntries(
  LFG_SETTING_KEYS.map((key) => [key, lfgSettings[key]?.trim() ? lfgSettings[key].trim() : null])
);
