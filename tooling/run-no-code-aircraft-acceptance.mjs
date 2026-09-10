import { spawnSync } from "node:child_process";

const acceptanceUrl = process.env.TRAINING_ACCEPTANCE_DATABASE_URL?.trim();
const productionUrl = process.env.TRAINING_DATABASE_URL?.trim();
const disposableConfirmation = process.env.TRAINING_ACCEPTANCE_CONFIRM_DISPOSABLE?.trim();
const requiredConfirmation = "I_UNDERSTAND_THIS_IS_DISPOSABLE";

if (!acceptanceUrl) {
  console.error("TRAINING_ACCEPTANCE_DATABASE_URL is required. Point it at a disposable/preview Training database, never production.");
  process.exit(2);
}

if (disposableConfirmation !== requiredConfirmation) {
  console.error(`Refusing database-writing acceptance run. Set TRAINING_ACCEPTANCE_CONFIRM_DISPOSABLE=${requiredConfirmation} only after confirming the target database is disposable.`);
  process.exit(2);
}

if (productionUrl && productionUrl === acceptanceUrl) {
  console.error("Refusing acceptance run because TRAINING_ACCEPTANCE_DATABASE_URL matches TRAINING_DATABASE_URL.");
  process.exit(2);
}

const result = spawnSync(
  process.execPath,
  ["--conditions=react-server", "--import", "tsx", "--test", "tests/no-code-postgres-acceptance.test.ts"],
  { stdio: "inherit", env: process.env },
);
process.exit(result.status ?? 1);
