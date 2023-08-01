module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: true,
  },
  plugins: ["@typescript-eslint", "import", "unused-imports"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "prettier",
  ],
  settings: {
    "import/resolver": { node: true, typescript: true },
  },
  rules: {
    "import/no-unresolved": ["error", { ignore: ["\\.jpg$"] }],
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/member-ordering": "error",
    "@typescript-eslint/no-explicit-any": ["error", { ignoreRestArgs: true }],
    "unused-imports/no-unused-imports": "warn",
    "unused-imports/no-unused-vars": [
      "warn",
      { vars: "all", varsIgnorePattern: "^_", args: "after-used", argsIgnorePattern: "^_" },
    ],
  },
}
