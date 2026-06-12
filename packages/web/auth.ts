import 'server-only';

import NextAuth from 'next-auth';

import { createAuthConfig } from './auth.config';
import env from './lib/env';

type DiscordGuild = { id: string; name: string; permissions: string; icon: string | null };

const GUILD_CACHE_MS = 10 * 60 * 1000;

async function fetchDiscordGuilds(accessToken: string) {
  const res = await fetch('https://discord.com/api/users/@me/guilds', {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return (await res.json()) as DiscordGuild[];
}

const baseConfig = createAuthConfig(env);

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...baseConfig,
  callbacks: {
    ...baseConfig.callbacks,
    async jwt({ token, account, profile, trigger }) {
      if (account?.access_token) {
        token.discordAccessToken = account.access_token;
      }
      const discordId = profile?.id ?? account?.providerAccountId;
      if (discordId) {
        token.sub = String(discordId);
      }

      const accessToken = token.discordAccessToken as string | undefined;
      const cachedAt = token.guildsCachedAt as number | undefined;
      const shouldRefreshGuilds =
        Boolean(accessToken) &&
        (Boolean(account?.access_token) ||
          trigger === 'update' ||
          !token.guilds ||
          !cachedAt ||
          Date.now() - cachedAt > GUILD_CACHE_MS);

      if (shouldRefreshGuilds && accessToken) {
        const guilds = await fetchDiscordGuilds(accessToken);
        if (guilds) {
          token.guilds = guilds;
          token.guildsCachedAt = Date.now();
        }
      }

      return token;
    },
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      if (token.guilds) {
        (session as { guilds?: DiscordGuild[] }).guilds = token.guilds as DiscordGuild[];
      }
      return session;
    },
  },
});
