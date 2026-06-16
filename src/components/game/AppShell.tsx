import { type ReactNode } from "react";
import { motion } from "motion/react";
import { useRouterState } from "@tanstack/react-router";
import { PlayerHeader } from "./PlayerHeader";
import { MobilePlayerHeader } from "./MobilePlayerHeader";
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
  let bgImage = "url('/ancient-tome-bg.png')";
  if (HUB_TABS.some((t) => t.path === pathname)) {
    activeTabs = HUB_TABS;
    activeColor = "#b89947";
    bgImage = "url('/bg_hub.png')";
  } else if (ROSTER_TABS.some((t) => t.path === pathname)) {
    activeTabs = ROSTER_TABS;
    activeColor = "#b89947";
    bgImage = "url('/bg_roster.png')";
  } else if (VOID_TABS.some((t) => t.path === pathname)) {
    activeTabs = VOID_TABS;
    activeColor = "#b89947";
    bgImage = "url('/bg_void.png')";
  } else if (ALTAR_TABS.some((t) => t.path === pathname)) {
    activeTabs = ALTAR_TABS;
    activeColor = "#b89947";
    bgImage = "url('/bg_altar.png')";
  }

  return (
    <div
      className="min-h-screen relative w-full overflow-hidden flex flex-col"
      style={{ background: "transparent", color: "var(--ink-primary)", zIndex: 1 }}
    >
      {withHeader && <MobilePlayerHeader profile={profile} />}
      {withHeader && <PlayerHeader profile={profile} />}
      {/* Ambient background for the entire shell (can be overridden by specific routes) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute inset-0 opacity-100 transition-all duration-1000 ease-in-out"
          style={{ 
            backgroundImage: bgImage,
            backgroundSize: "cover",
            backgroundPosition: "center"
          }} 
        />
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#2a1e12]/90 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-[#2a1e12] via-[#2a1e12]/95 to-transparent" />
      </div>

      <main className="w-full flex-1 overflow-hidden relative z-10 flex flex-col pt-16 md:pt-20">
        {activeTabs && (
          <div className="px-4 shrink-0 max-w-6xl mx-auto w-full pt-4">
            <SubNav items={activeTabs} color={activeColor} />
          </div>
        )}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
          <RouteTransition>{children}</RouteTransition>
        </div>
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
