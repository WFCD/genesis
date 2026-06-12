const enabled = (value: string | undefined) => value === '1' || value?.toLowerCase() === 'true';

/** Client-visible feature toggles for dashboard panels without full bot/worker support yet. */
export const featureFlags = {
  channelPermissions: enabled(process.env.NEXT_PUBLIC_FEATURE_CHANNEL_PERMISSIONS),
  guildWelcome: enabled(process.env.NEXT_PUBLIC_FEATURE_GUILD_WELCOME),
} as const;
