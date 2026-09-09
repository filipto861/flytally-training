import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { ScenarioTrainer } from "@/components/scenario-trainer";
import { getTrainingAircraft } from "@/lib/aircraft-catalog";
import { getAbnormalTrainingMinutes, getAircraftAbnormalTraining } from "@/lib/abnormal-scenarios";
import styles from "../learning.module.css";

export default async function AbnormalEmergencyPage({
  params,
}: Readonly<{ params: Promise<{ aircraftId: string }> }>) {
  const { aircraftId } = await params;
  const aircraft = getTrainingAircraft(aircraftId);
  const training = getAircraftAbnormalTraining(aircraftId);

  if (!aircraft || !training) notFound();

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href={`/aircraft/${aircraft.id}/practice`}>← Practice</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="practice" />

      <section className="workspace-section-hero">
        <p className="eyebrow">Abnormal & Emergency · {aircraft.displayName}</p>
        <h1>Recognize. Fly. Act. Continue.</h1>
        <p className="lede">
          Practice high-value failures as short simulator scenarios. Every session follows the same discipline: recognize the problem, keep the aircraft under control, perform only source-backed immediate actions, then transition to the controlling checklist.
        </p>
      </section>

      <section className={styles.learningHeader}>
        <p>
          <strong>Training boundary:</strong> this is a familiarization layer, not an operational QRH. Where the registered training source does not expose a complete abnormal procedure, FlyTally stops at the verified boundary instead of inventing switch actions. The current approved AFM/QRH and operator SOPs take precedence.
        </p>
        <span className={styles.timeBadge}>{training.scenarios.length} scenarios · ~{getAbnormalTrainingMinutes(training)} min full set</span>
      </section>

      <ScenarioTrainer training={training} />
    </main>
  );
}
