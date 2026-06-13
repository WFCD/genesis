import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import-x';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tseslint from 'typescript-eslint';

import {
  botExtraneousDependenciesRule,
  botTypeScriptRules,
  genesisStyleRules,
  serverOnlyModules,
  webExtraneousDependenciesRule,
  webTypeCheckedRules,
} from './eslint/base.mjs';
import { rootImportAliasConfig, webImportAliasConfig } from './eslint/import-alias.mjs';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.join(rootDir, 'packages/web');

const botFiles = ['packages/bot/**/*.{js,mjs,cjs,ts,mts,cts}', 'packages/worker/**/*.{js,mjs,cjs,ts,mts,cts}'];
const sharedFiles = ['packages/shared/**/*.{js,mjs,cjs,ts,mts,cts}'];
const specFiles = ['spec/**/*.{js,mjs,cjs,ts,mts,cts}'];
const webFiles = ['packages/web/**/*.{js,mjs,cjs,ts,tsx,mts,cts}'];
const webTsFiles = ['packages/web/**/*.{ts,tsx}'];

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      '**/node_modules/**',
      'coverage/**',
      '.nyc_output/**',
      'packages/web/.next/**',
      'packages/web/next-env.d.ts',
      'packages/shared/resources/*.json',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    ...rootImportAliasConfig,
    files: [...botFiles, ...sharedFiles, ...specFiles],
  },
  {
    files: [...botFiles, ...sharedFiles, ...specFiles],
    plugins: {
      'import-x': importPlugin,
      prettier: eslintPluginPrettier,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    settings: {
      'import-x/internal-regex': '^#',
    },
    rules: {
      ...genesisStyleRules,
      'import-x/no-extraneous-dependencies': botExtraneousDependenciesRule,
      ...botTypeScriptRules,
    },
  },
  {
    files: [
      'packages/bot/**/*.{ts,mts,cts}',
      'packages/worker/**/*.{ts,mts,cts}',
      'packages/shared/**/*.{ts,mts,cts}',
      'spec/**/*.{ts,mts,cts}',
    ],
    rules: {
      'import-x/extensions': 'off',
    },
  },
  {
    files: specFiles,
    languageOptions: {
      globals: {
        ...globals.mocha,
      },
    },
  },
  {
    files: ['packages/shared/resources/locales/commands/**'],
    rules: {
      'prettier/prettier': 'off',
    },
  },
  {
    ...nextPlugin.flatConfig.coreWebVitals,
    files: webFiles,
    settings: {
      next: {
        rootDir: webDir,
      },
    },
  },
  {
    ...webImportAliasConfig,
    files: webFiles,
  },
  {
    files: webFiles,
    plugins: {
      'import-x': importPlugin,
      prettier: eslintPluginPrettier,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    settings: {
      'import-x/internal-regex': '^(@/|#shared)',
      'import-x/resolver': {
        typescript: {
          project: './packages/web/tsconfig.json',
        },
        node: true,
      },
    },
    rules: {
      ...genesisStyleRules,
      'import-x/no-extraneous-dependencies': webExtraneousDependenciesRule,
      'no-unused-vars': 'off',
      '@next/next/no-html-link-for-pages': 'error',
    },
  },
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: webTsFiles,
  })),
  {
    files: webTsFiles,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: webDir,
      },
    },
    rules: {
      ...webTypeCheckedRules,
      'import-x/extensions': 'off',
      '@dword-design/import-alias/prefer-alias': [
        'error',
        {
          alias: { '@': './packages/web', '#shared': './packages/shared' },
          aliasForSubpaths: true,
          shouldReadTsConfig: false,
          shouldReadBabelConfig: false,
        },
      ],
    },
  },
  {
    files: [
      'packages/web/components/**/*.{ts,tsx}',
      'packages/web/lib/channels/route.ts',
      'packages/web/lib/channels/tree.ts',
      'packages/web/lib/guild/oauth.ts',
      'packages/web/lib/api/client.ts',
      'packages/web/lib/content/guides.ts',
      'packages/web/lib/content/legal.ts',
      'packages/web/lib/discord/types.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: serverOnlyModules.map((name) => ({
            name,
            message: `${name} is server-only. Use an API route or move logic to a server component.`,
          })),
        },
      ],
    },
  },
  {
    files: ['packages/web/next.config.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
  {
    files: ['packages/web/middleware.ts', 'packages/web/auth.config.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/lib/env',
              message: 'Edge/middleware code must use env.build with process.env, not env.ts.',
            },
            {
              name: '#shared/utilities/loadParentEnvFiles',
              message: 'Edge/middleware code cannot import node:fs env loader.',
            },
          ],
        },
      ],
    },
  }
);
