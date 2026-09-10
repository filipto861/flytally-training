import Link from "next/link";

import { AircraftVariantSelector } from "@/components/aircraft-variant-selector";
import { withVariantQuery } from "@/lib/aircraft-applicability";
import type { TrainingContentDomain } from "@/lib/content-admin-types";
import { getTrainingContentRepository } from "@/lib/content-store";

export type AircraftModuleNavKey = "overview" | "checklists" | "procedures" | "performance" | "limitations" | "systems" | "flows" | "avionics" | "abnormal" | "knowledge" | "progress";

type ModuleNavDefinition = {
  readonly key: AircraftModuleNavKey;
  readonly label: string;
  readonly href: string;
  readonly available: (domains: ReadonlySet<TrainingContentDomain>) => boolean;
};

const always = () => true;
const has = (...required: readonly TrainingContentDomain[]) => (domains: ReadonlySet<TrainingContentDomain>) => required.some((domain) => domains.has(domain));

function moduleNavigation(aircraftId: string): readonly ModuleNavDefinition[] {
  const base = `/aircraft/${aircraftId}`;
  return [
    { key: "overview", label: "Aircraft", href: base, available: always },
    { key: "checklists", label: "Checklists", href: `${base}/checklists`, available: has("checklists", "normal-flight") },
    { key: "procedures", label: "Procedures", href: `${base}/procedures`, available: has("procedures") },
    { key: "performance", label: "Performance", href: `${base}/performance`, available: has("performance") },
    { key: "limitations", label: "Limitations", href: `${base}/limitations`, available: has("limitations") },
    { key: "systems", label: "Systems", href: `${base}/systems`, available: has("systems", "learning") },
    { key: "flows", label: "Flows", href: `${base}/flows`, available: has("flows") },
    { key: "avionics", label: "Avionics", href: `${base}/avionics`, available: has("avionics") },
    { key: "abnormal", label: "Abnormal", href: `${base}/abnormal`, available: has("abnormal") },
    { key: "knowledge", label: "Knowledge", href: `${base}/knowledge`, available: has("knowledge", "reference-knowledge") },
    { key: "progress", label: "Progress", href: `${base}/progress-overview`, available: always },
  ];
}

export async function AircraftWorkspaceNav({
  aircraftId,
  active,
  variants = [],
  selectedVariant,
}: Readonly<{
  aircraftId: string;
  active: AircraftModuleNavKey | string;
  variants?: readonly string[];
  selectedVariant?: string;
}>) {
  const repository = getTrainingContentRepository();
  const publishedDomains = repository.listPublishedModuleDomains
    ? await repository.listPublishedModuleDomains(aircraftId)
    : [];
  const domains = new Set<TrainingContentDomain>(publishedDomains);
  const sections = moduleNavigation(aircraftId).filter((section) => section.available(domains));

  return (
    <>
      <nav className="workspace-nav" aria-label="Aircraft training navigation">
        {sections.map((section) => (
          <Link
            aria-current={section.key === active ? "page" : undefined}
            className={section.key === active ? "active" : undefined}
            href={withVariantQuery(section.href, selectedVariant)}
            key={section.key}
          >
            {section.label}
          </Link>
        ))}
      </nav>
      <AircraftVariantSelector variants={variants} selectedVariant={selectedVariant} />
    </>
  );
}
