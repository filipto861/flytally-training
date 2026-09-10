import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { ProgressPanel } from "@/components/progress-panel";
import { resolveSelectedVariant, withVariantQuery } from "@/lib/aircraft-applicability";
import { getTrainingContentRepository } from "@/lib/content-store";

export default async function ProgressOverviewPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ aircraftId: string }>;
  searchParams: Promise<{ variant?: string }>;
}>) {
  const [{ aircraftId }, { variant }] = await Promise.all([params, searchParams]);
  const aircraft = await getTrainingContentRepository().getAircraft(aircraftId);
  if (!aircraft) notFound();
  const selectedVariant = resolveSelectedVariant(variant, aircraft.variants);

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href={withVariantQuery(`/aircraft/${aircraft.id}`, selectedVariant)}>← {aircraft.displayName}</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="progress" variants={aircraft.variants} variantProfiles={aircraft.variantProfiles} selectedVariant={selectedVariant} />
      <section className="workspace-section-hero">
        <p className="eyebrow">Progress · {aircraft.displayName}{selectedVariant ? ` · ${selectedVariant}` : ""}</p>
        <h1>What you have practiced — and what needs another pass.</h1>
        <p className="lede">Checklist completions, abnormal scenarios and knowledge attempts feed one aircraft-scoped progress stream. Progress remains attached to the aircraft; configuration-aware proficiency can be layered on without changing content identity.</p>
      </section>
      <ProgressPanel aircraftId={aircraft.id} />
    </main>
  );
}
