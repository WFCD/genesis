import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { NextConfig } from 'next';

import '#shared/utilities/loadParentEnvFiles';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const clientStub = path.join(rootDir, 'lib/server/client-stub.ts');

/** Server modules that must never ship in the browser bundle. */
const serverOnlyAliases = [
  '@/lib/env',
  '@/lib/discord',
  '@/lib/db',
  '@/lib/auth/apiAuth',
  '@/lib/auth/ownerAuth',
  '@/lib/content/branding',
  '@/lib/meta',
  '@/lib/meta/pingables',
  '@/lib/channels/route.server',
  '@/auth',
] as const;

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  outputFileTracingRoot: path.join(rootDir, '../..'),
  serverExternalPackages: ['mysql2', 'discord.js'],
  webpack: (config, { isServer }) => {
    config.resolve.alias['#shared'] = path.join(rootDir, '../shared');

    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        ...Object.fromEntries(serverOnlyAliases.map((alias) => [alias, clientStub])),
        '#shared': clientStub,
      };
    }

    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      { module: /shared\/resources\/index/ },
      { module: /warframe-worldstate-data/ },
    ];
    return config;
  },
};

export default nextConfig;
