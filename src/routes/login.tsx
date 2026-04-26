import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.jpeg";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Sign in — TRI CUBE Digital Solutions" },
      { name: "description", content: "Sign in to your TRI CUBE management dashboard." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
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
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        // Try to claim admin if no admin exists yet (first user bootstrap)
        await supabase.rpc("claim_first_admin");
      }
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-gold/20 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-teal/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card rounded-3xl p-8 sm:p-10 w-full max-w-md shadow-elev relative z-10"
      >
        <Link to="/" className="flex flex-col items-center gap-2 mb-8">
          <img src={logo} alt="TRI CUBE Digital Solutions" className="h-20 w-20 object-contain rounded-2xl" />
        </Link>

        <h1 className="font-display text-2xl font-semibold tracking-tight mb-1">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {mode === "signin" ? "Sign in to continue to your dashboard." : "New users join with staff access by default."}
        </p>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <Field label="Full name" value={fullName} onChange={setFullName} type="text" required />
          )}
          <Field label="Email" value={email} onChange={setEmail} type="email" required autoComplete="email" />
          <Field label="Password" value={password} onChange={setPassword} type="password" required minLength={6} autoComplete={mode === "signin" ? "current-password" : "new-password"} />

          {error && <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</div>}

          <button
            disabled={loading}
            className="w-full h-11 rounded-xl bg-gradient-gold text-white font-medium shadow-gold hover:opacity-95 transition disabled:opacity-50"
          >
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}
          className="mt-6 text-sm text-muted-foreground hover:text-foreground w-full text-center transition"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </motion.div>
    </div>
  );
}

function Field({
  label, value, onChange, type, required, minLength, autoComplete,
}: {
  label: string; value: string; onChange: (v: string) => void; type: string;
  required?: boolean; minLength?: number; autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-foreground/70 mb-1.5 block">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        className="w-full h-11 rounded-xl border border-input bg-white/60 backdrop-blur px-3.5 text-sm outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/40 transition"
      />
    </label>
  );
}
