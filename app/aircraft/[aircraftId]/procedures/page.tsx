import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { ProcedureBrowser } from "@/components/procedure-browser";
import { configurationForAircraftVariant, filterProceduresForConfiguration, resolveSelectedVariant, withVariantQuery } from "@/lib/aircraft-applicability";
import { getPublishedAircraftModule } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import type { AircraftProcedureContent, AircraftProcedure } from "@/lib/universal-aircraft-content";

export default async function ProceduresPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ aircraftId: string }>;
  searchParams: Promise<{ variant?: string }>;
}>) {
  const [{ aircraftId }, { variant }] = await Promise.all([params, searchParams]);
  const repository = getTrainingContentRepository();
  const [aircraft, universal, legacy] = await Promise.all([
    repository.getAircraft(aircraftId),
    getPublishedAircraftModule<AircraftProcedureContent>(repository, aircraftId, "procedures"),
    repository.getNormalFlight(aircraftId),
  ]);
  if (!aircraft) notFound();

  const selectedVariant = resolveSelectedVariant(variant, aircraft.variants);
  const configuredUniversal = universal
    ? filterProceduresForConfiguration(universal, configurationForAircraftVariant(aircraft, selectedVariant))
    : undefined;
  const procedures: readonly AircraftProcedure[] = configuredUniversal?.procedures ?? legacy?.phases.map((phase) => ({
    id: phase.id,
    title: phase.title,
    summary: "Legacy procedure content retained while this aircraft is migrated to the universal procedure domain.",
    steps: phase.items.map((item) => ({ id: item.id, action: item.action, rationale: item.why })),
  })) ?? [];
  if (!procedures.length) notFound();

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href={withVariantQuery(`/aircraft/${aircraft.id}`, selectedVariant)}>← {aircraft.displayName}</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="procedures" variants={aircraft.variants} variantProfiles={aircraft.variantProfiles} selectedVariant={selectedVariant} />
      <section className="workspace-section-hero">
        <p className="eyebrow">Learn</p>
        <h1>Procedures</h1>
        <p className="lede">Choose a procedure and work through it step by step.</p>
        {configuredUniversal?.disclaimer || configuredUniversal?.sourceNote ? <details className="pilot-source-details">
          <summary>Training & source notes</summary>
          {configuredUniversal?.disclaimer ? <p><strong>Training boundary:</strong> {configuredUniversal.disclaimer}</p> : null}
          {configuredUniversal?.sourceNote ? <p>Source note · {configuredUniversal.sourceNote}</p> : null}
        </details> : null}
      </section>
      <ProcedureBrowser aircraftId={aircraft.id} procedures={procedures} selectedVariant={selectedVariant} />
    </main>
  );
}
