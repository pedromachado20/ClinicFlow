import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Só precisa ser uma string não-vazia — `neon()` não conecta na criação, só na 1ª query.
    // Evita que testes puros que importam `~/server/context` (que importa `~/db` estaticamente)
    // quebrem por falta de DATABASE_URL, sem depender do banco real de produção.
    env: { DATABASE_URL: "postgresql://test:test@localhost:5432/test" },
  },
});
