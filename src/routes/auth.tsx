import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/" });
  },
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setError(null), [mode]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
      }
      nav({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        
        .pixel-font { font-family: 'Press Start 2P', monospace; }
        
        .pixel-panel {
          background: #f4ecd8;
          border: 4px solid #b89047;
          box-shadow: inset -6px -6px 0px 0px rgba(0,0,0,0.8),
                      inset 6px 6px 0px 0px rgba(61,46,31,0.1),
                      10px 10px 0px 0px rgba(0,0,0,0.8);
          position: relative;
        }

        .pixel-panel::before {
          content: "";
          position: absolute;
          top: -8px; bottom: -8px; left: 8px; right: 8px;
          border-left: 4px solid #b89047;
          border-right: 4px solid #b89047;
          pointer-events: none;
        }

        .pixel-panel::after {
          content: "";
          position: absolute;
          left: -8px; right: -8px; top: 8px; bottom: 8px;
          border-top: 4px solid #b89047;
          border-bottom: 4px solid #b89047;
          pointer-events: none;
        }

        .pixel-btn {
          background: #b89047;
          color: #000;
          border: 4px solid #fff;
          box-shadow: inset -4px -4px 0px 0px rgba(0,0,0,0.3);
          text-transform: uppercase;
          cursor: pointer;
        }

        .pixel-btn:active:not(:disabled) {
          box-shadow: inset 4px 4px 0px 0px rgba(0,0,0,0.3);
          padding-top: 14px !important;
          padding-bottom: 10px !important;
        }

        .pixel-btn:disabled {
          background: #555;
          border-color: #888;
          color: #222;
          cursor: not-allowed;
        }

        .pixel-input {
          background: #111;
          color: #fff;
          border: 4px solid #3d2e1f;
          outline: none;
          padding: 12px;
          width: 100%;
        }

        .pixel-input:focus {
          border-color: #b89047;
          background: #001a22;
        }

        .pixel-tab {
          background: transparent;
          color: #3d2e1f;
          border: none;
          cursor: pointer;
        }
        
        .pixel-tab.active {
          color: #b89047;
          text-shadow: 2px 2px 0px #000;
        }

        .pixel-tab.active::before {
          content: "► ";
          color: #b89047;
        }
      `}</style>

      {/* PIXEL ART BACKGROUND */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'url("/pixel-auth-bg.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          imageRendering: "pixelated",
          filter: "brightness(0.7) contrast(1.2)",
        }}
      />

      {/* SCANLINES OVERLAY */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))",
          backgroundSize: "100% 4px, 3px 100%"
        }}
      />

      <div className="relative w-full max-w-md pixel-panel p-8 z-10 mx-4">
        <h1 className="text-center text-xl md:text-2xl pixel-font leading-relaxed" style={{ color: "#b89047", textShadow: "4px 4px 0px #000" }}>
          SUMMONSCROLL
        </h1>
        <p className="text-center text-[10px] mt-4 pixel-font opacity-80" style={{ color: "#b89047", textShadow: "2px 2px 0px #000" }}>
          INSERT COIN TO START
        </p>

        <div className="mt-8 flex justify-center gap-6 pixel-font text-[10px] uppercase mb-6">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`pixel-tab ${mode === m ? "active" : ""} transition-colors`}
            >
              {m === "signin" ? "Load Game" : "New Game"}
            </button>
          ))}
        </div>

        <form className="space-y-6 pixel-font text-[10px]" onSubmit={onSubmit}>
          {mode === "signup" && (
            <Field label="PLAYER NAME">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="HERO..."
                maxLength={40}
                className="pixel-input"
              />
            </Field>
          )}
          <Field label="EMAIL">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="PLAYER@REALM.COM"
              className="pixel-input"
            />
          </Field>
          <Field label="SECRET KEY">
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="pixel-input pr-16"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: "#3d2e1f" }}
              >
                {show ? "HIDE" : "SHOW"}
              </button>
            </div>
          </Field>

          {error && (
            <div className="p-3 border-4 border-[var(--danger)] bg-red-900/50 text-[var(--danger)] leading-relaxed text-center shadow-[inset_0_0_10px_rgba(255,0,0,0.5)]">
              ERR: {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 pixel-btn mt-4 text-[12px]"
          >
            {loading
              ? "CONNECTING..."
              : mode === "signin"
                ? "START"
                : "INITIALIZE"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2" style={{ color: "#8a6d3b", textShadow: "2px 2px 0px #000" }}>
        {label}
      </div>
      {children}
    </label>
  );
}
