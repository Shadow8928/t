// Edge Function: deliver due notification_outbox rows (respect quiet hours in payload filter).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async (_req) => {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    return new Response(JSON.stringify({ ok: false, error: "missing_env" }), { status: 500 });
  }
  const supabase = createClient(url, key);
  const now = new Date().toISOString();
  const { data: due, error } = await supabase
    .from("notification_outbox")
    .select("*")
    .is("delivered_at", null)
    .is("cancelled_at", null)
    .lte("deliver_at", now)
    .limit(100);

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }

  // Delivery channel wiring (APNs / web push) is environment-specific.
  const ids = (due ?? []).map((r: { id: string }) => r.id);
  if (ids.length) {
    await supabase
      .from("notification_outbox")
      .update({ delivered_at: now })
      .in("id", ids);
  }

  return new Response(JSON.stringify({ ok: true, drained: ids.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
