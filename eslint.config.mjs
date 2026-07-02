import js from '@eslint/js';
import json from '@eslint/json';
import importAlias from '@dword-design/eslint-plugin-import-alias';
import nextPlugin from '@next/eslint-plugin-next';
import stylistic from '@stylistic/eslint-plugin';
import importPlugin from 'eslint-plugin-import-x';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import preferArrowFunctions from 'eslint-plugin-prefer-arrow-functions';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import eslintPluginYml from 'eslint-plugin-yml';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tseslint from 'typescript-eslint';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.join(rootDir, 'packages/web');

const botFiles = ['packages/bot/**/*.{js,mjs,cjs,ts,mts,cts}', 'packages/worker/**/*.{js,mjs,cjs,ts,mts,cts}'];
const sharedFiles = ['packages/shared/**/*.{js,mjs,cjs,ts,mts,cts}'];
const specFiles = ['spec/**/*.{js,mjs,cjs,ts,mts,cts}'];
const webFiles = ['packages/web/**/*.{js,mjs,cjs,ts,tsx,mts,cts}'];
const webTsFiles = ['packages/web/**/*.{ts,tsx}'];
const webJsxFiles = ['packages/web/**/*.{jsx,tsx}'];
const jsFiles = [
  ...botFiles,
  ...sharedFiles,
  ...specFiles,
  ...webFiles,
  'eslint.config.mjs',
  'tsup.config.ts',
];

/** Import-alias config with explicit paths (TypeScript 6+ safe — no baseUrl in tsconfig). */
const importAliasConfig = (alias) => ({
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
});

const rootImportAliasConfig = importAliasConfig({ '#shared': './packages/shared' });
const webImportAliasConfig = importAliasConfig({ '@': './packages/web', '#shared': './packages/shared' });

const stylisticCustomized = stylistic.configs.customize({
  indent: 2,
  quotes: 'single',
  semi: true,
  jsx: true,
  arrowParens: true,
  braceStyle: '1tbs',
  blockSpacing: true,
  quoteProps: 'as-needed',
  commaDangle: 'only-multiline',
});

const genesisStyleRules = {
  ...stylisticCustomized.rules,
  '@stylistic/linebreak-style': ['error', 'unix'],
  '@stylistic/max-len': [
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
  '@stylistic/quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: 'always' }],
  '@stylistic/lines-between-class-members': 'off',
  '@stylistic/operator-linebreak': 'off',
  '@stylistic/multiline-ternary': 'off',
  '@stylistic/jsx-one-expression-per-line': 'off',
  '@stylistic/jsx-curly-newline': 'off',
  '@stylistic/indent-binary-ops': 'off',
  'prefer-arrow-functions/prefer-arrow-functions': [
    'error',
    {
      allowedNames: [],
      allowNamedFunctions: false,
      allowObjectProperties: false,
      classPropertiesAllowed: true,
      disallowPrototype: false,
      returnStyle: 'unchanged',
      singleReturnOnly: false,
    },
  ],
  'no-unsafe-optional-chaining': 'off',
  'no-constructor-return': 'off',
  strict: ['error', 'safe'],
  'func-names': 'off',
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
  'import-x/no-unresolved': 'off',
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
};

const botExtraneousDependenciesRule = [
  'error',
  {
    packageDir: ['./packages/bot', './packages/worker', './packages/shared', '.'],
    devDependencies: [
      '**/*.test.{js,cjs,mjs,ts}',
      '**/*.spec.{js,cjs,mjs,ts}',
      'build/**/*.{js,cjs,mjs}',
      'eslint.config.mjs',
      'tsup.config.ts',
    ],
  },
];

const webExtraneousDependenciesRule = [
  'error',
  {
    packageDir: ['./packages/web', '.'],
    devDependencies: [
      '**/*.config.{js,mjs,cjs,ts}',
      'eslint.config.mjs',
      'packages/web/scripts/**/*.{js,mjs}',
    ],
  },
];

const botTypeScriptRules = {
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
};

const webTypeCheckedRules = {
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
  '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],
  '@typescript-eslint/await-thenable': 'error',
  '@typescript-eslint/no-unnecessary-condition': 'warn',
  '@typescript-eslint/switch-exhaustiveness-check': 'error',
  '@typescript-eslint/restrict-template-expressions': ['warn', { allowNumber: true, allowBoolean: true }],
  '@typescript-eslint/no-import-type-side-effects': 'error',
  '@typescript-eslint/ban-ts-comment': ['error', { 'ts-nocheck': 'allow-with-description' }],
  '@typescript-eslint/only-throw-error': 'off',
};

const serverOnlyModules = [
  '@/lib/discord',
  '@/lib/env',
  '@/lib/env/build',
  '#shared/utilities/loadParentEnvFiles',
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
      'package-lock.json',
    ],
  },
  ...eslintPluginYml.configs.standard,
  {
    files: ['**/*.{yml,yaml}'],
    rules: {
      // GitHub Actions and Docker Compose use empty mapping values idiomatically.
      'yml/no-empty-mapping-value': 'off',
    },
  },
  {
    ...json.configs.recommended,
    files: ['**/*.json'],
    ignores: ['package-lock.json', 'packages/shared/resources/*.json'],
    language: 'json/json',
  },
  {
    files: jsFiles,
    ...js.configs.recommended,
  },
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: jsFiles,
  })),
  {
    files: jsFiles,
    ...stylistic.configs['disable-legacy'],
  },
  {
    ...rootImportAliasConfig,
    files: [...botFiles, ...sharedFiles, ...specFiles],
  },
  {
    files: [...botFiles, ...sharedFiles, ...specFiles],
    plugins: {
      '@stylistic': stylistic,
      'import-x': importPlugin,
      'prefer-arrow-functions': preferArrowFunctions,
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
    rules: Object.fromEntries(
      Object.keys(genesisStyleRules)
        .filter((rule) => rule.startsWith('@stylistic/'))
        .map((rule) => [rule, 'off'])
    ),
  },
  {
    ...nextPlugin.configs['core-web-vitals'],
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
    files: webJsxFiles,
    plugins: {
      'jsx-a11y': jsxA11yPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    languageOptions: {
      ...jsxA11yPlugin.flatConfigs.recommended.languageOptions,
      ...reactPlugin.configs.flat['jsx-runtime'].languageOptions,
    },
    settings: {
      react: {
        // Pin version — 'detect' uses removed context.getFilename() on ESLint 10.
        version: '19',
      },
    },
    rules: {
      ...reactPlugin.configs.flat.recommended.rules,
      ...reactPlugin.configs.flat['jsx-runtime'].rules,
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      ...reactHooksPlugin.configs.flat['recommended-latest'].rules,
      // Valid for data fetching, localStorage hydration, and panel sync — too noisy as error.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/exhaustive-deps': 'error',
      ...jsxA11yPlugin.flatConfigs.recommended.rules,
    },
  },
  {
    files: webFiles,
    plugins: {
      '@stylistic': stylistic,
      'import-x': importPlugin,
      'prefer-arrow-functions': preferArrowFunctions,
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
    files: ['packages/web/proxy.ts', 'packages/web/auth.config.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/lib/env',
              message: 'Proxy/auth config must use env.build with process.env, not env.ts.',
            },
            {
              name: '#shared/utilities/loadParentEnvFiles',
              message: 'Proxy/auth config cannot import node:fs env loader.',
            },
          ],
        },
      ],
    },
  }
);
