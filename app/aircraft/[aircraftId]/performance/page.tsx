import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { PerformanceExplorer } from "@/components/performance-explorer";
import { getPublishedAircraftModule } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import type { AircraftPerformanceContent } from "@/lib/universal-aircraft-content";

export default async function PerformancePage({ params }: Readonly<{ params: Promise<{ aircraftId: string }> }>) {
  const { aircraftId } = await params;
  const repository = getTrainingContentRepository();
  const [aircraft, content] = await Promise.all([
    repository.getAircraft(aircraftId),
    getPublishedAircraftModule<AircraftPerformanceContent>(repository, aircraftId, "performance"),
  ]);
  if (!aircraft || !content) notFound();

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href={`/aircraft/${aircraft.id}`}>← {aircraft.displayName}</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="performance" />
      <section className="workspace-section-hero">
        <p className="eyebrow">Performance · {aircraft.displayName}</p>
        <h1>{content.title}</h1>
        <p className="lede">Filter the published performance datasets by their own axes and read the exact source row. The generic explorer never invents interpolation or aircraft-specific calculation logic.</p>
        {content.disclaimer ? <p><strong>Training boundary:</strong> {content.disclaimer}</p> : null}
        {content.sourceNote ? <p><small>Source note · {content.sourceNote}</small></p> : null}
      </section>
      <PerformanceExplorer datasets={content.datasets} />
    </main>
  );
}
