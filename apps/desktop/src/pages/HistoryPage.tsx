import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";

export function HistoryPage() {
  const completed =
    useLiveQuery(
      () =>
        db.tasks
          .filter((t) => t.status === "completed" && !t.deletedAt)
          .reverse()
          .sortBy("completedAt"),
      [],
    ) ?? [];
  const timers =
    useLiveQuery(() => db.timers.filter((t) => t.state === "completed" || t.state === "cancelled").toArray(), []) ??
    [];

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-semibold">History</h1>
      <p className="mt-1 text-text-secondary">
        Completed work and timer sessions are preserved — including past recurrence dates.
      </p>

      <section className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-wider text-text-secondary">
          Completed tasks
        </h2>
        <ul className="mt-3 space-y-2">
          {completed.map((t) => (
            <li key={t.id} className="flex justify-between border-b border-border py-2 text-sm">
              <span>{t.title}</span>
              <span className="text-text-secondary">{t.completedAt?.slice(0, 16) ?? ""}</span>
            </li>
          ))}
          {!completed.length && <li className="text-text-secondary">No completions yet.</li>}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-wider text-text-secondary">
          Timer sessions
        </h2>
        <ul className="mt-3 space-y-2">
          {timers.map((t) => (
            <li key={t.id} className="flex justify-between border-b border-border py-2 text-sm">
              <span>{t.state}</span>
              <span className="text-text-secondary">{t.startedAt.slice(0, 16)}</span>
            </li>
          ))}
          {!timers.length && <li className="text-text-secondary">No timer history yet.</li>}
        </ul>
      </section>
    </div>
  );
}
