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

  let activeTabs = null;
  let activeColor = "#b89947";
  let bgBackground = "linear-gradient(180deg, #08080f 0%, #0c1020 50%, #080c18 100%)";
  if (HUB_TABS.some((t) => t.path === pathname)) {
    activeTabs = HUB_TABS;
    activeColor = "#b89947";
    bgBackground = "radial-gradient(ellipse 60% 50% at 50% 60%, rgba(255,224,102,0.12) 0%, transparent 70%), radial-gradient(ellipse 40% 60% at 20% 80%, rgba(196,127,255,0.07) 0%, transparent 60%), linear-gradient(180deg, #08080f 0%, #0c1020 50%, #080c18 100%)";
  } else if (ROSTER_TABS.some((t) => t.path === pathname)) {
    activeTabs = ROSTER_TABS;
    activeColor = "#b89947";
    bgBackground = "radial-gradient(ellipse 50% 50% at 30% 40%, rgba(56,184,245,0.07) 0%, transparent 65%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(255,224,102,0.05) 0%, transparent 60%), linear-gradient(180deg, #08080f 0%, #08101a 100%)";
  } else if (VOID_TABS.some((t) => t.path === pathname)) {
    activeTabs = VOID_TABS;
    activeColor = "#b89947";
    bgBackground = "radial-gradient(ellipse 80% 40% at 50% 100%, rgba(255,79,106,0.10) 0%, transparent 70%), radial-gradient(ellipse 40% 50% at 80% 50%, rgba(245,166,35,0.06) 0%, transparent 60%), linear-gradient(180deg, #08080f 0%, #120806 100%)";
  } else if (ALTAR_TABS.some((t) => t.path === pathname)) {
    activeTabs = ALTAR_TABS;
    activeColor = "#b89947";
    bgBackground = "radial-gradient(ellipse 70% 70% at 50% 80%, rgba(196,127,255,0.18) 0%, transparent 65%), radial-gradient(ellipse 30% 40% at 50% 100%, rgba(255,79,106,0.06) 0%, transparent 60%), linear-gradient(180deg, #08080f 0%, #0a080f 100%)";
  }

  return (
    <div
      className="min-h-screen relative w-full flex flex-col"
      style={{ color: "var(--ink-primary)", zIndex: 1 }}
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
        theme="dark"
        toastOptions={{
          style: {
            background:
              "linear-gradient(145deg, rgba(26, 11, 46, 0.95), var(--manhwa-system-dark))",
            border: "2px solid var(--manhwa-legendary-gold)",
            borderRadius: "8px",
            color: "var(--manhwa-legendary-gold)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.9), inset 0 0 15px rgba(212, 175, 63, 0.2)",
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
