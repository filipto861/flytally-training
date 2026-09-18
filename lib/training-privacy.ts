import "server-only";

import { sql } from "./db";

export const PRIVACY_RESET_AIRCRAFT_ID = "__privacy_reset__";

export type TrainingPrivacySummary = Readonly<{
  progressEvents: number;
  aircraftStates: number;
  lastResetAt?: string;
}>;

export async function getTrainingPrivacySummary(accountSubject: string): Promise<TrainingPrivacySummary> {
  const rows = await sql`SELECT
    (SELECT COUNT(*) FROM training_progress_events WHERE account_subject=${accountSubject}) progress_events,
    (SELECT COUNT(*) FROM training_aircraft_state WHERE account_subject=${accountSubject} AND aircraft_id<>${PRIVACY_RESET_AIRCRAFT_ID}) aircraft_states,
    (SELECT last_activity_at FROM training_aircraft_state WHERE account_subject=${accountSubject} AND aircraft_id=${PRIVACY_RESET_AIRCRAFT_ID} LIMIT 1) last_reset_at` as unknown as Array<Record<string, unknown>>;
  const row = rows[0] ?? {};
  return {
    progressEvents: Number(row.progress_events) || 0,
    aircraftStates: Number(row.aircraft_states) || 0,
    lastResetAt: row.last_reset_at ? new Date(String(row.last_reset_at)).toISOString() : undefined,
  };
}

export async function exportTrainingData(accountSubject: string) {
  const [events, states, summary] = await Promise.all([
    sql`SELECT event_id,aircraft_id,activity_kind,content_id,occurred_at,completed,score_percent,weak_areas,created_at
      FROM training_progress_events
      WHERE account_subject=${accountSubject}
      ORDER BY occurred_at,id`,
    sql`SELECT aircraft_id,last_activity_kind,last_content_id,last_activity_at,updated_at
      FROM training_aircraft_state
      WHERE account_subject=${accountSubject} AND aircraft_id<>${PRIVACY_RESET_AIRCRAFT_ID}
      ORDER BY aircraft_id`,
    getTrainingPrivacySummary(accountSubject),
  ]);
  return { summary, events, aircraftState: states };
}

export async function deleteTrainingProgress(accountSubject: string) {
  const resetAt = new Date().toISOString();
  await sql.transaction([
    // Serialize privacy reset with progress ingestion for this account. Without
    // the same advisory lock in appendEvents(), an old-device sync racing this
    // transaction could observe the pre-reset state and survive the deletion.
    sql`SELECT pg_advisory_xact_lock(hashtextextended(${accountSubject},0))`,
    sql`DELETE FROM training_progress_events WHERE account_subject=${accountSubject}`,
    sql`DELETE FROM training_aircraft_state WHERE account_subject=${accountSubject}`,
    sql`INSERT INTO training_aircraft_state(account_subject,aircraft_id,last_activity_kind,last_content_id,last_activity_at,updated_at)
      VALUES(${accountSubject},${PRIVACY_RESET_AIRCRAFT_ID},NULL,NULL,${resetAt}::timestamptz,NOW())`,
  ]);
  return { resetAt };
}
