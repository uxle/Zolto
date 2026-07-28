import js from "@eslint/js";

export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "coverage/**"
      // Add anything from your old .eslintignore here
    ]
  },

  js.configs.recommended,

  {
    files: ["src/**/*.js", "tests/**/*.js"],

    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        performance: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        process: "readonly",
        ComponentRegistry: "readonly",
        parseComponent: "readonly",
        renderComponent: "readonly"
      }
    },

    rules: {
      "no-var": "error",
      "prefer-const": "warn",
      "eqeqeq": ["warn", "always"],
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
      "semi": ["error", "always"],
      "no-useless-escape": "warn",
      "no-useless-assignment": "warn"
    }
  }
];
