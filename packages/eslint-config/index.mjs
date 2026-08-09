/**
 * @lanstream/eslint-config
 *
 * Shared ESLint configuration for LANStream workspace packages.
 * Each consuming app extends this base and adds its own overrides.
 */

import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import { defineConfig, globalIgnores } from "eslint/config";

/** Base TypeScript rules shared across all packages. */
const baseTsRules = {
  "@typescript-eslint/no-unused-vars": [
    "warn",
    { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
  ],
  "@typescript-eslint/no-explicit-any": "warn",
  "@typescript-eslint/consistent-type-imports": [
    "warn",
    { prefer: "type-imports", fixStyle: "inline-type-imports" },
  ],
};

/** Base config for TypeScript-only packages (no React/Next.js). */
export function defineBaseConfig(options = {}) {
  return defineConfig([
    globalIgnores(["node_modules/**", "dist/**", "build/**"]),
    {
      files: ["**/*.ts", "**/*.tsx"],
      languageOptions: {
        parser: tsParser,
        parserOptions: {
          ecmaVersion: "latest",
          sourceType: "module",
        },
      },
      plugins: {
        "@typescript-eslint": tsPlugin,
      },
      rules: {
        ...tsPlugin.configs.recommended.rules,
        ...baseTsRules,
      },
    },
  ]);
}

export default defineBaseConfig;
