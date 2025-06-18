import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import security from "eslint-plugin-security";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Global ignores
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "build/**",
      "out/**",
      "coverage/**",
      ".turbo/**",
      ".nyc_output/**",
      "**/*.d.ts",
      "prisma/migrations/**",
      "next.config.*",
      "tailwind.config.*",
      "postcss.config.*",
      "vitest.config.*",
      "playwright.config.*",
      "cypress/**",
      "e2e/**",
      "playwright/**",
      "playwright-report/**",
      "test-results/**",
      "scripts/**",
      "docs/**",
      "temp/**",
      "tmp/**",
      "html/**",
      "tests/**",
      "open-in-v0/**"
    ]
  },
  
  // Base configuration
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  
  // Main rules configuration
  {
    plugins: {
      security
    },
    rules: {
      // TypeScript-specific rules
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "ignoreRestSiblings": true,
        "destructuredArrayIgnorePattern": "^_"
      }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/consistent-type-imports": ["error", {
        "prefer": "type-imports",
        "disallowTypeAnnotations": false
      }],
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/array-type": ["error", { "default": "array-simple" }],
      
      // React-specific rules
      "react/no-unescaped-entities": "warn",
      "react/jsx-no-leaked-render": ["error", { "validStrategies": ["ternary"] }],
      "react/jsx-curly-brace-presence": ["error", { "props": "never", "children": "never" }],
      "react/self-closing-comp": ["error", { "component": true, "html": true }],
      "react/jsx-boolean-value": ["error", "never"],
      "react/jsx-fragments": ["error", "syntax"],
      "react/no-array-index-key": "warn",
      "react/jsx-key": ["error", {
        "checkFragmentShorthand": true,
        "checkKeyMustBeforeSpread": true,
        "warnOnDuplicates": true
      }],
      
      // React Hooks rules
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",
      
      // Next.js specific rules
      "@next/next/no-img-element": "warn",
      "@next/next/no-html-link-for-pages": "error",
      "@next/next/no-sync-scripts": "error",
      "@next/next/no-css-tags": "error",
      "@next/next/no-head-element": "error",
      "@next/next/no-styled-jsx-in-document": "error",
      "@next/next/no-title-in-document-head": "error",
      "@next/next/no-typos": "error",
      "@next/next/no-unwanted-polyfillio": "error",
      
      // Security rules (enhanced for admin dashboard)
      "security/detect-object-injection": "warn",
      "security/detect-non-literal-fs-filename": "warn", 
      "security/detect-unsafe-regex": "error",
      "security/detect-buffer-noassert": "error",
      "security/detect-child-process": "error",
      "security/detect-disable-mustache-escape": "error",
      "security/detect-eval-with-expression": "error",
      "security/detect-no-csrf-before-method-override": "error",
      "security/detect-non-literal-regexp": "warn",
      "security/detect-non-literal-require": "warn",
      "security/detect-possible-timing-attacks": "warn",
      "security/detect-pseudoRandomBytes": "error",
      
      // Code quality rules
      "prefer-const": "error",
      "no-var": "error",
      "no-console": ["warn", { "allow": ["warn", "error"] }],
      "no-debugger": "warn",
      "no-empty": ["error", { "allowEmptyCatch": true }],
      "no-unused-expressions": ["error", { 
        "allowShortCircuit": true, 
        "allowTernary": true,
        "allowTaggedTemplates": true 
      }],
      "no-duplicate-imports": "error",
      "no-self-compare": "error",
      "no-template-curly-in-string": "error",
      "no-unneeded-ternary": "error",
      "no-useless-rename": "error",
      "object-shorthand": "error",
      "prefer-arrow-callback": "error",
      "prefer-template": "error",
      "prefer-destructuring": ["error", {
        "array": false,
        "object": true
      }, {
        "enforceForRenamedProperties": false
      }],
      
      // Import/Export rules for better module organization
      "sort-imports": ["error", {
        "ignoreCase": false,
        "ignoreDeclarationSort": true,
        "ignoreMemberSort": false,
        "memberSyntaxSortOrder": ["none", "all", "multiple", "single"],
        "allowSeparatedGroups": true
      }],
      
      // Performance and best practices
      "no-await-in-loop": "warn",
      "require-atomic-updates": "error",
      "prefer-regex-literals": "error",
      
      // Accessibility rules (important for admin interfaces)
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-has-content": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/no-autofocus": "warn",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      
      // Async/await best practices
      "require-await": "error",
      "no-return-await": "error",
      "prefer-promise-reject-errors": "error",
      
      // Error handling
      "no-throw-literal": "error",
      "no-useless-catch": "error",
      
      // Admin dashboard specific rules
      "no-alert": "error", // Use toast notifications instead
      "no-restricted-globals": ["error", "event", "fdescribe"],
      "no-restricted-syntax": [
        "error",
        {
          "selector": "CallExpression[callee.name='setTimeout'][arguments.length!=2]",
          "message": "setTimeout must have exactly 2 arguments"
        },
        {
          "selector": "CallExpression[callee.name='setInterval']",
          "message": "Use useEffect cleanup or AbortController instead of setInterval"
        }
      ],
      
      // Modern JS features
      "prefer-spread": "error",
      "prefer-rest-params": "error",
      "no-useless-constructor": "error",
      
      // Complexity rules
      "complexity": "off",
      "max-depth": ["warn", 4],
      "max-params": ["warn", 5]
    }
  },
  
  // Test files configuration
  {
    files: ["**/*.test.{js,jsx,ts,tsx}", "**/*.spec.{js,jsx,ts,tsx}", "**/test/**/*", "**/tests/**/*"],
    rules: {
      // Relax rules for test files
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "no-console": "off",
      "prefer-const": "off",
      "react/jsx-key": "off",
      "security/detect-object-injection": "off",
      "max-lines-per-function": "off",
      "complexity": "off"
    }
  },
  
  // API route configuration
  {
    files: ["**/api/**/*.{js,ts}", "**/app/api/**/*.{js,ts}"],
    rules: {
      // API-specific rules
      "no-console": ["error", { "allow": ["warn", "error", "info"] }],
      "prefer-const": "error",
      "no-var": "error",
      "security/detect-object-injection": "error",
      "security/detect-possible-timing-attacks": "error",
      "@typescript-eslint/explicit-function-return-type": "warn"
    }
  },
  
  // Configuration files
  {
    files: ["*.config.{js,mjs,ts}", "**/*.config.{js,mjs,ts}"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-console": "off",
      "@typescript-eslint/no-var-requires": "off"
    }
  }
];

export default eslintConfig;
