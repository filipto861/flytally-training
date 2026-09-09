import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { ProgressPanel } from "@/components/progress-panel";
import { getTrainingContentRepository } from "@/lib/content-store";

export default async function ProgressOverviewPage({ params }: Readonly<{ params: Promise<{ aircraftId: string }> }>) {
  const { aircraftId } = await params;
  const aircraft = await getTrainingContentRepository().getAircraft(aircraftId);
  if (!aircraft) notFound();

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href={`/aircraft/${aircraft.id}/progress`}>← Progress</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="progress" />
      <section className="workspace-section-hero">
        <p className="eyebrow">Progress · {aircraft.displayName}</p>
        <h1>What you have practiced — and what needs another pass.</h1>
        <p className="lede">Checklist completions, abnormal scenarios and knowledge attempts feed one aircraft-scoped progress stream. Cross-device persistence comes in M7 without changing this learner-facing model.</p>
      </section>
      <ProgressPanel aircraftId={aircraft.id} />
    </main>
  );
}
