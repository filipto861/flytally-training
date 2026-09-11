import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { QuickReferencePanel } from "@/components/quick-reference-panel";
import { resolveSelectedVariant, withVariantQuery } from "@/lib/aircraft-applicability";
import { getTrainingContentRepository } from "@/lib/content-store";

export default async function QuickReferencePage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ aircraftId: string }>;
  searchParams: Promise<{ variant?: string }>;
}>) {
  const [{ aircraftId }, { variant }] = await Promise.all([params, searchParams]);
  const repository = getTrainingContentRepository();
  const [aircraft, content] = await Promise.all([
    repository.getAircraft(aircraftId),
    repository.getReferenceKnowledge(aircraftId),
  ]);

  if (!aircraft || !content) notFound();
  const selectedVariant = resolveSelectedVariant(variant, aircraft.variants);

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href={withVariantQuery(`/aircraft/${aircraft.id}`, selectedVariant)}>← {aircraft.displayName}</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="quick-reference" variants={aircraft.variants} variantProfiles={aircraft.variantProfiles} selectedVariant={selectedVariant} />
      <section className="workspace-section-hero">
        <p className="eyebrow">FLY · Quick Reference · {aircraft.displayName}{selectedVariant ? ` · ${selectedVariant}` : ""}</p>
        <h1>High-frequency numbers and cues.</h1>
        <p className="lede">A compact cockpit reference for frequently needed limits, speeds and operating cues. Every value retains its source provenance; approved aircraft and operator documentation remains controlling.</p>
      </section>
      <QuickReferencePanel content={content} />
    </main>
  );
}
