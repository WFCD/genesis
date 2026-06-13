/** Shared Genesis ESLint style rules for bot/worker/shared and web. */
export const genesisStyleRules = {
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

export const botExtraneousDependenciesRule = [
  'error',
  {
    packageDir: ['./packages/bot', './packages/worker', './packages/shared', '.'],
    devDependencies: [
      '**/*.test.{js,cjs,mjs,ts}',
      '**/*.spec.{js,cjs,mjs,ts}',
      'build/**/*.{js,cjs,mjs}',
      'eslint.config.mjs',
      'eslint/**/*.mjs',
      'tsup.config.ts',
    ],
  },
];

export const webExtraneousDependenciesRule = [
  'error',
  {
    packageDir: ['./packages/web', '.'],
    devDependencies: [
      '**/*.config.{js,mjs,cjs,ts}',
      'eslint.config.mjs',
      'eslint/**/*.mjs',
      'packages/web/scripts/**/*.{js,mjs}',
    ],
  },
];

export const botTypeScriptRules = {
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

export const webTypeCheckedRules = {
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

/** Modules that must never be imported from client components or shared client libs. */
export const serverOnlyModules = [
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
