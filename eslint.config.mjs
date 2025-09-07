import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react/no-unescaped-entities": "off",
      "prefer-const": "off",
      "no-console": "warn",
    },
  },
  {
    ignores: [
      "sandbox/**/*",
      ".next/**/*",
      "node_modules/**/*",
      "dist/**/*",
      "build/**/*"
    ]
  }
];

export default eslintConfig;
