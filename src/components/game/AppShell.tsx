import { type ReactNode } from "react";
import { motion } from "motion/react";
import { useRouterState } from "@tanstack/react-router";
import { PlayerHeader } from "./PlayerHeader";
import { MobilePlayerHeader } from "./MobilePlayerHeader";
import { Toaster } from "sonner";
import { ease, dur, reducedMotion } from "@/lib/ui/motion-tokens";
import { BottomHUD } from "./BottomHUD";

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
  return (
    <div
      className="min-h-screen relative w-full overflow-hidden"
      style={{ background: "transparent", color: "var(--ink-primary)", zIndex: 1 }}
    >
      {withHeader && <MobilePlayerHeader profile={profile} />}
      {withHeader && <PlayerHeader profile={profile} />}
      {/* Ambient background for the entire shell (can be overridden by specific routes) */}
      <div className="fixed inset-0 pointer-events-none bg-[var(--manhwa-system-dark)]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(74,144,226,0.1)_0%,var(--manhwa-system-dark)_100%)]" />
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#1a0b2e]/60 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-[var(--manhwa-system-dark)] to-transparent" />
      </div>

      <main className="w-full h-screen overflow-hidden relative pb-20 md:pb-0 z-10">
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
