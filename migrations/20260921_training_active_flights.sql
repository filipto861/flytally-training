CREATE TABLE IF NOT EXISTS training_active_flights (
  id TEXT PRIMARY KEY,
  account_subject TEXT NOT NULL,
  aircraft_id TEXT NOT NULL,
  lifecycle TEXT NOT NULL CHECK (lifecycle IN ('ACTIVE', 'PREVIOUS', 'ARCHIVED')),
  departure JSONB NOT NULL,
  destination JSONB NOT NULL,
  runway JSONB NOT NULL,
  weight JSONB NOT NULL,
  configuration JSONB NOT NULL,
  weather JSONB NULL,
  performance_dependency JSONB NOT NULL,
  brief JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  activated_at TIMESTAMPTZ NOT NULL,
  deactivated_at TIMESTAMPTZ NULL,
  archived_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_training_active_flights_subject_aircraft_lifecycle
  ON training_active_flights(account_subject, aircraft_id, lifecycle, updated_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS ux_training_active_flights_one_active
  ON training_active_flights(account_subject, aircraft_id)
  WHERE lifecycle = 'ACTIVE';
