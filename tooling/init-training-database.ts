export {};

const databaseUrl = process.env.TRAINING_DATABASE_URL?.trim();

if (!databaseUrl) {
  console.error("TRAINING_DATABASE_URL is required before Training database bootstrap can run.");
  process.exit(2);
}

try {
  const { initializeTrainingDatabase, trainingDatabaseTables } = await import("../lib/database-bootstrap.ts");
  await initializeTrainingDatabase();
  console.log(`Training database initialized and verified (${trainingDatabaseTables.length} required tables).`);
} catch (error) {
  console.error("Training database bootstrap failed.");
  if (error instanceof Error) console.error(error.message);
  process.exit(1);
}
