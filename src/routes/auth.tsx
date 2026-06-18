import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-black">
      {/* MANHWA BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#02040a] to-[#02040a]" />
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 1) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md ss-panel-holographic p-8 rounded-xl backdrop-blur-md border border-[var(--ss-border-active)]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white to-[var(--ink-secondary)] drop-shadow-[0_0_10px_rgba(128,222,234,0.5)]">
            SUMMONSCROLL
          </h1>
          <p className="mt-2 text-xs font-mono uppercase tracking-widest text-[var(--ink-secondary)] opacity-70">
            System Initialization
          </p>
        </div>

        <div className="flex justify-center gap-2 mb-8 p-1 bg-[rgba(0,0,0,0.5)] rounded-lg border border-[var(--ss-border)]">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all duration-300 ${
                mode === m 
                  ? "bg-white/10 text-[var(--gold-bright)] shadow-[inset_0_0_10px_rgba(255,213,79,0.2)]" 
                  : "text-[var(--ink-secondary)] hover:bg-white/5 hover:text-white"
              }`}
            >
              {m === "signin" ? "Login" : "Register"}
            </button>
          ))}
        </div>

        <form className="space-y-5" onSubmit={onSubmit}>
          {mode === "signup" && (
            <Field label="Hunter Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sung Jin-Woo..."
                maxLength={40}
                className="w-full bg-[rgba(0,0,0,0.4)] border border-[var(--ss-border)] rounded-md px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[var(--gold-bright)] focus:ring-1 focus:ring-[var(--gold-glow)] transition-all font-mono text-sm"
              />
            </Field>
          )}
          <Field label="System ID (Email)">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hunter@system.kr"
              className="w-full bg-[rgba(0,0,0,0.4)] border border-[var(--ss-border)] rounded-md px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[var(--gold-bright)] focus:ring-1 focus:ring-[var(--gold-glow)] transition-all font-mono text-sm"
            />
          </Field>
          <Field label="Passcode">
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="w-full bg-[rgba(0,0,0,0.4)] border border-[var(--ss-border)] rounded-md pl-4 pr-16 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[var(--gold-bright)] focus:ring-1 focus:ring-[var(--gold-glow)] transition-all font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold uppercase text-[var(--ink-secondary)] hover:text-white transition-colors"
              >
                {show ? "Hide" : "Show"}
              </button>
            </div>
          </Field>

          {error && (
            <div className="p-3 mt-4 text-sm bg-red-950/50 border border-red-500/50 text-red-200 rounded-md text-center">
              <span className="font-bold text-red-400">System Error:</span> {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-6 mt-6 text-sm relative group overflow-hidden bg-gradient-to-r from-[var(--gold-glow)] to-[var(--gold-bright)] text-black font-bold border-none shadow-[0_0_15px_rgba(255,213,79,0.3)] hover:shadow-[0_0_25px_rgba(255,213,79,0.5)] transition-all"
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12" />
            
            <span className="relative z-10">
              {loading ? (
                <span className="animate-pulse">Connecting to System...</span>
              ) : mode === "signin" ? (
                "Access System"
              ) : (
                "Initialize Player"
              )}
            </span>
          </Button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">
        {label}
      </div>
      {children}
    </label>
  );
}
