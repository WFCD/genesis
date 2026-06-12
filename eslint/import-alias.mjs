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

/** bot/worker/shared — package.json + tsconfig `#shared/*` → `./shared/*` */
export const rootImportAliasConfig = importAliasConfig({ '#shared': './shared' });

/** web — tsconfig `@/*` → `./*`, `#shared/*` → `../shared/*` */
export const webImportAliasConfig = importAliasConfig({ '@': '.', '#shared': '../shared' });
