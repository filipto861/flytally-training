import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { getAircraftContentBundle, type AircraftContentCapabilities } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import { isAircraftWorkspaceSection, type AircraftWorkspaceSection } from "@/lib/product-navigation";

type WorkspaceCard = { title: string; description: string; status: string; href?: string; capability?: keyof AircraftContentCapabilities; };
type WorkspaceDefinition = { eyebrow: string; title: string; description: string; cards: readonly WorkspaceCard[]; };

const definitions: Record<Exclude<AircraftWorkspaceSection, "overview">, WorkspaceDefinition> = {
  learn: {
    eyebrow: "Learn", title: "Understand the aircraft you are operating.", description: "System and avionics lessons are only shown when they exist for this aircraft and configuration.",
    cards: [
      { title: "Quick Start", description: "A concise orientation to the most important operating concepts when a quick-start module is published.", status: "Optional", href: "quick-start", capability: "quickStart" },
      { title: "Systems", description: "Controls, indications, normal operation, limitations, abnormal cues and the mental model behind installed systems.", status: "Optional", href: "systems", capability: "systems" },
      { title: "Avionics", description: "Configuration-specific avionics training when dedicated material is published.", status: "Optional", capability: "avionics" },
    ],
  },
  checklist: {
    eyebrow: "Checklist", title: "Run the checklist. Expand the procedure when you need detail.", description: "Checklist items stay concise while the learning layer explains actions, verification and expected results.",
    cards: [
      { title: "Flight Checklists", description: "Published flight-phase checklist content for this aircraft.", status: "Optional", href: "checklists", capability: "checklists" },
      { title: "Procedures", description: "Detailed operating procedures behind checklist actions.", status: "Optional", href: "procedures", capability: "procedures" },
      { title: "Flows", description: "Memory flows are independent content and only appear when published.", status: "Optional", capability: "flows" },
    ],
  },
  practice: {
    eyebrow: "Practice", title: "Practice procedures and scenarios, not a fixed aircraft template.", description: "Available practice areas come from published content. Cockpit orientation is intentionally outside the primary M9 path.",
    cards: [
      { title: "Procedures", description: "Prerequisites, actions, expected results, verification and rationale.", status: "Optional", href: "procedures", capability: "procedures" },
      { title: "Abnormal & Emergency", description: "Published abnormal and emergency scenarios for this aircraft.", status: "Optional", href: "abnormal", capability: "abnormalEmergency" },
    ],
  },
  reference: {
    eyebrow: "Reference", title: "Performance and limitations are first-class aircraft data.", description: "Reference is modular: only datasets and limitations actually published for this aircraft are exposed.",
    cards: [
      { title: "Performance", description: "Generic lookup and reference tables driven by aircraft data rather than aircraft-specific UI code.", status: "Optional", href: "performance", capability: "performance" },
      { title: "Limitations", description: "Speeds, weights, operating limits and conditional restrictions.", status: "Optional", href: "limitations", capability: "limitations" },
      { title: "Quick Reference", description: "Legacy compact reference remains available during migration to universal domains.", status: "Migration", href: "quick-reference", capability: "quickReference" },
      { title: "Source Library", description: "Registered source material with revision and provenance retained when available.", status: "Optional", capability: "manual" },
    ],
  },
  progress: {
    eyebrow: "Progress", title: "Track proficiency per aircraft and per module.", description: "Progress remains aircraft-scoped while module sets can differ completely between types.",
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

  return <main className="shell aircraft-detail">
    <Link className="back-link" href={`/aircraft/${aircraft.id}`}>← {aircraft.displayName}</Link>
    <AircraftWorkspaceNav aircraftId={aircraft.id} active={section} />
    <section className="workspace-section-hero"><p className="eyebrow">{definition.eyebrow} · {aircraft.displayName}</p><h1>{definition.title}</h1><p className="lede">{definition.description}</p></section>
    <section className="workspace-section-grid">{definition.cards.map((card) => {
      const available = card.capability ? capabilities[card.capability] : false;
      const href = card.href && available ? `/aircraft/${aircraft.id}/${card.href}` : undefined;
      const content = <><div className="workspace-card-topline"><span>{card.title}</span><small>{available ? "Available" : card.status}</small></div><p>{card.description}</p><strong>{href ? "Open →" : available ? "Available in this section" : "Not used for this aircraft"}</strong></>;
      return href ? <Link className="workspace-card" href={href} key={card.title}>{content}</Link> : <article className="workspace-card workspace-card-static" key={card.title}>{content}</article>;
    })}</section>
    {section === "reference" && manual ? <section className="reference-library" aria-labelledby="manual-library-title"><div className="section-heading"><div><p className="eyebrow">Source library</p><h2 id="manual-library-title">{manual.title}</h2></div><p>{manual.publisher} · Revision {manual.revision} · {manual.issueDate}</p></div><ol className="chapter-list">{manual.chapters.map((chapter) => <li key={chapter.number}><span className="chapter-number">{String(chapter.number).padStart(2, "0")}</span><div><strong>{chapter.title}</strong><span>Source chapter</span></div></li>)}</ol></section> : null}
  </main>;
}
