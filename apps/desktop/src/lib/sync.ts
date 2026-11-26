import { db, newId, type PendingOp } from "./db";
import { supabase } from "./supabase";

export async function enqueueOp(
  partial: Omit<PendingOp, "id" | "clientOpId" | "createdAt" | "attempts"> & {
    clientOpId?: string;
  },
): Promise<void> {
  await db.pendingOps.add({
    clientOpId: partial.clientOpId ?? newId(),
    entityType: partial.entityType,
    entityId: partial.entityId,
    op: partial.op,
    payload: partial.payload,
    baseVersion: partial.baseVersion,
    createdAt: new Date().toISOString(),
    attempts: 0,
  });
}

export async function flushPendingOps(): Promise<{ flushed: number; conflicts: number }> {
  if (!supabase) return { flushed: 0, conflicts: 0 };
  const ops = await db.pendingOps.orderBy("createdAt").toArray();
  if (!ops.length) return { flushed: 0, conflicts: 0 };

  let flushed = 0;
  let conflicts = 0;

  for (const op of ops) {
    try {
      if (op.entityType === "task") {
        if (op.op === "delete") {
          const { error } = await supabase
            .from("tasks")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", op.entityId)
            .eq("version", op.baseVersion ?? 0);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("tasks").upsert(op.payload);
          if (error) {
            conflicts += 1;
            // Keep pending — never silent discard
            await db.pendingOps.update(op.id!, { attempts: op.attempts + 1 });
            continue;
          }
        }
      }
      if (op.id != null) await db.pendingOps.delete(op.id);
      flushed += 1;
    } catch {
      await db.pendingOps.update(op.id!, { attempts: op.attempts + 1 });
    }
  }

  const cursor = new Date().toISOString();
  await db.meta.put({ key: "syncCursor", value: cursor });
  return { flushed, conflicts };
}

export function subscribeOnlineFlush(): () => void {
  const onOnline = () => {
    void flushPendingOps();
  };
  window.addEventListener("online", onOnline);
  return () => window.removeEventListener("online", onOnline);
}
