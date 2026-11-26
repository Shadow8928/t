import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "./supabase";
import { db, newId } from "./db";

interface AuthState {
  ready: boolean;
  session: Session | null;
  user: User | null;
  localMode: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<string | null>;
  deleteAccount: () => Promise<string | null>;
  registerDevice: () => Promise<void>;
  enterLocalDemo: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const LOCAL_USER_KEY = "localDemoUser";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [localMode, setLocalMode] = useState(false);

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      const demo = await db.meta.get(LOCAL_USER_KEY);
      if (demo?.value === "1") setLocalMode(true);

      if (supabase) {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
        unsub = () => sub.subscription.unsubscribe();
      }
      setReady(true);
    })();
    return () => unsub();
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    if (!supabase) return "Supabase is not configured. Use local demo mode or set VITE_SUPABASE_*.";
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName, timezone: "America/Chicago" } },
    });
    return error?.message ?? null;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return "Supabase is not configured. Use local demo mode or set VITE_SUPABASE_*.";
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }, []);

  const signOut = useCallback(async () => {
    setLocalMode(false);
    await db.meta.delete(LOCAL_USER_KEY);
    if (supabase) await supabase.auth.signOut();
    setSession(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!supabase) return "Supabase is not configured.";
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/settings`,
    });
    return error?.message ?? null;
  }, []);

  const deleteAccount = useCallback(async () => {
    if (localMode) {
      await db.delete();
      await db.open();
      await signOut();
      return null;
    }
    if (!supabase) return "Supabase is not configured.";
    const { error } = await supabase.rpc("delete_own_account");
    if (error) return error.message;
    await signOut();
    return null;
  }, [localMode, signOut]);

  const registerDevice = useCallback(async () => {
    if (!supabase || !session) return;
    let deviceId = (await db.meta.get("deviceId"))?.value;
    if (!deviceId) {
      deviceId = newId();
      await db.meta.put({ key: "deviceId", value: deviceId });
    }
    await supabase.from("devices").upsert({
      id: deviceId,
      user_id: session.user.id,
      device_name: navigator.userAgent.slice(0, 80),
      platform: "desktop",
      last_seen_at: new Date().toISOString(),
    });
  }, [session]);

  const enterLocalDemo = useCallback(() => {
    setLocalMode(true);
    void db.meta.put({ key: LOCAL_USER_KEY, value: "1" });
  }, []);

  useEffect(() => {
    if (session) void registerDevice();
  }, [session, registerDevice]);

  const value = useMemo<AuthState>(
    () => ({
      ready,
      session,
      user: session?.user ?? null,
      localMode,
      signUp,
      signIn,
      signOut,
      resetPassword,
      deleteAccount,
      registerDevice,
      enterLocalDemo,
    }),
    [
      ready,
      session,
      localMode,
      signUp,
      signIn,
      signOut,
      resetPassword,
      deleteAccount,
      registerDevice,
      enterLocalDemo,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}

export { supabaseConfigured };
