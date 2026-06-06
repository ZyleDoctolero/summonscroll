import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/" });
  },
  head: () => ({ meta: [{ title: "SummonScroll — Enter the Realm" }] }),
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
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at top, rgba(200,154,62,0.18), transparent 60%), linear-gradient(180deg,#0C0E14 0%,#080a0f 100%)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1600&q=70")',
          backgroundSize: "cover",
          opacity: 0.12,
          mixBlendMode: "screen",
        }}
      />
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 backdrop-blur-xl p-8 shadow-2xl"
        style={{ background: "rgba(19,22,31,0.82)" }}
      >
        <div
          className="absolute top-0 left-6 right-6 h-px"
          style={{ background: "linear-gradient(90deg,transparent, #FFD54F, transparent)" }}
        />
        <h1
          className="text-center text-3xl font-bold"
          style={{ color: "#FFD54F", fontFamily: "'Cinzel', serif", letterSpacing: "0.04em" }}
        >
          SummonScroll
        </h1>
        <p className="text-center text-sm mt-2" style={{ color: "#A09D96" }}>
          Your habits. Your monsters. Your legend.
        </p>

        <div className="mt-6 flex gap-2 p-1 rounded-lg bg-black/40 border border-white/5">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex-1 py-2 text-xs uppercase tracking-widest font-bold rounded-md transition-all"
              style={{
                background: mode === m ? "linear-gradient(135deg,#C89A3E,#FFD54F)" : "transparent",
                color: mode === m ? "#0C0E14" : "#A09D96",
              }}
            >
              {m === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          {mode === "signup" && (
            <Field label="Summoner Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="CrimsonBlade"
                maxLength={40}
                className="ss-input"
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
              className="ss-input"
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
                placeholder="••••••••"
                className="ss-input pr-10"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
                style={{ color: "#A09D96" }}
              >
                {show ? "Hide" : "Show"}
              </button>
            </div>
          </Field>

          {error && (
            <div
              className="text-sm p-3 rounded-md border"
              style={{ background: "rgba(224,82,82,0.1)", borderColor: "rgba(224,82,82,0.3)", color: "#FCA5A5" }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-md font-bold uppercase tracking-widest text-sm disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg,#C89A3E,#FFD54F)",
              color: "#0C0E14",
              boxShadow: "0 0 24px rgba(255,213,79,0.25)",
            }}
          >
            {loading
              ? mode === "signin"
                ? "Summoning…"
                : "Forging Contract…"
              : mode === "signin"
                ? "Enter the Realm"
                : "Begin Your Journey"}
          </button>
        </form>
      </div>
      <style>{`
        .ss-input {
          width: 100%;
          background: #1A1E2A;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 10px 12px;
          color: #F0EDE6;
          font-size: 14px;
          outline: none;
          transition: border-color .15s;
        }
        .ss-input:focus { border-color: #C89A3E; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div
        className="text-[11px] uppercase tracking-widest mb-1 font-semibold"
        style={{ color: "#A09D96" }}
      >
        {label}
      </div>
      {children}
    </label>
  );
}
