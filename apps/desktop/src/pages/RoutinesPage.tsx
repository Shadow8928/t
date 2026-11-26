import { useState, type FormEvent } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { orderedSteps, totalRoutineMinutes, validateRoutine, type RoutineKind } from "@system/domain";
import { db, newId, type LocalRoutine } from "../lib/db";
import { enqueueOp } from "../lib/sync";
import { startLocalTimer } from "../lib/timers";

export function RoutinesPage() {
  const routines = useLiveQuery(() => db.routines.filter((r) => !r.deletedAt).toArray(), []) ?? [];
  const [name, setName] = useState("");
  const [kind, setKind] = useState<RoutineKind>("morning");
  const [stepTitle, setStepTitle] = useState("First step");
  const [stepMins, setStepMins] = useState(5);
  const [error, setError] = useState<string | null>(null);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const steps = [{ id: newId(), title: stepTitle, durationMinutes: stepMins, sortOrder: 0 }];
    try {
      validateRoutine({ name, kind, steps });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid");
      return;
    }
    const routine: LocalRoutine = {
      id: newId(),
      name: name.trim(),
      kind,
      steps,
      deletedAt: null,
      updatedAt: new Date().toISOString(),
      version: 1,
    };
    await db.routines.put(routine);
    await enqueueOp({
      entityType: "routine",
      entityId: routine.id,
      op: "create",
      payload: routine as unknown as Record<string, unknown>,
      baseVersion: null,
    });
    setName("");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-semibold">Routines</h1>
      <p className="mt-1 text-text-secondary">Morning, night, or custom — same global timer.</p>

      <form onSubmit={onCreate} className="mt-6 grid gap-2 sm:grid-cols-2">
        <input
          className="rounded-md border border-border bg-surface px-3 py-2"
          placeholder="Routine name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <select
          className="rounded-md border border-border bg-surface px-3 py-2"
          value={kind}
          onChange={(e) => setKind(e.target.value as RoutineKind)}
        >
          <option value="morning">Morning</option>
          <option value="night">Night</option>
          <option value="custom">Custom</option>
        </select>
        <input
          className="rounded-md border border-border bg-surface px-3 py-2"
          placeholder="First step"
          value={stepTitle}
          onChange={(e) => setStepTitle(e.target.value)}
        />
        <input
          type="number"
          min={1}
          className="rounded-md border border-border bg-surface px-3 py-2"
          value={stepMins}
          onChange={(e) => setStepMins(Number(e.target.value))}
        />
        <button type="submit" className="rounded-md bg-accent px-4 py-2 font-medium text-background sm:col-span-2">
          Create routine
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      <ul className="mt-8 space-y-4">
        {routines.map((r) => {
          const steps = orderedSteps(r.steps);
          return (
            <li key={r.id} className="border-b border-border pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-text-secondary">
                    {r.kind} · {totalRoutineMinutes(steps)} min
                  </div>
                </div>
                {steps[0] && (
                  <button
                    type="button"
                    className="text-sm text-accent"
                    onClick={() =>
                      void startLocalTimer({
                        durationMs: steps[0]!.durationMinutes * 60_000,
                        routineStepId: steps[0]!.id,
                      })
                    }
                  >
                    Start first step
                  </button>
                )}
              </div>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-text-secondary">
                {steps.map((s) => (
                  <li key={s.id}>
                    {s.title} ({s.durationMinutes}m)
                  </li>
                ))}
              </ol>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
