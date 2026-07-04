import { type ReactNode } from "react";
import { motion } from "motion/react";
import { useRouterState } from "@tanstack/react-router";
import { PlayerHeader } from "./PlayerHeader";
import { Toaster } from "sonner";
import { ease, dur, reducedMotion } from "@/lib/ui/motion-tokens";
import { BottomHUD } from "./BottomHUD";
import { SubNav, HUB_TABS, ROSTER_TABS, VOID_TABS, ALTAR_TABS } from "./SubNav";

type Profile = Parameters<typeof PlayerHeader>[0]["profile"] & {
  class?: string;
};

export function AppShell({
  profile,
  children,
  withHeader = true,
}: {
  profile: Profile;
  children: ReactNode;
  withHeader?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Stage backgrounds live in the parchment system (see styles.css tokens).
  // The old near-black gradients here made every page-level ink color
  // unreadable — dark surfaces are reserved for HUD chrome (SubNav/BottomHUD)
  // and monster frames. Each section keeps its mood via a soft color wash.
  const parchment = "linear-gradient(180deg, var(--bg-deep) 0%, var(--bg-stage) 45%)";
  let activeTabs = null;
  const activeColor = "var(--gold-bright)";
  let bgBackground = parchment;
  if (HUB_TABS.some((t) => t.path === pathname)) {
    activeTabs = HUB_TABS;
    bgBackground = `radial-gradient(ellipse 60% 50% at 50% 0%, rgba(200,154,62,0.14) 0%, transparent 70%), ${parchment}`;
  } else if (ROSTER_TABS.some((t) => t.path === pathname)) {
    activeTabs = ROSTER_TABS;
    bgBackground = `radial-gradient(ellipse 50% 50% at 30% 40%, rgba(56,184,245,0.1) 0%, transparent 65%), ${parchment}`;
  } else if (VOID_TABS.some((t) => t.path === pathname)) {
    activeTabs = VOID_TABS;
    bgBackground = `radial-gradient(ellipse 80% 40% at 50% 100%, rgba(163,116,255,0.12) 0%, transparent 70%), ${parchment}`;
  } else if (ALTAR_TABS.some((t) => t.path === pathname)) {
    activeTabs = ALTAR_TABS;
    bgBackground = `radial-gradient(ellipse 70% 70% at 50% 80%, rgba(200,154,62,0.13) 0%, transparent 65%), ${parchment}`;
  }

  return (
    <div
      className="min-h-screen relative w-full flex flex-col"
      style={{ color: "var(--ink-primary)", zIndex: 1, background: bgBackground }}
    >
      {withHeader && <PlayerHeader profile={profile} />}

      <main className="max-w-5xl mx-auto px-4 py-6 pb-32 md:pb-12 w-full flex-1 relative z-10 flex flex-col pt-20 md:pt-28">
        {activeTabs && (
          <div className="shrink-0 w-full mb-6">
            <SubNav items={activeTabs} color={activeColor} />
          </div>
        )}
        <RouteTransition>{children}</RouteTransition>
      </main>

      <Toaster
        position="top-right"
        theme="light"
        toastOptions={{
          style: {
            background: "rgba(255, 252, 247, 0.96)",
            border: "1px solid rgba(200, 170, 110, 0.3)",
            borderRadius: "12px",
            color: "var(--ink-primary)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: "0 8px 32px rgba(120, 90, 50, 0.1)",
            fontFamily: "var(--ss-font-body)",
            letterSpacing: "0.02em",
          },
        }}
      />
      <BottomHUD />
    </div>
  );
}

// Fades + lifts each screen as the route changes - the "switching menus"
// feel of a game rather than instant page swaps.
function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const rm = reducedMotion();
  return (
    <motion.div
      key={pathname}
      initial={rm ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 15, filter: "blur(4px)" }}
      animate={rm ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
      transition={{
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1], // Custom snappy ease-out
      }}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );
}
