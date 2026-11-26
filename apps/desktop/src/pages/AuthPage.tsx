import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { BrandMark } from "../components/BrandMark";
import { supabaseConfigured, useAuth } from "../lib/auth";

export function AuthPage() {
  const { session, localMode, signIn, signUp, resetPassword, enterLocalDemo } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (session || localMode) return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (mode === "signin") {
      setError(await signIn(email, password));
    } else if (mode === "signup") {
      setError(await signUp(email, password, name));
      if (!error) setInfo("Check your email if confirmations are enabled, or sign in.");
    } else {
      setError(await resetPassword(email));
      setInfo("If that account exists, a reset link was sent.");
    }
  }

  return (
    <div className="grid h-full place-items-center px-4">
      <div className="w-full max-w-md animate-fade-up">
        <BrandMark size={72} withWordmark />
        <h1 className="sr-only">System</h1>
        <p className="mt-3 text-text-secondary">Your day. Under control.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-3">
          {mode === "signup" && (
            <input
              className="w-full rounded-md border border-border bg-surface px-3 py-2"
              placeholder="Display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            type="email"
            required
            className="w-full rounded-md border border-border bg-surface px-3 py-2"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {mode !== "reset" && (
            <input
              type="password"
              required
              minLength={8}
              className="w-full rounded-md border border-border bg-surface px-3 py-2"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
          {error && <p className="text-sm text-danger">{error}</p>}
          {info && <p className="text-sm text-accent">{info}</p>}
          <button
            type="submit"
            className="w-full rounded-md bg-accent py-2 font-medium text-background hover:bg-accent-strong"
          >
            {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset"}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-3 text-sm text-text-secondary">
          <button type="button" onClick={() => setMode("signin")}>
            Sign in
          </button>
          <button type="button" onClick={() => setMode("signup")}>
            Register
          </button>
          <button type="button" onClick={() => setMode("reset")}>
            Reset password
          </button>
        </div>

        {!supabaseConfigured && (
          <p className="mt-6 text-sm text-warning">
            Supabase env not set. You can continue in local offline demo mode.
          </p>
        )}
        <button
          type="button"
          className="mt-3 text-sm text-accent hover:text-accent-strong"
          onClick={enterLocalDemo}
        >
          Continue offline (local demo)
        </button>
      </div>
    </div>
  );
}
