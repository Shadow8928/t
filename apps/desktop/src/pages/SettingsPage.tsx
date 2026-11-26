import { useEffect, useState } from "react";
import { useAuth, supabaseConfigured } from "../lib/auth";
import { db } from "../lib/db";
import { disableNotifications, enableNotifications, notificationsEnabled } from "../lib/notifications";
import { flushPendingOps } from "../lib/sync";

export function SettingsPage() {
  const { user, localMode, signOut, deleteAccount, resetPassword } = useAuth();
  const [notifOn, setNotifOn] = useState(false);
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("07:00");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    void (async () => {
      setNotifOn(await notificationsEnabled());
      setQuietStart((await db.meta.get("quietHoursStart"))?.value ?? "22:00");
      setQuietEnd((await db.meta.get("quietHoursEnd"))?.value ?? "07:00");
      setPending(await db.pendingOps.count());
    })();
  }, []);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-3xl font-semibold">Settings</h1>
      <p className="mt-1 text-text-secondary">Account, sync, and notifications.</p>

      <section className="mt-8 space-y-2 text-sm">
        <h2 className="text-sm font-medium uppercase tracking-wider text-text-secondary">Account</h2>
        <p>
          {localMode ? "Local demo mode" : user?.email ?? "Signed out"}
          {!supabaseConfigured && " · Supabase env missing"}
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          {!localMode && user?.email && (
            <button
              type="button"
              className="rounded-md border border-border px-3 py-2"
              onClick={async () => {
                const err = await resetPassword(user.email!);
                setMessage(err ?? "Password reset email sent.");
              }}
            >
              Reset password
            </button>
          )}
          <button type="button" className="rounded-md border border-border px-3 py-2" onClick={() => void signOut()}>
            Sign out
          </button>
          <button
            type="button"
            className="rounded-md border border-danger/50 px-3 py-2 text-danger"
            onClick={async () => {
              if (!confirm("Delete account and local data?")) return;
              const err = await deleteAccount();
              setMessage(err ?? "Account deleted.");
            }}
          >
            Delete account
          </button>
        </div>
      </section>

      <section className="mt-8 space-y-3 text-sm">
        <h2 className="text-sm font-medium uppercase tracking-wider text-text-secondary">
          Notifications
        </h2>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={notifOn}
            onChange={async (e) => {
              if (e.target.checked) {
                const perm = await enableNotifications();
                setNotifOn(perm === "granted");
                setMessage(perm === "granted" ? "Notifications enabled." : `Permission: ${perm}`);
              } else {
                await disableNotifications();
                setNotifOn(false);
              }
            }}
          />
          Enable notifications (permission requested only when enabling)
        </label>
        <div className="flex gap-2">
          <label className="flex-1">
            Quiet start
            <input
              type="time"
              className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1"
              value={quietStart}
              onChange={async (e) => {
                setQuietStart(e.target.value);
                await db.meta.put({ key: "quietHoursStart", value: e.target.value });
              }}
            />
          </label>
          <label className="flex-1">
            Quiet end
            <input
              type="time"
              className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1"
              value={quietEnd}
              onChange={async (e) => {
                setQuietEnd(e.target.value);
                await db.meta.put({ key: "quietHoursEnd", value: e.target.value });
              }}
            />
          </label>
        </div>
      </section>

      <section className="mt-8 space-y-2 text-sm">
        <h2 className="text-sm font-medium uppercase tracking-wider text-text-secondary">Sync</h2>
        <p>{pending} pending operations in the offline queue.</p>
        <button
          type="button"
          className="rounded-md bg-accent px-3 py-2 font-medium text-background"
          onClick={async () => {
            const res = await flushPendingOps();
            setPending(await db.pendingOps.count());
            setMessage(`Flushed ${res.flushed}; conflicts ${res.conflicts}.`);
          }}
        >
          Flush queue
        </button>
      </section>

      <section className="mt-8 text-sm text-text-secondary">
        <h2 className="text-sm font-medium uppercase tracking-wider">Branding</h2>
        <p className="mt-2">
          Official logo missing — using text wordmark. Place the original under{" "}
          <code className="text-accent">assets/branding/original-logo/</code>.
        </p>
        <p className="mt-2">Timezone default: America/Chicago</p>
      </section>

      {message && <p className="mt-6 text-accent">{message}</p>}
    </div>
  );
}
