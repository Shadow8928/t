// Edge Function: complete expired running timers (cron).
// Free-tier: schedule sparingly — share cadence with notification drain.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async (_req) => {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    return new Response(JSON.stringify({ ok: false, error: "missing_env" }), { status: 500 });
  }
  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("timer_sessions")
    .update({ state: "completed", completed_at: new Date().toISOString() })
    .eq("state", "running")
    .lte("ends_at", new Date().toISOString())
    .select("id");

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify({ ok: true, completed: data?.length ?? 0 }), {
    headers: { "Content-Type": "application/json" },
  });
});
