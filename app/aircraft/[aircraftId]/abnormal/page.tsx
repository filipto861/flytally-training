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
import styles from "../learning.module.css";

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

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href={withVariantQuery(`/aircraft/${aircraft.id}`, selectedVariant)}>← {aircraft.displayName}</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="abnormal" variants={aircraft.variants} variantProfiles={aircraft.variantProfiles} selectedVariant={selectedVariant} />

      <section className="workspace-section-hero">
        <p className="eyebrow">Abnormal & Emergency · {aircraft.displayName}{selectedVariant ? ` · ${selectedVariant}` : ""}</p>
        <h1>{training.title}</h1>
        <p className="lede">
          Practice published abnormal and emergency scenarios as structured training sequences. Stage names, actions and configuration applicability come from the aircraft content rather than from application code.
        </p>
      </section>

      <section className={styles.learningHeader}>
        <p>
          {universal
            ? "Scenario and stage applicability is filtered against the selected aircraft configuration. Current approved AFM/QRH, supplements and operator procedures remain controlling."
            : "This published source set predates structured configuration applicability. FlyTally does not infer equipment-specific abnormal actions from the model name; current approved AFM/QRH, supplements and operator procedures remain controlling."}
        </p>
        <span className={styles.timeBadge}>{training.scenarios.length} scenarios · ~{minutes} min full set</span>
      </section>

      <ScenarioTrainer training={training} />
    </main>
  );
}
