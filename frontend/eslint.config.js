import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

// Pragmatic starting set for an existing codebase with no prior lint
// history: real-bug rules (unused vars, undefined names, React Hooks
// rules-of-hooks/exhaustive-deps) rather than style nitpicks that
// would produce a huge reformat diff with no behavioral value.
// Widen this over time - matches backend/pyproject.toml's ruff config
// philosophy.
export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'react/prop-types': 'off', // no PropTypes anywhere in this codebase - a wholesale opt-in, not per-file drift
      'react/react-in-jsx-scope': 'off', // React 19 + the new JSX transform - no import needed
      'react/no-unescaped-entities': 'off', // flags plain apostrophes/quotes in JSX text - not a real bug, just noise
    },
    settings: {
      react: { version: 'detect' },
    },
  },
  {
    files: ['**/*.test.{js,jsx}', 'src/test/**'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser, vi: 'readonly' },
    },
  },
  {
    files: ['public/sw.js'],
    languageOptions: {
      globals: globals.serviceworker,
    },
  },
];
