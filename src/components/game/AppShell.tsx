import { type ReactNode } from "react";
import { GameSidebar } from "./GameSidebar";
import { PlayerHeader } from "./PlayerHeader";
import { Toaster } from "sonner";

type Profile = Parameters<typeof PlayerHeader>[0]["profile"];

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
    <div className="min-h-screen" style={{ background: "#0C0E14", color: "#F0EDE6" }}>
      <GameSidebar displayName={profile.display_name} level={profile.level} />
      {withHeader && <PlayerHeader profile={profile} />}
      <main className={`md:ml-[260px] ${withHeader ? "md:pt-14" : ""} min-h-screen`}>
        {children}
      </main>
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "#13161F",
            border: "1px solid rgba(255,213,79,0.3)",
            color: "#F0EDE6",
          },
        }}
      />
    </div>
  );
}
