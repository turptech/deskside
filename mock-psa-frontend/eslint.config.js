import js from "@eslint/js"
import { defineConfig, globalIgnores } from "eslint/config"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import globals from "globals"
import tseslint from "typescript-eslint"

export default defineConfig([
  globalIgnores(["dist", "coverage"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: "latest",
      globals: globals.browser,
    },
  },
  {
    // shadcn intentionally co-locates variants/hooks with generated components.
    files: ["src/components/ui/**/*.{ts,tsx}", "src/hooks/use-mobile.ts"],
    rules: {
      "react-refresh/only-export-components": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    // These modules intentionally expose a component plus its colocated hook/helper.
    files: [
      "src/app/theme-provider.tsx",
      "src/features/tickets/ticket-badges.tsx",
    ],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
])
