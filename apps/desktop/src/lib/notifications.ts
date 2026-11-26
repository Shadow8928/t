import { db } from "./db";

const PERMISSION_META = "notificationsEnabled";

export async function notificationsEnabled(): Promise<boolean> {
  const row = await db.meta.get(PERMISSION_META);
  return row?.value === "1";
}

/** Request permission only after the user explicitly enables notifications. */
export async function enableNotifications(): Promise<NotificationPermission | "unsupported"> {
  if (!("Notification" in window)) return "unsupported";
  const perm = await Notification.requestPermission();
  if (perm === "granted") {
    await db.meta.put({ key: PERMISSION_META, value: "1" });
  }
  return perm;
}

export async function disableNotifications(): Promise<void> {
  await db.meta.put({ key: PERMISSION_META, value: "0" });
}

export async function notifyIfAllowed(title: string, body?: string): Promise<void> {
  if (!(await notificationsEnabled())) return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  // Quiet hours check (local)
  const quiet = await isInQuietHours();
  if (quiet) return;
  new Notification(title, { body, silent: false });
}

async function isInQuietHours(): Promise<boolean> {
  const start = (await db.meta.get("quietHoursStart"))?.value;
  const end = (await db.meta.get("quietHoursEnd"))?.value;
  if (!start || !end) return false;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = start.split(":").map(Number) as [number, number];
  const [eh, em] = end.split(":").map(Number) as [number, number];
  const s = sh * 60 + sm;
  const e = eh * 60 + em;
  if (s <= e) return cur >= s && cur < e;
  return cur >= s || cur < e;
}
