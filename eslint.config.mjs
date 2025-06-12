import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // First, define global ignores
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "build/**",
      "**/*.d.ts",
      "prisma/migrations/**",
      "next.config.*",
      "tailwind.config.*",
      "postcss.config.*",
      "out/**",
      ".turbo/**",
      "coverage/**",
      ".nyc_output/**",
      "cypress/**",
      "e2e/**",
      "playwright/**",
      "scripts/**",
      "docs/**",
      "temp/**",
      "tmp/**",
      "open-in-v0/**"
    ]
  },
  // Then apply the configuration
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "ignoreRestSiblings": true
      }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-this-alias": "off",
      "react/no-unescaped-entities": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "@next/next/no-img-element": "warn",
      "prefer-const": "off",
      "no-console": "off",
      "no-debugger": "warn",
      "no-empty": ["error", { "allowEmptyCatch": true }],
    }
  }
];

export default eslintConfig;
