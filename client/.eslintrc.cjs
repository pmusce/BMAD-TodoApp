module.exports = {
  extends: ['../.eslintrc.base.js'],
  parserOptions: {
    ecmaFeatures: { jsx: true },
  },
  env: {
    browser: true,
    es2022: true,
  },
  settings: {
    react: { version: 'detect' },
  },
}
