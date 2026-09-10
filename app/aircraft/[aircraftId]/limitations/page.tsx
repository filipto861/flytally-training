import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { configurationForAircraftVariant, filterLimitationsForConfiguration, resolveSelectedVariant, withVariantQuery } from "@/lib/aircraft-applicability";
import { getPublishedAircraftModule } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import type { AircraftLimitationsContent, TrainingSourceReference } from "@/lib/universal-aircraft-content";

const formatSources = (sources: readonly TrainingSourceReference[] | undefined): string | undefined =>
  sources?.map((item) => [item.chapter ? `Ch ${item.chapter}` : undefined, item.section, `p. ${item.pageLabel}`].filter(Boolean).join(" · ")).join(" · ");

export default async function LimitationsPage({
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
    getPublishedAircraftModule<AircraftLimitationsContent>(repository, aircraftId, "limitations"),
  ]);
  if (!aircraft || !content) notFound();

  const selectedVariant = resolveSelectedVariant(variant, aircraft.variants);
  const configuredContent = filterLimitationsForConfiguration(content, configurationForAircraftVariant(aircraft, selectedVariant));
  if (!configuredContent.groups.length) notFound();

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href={withVariantQuery(`/aircraft/${aircraft.id}`, selectedVariant)}>← {aircraft.displayName}</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="limitations" variants={aircraft.variants} variantProfiles={aircraft.variantProfiles} selectedVariant={selectedVariant} />
      <section className="workspace-section-hero">
        <p className="eyebrow">Limitations · {aircraft.displayName}{selectedVariant ? ` · ${selectedVariant}` : ""}</p>
        <h1>{configuredContent.title}</h1>
        <p className="lede">Only limitations published for this aircraft and configuration are shown.</p>
        {configuredContent.disclaimer ? <p><strong>Training boundary:</strong> {configuredContent.disclaimer}</p> : null}
        {configuredContent.sourceNote ? <p><small>Source note · {configuredContent.sourceNote}</small></p> : null}
      </section>
      {configuredContent.groups.map((group) => (
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
