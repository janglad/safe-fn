// prettier.config.js, .prettierrc.js, prettier.config.mjs, or .prettierrc.mjs

/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
const config = {
  singleQuote: false,
  useTabs: false,
  tabWidth: 2,
  semi: true,
  trailingComma: "all",
  plugins: ["prettier-plugin-organize-imports"],
};

export default config;
