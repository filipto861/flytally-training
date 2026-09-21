import Link from "next/link";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { ContinueLearningCard } from "@/components/continue-learning-card";
import { withVariantQuery } from "@/lib/aircraft-applicability";
import type { TrainingAircraftVariantProfile } from "@/lib/aircraft-catalog";
import type { AircraftContentCapabilities } from "@/lib/content-repository";

export function LegacyAircraftHome({
  aircraftId,
  aircraftName,
  variants,
  variantProfiles,
  selectedVariant,
  capabilities,
}: Readonly<{
  aircraftId: string;
  aircraftName: string;
  variants: readonly string[];
  variantProfiles?: readonly TrainingAircraftVariantProfile[];
  selectedVariant?: string;
  capabilities: AircraftContentCapabilities;
}>) {
  const moduleHref = (href: string) =>
    withVariantQuery(`/aircraft/${aircraftId}/${href}`, selectedVariant);

  const hasTraining = capabilities.quickStart || capabilities.cockpitOrientation || capabilities.checklists || capabilities.systems || capabilities.procedures || capabilities.knowledge || capabilities.avionics || capabilities.flows;
  const hasFly = capabilities.checklists || capabilities.performance;
  const hasReference = capabilities.performance || capabilities.weightBalance || capabilities.limitations || capabilities.abnormalEmergency;

  return (
    <main className="shell aircraft-detail">
      <AircraftWorkspaceNav
        aircraftId={aircraftId}
        active="overview"
        variants={variants}
        variantProfiles={variantProfiles}
        selectedVariant={selectedVariant}
      />

      <section className="pilot-aircraft-home">
        <header className="pilot-home-header">
          <p className="eyebrow">Aircraft</p>
          <h1>{aircraftName}</h1>
        </header>

        {hasTraining ? (
          <ContinueLearningCard
            aircraftId={aircraftId}
            selectedVariant={selectedVariant}
            hasQuickStart={capabilities.quickStart}
          />
        ) : null}

        <div className="pilot-command-grid">
          {hasFly ? (
            <article className="pilot-command-panel pilot-command-panel-primary">
              <p className="eyebrow">In flight</p>
              <h2>Fly</h2>
              <p>Checklist and performance for quick cockpit use.</p>
              <Link className="pilot-command-primary" href={moduleHref("fly")}>
                Open Fly →
              </Link>
            </article>
          ) : null}

          {hasTraining ? (
            <article className="pilot-command-panel">
              <p className="eyebrow">Study</p>
              <h2>Learn</h2>
              <p>Focused training away from the cockpit.</p>
              <Link className="pilot-command-primary" href={moduleHref("training")}>
                Open Learn →
              </Link>
            </article>
          ) : null}

          {hasReference ? (
            <article className="pilot-command-panel">
              <p className="eyebrow">Quick access</p>
              <h2>Reference</h2>
              <p>Find limits, performance, loading and emergency material quickly.</p>
              <Link className="pilot-command-primary" href={moduleHref("reference")}>
                Open Reference →
              </Link>
            </article>
          ) : null}
        </div>

        {capabilities.abnormalEmergency ? (
          <Link className="pilot-emergency-strip" href={moduleHref("abnormal")}>
            <span>Abnormal & Emergency</span>
            <span aria-hidden="true">Open quick reference →</span>
          </Link>
        ) : null}
      </section>
    </main>
  );
}
