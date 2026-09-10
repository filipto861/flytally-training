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
  hrefCapability?: keyof AircraftContentCapabilities;
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
    title: "Understand the aircraft you are operating.",
    description: "System lessons are only shown when they exist for this aircraft and configuration.",
    cards: [
      { title: "Quick Start", description: "A concise orientation to the most important operating concepts when a quick-start module is published.", status: "Optional", href: "quick-start", capability: "quickStart" },
      { title: "Systems", description: "Controls, indications, normal operation, limitations, abnormal cues and the mental model behind each installed system.", status: "Optional", href: "systems", capability: "systems" },
      { title: "Avionics", description: "Configuration-specific avionics training when dedicated avionics material is published.", status: "Optional", capability: "avionics" },
    ],
  },
  checklist: {
    eyebrow: "Checklist",
    title: "Run the checklist. Expand the procedure when you need the detail.",
    description: "Checklist items stay operationally concise while the training layer can explain actions, verification and expected results.",
    cards: [
      { title: "Flight Checklists", description: "Published flight-phase checklist content for this aircraft.", status: "Optional", href: "cold-dark", capability: "checklists", hrefCapability: "normalFlight" },
      { title: "Trainer Modes", description: "Learn, Practice, Flow and Challenge & Response reuse the same checklist data where the interactive trainer is available.", status: "Optional", href: "cold-dark", capability: "checklists", hrefCapability: "normalFlight" },
      { title: "Flows", description: "Memory flows are independent content and are only shown when the aircraft has published flow data.", status: "Optional", capability: "flows" },
    ],
  },
  practice: {
    eyebrow: "Practice",
    title: "Practice procedures and scenarios, not a fixed aircraft template.",
    description: "The available practice areas are derived from published content. Cockpit orientation is intentionally not part of the primary M9 path.",
    cards: [
      { title: "Procedures", description: "Detailed operating procedures with prerequisites, actions, expected results, verification and short rationale.", status: "Optional", capability: "procedures" },
      { title: "Abnormal & Emergency", description: "Published abnormal and emergency scenarios for this aircraft.", status: "Optional", href: "abnormal", capability: "abnormalEmergency" },
    ],
  },
  reference: {
    eyebrow: "Reference",
    title: "Performance and limitations are first-class aircraft data.",
    description: "Reference data is modular: an aircraft only exposes the datasets and limitations that have actually been published for it.",
    cards: [
      { title: "Performance", description: "Generic lookup and reference tables driven by aircraft data rather than aircraft-specific UI code.", status: "Optional", capability: "performance" },
      { title: "Limitations", description: "Speeds, weights, operating limits and conditional restrictions.", status: "Optional", capability: "limitations" },
      { title: "Quick Reference", description: "Legacy compact reference remains available during migration to the universal domains.", status: "Migration", href: "quick-reference", capability: "quickReference" },
      { title: "Source Library", description: "Registered source material with revision and provenance retained when available.", status: "Optional", capability: "manual" },
    ],
  },
  progress: {
    eyebrow: "Progress",
    title: "Track proficiency per aircraft and per module.",
    description: "Progress remains aircraft-scoped while the module set can differ completely between aircraft types.",
    cards: [
      { title: "Knowledge & weak-area review", description: "Questions and explanations when a knowledge module is published.", status: "Optional", href: "knowledge", capability: "knowledge" },
      { title: "Aircraft Progress", description: "Training attempts feed one aircraft-scoped activity stream.", status: "Available", href: "progress-overview", capability: "knowledge" },
      { title: "Cross-device continuation", description: "Persist progress and training history through the shared FlyTally identity.", status: "Platform" },
    ],
  },
};

export default async function AircraftWorkspaceSectionPage({ params }: Readonly<{ params: Promise<{ aircraftId: string; section: string }> }>) {
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
          const routeAvailable = card.hrefCapability ? capabilities[card.hrefCapability] : available;
          const href = card.href && available && routeAvailable ? `/aircraft/${aircraft.id}/${card.href}` : undefined;
          const content = (
            <>
              <div className="workspace-card-topline"><span>{card.title}</span><small>{available ? "Available" : card.status}</small></div>
              <p>{card.description}</p>
              <strong>{href ? "Open →" : available ? "Published · renderer migration in progress" : "Not used for this aircraft"}</strong>
            </>
          );
          return href ? <Link className="workspace-card" href={href} key={card.title}>{content}</Link> : <article className="workspace-card workspace-card-static" key={card.title}>{content}</article>;
        })}
      </section>

      {section === "reference" && manual ? (
        <section className="reference-library" aria-labelledby="manual-library-title">
          <div className="section-heading">
            <div><p className="eyebrow">Source library</p><h2 id="manual-library-title">{manual.title}</h2></div>
            <p>{manual.publisher} · Revision {manual.revision} · {manual.issueDate}</p>
          </div>
          <ol className="chapter-list">
            {manual.chapters.map((chapter) => <li key={chapter.number}><span className="chapter-number">{String(chapter.number).padStart(2, "0")}</span><div><strong>{chapter.title}</strong><span>Source chapter</span></div></li>)}
          </ol>
        </section>
      ) : null}
    </main>
  );
}
