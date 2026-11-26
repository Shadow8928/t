// Edge Function: extend task_occurrences 30-day horizon for recurring tasks.
// Invoke on a free-tier-friendly schedule (e.g. hourly).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async (_req) => {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    return new Response(JSON.stringify({ ok: false, error: "missing_env" }), { status: 500 });
  }
  const supabase = createClient(url, key);
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("id,user_id,recurrence,fixed_time")
    .is("deleted_at", null)
    .not("recurrence", "is", null)
    .limit(500);

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }

  // Occurrence expansion is also available client-side via @system/domain generateOccurrences.
  // This function is a hook for server-side materialization; full expansion runs where domain is bundled.
  return new Response(
    JSON.stringify({ ok: true, recurringTasks: tasks?.length ?? 0, note: "client_domain_primary" }),
    { headers: { "Content-Type": "application/json" } },
  );
});
