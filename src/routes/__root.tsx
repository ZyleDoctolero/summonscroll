import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CascadeProvider } from "../components/game/CascadeCard";
import { WhisperProvider } from "../components/game/WhisperFeed";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-deep)] px-4">
      <div className="max-w-md text-center text-[#2a1e12]">
        <h1 className="text-7xl font-bold text-[#b89047]">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-[#b89047] px-4 py-2 text-sm font-medium text-[var(--bg-deep)] transition-colors hover:brightness-110"
        >
          Return to Hub
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-deep)] px-4 text-[#2a1e12]">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 rounded-md bg-[#b89047] px-4 py-2 text-sm font-medium text-[var(--bg-deep)]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="app-content-layer">
        <Outlet />
      </div>
      <CascadeProvider />
      <WhisperProvider />
    </QueryClientProvider>
  );
}
