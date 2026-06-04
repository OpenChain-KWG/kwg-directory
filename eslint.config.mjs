import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Storybook build output (gitignored; only present locally after storybook:build):
    "storybook-static/**",
    // E2E / Playwright:
    "e2e/**",
    "test-results/**",
    "playwright-report/**",
  ]),
]);

export default eslintConfig;
