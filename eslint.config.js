import opencastConfig from "@opencast/eslint-config-ts-react";

export default [
  ...opencastConfig,

  // Fully ignore some files
  {
    ignores: ["build/", "**/*.js", "*.ts", "tests/**"],
  },

  {
    rules: {
      // // TODO: We want to turn these on eventually
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-unsafe-return": "off",
    },
  },
];
