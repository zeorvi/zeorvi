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
      "scripts/**", // Ignorar scripts de Node.js
      "*.config.js", // Ignorar archivos de configuración
      "jest.setup.js", // Ignorar setup de Jest
      ".github/**", // Ignorar archivos de GitHub
      "**/.github/**", // Ignorar archivos de GitHub en cualquier ubicación
      "*.yml", // Ignorar archivos YAML
      "*.yaml", // Ignorar archivos YAML
      ".actionlint.yaml", // Ignorar configuración de actionlint
      ".actionlint.yml", // Ignorar configuración de actionlint
    ],
    rules: {
      // Relajar reglas estrictas para desarrollo
      "@typescript-eslint/no-explicit-any": "warn", // Cambiar de error a warning
      "@typescript-eslint/no-unused-vars": "warn", // Cambiar de error a warning
      "@typescript-eslint/no-unsafe-function-type": "warn", // Cambiar de error a warning
      "react/no-unescaped-entities": "warn", // Cambiar de error a warning
      "import/no-anonymous-default-export": "warn", // Cambiar de error a warning
      "react-hooks/exhaustive-deps": "warn", // Cambiar de error a warning
      
      // Deshabilitar reglas problemáticas para el contexto actual
      "@typescript-eslint/no-require-imports": "off", // Permitir require en scripts
    },
  },
];

export default eslintConfig;
