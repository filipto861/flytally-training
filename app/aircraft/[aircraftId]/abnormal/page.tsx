import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { ScenarioTrainer } from "@/components/scenario-trainer";
import { resolveSelectedVariant, withVariantQuery } from "@/lib/aircraft-applicability";
import { getAbnormalTrainingMinutes } from "@/lib/content-metrics";
import { getTrainingContentRepository } from "@/lib/content-store";
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
  const [aircraft, training] = await Promise.all([
    repository.getAircraft(aircraftId),
    repository.getAbnormalTraining(aircraftId),
  ]);

  if (!aircraft || !training) notFound();
  const selectedVariant = resolveSelectedVariant(variant, aircraft.variants);

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href={withVariantQuery(`/aircraft/${aircraft.id}`, selectedVariant)}>← {aircraft.displayName}</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="abnormal" variants={aircraft.variants} variantProfiles={aircraft.variantProfiles} selectedVariant={selectedVariant} />

      <section className="workspace-section-hero">
        <p className="eyebrow">Abnormal & Emergency · {aircraft.displayName}{selectedVariant ? ` · ${selectedVariant}` : ""}</p>
        <h1>Recognize. Fly. Act. Continue.</h1>
        <p className="lede">
          Practice high-value failures with the same discipline used in aircraft training: recognize the problem, keep the aircraft under control, perform only source-backed immediate actions, then transition to the controlling checklist.
        </p>
      </section>

      <section className={styles.learningHeader}>
        <p>
          <strong>Training boundary:</strong> this legacy abnormal module is not configuration-filtered until it is republished in the universal applicability-aware domain. The current approved AFM/QRH and operator SOPs take precedence.
        </p>
        <span className={styles.timeBadge}>{training.scenarios.length} scenarios · ~{getAbnormalTrainingMinutes(training)} min full set</span>
      </section>

      <ScenarioTrainer training={training} />
    </main>
  );
}
