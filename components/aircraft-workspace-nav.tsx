import Link from "next/link";

import { AircraftVariantSelector } from "@/components/aircraft-variant-selector";
import { withVariantQuery } from "@/lib/aircraft-applicability";
import type { TrainingAircraftVariantProfile } from "@/lib/aircraft-catalog";
import { aircraftWorkspaceSections, type AircraftModuleNavKey } from "@/lib/aircraft-workspace-navigation";
import { getTrainingContentRepository } from "@/lib/content-store";

export type { AircraftModuleNavKey } from "@/lib/aircraft-workspace-navigation";

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
      <AircraftVariantSelector variants={variants} variantProfiles={variantProfiles} selectedVariant={selectedVariant} />
    </>
  );
}
