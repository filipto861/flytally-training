"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireTrainingAdmin } from "@/lib/admin-auth";
import { publishReviewedStaticAircraftRelease } from "@/lib/governed-static-release";

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

export async function publishReviewedStaticAircraftReleaseAction(form: FormData) {
  const session = await requireTrainingAdmin();
  if (text(form, "confirmReviewedAircraftRelease") !== "yes") {
    throw new Error("Explicit administrator confirmation is required before the reviewed aircraft release can be approved and published.");
  }

  const aircraftId = text(form, "aircraftId");
  if (!aircraftId) throw new Error("Aircraft is required.");

  const result = await publishReviewedStaticAircraftRelease(aircraftId, session.subject);

  revalidatePath("/");
  revalidatePath(`/aircraft/${aircraftId}`);
  revalidatePath(`/admin/aircraft/${aircraftId}`);
  for (const item of result.published) revalidatePath(`/aircraft/${aircraftId}/${item.domain}`);

  const released = result.published.map((item) => item.domain).join(",") || "none";
  const unchanged = result.unchanged.join(",") || "none";
  redirect(`/admin/aircraft/${encodeURIComponent(aircraftId)}?releasePublished=${encodeURIComponent(released)}&releaseUnchanged=${encodeURIComponent(unchanged)}`);
}
