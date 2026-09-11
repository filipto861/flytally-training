import Link from "next/link";

import { AircraftVariantSelector } from "@/components/aircraft-variant-selector";
import { withVariantQuery } from "@/lib/aircraft-applicability";
import type { TrainingAircraftVariantProfile } from "@/lib/aircraft-catalog";
import { aircraftWorkspaceSections, type AircraftModuleNavKey } from "@/lib/aircraft-workspace-navigation";
import { getTrainingContentRepository } from "@/lib/content-store";

export type { AircraftModuleNavKey } from "@/lib/aircraft-workspace-navigation";

const flyKeys = new Set(["checklists", "performance", "limitations", "abnormal"]);
const learnKeys = new Set(["procedures", "systems", "flows", "avionics", "knowledge"]);

const pilotLabel = (key: string, fallback: string): string => {
  if (key === "checklists") return "Normal";
  if (key === "abnormal") return "QRH";
  if (key === "flows") return "Workflow drills";
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
  const activeGroup = flyKeys.has(active) || active === "reference" || active === "quick-reference"
    ? "fly"
    : learnKeys.has(active)
      ? "learn"
      : undefined;
  const contextualSections = activeGroup === "fly" ? fly : activeGroup === "learn" ? learn : [];

  const topLinks = [
    overview ? { key: "overview", label: "Aircraft", href: overview.href, active: active === "overview" } : undefined,
    fly[0] ? { key: "fly", label: "FLY", href: fly[0].href, active: activeGroup === "fly" } : undefined,
    learn[0] ? { key: "learn", label: "LEARN", href: learn[0].href, active: activeGroup === "learn" } : undefined,
    progress ? { key: "progress", label: "Progress", href: progress.href, active: active === "progress" } : undefined,
  ].filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  return (
    <>
      <nav className="workspace-nav workspace-nav-primary" aria-label="Aircraft pilot workspace navigation">
        {topLinks.map((entry) => (
          <Link
            aria-current={entry.active ? "page" : undefined}
            className={entry.active ? "active" : undefined}
            href={withVariantQuery(entry.href, selectedVariant)}
            key={entry.key}
          >
            {entry.label}
          </Link>
        ))}
      </nav>
      {contextualSections.length ? (
        <nav className="workspace-nav workspace-nav-secondary" aria-label={`${activeGroup === "fly" ? "FLY" : "LEARN"} tools`}>
          {contextualSections.map((section) => (
            <Link
              aria-current={section.key === active ? "page" : undefined}
              className={section.key === active ? "active" : undefined}
              href={withVariantQuery(section.href, selectedVariant)}
              key={section.key}
            >
              {pilotLabel(section.key, section.label)}
            </Link>
          ))}
        </nav>
      ) : null}
      <AircraftVariantSelector variants={variants} variantProfiles={variantProfiles} selectedVariant={selectedVariant} />
    </>
  );
}
