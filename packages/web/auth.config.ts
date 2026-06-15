import type { NextAuthConfig } from 'next-auth';
import Discord from 'next-auth/providers/discord';

import { buildEnv, type WebEnv } from './lib/env/build';
import { readFromProcess } from './lib/env/readFromProcess';

export function createAuthConfig(env: WebEnv) {
  const isDev = env.nodeEnv === 'development';

  return {
    providers: [
      Discord({
        clientId: env.auth.discordClientId!,
        clientSecret: env.auth.discordClientSecret!,
        authorization: { params: { scope: 'identify guilds' } },
      }),
    ],
    pages: {
      signIn: '/',
    },
    secret: env.auth.secret,
    trustHost: true,
    debug: readFromProcess('AUTH_DEBUG') === 'true',
    ...(isDev
      ? {
          cookies: {
            sessionToken: {
              options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: false,
              },
            },
            callbackUrl: {
              options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: false,
              },
            },
          },
        }
      : {}),
    callbacks: {
      authorized({ auth, request: { nextUrl } }) {
        const path = nextUrl.pathname;
        if (path === '/' || path === '/privacy' || path === '/tos') return true;
        return !!auth?.user;
      },
    },
  } satisfies NextAuthConfig;
}

/** Proxy/auth config — process.env only (no parent .env file loader). */
export const authConfig = createAuthConfig(buildEnv(readFromProcess));
