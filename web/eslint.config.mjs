import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import-x';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tseslint from 'typescript-eslint';

import { webImportAliasConfig } from '../eslint/import-alias.mjs';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: rootDir });
const tsFiles = ['**/*.{ts,tsx}'];

/** Modules that must never be imported from client components or shared client libs. */
const serverOnlyModules = [
  '@/lib/discord',
  '@/lib/env',
  '@/lib/env/build',
  '@/lib/env/loadParentEnvFiles',
  '@/lib/db',
  '@/lib/auth/apiAuth',
  '@/lib/auth/ownerAuth',
  '@/lib/content/branding',
  '@/lib/meta',
  '@/lib/meta/pingables',
  '@/lib/channels/route.server',
  '@/auth',
  '@/auth.config',
  '#shared',
  'server-only',
];

const genesisStyleRules = {
  strict: ['error', 'safe'],
  'linebreak-style': ['error', 'unix'],
  'arrow-parens': ['error', 'always'],
  'no-underscore-dangle': ['error', { allow: ['__basedir', '__dirname'] }],
  'max-len': [
    'error',
    {
      code: 120,
      tabWidth: 2,
      comments: 120,
      ignoreTemplateLiterals: true,
      ignoreStrings: true,
      ignoreRegExpLiterals: true,
    },
  ],
  quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
  'prettier/prettier': 'error',
  'import-x/no-unresolved': 'off',
  'import-x/no-extraneous-dependencies': [
    'error',
    {
      devDependencies: [
        '**/*.config.{js,mjs,cjs,ts}',
        'eslint.config.mjs',
        'scripts/**/*.{js,mjs}',
      ],
    },
  ],
  'import-x/order': [
    'error',
    {
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      'newlines-between': 'always',
    },
  ],
  'import-x/extensions': [
    'error',
    'ignorePackages',
    {
      js: 'never',
      jsx: 'never',
      ts: 'never',
      tsx: 'never',
      json: 'always',
    },
  ],
  'import-x/no-named-as-default': 'off',
  'import-x/no-named-as-default-member': 'off',
};

const typeCheckedRules = {
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrors: 'none',
    },
  ],
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/consistent-type-imports': [
    'error',
    { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
  ],
  '@typescript-eslint/no-floating-promises': 'error',
  '@typescript-eslint/no-misused-promises': [
    'error',
    { checksVoidReturn: { attributes: false } },
  ],
  '@typescript-eslint/await-thenable': 'error',
  '@typescript-eslint/no-unnecessary-condition': 'warn',
  '@typescript-eslint/switch-exhaustiveness-check': 'error',
  '@typescript-eslint/restrict-template-expressions': [
    'warn',
    { allowNumber: true, allowBoolean: true },
  ],
  '@typescript-eslint/no-import-type-side-effects': 'error',
  '@typescript-eslint/ban-ts-comment': ['error', { 'ts-nocheck': 'allow-with-description' }],
  // Next.js route handlers conventionally throw Response, not Error subclasses.
  '@typescript-eslint/only-throw-error': 'off',
};

export default tseslint.config(
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'scripts/**', 'eslint.config.mjs'],
  },
  js.configs.recommended,
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  eslintConfigPrettier,
  webImportAliasConfig,
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
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
          project: './tsconfig.json',
        },
        node: true,
      },
    },
    rules: {
      ...genesisStyleRules,
      'no-unused-vars': 'off',
      '@next/next/no-html-link-for-pages': 'error',
    },
  },
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: tsFiles,
  })),
  {
    files: tsFiles,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: rootDir,
      },
    },
    rules: {
      ...typeCheckedRules,
      'import-x/extensions': 'off',
      '@dword-design/import-alias/prefer-alias': [
        'error',
        {
          alias: { '@': '.', '#shared': '../shared' },
          aliasForSubpaths: true,
          shouldReadTsConfig: false,
          shouldReadBabelConfig: false,
        },
      ],
    },
  },
  {
    files: [
      'components/**/*.{ts,tsx}',
      'lib/channels/route.ts',
      'lib/channels/tree.ts',
      'lib/guild/oauth.ts',
      'lib/api/client.ts',
      'lib/content/guides.ts',
      'lib/content/legal.ts',
      'lib/discord/types.ts',
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
    files: ['next.config.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
  {
    files: ['middleware.ts', 'auth.config.ts'],
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
              name: '@/lib/env/loadParentEnvFiles',
              message: 'Edge/middleware code cannot import node:fs env loader.',
            },
          ],
        },
      ],
    },
  }
);
