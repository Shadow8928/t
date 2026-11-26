import { useState, type FormEvent } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import type { Priority } from "@system/domain";
import { db } from "../lib/db";
import { createTask, softDeleteTask, updateTaskStatus } from "../lib/tasks";
import { startLocalTimer } from "../lib/timers";

export function TasksPage() {
  const tasks = useLiveQuery(() => db.tasks.filter((t) => !t.deletedAt).reverse().sortBy("updatedAt"), []) ?? [];
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [error, setError] = useState<string | null>(null);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createTask({ title, priority });
      setTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-semibold">Tasks</h1>
      <p className="mt-1 text-text-secondary">Capture work. Sync when online.</p>

      <form onSubmit={onCreate} className="mt-6 flex flex-wrap gap-2">
        <input
          className="min-w-[220px] flex-1 rounded-md border border-border bg-surface px-3 py-2"
          placeholder="New task"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <select
          className="rounded-md border border-border bg-surface px-3 py-2"
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
        >
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
        </select>
        <button type="submit" className="rounded-md bg-accent px-4 py-2 font-medium text-background">
          Add
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      <ul className="mt-8 space-y-2">
        {tasks.map((t) => (
          <li
            key={t.id}
            className="flex flex-wrap items-center gap-3 border-b border-border py-3"
          >
            <button
              type="button"
              className="text-accent"
              title="Complete"
              onClick={() => void updateTaskStatus(t.id, t.status === "completed" ? "pending" : "completed")}
            >
              {t.status === "completed" ? "✓" : "○"}
            </button>
            <div className="min-w-0 flex-1">
              <div className={t.status === "completed" ? "text-text-secondary line-through" : ""}>
                {t.title}
              </div>
              <div className="text-xs text-text-secondary">
                {t.priority} · {t.status}
                {t.fixedTime ? " · fixed" : " · flexible"}
              </div>
            </div>
            {t.durationMinutes && t.status !== "completed" && (
              <button
                type="button"
                className="text-xs text-accent"
                onClick={() =>
                  void startLocalTimer({
                    durationMs: t.durationMinutes! * 60_000,
                    taskId: t.id,
                  })
                }
              >
                Time
              </button>
            )}
            <button
              type="button"
              className="text-xs text-danger"
              onClick={() => void softDeleteTask(t.id)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
