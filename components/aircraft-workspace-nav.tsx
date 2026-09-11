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
  if (key === "checklists") return "Normal";
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
  const publishedDomains = repository.listPublishedModuleDomains
    ? await repository.listPublishedModuleDomains(aircraftId)
    : [];
  const sections = aircraftWorkspaceSections(aircraftId, publishedDomains);
  const overview = sections.find((section) => section.key === "overview");
  const progress = sections.find((section) => section.key === "progress");
  const fly = sections.filter((section) => flyKeys.has(section.key));
  const learn = sections.filter((section) => learnKeys.has(section.key));
  const hasQuickReference = fly.some(section => section.key === "performance") && fly.some(section => section.key === "limitations");
  const flyLinks = hasQuickReference
    ? [
        ...fly.flatMap(section => section.key === "limitations"
          ? [{ key: "quick-reference", label: "Quick Reference", href: `/aircraft/${aircraftId}/quick-reference` }, section]
          : [section]),
      ]
    : fly;
  const activeGroup = flyKeys.has(active) || active === "reference" || active === "quick-reference"
    ? "fly"
    : learnKeys.has(active)
      ? "learn"
      : undefined;

  const renderGroup = (
    group: "fly" | "learn",
    label: string,
    description: string,
    entries: readonly { key: string; label: string; href: string }[],
  ) => entries.length ? (
    <section className={`${styles.group} ${styles[group]} ${activeGroup === group ? styles.groupActive : ""}`}>
      <div className={styles.groupHeader}><strong>{label}</strong><span>{description}</span></div>
      <nav className={styles.links} aria-label={`${label} tools`}>
        {entries.map((entry) => (
          <Link
            aria-current={entry.key === active ? "page" : undefined}
            className={entry.key === active ? "active" : undefined}
            href={withVariantQuery(entry.href, selectedVariant)}
            key={entry.key}
          >
            {pilotLabel(entry.key, entry.label)}
          </Link>
        ))}
      </nav>
    </section>
  ) : null;

  return (
    <section className={styles.navigator} aria-label="Aircraft training navigation">
      <div className={styles.utilityRow}>
        {overview ? <Link
          aria-current={active === "overview" ? "page" : undefined}
          className={`${styles.utilityLink} ${active === "overview" ? styles.utilityActive : ""}`}
          href={withVariantQuery(overview.href, selectedVariant)}
        >Overview</Link> : null}
        {progress ? <Link
          aria-current={active === "progress" ? "page" : undefined}
          className={`${styles.utilityLink} ${active === "progress" ? styles.utilityActive : ""}`}
          href={withVariantQuery(progress.href, selectedVariant)}
        >Progress</Link> : null}
        <span className={styles.spacer}/>
        <AircraftVariantSelector variants={variants} variantProfiles={variantProfiles} selectedVariant={selectedVariant} />
      </div>
      <div className={styles.groups}>
        {renderGroup("fly", "FLY", "Cockpit tools", flyLinks)}
        {renderGroup("learn", "LEARN", "Study & practice", learn)}
      </div>
    </section>
  );
}
