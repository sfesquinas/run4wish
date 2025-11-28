// app/lib/joinRace.ts
import { supabase } from "./supabaseClient";

export async function joinRace(email: string, raceId: string, cost: number) {

  // 1) Verificar si ya está inscrito
  const existing = await supabase
    .from("user_races")
    .select("*")
    .eq("user_email", email)
    .eq("race_id", raceId)
    .maybeSingle();

  if (existing.data) {
    return { ok: true, already: true };
  }

  // 2) Descontar wishes
  const { data: wishesRow } = await supabase
    .from("profiles")
    .select("wishes")
    .eq("email", email)
    .maybeSingle();

  const current = wishesRow?.wishes ?? 0;
  if (current < cost) {
    return { ok: false, error: "NO_WISHES" };
  }

  await supabase
    .from("profiles")
    .update({ wishes: current - cost })
    .eq("email", email);

  // 3) Registrar carrera
  await supabase.from("user_races").insert({
    user_email: email,
    race_id: raceId,
    start_date: new Date().toISOString(),
    current_day: 1,
    answered_today: false,
    completed: false,
  });

  return { ok: true };
}