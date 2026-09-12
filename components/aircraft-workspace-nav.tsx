import Link from "next/link";

import { AircraftVariantSelector } from "@/components/aircraft-variant-selector";
import { withVariantQuery } from "@/lib/aircraft-applicability";
import type { TrainingAircraftVariantProfile } from "@/lib/aircraft-catalog";
import { aircraftWorkspaceSections, type AircraftModuleNavKey } from "@/lib/aircraft-workspace-navigation";
import { getTrainingContentRepository } from "@/lib/content-store";
import styles from "./aircraft-workspace-nav.module.css";

export type { AircraftModuleNavKey } from "@/lib/aircraft-workspace-navigation";

type PilotArea = "training" | "checklists" | "reference";
type NavEntry = { readonly key: string; readonly label: string; readonly href: string };

const trainingOrder = ["systems", "procedures", "knowledge", "avionics", "flows"] as const;
const checklistOrder = ["checklists", "abnormal"] as const;
const referenceOrder = ["performance", "weight-balance", "limitations"] as const;

const labelFor = (key: string, fallback: string): string => {
  if (key === "checklists") return "Normal";
  if (key === "abnormal") return "Abnormal / Emergency";
  if (key === "flows") return "Workflow";
  if (key === "knowledge") return "Knowledge";
  return fallback;
};

const orderedEntries = (
  sections: readonly NavEntry[],
  order: readonly string[],
): readonly NavEntry[] => order.flatMap((key) => {
  const section = sections.find((item) => item.key === key);
  return section ? [section] : [];
});

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

  const training = orderedEntries(sections, trainingOrder);
  const checklists = orderedEntries(sections, checklistOrder);
  const referenceBase = orderedEntries(sections, referenceOrder);
  const hasQuickReference = referenceBase.some((section) => section.key === "performance")
    && referenceBase.some((section) => section.key === "limitations");
  const reference: readonly NavEntry[] = hasQuickReference
    ? [{ key: "quick-reference", label: "Quick Reference", href: `/aircraft/${aircraftId}/quick-reference` }, ...referenceBase]
    : referenceBase;

  const activeArea: PilotArea | undefined =
    training.some((entry) => entry.key === active) ? "training"
      : checklists.some((entry) => entry.key === active) ? "checklists"
        : reference.some((entry) => entry.key === active) || active === "reference" ? "reference"
          : undefined;

  const areas: readonly { key: PilotArea; label: string; entries: readonly NavEntry[] }[] = [
    { key: "training", label: "Training", entries: training },
    { key: "checklists", label: "Checklists", entries: checklists },
    { key: "reference", label: "Reference", entries: reference },
  ];
  const visibleAreas = areas.filter((area) => area.entries.length > 0);
  const currentArea = visibleAreas.find((area) => area.key === activeArea);

  return (
    <section className={`${styles.navigator} learner-pilot-nav`} aria-label="Aircraft training navigation">
      <div className={styles.contextRow}>
        <Link className={styles.libraryLink} href="/">Aircraft</Link>
        <span className={styles.divider} aria-hidden="true">/</span>
        <div className={styles.aircraftIdentity}>
          <strong>{aircraft?.displayName ?? aircraftId}</strong>
          {selectedVariant ? <span>{selectedVariant}</span> : null}
        </div>
        <div className={styles.utilities}>
          <AircraftVariantSelector variants={variants} variantProfiles={variantProfiles} selectedVariant={selectedVariant} />
          {progress ? <Link className={styles.progressLink} href={withVariantQuery(progress.href, selectedVariant)}>Progress</Link> : null}
        </div>
      </div>

      <nav className={styles.primaryNav} aria-label="Pilot workspace">
        {overview ? <Link
          aria-current={active === "overview" ? "page" : undefined}
          className={active === "overview" ? styles.primaryActive : undefined}
          href={withVariantQuery(overview.href, selectedVariant)}
        >Home</Link> : null}
        {visibleAreas.map((area) => <Link
          aria-current={activeArea === area.key ? "page" : undefined}
          className={activeArea === area.key ? styles.primaryActive : undefined}
          href={withVariantQuery(area.entries[0].href, selectedVariant)}
          key={area.key}
        >{area.label}</Link>)}
      </nav>

      {currentArea && currentArea.entries.length > 1 ? <nav className={styles.areaNav} aria-label={`${currentArea.label} sections`}>
        {currentArea.entries.map((entry) => <Link
          aria-current={entry.key === active || (active === "reference" && entry.key === "quick-reference") ? "page" : undefined}
          className={entry.key === active || (active === "reference" && entry.key === "quick-reference") ? styles.areaActive : undefined}
          href={withVariantQuery(entry.href, selectedVariant)}
          key={entry.key}
        >{labelFor(entry.key, entry.label)}</Link>)}
      </nav> : null}
    </section>
  );
}
