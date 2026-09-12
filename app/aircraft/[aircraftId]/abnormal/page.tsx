import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { ScenarioTrainer } from "@/components/scenario-trainer";
import {
  configurationForAircraftVariant,
  filterAbnormalEmergencyForConfiguration,
  resolveSelectedVariant,
  withVariantQuery,
} from "@/lib/aircraft-applicability";
import { normalizeLegacyAbnormalTraining, normalizeUniversalAbnormalEmergency } from "@/lib/abnormal-runtime";
import { getPublishedAircraftModule } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import {
  isUniversalAbnormalEmergencyContent,
  type AircraftAbnormalEmergencyContent,
} from "@/lib/universal-abnormal-emergency";

export default async function AbnormalEmergencyPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ aircraftId: string }>;
  searchParams: Promise<{ variant?: string }>;
}>) {
  const [{ aircraftId }, { variant }] = await Promise.all([params, searchParams]);
  const repository = getTrainingContentRepository();
  const [aircraft, published, legacy] = await Promise.all([
    repository.getAircraft(aircraftId),
    getPublishedAircraftModule<unknown>(repository, aircraftId, "abnormal"),
    repository.getAbnormalTraining(aircraftId),
  ]);

  if (!aircraft) notFound();
  const selectedVariant = resolveSelectedVariant(variant, aircraft.variants);
  const universal = isUniversalAbnormalEmergencyContent(published)
    ? filterAbnormalEmergencyForConfiguration(
        published as AircraftAbnormalEmergencyContent,
        configurationForAircraftVariant(aircraft, selectedVariant),
      )
    : undefined;
  const training = universal
    ? normalizeUniversalAbnormalEmergency(universal)
    : legacy
      ? normalizeLegacyAbnormalTraining(legacy)
      : undefined;
  if (!training?.scenarios.length) notFound();
  const minutes = training.scenarios.reduce((total, scenario) => total + scenario.minutes, 0);
  const authorityNote = universal
    ? "Scenario and stage applicability is filtered against the selected aircraft configuration. Current approved AFM/QRH, supplements and operator procedures remain controlling."
    : "This source set predates structured configuration applicability. FlyTally does not infer equipment-specific abnormal actions from the model name; current approved AFM/QRH, supplements and operator procedures remain controlling.";

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href={withVariantQuery(`/aircraft/${aircraft.id}`, selectedVariant)}>← {aircraft.displayName}</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="abnormal" variants={aircraft.variants} variantProfiles={aircraft.variantProfiles} selectedVariant={selectedVariant} />

      <section className="workspace-section-hero">
        <p className="eyebrow">Reference</p>
        <h1>Abnormal &amp; Emergency</h1>
        <p className="lede">Choose a scenario and work through the published sequence.</p>
        <details className="pilot-source-details">
          <summary>Training & source notes</summary>
          <p>{authorityNote}</p>
          <p>{training.scenarios.length} scenarios · ~{minutes} min full set</p>
        </details>
      </section>

      <ScenarioTrainer training={training} />
    </main>
  );
}
