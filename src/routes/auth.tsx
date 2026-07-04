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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-[var(--bg-deep)]">
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(255,213,79,0.1) 0%, transparent 60%)",
          }}
        />
      </div>

      <div
        className="relative z-10 w-full max-w-md p-5 sm:p-8 border-2"
        style={{
          background: "rgba(18,14,9,0.95)",
          borderColor: "rgba(200,154,62,0.3)",
          boxShadow: "6px 6px 0 rgba(0,0,0,0.5)",
        }}
      >
        <div className="text-center mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold tracking-wider md:tracking-widest text-[#b8860b]">
            SUMMONSCROLL
          </h1>
          <p className="mt-2 text-xs uppercase tracking-widest text-[var(--ink-tertiary)]">
            Begin your adventure
          </p>
        </div>

        <div className="flex justify-center gap-2 mb-8 p-1 bg-[rgba(255,200,80,0.05)] rounded-lg border border-[rgba(200,154,62,0.15)]">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all duration-300 ${
                mode === m
                  ? "bg-[rgba(200,154,62,0.15)] text-[#c89a3e] shadow-sm"
                  : "text-[var(--ink-tertiary)] hover:text-[var(--ink-secondary)]"
              }`}
            >
              {m === "signin" ? "Login" : "Register"}
            </button>
          ))}
        </div>

        <form className="space-y-5" onSubmit={onSubmit}>
          {mode === "signup" && (
            <Field label="Your Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name..."
                maxLength={40}
                className="w-full bg-[rgba(255,200,80,0.04)] border border-[rgba(200,154,62,0.18)] rounded-lg px-4 py-3 text-[var(--ink-primary)] placeholder:text-[var(--ink-tertiary)] focus:outline-none focus:border-[#c89a3e] focus:ring-1 focus:ring-[#c89a3e]/30 transition-all text-sm"
              />
            </Field>
          )}
          <Field label="Email">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-[rgba(255,200,80,0.04)] border border-[rgba(200,154,62,0.18)] rounded-lg px-4 py-3 text-[var(--ink-primary)] placeholder:text-[var(--ink-tertiary)] focus:outline-none focus:border-[#c89a3e] focus:ring-1 focus:ring-[#c89a3e]/30 transition-all text-sm"
            />
          </Field>
          <Field label="Password">
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="w-full bg-[rgba(255,200,80,0.04)] border border-[rgba(200,154,62,0.18)] rounded-lg pl-4 pr-16 py-3 text-[var(--ink-primary)] placeholder:text-[var(--ink-tertiary)] focus:outline-none focus:border-[#c89a3e] focus:ring-1 focus:ring-[#c89a3e]/30 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold uppercase text-[var(--ink-tertiary)] hover:text-[var(--ink-primary)] transition-colors"
              >
                {show ? "Hide" : "Show"}
              </button>
            </div>
          </Field>

          {error && (
            <div className="p-3 mt-4 text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg text-center">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-6 mt-6 text-sm relative group overflow-hidden bg-gradient-to-r from-[#c89a3e] to-[#e8c55a] text-white font-bold border-none rounded-xl shadow-[0_4px_15px_rgba(200,154,62,0.3)] hover:shadow-[0_6px_25px_rgba(200,154,62,0.4)] transition-all"
          >
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" />

            <span className="relative z-10">
              {loading ? (
                <span className="animate-pulse">Connecting...</span>
              ) : mode === "signin" ? (
                "Sign In"
              ) : (
                "Create Account"
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
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)]">
        {label}
      </div>
      {children}
    </label>
  );
}
