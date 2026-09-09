import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { getTrainingAircraft } from "@/lib/aircraft-catalog";
import {
  isAircraftWorkspaceSection,
  type AircraftWorkspaceSection,
} from "@/lib/product-navigation";

type WorkspaceCard = {
  title: string;
  description: string;
  status: string;
  href?: string;
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
    description: "Quick Start and essential systems will stay short, practical and connected to the actions you perform in the simulator.",
    cards: [
      { title: "Quick Start", description: "Aircraft orientation before the first flight: cockpit, engines, fuel, electrical, hydraulics and pressurization at a practical level.", status: "Building next" },
      { title: "Essential Systems", description: "Short system lessons structured around what the pilot controls, monitors and needs when something changes.", status: "v1.0" },
    ],
  },
  checklist: {
    eyebrow: "Checklist",
    title: "Train the flow, then verify it.",
    description: "The checklist is the spine of FlyTally Training. Choose how much help you want, then practice the complete flight or only one phase.",
    cards: [
      { title: "Normal Flight Checklist", description: "Complete simulator-oriented normal flow from power-up to shutdown, with source-backed explanations.", status: "Available", href: "cold-dark" },
      { title: "Trainer Modes", description: "Switch between Learn, Practice, Flow and Challenge & Response using the same checklist data.", status: "Available", href: "cold-dark" },
      { title: "Phase Practice", description: "Practice engine start, takeoff, approach, shutdown or any other phase without running the entire flight.", status: "Available", href: "cold-dark" },
    ],
  },
  practice: {
    eyebrow: "Practice",
    title: "Learn the Learjet by operating it.",
    description: "First Flight is the primary training path. Later practice modes reuse the same aircraft data for orientation, procedures and scenarios.",
    cards: [
      { title: "First Flight", description: "Cold & Dark → engine start → taxi → takeoff → cruise → approach → landing → shutdown.", status: "Available", href: "cold-dark" },
      { title: "Cockpit Orientation", description: "Learn where controls and panels are, then use Show me directly from checklist items.", status: "M3" },
      { title: "Abnormal & Emergency", description: "Scenario-based engine, electrical, hydraulic, pressurization and other simulator-relevant practice.", status: "M5" },
    ],
  },
  reference: {
    eyebrow: "Reference",
    title: "The detail is here when you need it.",
    description: "Reference is intentionally separate from the primary learning path: use it for limits, systems, source material and quick in-flight lookup.",
    cards: [
      { title: "Controlled Manual", description: "FlightSafety Learjet 35/36 Pilot Training Manual with revision and source provenance retained.", status: "Available" },
      { title: "Quick Reference / FLY mode", description: "Speeds, limitations, capacities, memory items and compact checklist access while flying.", status: "M6" },
    ],
  },
  progress: {
    eyebrow: "Progress",
    title: "Know what you can do without turning training into an exam.",
    description: "Progress will combine aircraft completion, attempts, recent practice and weak areas while keeping the focus on simulator competence.",
    cards: [
      { title: "Aircraft Progress", description: "Quick Start, First Flight, checklist, systems, scenarios and knowledge completion in one aircraft view.", status: "M6/M7" },
      { title: "Cross-device continuation", description: "Persist progress, checklist attempts and quiz history through the shared FlyTally identity.", status: "M7" },
    ],
  },
};

export default async function AircraftWorkspaceSectionPage({
  params,
}: Readonly<{ params: Promise<{ aircraftId: string; section: string }> }>) {
  const { aircraftId, section } = await params;
  const aircraft = getTrainingAircraft(aircraftId);

  if (!aircraft || !isAircraftWorkspaceSection(section) || section === "overview") notFound();

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
          const content = (
            <>
              <div className="workspace-card-topline">
                <span>{card.title}</span>
                <small>{card.status}</small>
              </div>
              <p>{card.description}</p>
              {card.href ? <strong>Open →</strong> : <strong>Included in v1.0</strong>}
            </>
          );

          return card.href ? (
            <Link className="workspace-card" href={`/aircraft/${aircraft.id}/${card.href}`} key={card.title}>{content}</Link>
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
            <p>{manual.publisher} · Revision {manual.revision} · January 2020</p>
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
