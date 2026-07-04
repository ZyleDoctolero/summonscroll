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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[var(--bg-deep)]">
      <div
        className="w-full max-w-md p-5 sm:p-8 border-2"
        style={{
          background: "var(--bg-panel)",
          borderColor: "rgba(200,154,62,0.45)",
          borderRadius: 0,
          boxShadow: "6px 6px 0 rgba(44,31,20,0.35)",
        }}
      >
        <div className="text-center mb-8">
          <h1
            className="text-xl sm:text-2xl md:text-3xl font-bold uppercase"
            style={{
              fontFamily: "var(--ss-font-pixel)",
              color: "var(--gold-glow)",
              letterSpacing: "0.1em",
            }}
          >
            SummonScroll
          </h1>
          <p
            className="mt-2 text-xs uppercase tracking-widest"
            style={{ color: "var(--ink-secondary)" }}
          >
            Begin your adventure
          </p>
        </div>

        <div
          className="flex gap-0 mb-8"
          style={{ border: "2px solid rgba(200,154,62,0.35)", borderRadius: 0 }}
          role="tablist"
          aria-label="Sign in or register"
        >
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              role="tab"
              aria-selected={mode === m}
              className="flex-1 py-3 text-[10px] uppercase font-bold min-h-[44px]"
              style={{
                fontFamily: "var(--ss-font-pixel)",
                letterSpacing: "0.06em",
                background: mode === m ? "var(--gold-bright)" : "transparent",
                color: mode === m ? "var(--ink-primary)" : "var(--ink-secondary)",
                borderRight: m === "signin" ? "1px solid rgba(200,154,62,0.25)" : "none",
              }}
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
                className="ss-input w-full text-sm"
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
              className="ss-input w-full text-sm"
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
                className="ss-input w-full pr-16 text-sm"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold uppercase transition-colors"
                style={{ color: "var(--ink-secondary)" }}
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? "Hide" : "Show"}
              </button>
            </div>
          </Field>

          {error && (
            <div
              role="alert"
              className="p-3 text-sm text-center border-2"
              style={{
                borderColor: "var(--danger)",
                color: "var(--danger)",
                background: "rgba(239,68,68,0.08)",
                borderRadius: 0,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="ss-btn ss-btn-primary w-full py-4 mt-2 text-xs uppercase font-bold disabled:opacity-50"
          >
            {loading ? "Connecting..." : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div
        className="mb-2 text-xs font-semibold uppercase tracking-wider"
        style={{ color: "var(--ink-secondary)" }}
      >
        {label}
      </div>
      {children}
    </label>
  );
}
