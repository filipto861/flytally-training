"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireTrainingAdmin } from "@/lib/admin-auth";
import { publishReviewedStaticAircraftRelease } from "@/lib/governed-static-release";
import { publishLearjetChecklistRelease } from "@/lib/learjet-checklist-release";
import { publishLearjetQrhRelease } from "@/lib/learjet-qrh-release";

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


export async function publishLearjetChecklistReleaseAction(form: FormData) {
  const session = await requireTrainingAdmin();
  if (text(form, "confirmLearjetChecklistRelease") !== "yes") {
    throw new Error(
      "Explicit administrator confirmation is required before the reviewed Learjet checklist can be published.",
    );
  }

  const result = await publishLearjetChecklistRelease(session.subject);

  revalidatePath("/");
  revalidatePath("/aircraft/learjet-35a", "layout");
  revalidatePath("/aircraft/learjet-35a/checklists");
  revalidatePath("/aircraft/learjet-35a/fly");
  revalidatePath("/admin");
  revalidatePath("/admin/aircraft/learjet-35a");
  revalidatePath("/admin/aircraft/learjet-35a/content");
  revalidatePath("/admin/aircraft/learjet-35a/sources");

  redirect(
    `/admin/aircraft/learjet-35a?checklistRelease=${encodeURIComponent(result.status)}&checklistVersion=${encodeURIComponent(result.versionId)}`,
  );
}


export async function publishLearjetQrhReleaseAction(form: FormData) {
  const session = await requireTrainingAdmin();
  if (text(form, "confirmLearjetQrhRelease") !== "yes") {
    throw new Error(
      "Explicit administrator confirmation is required before the reviewed Learjet QRH can be published.",
    );
  }

  const result = await publishLearjetQrhRelease(session.subject);

  revalidatePath("/");
  revalidatePath("/aircraft/learjet-35a", "layout");
  revalidatePath("/aircraft/learjet-35a/abnormal");
  revalidatePath("/aircraft/learjet-35a/quick-reference");
  revalidatePath("/aircraft/learjet-35a/fly");
  revalidatePath("/aircraft/learjet-35a/flight");
  revalidatePath("/admin");
  revalidatePath("/admin/aircraft/learjet-35a");
  revalidatePath("/admin/aircraft/learjet-35a/content");
  revalidatePath("/admin/aircraft/learjet-35a/sources");

  redirect(
    `/admin/aircraft/learjet-35a?qrhRelease=${encodeURIComponent(result.status)}&qrhVersion=${encodeURIComponent(result.versionId)}`,
  );
}
