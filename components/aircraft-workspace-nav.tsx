import Link from "next/link";

import { AircraftVariantSelector } from "@/components/aircraft-variant-selector";
import { withVariantQuery } from "@/lib/aircraft-applicability";
import type { TrainingAircraftVariantProfile } from "@/lib/aircraft-catalog";
import { aircraftWorkspaceSections, type AircraftModuleNavKey } from "@/lib/aircraft-workspace-navigation";
import { getTrainingContentRepository } from "@/lib/content-store";
import styles from "./aircraft-workspace-nav.module.css";

export type { AircraftModuleNavKey } from "@/lib/aircraft-workspace-navigation";

const flyKeys = new Set(["checklists", "performance", "limitations", "abnormal"]);
const learnKeys = new Set(["procedures", "systems", "flows", "avionics", "knowledge"]);

const pilotLabel = (key: string, fallback: string): string => {
  if (key === "checklists") return "Normal Checklist";
  if (key === "abnormal") return "QRH";
  if (key === "flows") return "Workflow";
  if (key === "knowledge") return "Knowledge";
  return fallback;
};

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
  const fly = sections.filter((section) => flyKeys.has(section.key));
  const learn = sections.filter((section) => learnKeys.has(section.key));
  const hasQuickReference = fly.some(section => section.key === "performance") && fly.some(section => section.key === "limitations");
  const flyLinks = hasQuickReference
    ? fly.flatMap(section => section.key === "limitations"
      ? [{ key: "quick-reference", label: "Quick Reference", href: `/aircraft/${aircraftId}/quick-reference` }, section]
      : [section])
    : fly;
  const activeGroup = flyKeys.has(active) || active === "reference" || active === "quick-reference"
    ? "fly"
    : learnKeys.has(active)
      ? "learn"
      : undefined;

  const renderGroup = (
    group: "fly" | "learn",
    label: string,
    entries: readonly { key: string; label: string; href: string }[],
  ) => {
    if (!entries.length) return null;
    if (activeGroup !== group) {
      return <Link className={styles.collapsedGroup} href={withVariantQuery(entries[0].href, selectedVariant)}>
        <span>{label}</span><span aria-hidden="true">›</span>
      </Link>;
    }
    return <section className={styles.expandedGroup} aria-label={`${label} tools`}>
      <div className={styles.groupTitle}>{label}</div>
      <nav className={styles.moduleLinks}>
        {entries.map((entry) => <Link
          aria-current={entry.key === active ? "page" : undefined}
          className={entry.key === active ? styles.moduleActive : undefined}
          href={withVariantQuery(entry.href, selectedVariant)}
          key={entry.key}
        >{pilotLabel(entry.key, entry.label)}</Link>)}
      </nav>
    </section>;
  };

  return (
    <aside className={`${styles.navigator} learner-sidebar`} aria-label="Aircraft training navigation">
      <Link className={styles.libraryLink} href="/">← Aircraft library</Link>
      <div className={styles.aircraftIdentity}>
        <strong>{aircraft?.displayName ?? aircraftId}</strong>
        {selectedVariant ? <span>{selectedVariant}</span> : null}
      </div>

      <nav className={styles.primaryNav} aria-label="Aircraft workspace">
        {overview ? <Link
          aria-current={active === "overview" ? "page" : undefined}
          className={active === "overview" ? styles.primaryActive : undefined}
          href={withVariantQuery(overview.href, selectedVariant)}
        >Home</Link> : null}
        {renderGroup("fly", "FLY", flyLinks)}
        {renderGroup("learn", "LEARN", learn)}
        {progress ? <Link
          aria-current={active === "progress" ? "page" : undefined}
          className={active === "progress" ? styles.primaryActive : undefined}
          href={withVariantQuery(progress.href, selectedVariant)}
        >Progress</Link> : null}
      </nav>

      <div className={styles.configuration}>
        <AircraftVariantSelector variants={variants} variantProfiles={variantProfiles} selectedVariant={selectedVariant} />
      </div>
    </aside>
  );
}
