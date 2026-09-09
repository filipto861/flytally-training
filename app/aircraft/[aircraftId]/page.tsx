import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { getAircraftContentBundle } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";

const workspaceCards = [
  { key: "learn", title: "Learn", description: "Quick Start and concise system lessons that explain only what you need to operate the aircraft." },
  { key: "checklist", title: "Checklist", description: "Normal simulator checklist with training modes built around the full flight flow." },
  { key: "practice", title: "Practice", description: "First Flight, cockpit orientation and targeted procedure practice." },
  { key: "reference", title: "Reference", description: "Speeds, limits, systems and the controlled manual when you need deeper detail." },
  { key: "progress", title: "Progress", description: "Aircraft learning status, attempts, weak areas and recent practice." },
] as const;

export default async function AircraftPage({
  params,
}: Readonly<{ params: Promise<{ aircraftId: string }> }>) {
  const { aircraftId } = await params;
  const bundle = await getAircraftContentBundle(getTrainingContentRepository(), aircraftId);

  if (!bundle) notFound();

  const { aircraft, capabilities } = bundle;
  const manual = aircraft.manuals[0];
  if (!manual) notFound();

  const availability = {
    learn: capabilities.quickStart || capabilities.systems,
    checklist: capabilities.normalFlight,
    practice: capabilities.normalFlight || capabilities.cockpitOrientation || capabilities.abnormalEmergency,
    reference: capabilities.manual,
    progress: false,
  } as const;

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href="/">← Aircraft library</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="overview" />

      <section className="detail-hero workspace-hero">
        <div>
          <p className="eyebrow">Training workspace</p>
          <h1>{aircraft.displayName}</h1>
          <p className="lede">
            Learn the {aircraft.displayName} by operating it. The normal path starts fully cold & dark and ends after shutdown.
          </p>
          <div className="hero-facts">
            <span>Variants {aircraft.variants.join(" · ")}</span>
            <span>Target first-flight prep 2–4 h</span>
          </div>
        </div>

        <aside className="manual-summary compact-summary">
          <span className="source-pill">Controlled training source</span>
          <h2>{manual.title}</h2>
          <dl>
            <div><dt>Publisher</dt><dd>{manual.publisher}</dd></div>
            <div><dt>Revision</dt><dd>{manual.revision}</dd></div>
            <div><dt>Issue</dt><dd>{manual.issueDate}</dd></div>
          </dl>
          <p>Simulator training content stays traceable to this source while the pilot-facing experience remains concise.</p>
        </aside>
      </section>

      <section className="start-panel" aria-labelledby="start-title">
        <div>
          <p className="eyebrow">Start here</p>
          <h2 id="start-title">Your first flight starts cold & dark.</h2>
          <p>Power up, start both engines, taxi, take off, fly one normal sector, land and shut the aircraft down again.</p>
        </div>
        {capabilities.normalFlight ? (
          <Link className="primary-action" href={`/aircraft/${aircraft.id}/cold-dark`}>
            Start First Flight →
          </Link>
        ) : (
          <span className="source-pill">First Flight content in progress</span>
        )}
      </section>

      <section className="workspace-overview" aria-label="Training areas">
        {workspaceCards.map((card) => (
          <Link className="workspace-card" href={`/aircraft/${aircraft.id}/${card.key}`} key={card.key}>
            <div className="workspace-card-topline">
              <span>{card.title}</span>
              <small>{availability[card.key] ? "Open" : "v1.0"}</small>
            </div>
            <p>{card.description}</p>
            <strong>Explore →</strong>
          </Link>
        ))}
      </section>
    </main>
  );
}
