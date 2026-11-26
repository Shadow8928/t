import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { formatDuration } from "@system/domain";
import {
  cancelActiveTimer,
  getActiveTimer,
  liveRemaining,
  pauseActiveTimer,
  resumeActiveTimer,
  startLocalTimer,
} from "../lib/timers";
import { notifyIfAllowed } from "../lib/notifications";

export function TimerPanel() {
  const timer = useLiveQuery(() => getActiveTimer(), []);
  const [now, setNow] = useState(() => Date.now());
  const [minutes, setMinutes] = useState(25);
  const [conflict, setConflict] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!timer || timer.state !== "running") return;
    const rem = liveRemaining(timer, new Date(now));
    if (rem <= 0) {
      void notifyIfAllowed("Timer complete", "Your focus block finished.");
    }
  }, [timer, now]);

  const remaining = timer ? liveRemaining(timer, new Date(now)) : 0;

  return (
    <aside className="flex w-[300px] shrink-0 flex-col border-l border-border bg-surface/90 p-5 backdrop-blur">
      <h2 className="text-sm font-medium uppercase tracking-wider text-text-secondary">Timer</h2>
      <div
        className={[
          "mt-6 rounded-md bg-surface-elevated px-4 py-8 text-center",
          timer?.state === "running" ? "animate-timer-live" : "",
        ].join(" ")}
      >
        <div className="font-display text-4xl tabular-nums text-text-primary">
          {timer ? formatDuration(remaining) : "0:00"}
        </div>
        <p className="mt-2 text-xs text-text-secondary">
          {timer
            ? timer.provisional
              ? `${timer.state} · provisional offline`
              : timer.state
            : "No active timer"}
        </p>
      </div>

      {conflict && (
        <p className="mt-3 text-sm text-warning">
          Another timer is already active. Pause or cancel it first.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-2">
        {!timer || timer.state === "completed" || timer.state === "cancelled" ? (
          <>
            <label className="text-xs text-text-secondary">
              Minutes
              <input
                type="number"
                min={1}
                max={180}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <button
              type="button"
              className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-background hover:bg-accent-strong"
              onClick={async () => {
                const res = await startLocalTimer({ durationMs: minutes * 60_000 });
                setConflict(Boolean(res.conflict));
              }}
            >
              Start
            </button>
          </>
        ) : (
          <div className="flex gap-2">
            {timer.state === "running" ? (
              <button
                type="button"
                className="flex-1 rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-elevated"
                onClick={() => void pauseActiveTimer()}
              >
                Pause
              </button>
            ) : (
              <button
                type="button"
                className="flex-1 rounded-md bg-accent px-3 py-2 text-sm font-medium text-background"
                onClick={() => void resumeActiveTimer()}
              >
                Resume
              </button>
            )}
            <button
              type="button"
              className="rounded-md border border-danger/40 px-3 py-2 text-sm text-danger"
              onClick={() => void cancelActiveTimer()}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
