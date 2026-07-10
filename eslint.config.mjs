import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  {
    ignores: [
      // Default ignores of eslint-config-next:
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // Serwist auto-generated files
      "public/sw.js",
      "public/sw.js.map",
      "public/workbox-*.js",
      // Scratch / test scripts
      "scratch/**",
    ],
  },
];

export default eslintConfig;
