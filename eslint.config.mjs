import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import-x';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import { rootImportAliasConfig } from './eslint/import-alias.mjs';

const genesisRules = {
  'no-unsafe-optional-chaining': 'off',
  'no-constructor-return': 'off',
  strict: ['error', 'safe'],
  'linebreak-style': ['error', 'unix'],
  'func-names': 'off',
  'arrow-parens': ['error', 'always'],
  'global-require': 'off',
  'no-await-in-loop': 'off',
  'no-param-reassign': 'off',
  'no-continue': 'off',
  'no-underscore-dangle': ['error', { allow: ['__basedir', '__dirname'] }],
  'no-fallthrough': 'off',
  'no-case-declarations': 'off',
  'lines-between-class-members': 'off',
  'default-case': 'off',
  'max-classes-per-file': 'off',
  'consistent-return': 'off',
  'class-methods-use-this': 'off',
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
  'import-x/no-unresolved': 'off',
  'import-x/no-extraneous-dependencies': [
    'error',
    {
      devDependencies: [
        '**/*.test.{js,cjs,mjs,ts}',
        '**/*.spec.{js,cjs,mjs,ts}',
        'build/**/*.{js,cjs,mjs}',
        'eslint.config.mjs',
        'tsup.config.ts',
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
  'no-unused-private-class-members': 'off',
  quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
  'prettier/prettier': 'error',
};

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', '.nyc_output/**', 'shared/resources/*.json'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  rootImportAliasConfig,
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
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
      ...genesisRules,
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'none',
        },
      ],
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': ['error', { 'ts-nocheck': 'allow-with-description' }],
    },
  },
  {
    files: ['**/*.{ts,mts,cts}'],
    rules: {
      'import-x/extensions': 'off',
    },
  },
  {
    files: ['spec/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.mocha,
      },
    },
  },
  {
    files: ['shared/resources/locales/commands/**'],
    rules: {
      'prettier/prettier': 'off',
    },
  }
);
