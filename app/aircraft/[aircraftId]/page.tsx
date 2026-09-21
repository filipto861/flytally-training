import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { ContinueLearningCard } from "@/components/continue-learning-card";
import { FtLaunchSurface } from "@/components/ft-launch/FtLaunchSurface";
import { resolveSelectedVariant, withVariantQuery } from "@/lib/aircraft-applicability";
import type { TrainingAircraftVariantProfile } from "@/lib/aircraft-catalog";
import { getAircraftContentBundle } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import { isNewShellEnabled } from "@/lib/feature-flags";
import { loadLatestLaunchTrainingEvent } from "@/lib/launch/progress";
import { getTrainingProgressRepository } from "@/lib/progress-repository";
import { getTrainingSession } from "@/lib/training-session";

function LegacyAircraftHome({
  aircraftId,
  aircraftName,
  variants,
  variantProfiles,
  selectedVariant,
  hasTraining,
  hasFly,
  hasReference,
  hasQuickStart,
  hasAbnormalEmergency,
}: Readonly<{
  aircraftId: string;
  aircraftName: string;
  variants: readonly string[];
  variantProfiles?: readonly TrainingAircraftVariantProfile[];
  selectedVariant?: string;
  hasTraining: boolean;
  hasFly: boolean;
  hasReference: boolean;
  hasQuickStart: boolean;
  hasAbnormalEmergency: boolean;
}>) {
  const moduleHref = (href: string) =>
    withVariantQuery(`/aircraft/${aircraftId}/${href}`, selectedVariant);

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
            hasQuickStart={hasQuickStart}
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

        {hasAbnormalEmergency ? (
          <Link className="pilot-emergency-strip" href={moduleHref("abnormal")}>
            <span>Abnormal & Emergency</span>
            <span aria-hidden="true">Open quick reference →</span>
          </Link>
        ) : null}
      </section>
    </main>
  );
}

export default async function AircraftPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ aircraftId: string }>;
  searchParams: Promise<{ variant?: string }>;
}>) {
  const [{ aircraftId }, { variant }] = await Promise.all([params, searchParams]);
  const bundle = await getAircraftContentBundle(
    getTrainingContentRepository(),
    aircraftId,
  );
  if (!bundle) notFound();

  const { aircraft, capabilities } = bundle;
  const selectedVariant = resolveSelectedVariant(variant, aircraft.variants);

  const hasTraining =
    capabilities.quickStart ||
    capabilities.cockpitOrientation ||
    capabilities.checklists ||
    capabilities.systems ||
    capabilities.procedures ||
    capabilities.knowledge ||
    capabilities.avionics ||
    capabilities.flows;
  const hasFly = capabilities.checklists || capabilities.performance;
  const hasReference =
    capabilities.performance ||
    capabilities.weightBalance ||
    capabilities.limitations ||
    capabilities.abnormalEmergency;

  if (!isNewShellEnabled()) {
    return (
      <LegacyAircraftHome
        aircraftId={aircraft.id}
        aircraftName={aircraft.displayName}
        variants={aircraft.variants}
        variantProfiles={aircraft.variantProfiles}
        selectedVariant={selectedVariant}
        hasTraining={hasTraining}
        hasFly={hasFly}
        hasReference={hasReference}
        hasQuickStart={capabilities.quickStart}
        hasAbnormalEmergency={capabilities.abnormalEmergency}
      />
    );
  }

  const session = await getTrainingSession();
  const latestTraining = session
    ? await loadLatestLaunchTrainingEvent(
        getTrainingProgressRepository(),
        session.subject,
        aircraft.id,
      )
    : undefined;

  return (
    <FtLaunchSurface
      aircraftId={aircraft.id}
      aircraftName={aircraft.displayName}
      selectedVariant={selectedVariant}
      latestTraining={latestTraining}
      recentItems={[]}
    />
  );
}
