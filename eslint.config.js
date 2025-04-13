import eslint from "@eslint/js"
import eslintConfigPrettier from "eslint-config-prettier"
import eslintPluginImport from "eslint-plugin-import"
import jsdoc from "eslint-plugin-jsdoc"
import simpleImportSort from "eslint-plugin-simple-import-sort"
import unusedImports from "eslint-plugin-unused-imports"
import globals from "globals"
import tsEslint, { configs as tsConfig } from "typescript-eslint"

export default tsEslint.config(
  { ignores: ["dist/", "typings/p5"] },
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
        projectService: {
          allowDefaultProject: ["./*.ts"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/member-ordering": [
        "warn",
        {
          classes: [
            "decorated-field",
            "public-field",
            "protected-field",
            "private-field",
            "constructor",
            "public-static-method",
            "public-decorated-method",
            "public-method",
            "protected-static-method",
            "protected-decorated-method",
            "protected-method",
            "private-static-method",
            "private-decorated-method",
            "private-method",
          ],
        },
      ],

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
  { files: ["*.js"], extends: [tsConfig.disableTypeChecked], languageOptions: { globals: globals.node } },
  {
    files: ["library/**", "./*.ts"],
    extends: [jsdoc.configs["flat/recommended-typescript"]],
    rules: {
      "jsdoc/require-jsdoc": [
        "warn",
        {
          require: { ClassDeclaration: true, MethodDefinition: true },
          contexts: ["TSInterfaceDeclaration", "TSMethodSignature"],
        },
      ],
    },
  },
  eslintConfigPrettier,
)
