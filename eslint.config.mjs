import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "coverage/**",
      "dist/**",
      "prisma/migrations/**",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // TypeScript strict rules
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/prefer-const": "error",

      // Code quality rules
      "prefer-const": "error",
      "no-var": "error",
      "no-console": "warn",
      "no-debugger": "error",
      "max-len": ["warn", { code: 100, ignoreUrls: true }],
      "max-params": ["error", 4],
      "complexity": ["warn", 10],
      "max-depth": ["error", 4],

      // Import/Export rules
      "no-duplicate-imports": "error",
      "sort-imports": ["error", { ignoreDeclarationSort: true }],

      // React rules
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      "react-hooks/exhaustive-deps": "warn",

      // Security rules
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",

      // Performance rules
      "react/jsx-no-bind": [
        "warn",
        {
          allowArrowFunctions: true,
          allowBind: false,
          ignoreRefs: true,
        },
      ],
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },
];

export default eslintConfig;
