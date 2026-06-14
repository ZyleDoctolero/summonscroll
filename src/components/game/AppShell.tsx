import { type ReactNode } from "react";
import { motion } from "motion/react";
import { useRouterState } from "@tanstack/react-router";
import { GameSidebar } from "./GameSidebar";
import { PlayerHeader } from "./PlayerHeader";
import { MobilePlayerHeader } from "./MobilePlayerHeader";
import { Toaster } from "sonner";
import { ease, dur, reducedMotion } from "@/lib/ui/motion-tokens";
import { MobileNav } from "./MobileNav";

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
      className="min-h-screen relative"
      style={{ background: "transparent", color: "var(--ink-primary)", zIndex: 1 }}
    >
      <GameSidebar
        displayName={profile.display_name}
        level={profile.level}
        playerClass={profile.class}
      />
      {withHeader && <MobilePlayerHeader profile={profile as any} />}
      {withHeader && <PlayerHeader profile={profile} />}
      <main className={`md:ml-[260px] ${withHeader ? "md:pt-14" : ""} min-h-screen pb-20 md:pb-0`}>
        <RouteTransition>{children}</RouteTransition>
      </main>
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "var(--bg-panel)",
            border: "var(--ss-hairline-active)",
            color: "var(--ink-primary)",
          },
        }}
      />
      <MobileNav />
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
      initial={rm ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={rm ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: dur.normal, ease: ease.out }}
    >
      {children}
    </motion.div>
  );
}
