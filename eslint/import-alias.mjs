import importAlias from '@dword-design/eslint-plugin-import-alias';

/**
 * Import-alias config with explicit paths (TypeScript 6+ safe — no baseUrl in tsconfig).
 * @param {Record<string, string>} alias
 */
export function importAliasConfig(alias) {
  return {
    plugins: importAlias.configs.recommended.plugins,
    rules: {
      '@dword-design/import-alias/prefer-alias': [
        'error',
        {
          alias,
          shouldReadTsConfig: false,
          shouldReadBabelConfig: false,
        },
      ],
    },
  };
}

/** bot/worker/shared — tsconfig `#shared/*` → `./packages/shared/*` */
export const rootImportAliasConfig = importAliasConfig({ '#shared': './packages/shared' });

/** web — tsconfig `@/*` → `packages/web/*`, `#shared/*` → `packages/shared/*` */
export const webImportAliasConfig = importAliasConfig({ '@': './packages/web', '#shared': './packages/shared' });
