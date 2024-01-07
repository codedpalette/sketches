module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: true,
  },
  plugins: ["@typescript-eslint", "import", "unused-imports", "simple-import-sort", "jsdoc"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "prettier",
  ],
  overrides: [
    {
      files: ["./*.js"],
      extends: ["plugin:@typescript-eslint/disable-type-checked"],
      env: {
        node: true,
      },
    },
    {
      files: ["./library/**"],
      extends: ["plugin:jsdoc/recommended-typescript"],
      rules: {
        "jsdoc/require-jsdoc": [
          "warn",
          { publicOnly: true, require: { ClassDeclaration: true, MethodDefinition: true } },
        ],
      },
    },
  ],
  settings: {
    // https://github.com/import-js/eslint-plugin-import/tree/main#typescript
    "import/resolver": { typescript: true },
  },
  rules: {
    "@typescript-eslint/member-ordering": "warn",

    // https://github.com/lydell/eslint-plugin-simple-import-sort/#example-configuration
    "simple-import-sort/imports": "warn",
    "simple-import-sort/exports": "warn",
    "import/first": "warn",
    "import/newline-after-import": "warn",
    "import/no-duplicates": "warn",

    // https://github.com/sweepline/eslint-plugin-unused-imports#usage
    "@typescript-eslint/no-unused-vars": "off",
    "unused-imports/no-unused-imports": "warn",
    "unused-imports/no-unused-vars": [
      "warn",
      { vars: "all", varsIgnorePattern: "^_", args: "after-used", argsIgnorePattern: "^_" },
    ],
  },
}
