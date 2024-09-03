module.exports = {
  extends: [
    require.resolve("@vercel/style-guide/eslint/react"),
    require.resolve("@vercel/style-guide/eslint/typescript"),
  ],
  rules: {
    "@typescript-eslint/consistent-type-definitions": ["error", "type"],
  },
};
