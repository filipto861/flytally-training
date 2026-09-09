import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import {
  getAircraftContentBundle,
  type AircraftContentCapabilities,
} from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import {
  isAircraftWorkspaceSection,
  type AircraftWorkspaceSection,
} from "@/lib/product-navigation";

type WorkspaceCard = {
  title: string;
  description: string;
  status: string;
  href?: string;
  capability?: keyof AircraftContentCapabilities;
};

type WorkspaceDefinition = {
  eyebrow: string;
  title: string;
  description: string;
  cards: readonly WorkspaceCard[];
};

const definitions: Record<Exclude<AircraftWorkspaceSection, "overview">, WorkspaceDefinition> = {
  learn: {
    eyebrow: "Learn",
    title: "Understand only what you need to fly.",
    description: "Quick Start and essential systems stay short, practical and connected to the actions you perform in the simulator.",
    cards: [
      { title: "Quick Start", description: "A short mental model before the first flight: power, start, fuel, bleed air, pressurization, hydraulics, controls and ice protection.", status: "v1.0", href: "quick-start", capability: "quickStart" },
      { title: "Essential Systems", description: "Compact system lessons structured around what the pilot controls, monitors, expects and needs to remember.", status: "v1.0", href: "systems", capability: "systems" },
    ],
  },
  checklist: {
    eyebrow: "Checklist",
    title: "Train the flow, then verify it.",
    description: "The checklist is the spine of FlyTally Training. Choose how much help you want, then practice the complete flight or only one phase.",
    cards: [
      { title: "Normal Flight Checklist", description: "Complete simulator-oriented normal flow from power-up to shutdown, with source-backed explanations.", status: "v1.0", href: "cold-dark", capability: "normalFlight" },
      { title: "Trainer Modes", description: "Switch between Learn, Practice, Flow and Challenge & Response using the same checklist data.", status: "v1.0", href: "cold-dark", capability: "normalFlight" },
      { title: "Phase Practice", description: "Practice engine start, takeoff, approach, shutdown or any other phase without running the entire flight.", status: "v1.0", href: "cold-dark", capability: "normalFlight" },
    ],
  },
  practice: {
    eyebrow: "Practice",
    title: "Learn the aircraft by operating it.",
    description: "First Flight is the primary training path. Practice modes reuse the same aircraft data for orientation, procedures and scenarios.",
    cards: [
      { title: "First Flight", description: "Cold & Dark → engine start → taxi → takeoff → cruise → approach → landing → shutdown.", status: "v1.0", href: "cold-dark", capability: "normalFlight" },
      { title: "Cockpit Orientation", description: "Learn verified cockpit regions and jump to them with Show me from supported checklist items.", status: "v1.0", href: "orientation", capability: "cockpitOrientation" },
      { title: "Abnormal & Emergency", description: "Scenario-based engine, electrical, hydraulic, pressurization and other simulator-relevant practice.", status: "v1.0", href: "abnormal", capability: "abnormalEmergency" },
    ],
  },
  reference: {
    eyebrow: "Reference",
    title: "The detail is here when you need it.",
    description: "Reference is intentionally separate from the primary learning path: use it for limits, systems, source material and quick in-flight lookup.",
    cards: [
      { title: "Controlled Manual", description: "Registered source material with revision and source provenance retained.", status: "v1.0", capability: "manual" },
      { title: "Quick Reference / FLY mode", description: "Source-backed speeds, capacities, system references and compact simulator-side cues without inventing fixed performance data.", status: "M6", href: "quick-reference", capability: "quickReference" },
    ],
  },
  progress: {
    eyebrow: "Progress",
    title: "Know what you can do without turning training into an exam.",
    description: "Progress combines aircraft completion, attempts, recent practice and weak areas while keeping the focus on simulator competence.",
    cards: [
      { title: "Knowledge & weak-area review", description: "Source-linked questions with immediate explanations and weak-area identification.", status: "M6", href: "knowledge", capability: "knowledge" },
      { title: "Aircraft Progress", description: "Quick Start, First Flight, checklist, systems, scenarios and knowledge completion in one aircraft view.", status: "M6/M7" },
      { title: "Cross-device continuation", description: "Persist progress, checklist attempts and quiz history through the shared FlyTally identity.", status: "M7" },
    ],
  },
};

export default async function AircraftWorkspaceSectionPage({
  params,
}: Readonly<{ params: Promise<{ aircraftId: string; section: string }> }>) {
  const { aircraftId, section } = await params;

  if (!isAircraftWorkspaceSection(section) || section === "overview") notFound();

  const bundle = await getAircraftContentBundle(getTrainingContentRepository(), aircraftId);
  if (!bundle) notFound();

  const { aircraft, capabilities } = bundle;
  const definition = definitions[section];
  const manual = aircraft.manuals[0];

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href={`/aircraft/${aircraft.id}`}>← {aircraft.displayName}</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active={section} />

      <section className="workspace-section-hero">
        <p className="eyebrow">{definition.eyebrow} · {aircraft.displayName}</p>
        <h1>{definition.title}</h1>
        <p className="lede">{definition.description}</p>
      </section>

      <section className="workspace-section-grid">
        {definition.cards.map((card) => {
          const available = card.capability ? capabilities[card.capability] : false;
          const href = card.href && available ? `/aircraft/${aircraft.id}/${card.href}` : undefined;
          const content = (
            <>
              <div className="workspace-card-topline">
                <span>{card.title}</span>
                <small>{available ? "Available" : card.status}</small>
              </div>
              <p>{card.description}</p>
              <strong>{href ? "Open →" : available ? "Available in this section" : "Included in v1.0"}</strong>
            </>
          );

          return href ? (
            <Link className="workspace-card" href={href} key={card.title}>{content}</Link>
          ) : (
            <article className="workspace-card workspace-card-static" key={card.title}>{content}</article>
          );
        })}
      </section>

      {section === "reference" && manual ? (
        <section className="reference-library" aria-labelledby="manual-library-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Manual library</p>
              <h2 id="manual-library-title">{manual.title}</h2>
            </div>
            <p>{manual.publisher} · Revision {manual.revision} · {manual.issueDate}</p>
          </div>
          <ol className="chapter-list">
            {manual.chapters.map((chapter) => (
              <li key={chapter.number}>
                <span className="chapter-number">{String(chapter.number).padStart(2, "0")}</span>
                <div><strong>{chapter.title}</strong><span>Source chapter</span></div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </main>
  );
}
