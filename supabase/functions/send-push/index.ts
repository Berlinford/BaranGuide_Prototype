import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const { record } = await req.json();
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data: tokens } = await supabase
    .from("push_tokens").select("token").eq("user_id", record.user_id);
  if (!tokens?.length) return new Response("no tokens");

  const isSos = record.type === "sos";
  const messages = tokens.map((t) => ({
    to: t.token,
    title: record.title,
    body: record.body,
    data: { type: record.type, route: record.route },
    priority: "high",
    channelId: isSos ? "sos-alerts-v2" : "general",
    sound: isSos ? "sos_alert.wav" : "notify.wav",
  }));

  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messages),
  });
  return new Response(await res.text());
});