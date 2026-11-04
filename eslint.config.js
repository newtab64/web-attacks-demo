import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'design-reference/**',
      'dist/**',
      'data/**',
      'public/**',
      'node_modules/**',
      'eslint.config.js',
      'vitest.config.ts',
      '**/*.js',
    ],
  },
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
);
