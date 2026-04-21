import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // Catch invalid Tailwind padding: pl-[-..], pr-[-..], px-[-..], py-[-..],
      // pt-[-..], pb-[-..], p-[-..]. Tailwind doesn't support negative arbitrary
      // values for padding utilities — use margin (-m*) or 0 instead.
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/\\b(p[lrtbxy]?)-\\[-[^\\]]+\\]/]",
          message:
            "Invalid Tailwind: padding utilities don't support negative arbitrary values (e.g. pl-[-0.5rem]). Use a non-negative value or a negative margin (-m*) instead.",
        },
        {
          selector: "TemplateElement[value.raw=/\\b(p[lrtbxy]?)-\\[-[^\\]]+\\]/]",
          message:
            "Invalid Tailwind: padding utilities don't support negative arbitrary values (e.g. pl-[-0.5rem]). Use a non-negative value or a negative margin (-m*) instead.",
        },
      ],
    },
  },
);
