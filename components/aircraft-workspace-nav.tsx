import Link from "next/link";

import { AircraftVariantSelector } from "@/components/aircraft-variant-selector";
import { withVariantQuery } from "@/lib/aircraft-applicability";
import type { TrainingAircraftVariantProfile } from "@/lib/aircraft-catalog";
import { aircraftWorkspaceSections, type AircraftModuleNavKey } from "@/lib/aircraft-workspace-navigation";
import { getTrainingContentRepository } from "@/lib/content-store";
import styles from "./aircraft-workspace-nav.module.css";

export type { AircraftModuleNavKey } from "@/lib/aircraft-workspace-navigation";

type PilotArea = "fly" | "learn" | "reference";
type PrimaryKey = "overview" | PilotArea;
type NavEntry = { readonly key: string; readonly label: string; readonly href: string };

const learnOrder = ["systems", "procedures", "knowledge", "avionics", "flows", "checklists"] as const;
const referenceOrder = ["performance", "weight-balance", "limitations", "abnormal"] as const;

const orderedEntries = (
  sections: readonly NavEntry[],
  order: readonly string[],
): readonly NavEntry[] => order.flatMap((key) => {
  const section = sections.find((item) => item.key === key);
  return section ? [section] : [];
});

function PilotIcon({ kind }: Readonly<{ kind: PrimaryKey }>) {
  if (kind === "overview") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5"/><path d="M6.5 9.5V20h11V9.5"/></svg>;
  if (kind === "fly") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h11M8 12h11M8 18h11"/><path d="m3.5 6 1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2"/></svg>;
  if (kind === "learn") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5h6.5c1.7 0 3 1.3 3 3V19c-.8-1.1-1.8-1.6-3-1.6H5z"/><path d="M19 5.5h-4.5v12c.8-.1 1.5-.1 2.1.2.9.4 1.5.8 2.4 1.3z"/></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5h14v15H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>;
}

export async function AircraftWorkspaceNav({
  aircraftId,
  active,
  variants = [],
  variantProfiles = [],
  selectedVariant,
}: Readonly<{
  aircraftId: string;
  active: AircraftModuleNavKey | string;
  variants?: readonly string[];
  variantProfiles?: readonly TrainingAircraftVariantProfile[];
  selectedVariant?: string;
}>) {
  const repository = getTrainingContentRepository();
  const [publishedDomains, aircraft] = await Promise.all([
    repository.listPublishedModuleDomains ? repository.listPublishedModuleDomains(aircraftId) : Promise.resolve([]),
    repository.getAircraft(aircraftId),
  ]);
  const sections = aircraftWorkspaceSections(aircraftId, publishedDomains);
  const overview = sections.find((section) => section.key === "overview");
  const progress = sections.find((section) => section.key === "progress");
  const checklist = sections.find((section) => section.key === "checklists");
  const performance = sections.find((section) => section.key === "performance");

  const learn = orderedEntries(sections, learnOrder);
  const referenceBase = orderedEntries(sections, referenceOrder);
  const hasQuickReference = Boolean(performance) && referenceBase.some((section) => section.key === "limitations");
  const reference: readonly NavEntry[] = hasQuickReference
    ? [{ key: "quick-reference", label: "Quick Reference", href: `/aircraft/${aircraftId}/quick-reference` }, ...referenceBase]
    : referenceBase;
  const hasFly = Boolean(checklist || performance);

  const activeArea: PilotArea | undefined =
    active === "fly" ? "fly"
      : active === "training" || learn.some((entry) => entry.key === active) ? "learn"
        : active === "reference" || active === "quick-reference" || reference.some((entry) => entry.key === active) ? "reference"
          : undefined;

  const primaryDestinations: readonly { key: PrimaryKey; label: string; href: string }[] = [
    ...(overview ? [{ key: "overview" as const, label: "Home", href: overview.href }] : []),
    ...(hasFly ? [{ key: "fly" as const, label: "Fly", href: `/aircraft/${aircraftId}/fly` }] : []),
    ...(learn.length ? [{ key: "learn" as const, label: "Learn", href: `/aircraft/${aircraftId}/training` }] : []),
    ...(reference.length ? [{ key: "reference" as const, label: "Reference", href: `/aircraft/${aircraftId}/reference` }] : []),
  ];

  const activePrimary: PrimaryKey = active === "overview" ? "overview" : activeArea ?? "overview";

  return (
    <section className={`${styles.navigator} learner-pilot-nav`} aria-label="Aircraft navigation">
      <div className={styles.aircraftCard}>
        <Link className={styles.libraryLink} href="/" aria-label="All aircraft"><span aria-hidden="true">←</span><span className={styles.libraryLabel}>Aircraft</span></Link>
        <div className={styles.aircraftIdentity}>
          <strong>{aircraft?.displayName ?? aircraftId}</strong>
          <span>{selectedVariant ?? "All configurations"}</span>
        </div>
        <AircraftVariantSelector variants={variants} variantProfiles={variantProfiles} selectedVariant={selectedVariant} />
      </div>

      <nav className={styles.primaryNav} aria-label="Pilot workspace">
        {primaryDestinations.map((destination) => <Link
          aria-current={activePrimary === destination.key ? "page" : undefined}
          className={activePrimary === destination.key ? styles.primaryActive : undefined}
          href={withVariantQuery(destination.href, selectedVariant)}
          key={destination.key}
        >
          <span className={styles.navIcon}><PilotIcon kind={destination.key} /></span>
          <span>{destination.label}</span>
        </Link>)}
      </nav>

      {progress ? <div className={styles.utilities}>
        <Link className={styles.progressLink} href={withVariantQuery(progress.href, selectedVariant)}>Progress <span aria-hidden="true">→</span></Link>
      </div> : null}
    </section>
  );
}
