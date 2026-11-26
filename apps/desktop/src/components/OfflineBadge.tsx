import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import { flushPendingOps } from "../lib/sync";

export function OfflineBadge() {
  const [online, setOnline] = useState(navigator.onLine);
  const pending = useLiveQuery(() => db.pendingOps.count(), []) ?? 0;

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return (
    <div className="space-y-2 text-xs text-text-secondary">
      <div className="flex items-center gap-2">
        <span
          className={[
            "inline-block h-2 w-2 rounded-full",
            online ? "bg-accent" : "bg-warning",
          ].join(" ")}
        />
        {online ? "Online" : "Offline"}
        {pending > 0 ? ` · ${pending} queued` : ""}
      </div>
      {pending > 0 && online && (
        <button
          type="button"
          className="text-accent hover:text-accent-strong"
          onClick={() => void flushPendingOps()}
        >
          Sync now
        </button>
      )}
    </div>
  );
}
