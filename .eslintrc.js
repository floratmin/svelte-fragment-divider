module.exports = {
  root: true,
  overrides: [
    {
      files: ['./src/**/*.ts'],
      parserOptions: {
        project: ['./tsconfig.json']
      }
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
  },
};