import { spawnSync } from "node:child_process";

if (!process.env.TRAINING_ACCEPTANCE_DATABASE_URL?.trim()) {
  console.error("TRAINING_ACCEPTANCE_DATABASE_URL is required. Point it at a disposable/preview Training database, never production.");
  process.exit(2);
}

const result = spawnSync(process.execPath,["--conditions=react-server","--import","tsx","--test","tests/no-code-postgres-acceptance.test.ts"],{stdio:"inherit",env:process.env});
process.exit(result.status ?? 1);
