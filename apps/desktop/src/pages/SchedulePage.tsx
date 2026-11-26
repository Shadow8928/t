import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { generateOccurrences, type RecurrenceRule } from "@system/domain";
import { db } from "../lib/db";

export function SchedulePage() {
  const tasks = useLiveQuery(() => db.tasks.filter((t) => !t.deletedAt).toArray(), []) ?? [];
  const [fromDate] = useState(() => new Date().toISOString().slice(0, 10));

  const occurrences = useMemo(() => {
    const rows: Array<{ date: string; title: string; fixedTime: boolean; scheduledAt: string | null }> = [];
    for (const task of tasks) {
      if (task.recurrence) {
        const occ = generateOccurrences({
          rule: task.recurrence as RecurrenceRule,
          fromDate,
          horizonDays: 14,
          fixedTime: task.fixedTime,
          timezone: "America/Chicago",
        });
        for (const o of occ) {
          rows.push({
            date: o.date,
            title: task.title,
            fixedTime: o.fixedTime,
            scheduledAt: o.scheduledAt,
          });
        }
      } else if (task.scheduledAt) {
        rows.push({
          date: task.scheduledAt.slice(0, 10),
          title: task.title,
          fixedTime: task.fixedTime,
          scheduledAt: task.scheduledAt,
        });
      }
    }
    return rows.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
  }, [tasks, fromDate]);

  const byDate = occurrences.reduce<Record<string, typeof occurrences>>((acc, o) => {
    (acc[o.date] ??= []).push(o);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-semibold">Schedule</h1>
      <p className="mt-1 text-text-secondary">
        Fixed-time blocks stay fixed. Flexible tasks are never auto-forced into slots.
      </p>

      <div className="mt-8 space-y-6">
        {Object.keys(byDate).length === 0 && (
          <p className="text-text-secondary">No scheduled items in the next two weeks.</p>
        )}
        {Object.entries(byDate).map(([date, items]) => (
          <section key={date}>
            <h2 className="text-sm font-medium text-accent">{date}</h2>
            <ul className="mt-2 space-y-1">
              {items.map((item, i) => (
                <li key={`${item.title}-${i}`} className="flex justify-between border-b border-border py-2 text-sm">
                  <span>{item.title}</span>
                  <span className="text-text-secondary">
                    {item.fixedTime
                      ? item.scheduledAt?.slice(11, 16) ?? "fixed"
                      : "flexible"}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
