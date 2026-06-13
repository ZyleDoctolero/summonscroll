import { type ReactNode } from "react";
import { GameSidebar } from "./GameSidebar";
import { PlayerHeader } from "./PlayerHeader";
import { MobilePlayerHeader } from "./MobilePlayerHeader";
import { Toaster } from "sonner";

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
      className="min-h-screen"
      style={{ background: "var(--bg-deep)", color: "var(--ink-primary)" }}
    >
      <GameSidebar
        displayName={profile.display_name}
        level={profile.level}
        playerClass={profile.class}
      />
      {withHeader && <MobilePlayerHeader profile={profile as any} />}
      {withHeader && <PlayerHeader profile={profile} />}
      <main className={`md:ml-[260px] ${withHeader ? "md:pt-14" : ""} min-h-screen pb-20 md:pb-0`}>
        {children}
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
    </div>
  );
}
