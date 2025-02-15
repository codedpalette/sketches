import eslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginImport from "eslint-plugin-import";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";
import tsEslint, { configs as tsConfig } from "typescript-eslint";

export default tsEslint.config(
  { ignores: ["node_modules/", "dist/", "vite.config.ts"] },
  eslint.configs.recommended,
  ...tsConfig.recommendedTypeChecked,
  ...tsConfig.stylisticTypeChecked,
  eslintPluginImport.flatConfigs.recommended,
  eslintPluginImport.flatConfigs.typescript,
  {
    plugins: {
      "unused-imports": unusedImports,
      "simple-import-sort": simpleImportSort,
    },
    settings: { "import/resolver": { typescript: true } },
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/member-ordering": "warn",

      // https://github.com/sweepline/eslint-plugin-unused-imports#usage
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],

      // https://github.com/lydell/eslint-plugin-simple-import-sort/#example-configuration
      "simple-import-sort/imports": "warn",
      "simple-import-sort/exports": "warn",
      "import/first": "warn",
      "import/newline-after-import": "warn",
      "import/no-duplicates": ["warn", { considerQueryString: true }],
    },
  },
  { files: ["**/*.js"], extends: [tsConfig.disableTypeChecked] },
  eslintConfigPrettier,
);
