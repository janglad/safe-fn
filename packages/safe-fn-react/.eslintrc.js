const { resolve } = require("node:path");

const project = resolve(__dirname, "tsconfig.json");
/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["@repo/eslint-config/react.js"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
  ignorePatterns: [".*.js", "node_modules/", "dist/"],
  overrides: [{ files: ["*.js?(x)", "*.ts?(x)"] }],
};
