module.exports = {
  root: true,
  overrides: [
    {
      files: ['./src/**/*.ts']
    },
    {
      files: ['./tests/**/*.test.ts'],
      parserOptions: {
        project: ['./tsconfig.test.json']
      },
      rules: {
        '@typescript-eslint/quotes': 'off'
      }
    },
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json']
  },
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'airbnb-typescript',
  ],
  rules: {
    'no-nested-ternary': 'off',
    'max-len': [1, 160],
    '@typescript-eslint/object-curly-spacing': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
  },
};
