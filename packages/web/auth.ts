import 'server-only';

import NextAuth from 'next-auth';

import { getCached, invalidateCached } from '@/lib/cache/server';

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

const getSessionGuilds = async (userId: string, accessToken: string) => {
  return getCached(`auth:discord-guilds:${userId}`, GUILD_CACHE_MS, async () => {
    const guilds = await fetchDiscordGuilds(accessToken);
    return guilds ?? [];
  });
};

const baseConfig = createAuthConfig(env);

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...baseConfig,
  callbacks: {
    ...baseConfig.callbacks,
    jwt({ token, account, profile, trigger }) {
      if (account?.access_token) {
        token.discordAccessToken = account.access_token;
      }
      const discordId = profile?.id ?? account?.providerAccountId;
      if (discordId) {
        token.sub = String(discordId);
        if (account?.access_token || trigger === 'update') {
          invalidateCached(`auth:discord-guilds:${String(discordId)}`);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      const accessToken = token.discordAccessToken as string | undefined;
      if (token.sub && accessToken) {
        const guilds = await getSessionGuilds(token.sub, accessToken);
        if (guilds.length) {
          (session as { guilds?: DiscordGuild[] }).guilds = guilds;
        }
      }
      return session;
    },
  },
});
