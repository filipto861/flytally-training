import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { ProcedureBrowser } from "@/components/procedure-browser";
import { getPublishedAircraftModule } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import type { AircraftProcedureContent, AircraftProcedure } from "@/lib/universal-aircraft-content";

export default async function ProceduresPage({ params }: Readonly<{ params: Promise<{ aircraftId: string }> }>) {
  const { aircraftId } = await params;
  const repository = getTrainingContentRepository();
  const [aircraft, universal, legacy] = await Promise.all([
    repository.getAircraft(aircraftId),
    getPublishedAircraftModule<AircraftProcedureContent>(repository, aircraftId, "procedures"),
    repository.getNormalFlight(aircraftId),
  ]);
  if (!aircraft) notFound();

  const procedures: readonly AircraftProcedure[] = universal?.procedures ?? legacy?.phases.map((phase) => ({
    id: phase.id,
    title: phase.title,
    summary: "Legacy procedure content retained while this aircraft is migrated to the universal procedure domain.",
    steps: phase.items.map((item) => ({ id: item.id, action: item.action, rationale: item.why })),
  })) ?? [];
  if (!procedures.length) notFound();

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href={`/aircraft/${aircraft.id}`}>← {aircraft.displayName}</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="procedures" />
      <section className="workspace-section-hero">
        <p className="eyebrow">Procedures · {aircraft.displayName}</p>
        <h1>{universal?.title ?? "Operating procedures"}</h1>
        <p className="lede">Search by action, system or indication, filter by phase, and open the full procedure behind a concise checklist item.</p>
        {universal?.disclaimer ? <p><strong>Training boundary:</strong> {universal.disclaimer}</p> : null}
        {universal?.sourceNote ? <p><small>Source note · {universal.sourceNote}</small></p> : null}
      </section>
      <ProcedureBrowser procedures={procedures} />
    </main>
  );
}
