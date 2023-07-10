/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: [
    "@remix-run/eslint-config",
    "@remix-run/eslint-config/node",
    "@remix-run/eslint-config/jest-testing-library",
    "prettier",
  ],
  settings: {
    jest: {
      version: 28,
    },
  },
  rules: {
    "testing-library/await-async-query": "off",
  },
};
