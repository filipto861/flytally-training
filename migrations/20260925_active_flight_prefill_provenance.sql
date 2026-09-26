ALTER TABLE training_active_flights
  ADD COLUMN IF NOT EXISTS prefill_provenance JSONB NULL;
