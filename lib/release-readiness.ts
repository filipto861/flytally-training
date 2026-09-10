export type ReleaseConfigurationCheck = {
  readonly id: string;
  readonly ok: boolean;
};

export type ReleaseConfigurationReport = {
  readonly ready: boolean;
  readonly checks: readonly ReleaseConfigurationCheck[];
};

type Environment = Record<string, string | undefined>;

function configured(value: string | undefined, minimum = 1): boolean {
  return Boolean(value?.trim() && value.trim().length >= minimum);
}

function validHttpsUrl(value: string | undefined): boolean {
  if (!configured(value)) return false;
  try {
    return new URL(value!.trim()).protocol === "https:";
  } catch {
    return false;
  }
}

function validPostgresUrl(value: string | undefined): boolean {
  if (!configured(value)) return false;
  try {
    const protocol = new URL(value!.trim()).protocol;
    return protocol === "postgres:" || protocol === "postgresql:";
  } catch {
    return false;
  }
}

export function inspectReleaseConfiguration(env: Environment): ReleaseConfigurationReport {
  const checks: ReleaseConfigurationCheck[] = [
    { id: "postgres-content-backend", ok: env.TRAINING_CONTENT_BACKEND?.trim() === "postgres" },
    { id: "training-database", ok: validPostgresUrl(env.TRAINING_DATABASE_URL) },
    { id: "training-session-secret", ok: configured(env.TRAINING_SESSION_SECRET, 32) },
    { id: "identity-secret", ok: configured(env.FLYTALLY_IDENTITY_SECRET, 32) },
    { id: "identity-provider", ok: validHttpsUrl(env.FLYTALLY_LOGBOOK_URL) },
    // @vercel/blob's signed URL helpers use the project-scoped read/write token
    // when no explicit token/OIDC credential is passed. Controlled manuals are a
    // v1 production capability, so a deployment without the Blob credential is
    // intentionally not release-ready.
    { id: "controlled-manual-storage", ok: configured(env.BLOB_READ_WRITE_TOKEN, 16) },
  ];

  return { ready: checks.every(check => check.ok), checks };
}
