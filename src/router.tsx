import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { QueryClient, QueryCache } from "@tanstack/react-query";
import { toast } from "sonner";
import { routeTree } from "./routeTree.gen";

export function createRouter() {
  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        console.error("Query error:", error);
        toast.error(error instanceof Error ? error.message : "Erro ao carregar dados");
      },
    }),
  });

  return createTanStackRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: "intent",
    scrollRestoration: true,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
