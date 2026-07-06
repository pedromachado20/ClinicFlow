import { defineConfig } from "@tanstack/start/config";
import viteTsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { loadEnv } from "vite";

const localEnv = loadEnv("", process.cwd(), "");
const getEnv = (key: string) => localEnv[key] || process.env[key] || "";

export default defineConfig({
  tsr: {
    routesDirectory: "./src/routes",
    generatedRouteTree: "./src/routeTree.gen.ts",
  },
  routers: {
    api: {
      entry: "./src/api.ts",
    },
    ssr: {
      entry: "./src/ssr.tsx",
    },
    client: {
      entry: "./src/client.tsx",
    },
  },
  server: {
    preset: "vercel",
    externals: {
      inline: ["better-auth", "@better-auth/utils"],
    },
  },
  vite: {
    define: {
      "process.env.DATABASE_URL": JSON.stringify(getEnv("DATABASE_URL")),
      "process.env.BETTER_AUTH_SECRET": JSON.stringify(getEnv("BETTER_AUTH_SECRET")),
      "process.env.BETTER_AUTH_URL": JSON.stringify(getEnv("BETTER_AUTH_URL")),
      "process.env.ASAAS_API_KEY": JSON.stringify(getEnv("ASAAS_API_KEY")),
      "process.env.ASAAS_BASE_URL": JSON.stringify(getEnv("ASAAS_BASE_URL")),
      "process.env.ASAAS_WEBHOOK_TOKEN": JSON.stringify(getEnv("ASAAS_WEBHOOK_TOKEN")),
      "process.env.SUBSCRIPTION_PRICE_OVERRIDE": JSON.stringify(getEnv("SUBSCRIPTION_PRICE_OVERRIDE")),
      "process.env.RESEND_API_KEY": JSON.stringify(getEnv("RESEND_API_KEY")),
      "process.env.EMAIL_FROM": JSON.stringify(getEnv("EMAIL_FROM")),
      "process.env.CRON_SECRET": JSON.stringify(getEnv("CRON_SECRET")),
    },
    plugins: [
      tailwindcss(),
      viteTsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
    ],
  },
});
