import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { db } from "../lib/db";
import { getActiveTimer } from "../lib/timers";

export function DashboardPage() {
  const tasks = useLiveQuery(() => db.tasks.filter((t) => !t.deletedAt).toArray(), []) ?? [];
  const pending = tasks.filter((t) => t.status === "pending" || t.status === "in_progress");
  const doneToday = tasks.filter((t) => {
    if (t.status !== "completed" || !t.completedAt) return false;
    return t.completedAt.slice(0, 10) === new Date().toISOString().slice(0, 10);
  });
  const timer = useLiveQuery(() => getActiveTimer(), []);
  const queued = useLiveQuery(() => db.pendingOps.count(), []) ?? 0;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-semibold">Today</h1>
      <p className="mt-1 text-text-secondary">Focus on what matters next.</p>

      <div className="mt-8 grid gap-6">
        <section>
          <h2 className="text-sm font-medium uppercase tracking-wider text-text-secondary">
            Open tasks
          </h2>
          <ul className="mt-3 space-y-2">
            {pending.slice(0, 8).map((t) => (
              <li key={t.id} className="flex items-center justify-between border-b border-border py-2">
                <span>{t.title}</span>
                <span className="text-xs uppercase text-text-secondary">{t.priority}</span>
              </li>
            ))}
            {!pending.length && (
              <li className="text-text-secondary">
                Nothing open. <Link className="text-accent" to="/tasks">Add a task</Link>
              </li>
            )}
          </ul>
        </section>

        <section className="text-sm text-text-secondary">
          <p>
            Completed today: <span className="text-text-primary">{doneToday.length}</span>
          </p>
          <p className="mt-1">
            Timer:{" "}
            <span className="text-text-primary">{timer ? timer.state : "idle"}</span>
            {queued > 0 ? ` · ${queued} sync ops queued` : ""}
          </p>
        </section>
      </div>
    </div>
  );
}
