import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import twConfigRaw from "../screens/_twconfig.js?raw";
import sharedStyles from "../screens/_styles.css?raw";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0C0E14] px-4">
      <div className="max-w-md text-center text-[#F0EDE6]">
        <h1 className="text-7xl font-bold text-[#f1bf5f]">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-[#f1bf5f] px-4 py-2 text-sm font-medium text-[#412d00] transition-colors hover:brightness-110"
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
    <div className="flex min-h-screen items-center justify-center bg-[#0C0E14] px-4 text-[#F0EDE6]">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-md bg-[#f1bf5f] px-4 py-2 text-sm font-medium text-[#412d00]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SummonScroll" },
      { name: "description", content: "A dark-fantasy companion app for habits, summoning, and battles." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap",
      },
    ],
    scripts: [
      // Tailwind play CDN must load first so the `tailwind` global exists,
      // then we set the custom config (matching the source mockups' order).
      { src: "https://cdn.tailwindcss.com?plugins=forms,container-queries" },
      { children: twConfigRaw },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
        <style dangerouslySetInnerHTML={{ __html: sharedStyles }} />
      </head>
      <body className="bg-[#0C0E14] text-[#F0EDE6]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
