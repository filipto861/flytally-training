import "server-only";

import { redirect } from "next/navigation";
import { getTrainingSession } from "./training-session";

export async function requireTrainingAdmin() {
  const session = await getTrainingSession();
  if (!session) redirect("/api/auth/flytally/start?next=/admin");
  if (session.role !== "admin") throw new Error("Administrator access is required.");
  return session;
}
