import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
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
      <Link className="back-link" href={`/aircraft/${aircraft.id}/reference`}>← Reference</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="reference" />
      <section className="workspace-section-hero">
        <p className="eyebrow">Performance · {aircraft.displayName}</p>
        <h1>{content.title}</h1>
        <p className="lede">Performance tables are rendered from structured aircraft data. Interpolation is never assumed unless the dataset explicitly permits it.</p>
      </section>
      {content.datasets.map((dataset) => (
        <section className="reference-library" key={dataset.id}>
          <div className="section-heading"><div><p className="eyebrow">{dataset.kind}</p><h2>{dataset.title}</h2></div><p>Interpolation: {dataset.interpolation === "none" ? "not applied" : "explicit linear"}</p></div>
          {dataset.description ? <p>{dataset.description}</p> : null}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{dataset.axes.map((axis) => <th key={axis.key} style={{ textAlign: "left", padding: "0.6rem" }}>{axis.label}{axis.unit ? ` (${axis.unit})` : ""}</th>)}{dataset.outputs.map((output) => <th key={output.key} style={{ textAlign: "left", padding: "0.6rem" }}>{output.label}{output.unit ? ` (${output.unit})` : ""}</th>)}</tr></thead>
              <tbody>{dataset.rows.map((row, index) => <tr key={index}>{dataset.axes.map((axis) => <td key={axis.key} style={{ padding: "0.6rem" }}>{String(row.inputs[axis.key])}</td>)}{dataset.outputs.map((output) => <td key={output.key} style={{ padding: "0.6rem" }}>{String(row.outputs[output.key])}</td>)}</tr>)}</tbody>
            </table>
          </div>
          {dataset.notes?.length ? <ul>{dataset.notes.map((note) => <li key={note}>{note}</li>)}</ul> : null}
        </section>
      ))}
    </main>
  );
}
