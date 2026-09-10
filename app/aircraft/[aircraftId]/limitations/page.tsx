import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { getPublishedAircraftModule } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import type { AircraftLimitationsContent, TrainingSourceReference } from "@/lib/universal-aircraft-content";

const formatSources = (sources: readonly TrainingSourceReference[] | undefined): string | undefined =>
  sources?.map((item) => [item.chapter ? `Ch ${item.chapter}` : undefined, item.section, `p. ${item.pageLabel}`].filter(Boolean).join(" · ")).join(" · ");

export default async function LimitationsPage({ params }: Readonly<{ params: Promise<{ aircraftId: string }> }>) {
  const { aircraftId } = await params;
  const repository = getTrainingContentRepository();
  const [aircraft, content] = await Promise.all([
    repository.getAircraft(aircraftId),
    getPublishedAircraftModule<AircraftLimitationsContent>(repository, aircraftId, "limitations"),
  ]);
  if (!aircraft || !content) notFound();

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href={`/aircraft/${aircraft.id}/reference`}>← Reference</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="reference" />
      <section className="workspace-section-hero">
        <p className="eyebrow">Limitations · {aircraft.displayName}</p>
        <h1>{content.title}</h1>
        <p className="lede">Only limitations published for this aircraft and configuration are shown.</p>
        {content.disclaimer ? <p><strong>Training boundary:</strong> {content.disclaimer}</p> : null}
        {content.sourceNote ? <p><small>Source note · {content.sourceNote}</small></p> : null}
      </section>
      {content.groups.map((group) => (
        <section className="reference-library" key={group.id}>
          <h2>{group.title}</h2>
          <ol className="chapter-list">
            {group.items.map((item) => (
              <li key={item.id}>
                <span className="chapter-number">LIM</span>
                <div>
                  <strong>{item.label} — {item.value}{item.unit ? ` ${item.unit}` : ""}</strong>
                  {item.condition ? <span>{item.condition}</span> : null}
                  {item.notices?.map((notice, index) => <span key={`${item.id}-${index}`}><strong>{notice.kind.toUpperCase()}:</strong> {notice.text}</span>)}
                  {formatSources(item.sources) ? <span><small>Source · {formatSources(item.sources)}</small></span> : null}
                </div>
              </li>
            ))}
          </ol>
          {formatSources(group.sources) ? <p><small>Group source · {formatSources(group.sources)}</small></p> : null}
        </section>
      ))}
    </main>
  );
}
