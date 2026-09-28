import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import {
  FtReferencePage,
  type FtReferenceDestination,
} from "@/components/ft-reference/FtReferencePage";
import {
  FtConfigurationNotice,
  FtConfigurationState,
} from "@/components/ft-shell/FtConfigurationState";
import {
  configurationForAircraftVariant,
  filterLimitationsForConfiguration,
  filterPerformanceForConfiguration,
  resolveSelectedVariant,
  withVariantQuery,
} from "@/lib/aircraft-applicability";
import { getBundledPerformancePackage } from "@/lib/bundled-performance-content";
import { getBundledReferencePerformancePackage } from "@/lib/bundled-reference-performance-content";
import {
  getAircraftContentBundle,
  getPublishedAircraftModule,
} from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import { isNewShellEnabled } from "@/lib/feature-flags";
import { toReferencePresentation } from "@/lib/reference-presentation";
import type { AircraftLimitationsContent } from "@/lib/universal-aircraft-content";
import { resolveWorkspaceAircraftScopeFromSearchParam } from "@/lib/workspace-aircraft-scope";

export default async function ReferenceHubPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ aircraftId: string }>;
  searchParams: Promise<{ variant?: string | string[] }>;
}>) {
  const [{ aircraftId }, { variant }] = await Promise.all([params, searchParams]);
  const repository = getTrainingContentRepository();
  const [bundle, publishedLimitations] = await Promise.all([
    getAircraftContentBundle(repository, aircraftId),
    getPublishedAircraftModule<AircraftLimitationsContent>(
      repository,
      aircraftId,
      "limitations",
    ),
  ]);
  if (!bundle) notFound();
  const { aircraft, capabilities } = bundle;
  const hasPerformance = capabilities.performance || Boolean(getBundledPerformancePackage(aircraftId));
  const newShell = isNewShellEnabled();
  const workspaceScope = newShell
    ? resolveWorkspaceAircraftScopeFromSearchParam(aircraft, variant)
    : undefined;
  if (
    newShell
    && workspaceScope
    && workspaceScope.status !== "selected"
    && workspaceScope.status !== "unselected"
  ) {
    return <FtConfigurationState scope={workspaceScope} />;
  }

  const selectedVariant = newShell
    ? workspaceScope?.status === "selected"
      ? workspaceScope.variantKey ?? undefined
      : undefined
    : resolveSelectedVariant(variant as string | undefined, aircraft.variants);
  const href = (section: string) => withVariantQuery(`/aircraft/${aircraft.id}/${section}`, selectedVariant);

  const hasQuickReference = hasPerformance && capabilities.limitations;
  const emergency = capabilities.abnormalEmergency ? { key: "abnormal", kicker: "Emergency", title: "Abnormal & Emergency", text: "Open source-backed abnormal and emergency material quickly." } : undefined;
  const modules = [
    hasPerformance ? { key: "performance", kicker: "Plan", title: "Performance", text: "Source-backed performance data and calculator." } : undefined,
    capabilities.weightBalance ? { key: "weight-balance", kicker: "Load", title: "Weight & Balance", text: "Mass, CG and configuration-specific loading limits." } : undefined,
    capabilities.limitations ? { key: "limitations", kicker: "Limits", title: "Limitations", text: "Speeds, weights and operating boundaries." } : undefined,
  ].filter((item): item is { key: string; kicker: string; title: string; text: string } => Boolean(item));

  if (newShell) {
    const configuration =
      workspaceScope?.status === "selected"
        ? workspaceScope.configuration
        : configurationForAircraftVariant(aircraft, undefined);
    const configuredLimitations = publishedLimitations
      ? filterLimitationsForConfiguration(
          publishedLimitations,
          configuration,
        )
      : undefined;
    const bundledReferencePerformance = getBundledReferencePerformancePackage(aircraftId);
    const referencePerformance = bundledReferencePerformance
      ? filterPerformanceForConfiguration(
          bundledReferencePerformance.content,
          configuration,
        )
      : undefined;
    const reference = toReferencePresentation(configuredLimitations);
    const destinations: FtReferenceDestination[] = [
      ...(hasQuickReference
        ? [{
            key: "quick-reference",
            title: "Quick Reference",
            summary: "Published limitations and source rows in one workspace.",
            href: `/aircraft/${aircraft.id}/quick-reference`,
          }]
        : []),
      ...(capabilities.limitations
        ? [{
            key: "limitations",
            title: "Limitations",
            summary: "Search all published operating limitations.",
            href: `/aircraft/${aircraft.id}/limitations`,
          }]
        : []),
      ...(capabilities.abnormalEmergency
        ? [{
            key: "abnormal",
            title: "Abnormal & Emergency",
            summary: "Open the source-backed abnormal and emergency workspace.",
            href: `/aircraft/${aircraft.id}/abnormal`,
          }]
        : []),
    ];

    if (!reference && !referencePerformance?.datasets.length && !destinations.length) notFound();

    return (
      <>
        {workspaceScope?.status === "unselected" ? <FtConfigurationNotice /> : null}
        <FtReferencePage
          aircraftId={aircraft.id}
          selectedVariant={selectedVariant}
          reference={reference}
          referencePerformance={referencePerformance}
          destinations={destinations}
        />
      </>
    );
  }

  if (!modules.length && !hasQuickReference && !emergency) notFound();

  return (
    <main className="shell aircraft-detail">
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="reference" variants={aircraft.variants} variantProfiles={aircraft.variantProfiles} selectedVariant={selectedVariant} />
      <section className="pilot-area">
        <header className="pilot-area-header">
          <p className="eyebrow">Reference</p>
          <h1>Reference</h1>
          <p className="lede">Find the number or procedure you need without stepping through training.</p>
        </header>
        {(hasQuickReference||emergency) ? <section className="training-hub-section">
          <div className="training-hub-heading"><p className="eyebrow">QUICK ACCESS</p><h2>Cockpit reference</h2></div>
          <div className="pilot-area-grid reference-priority-grid" aria-label="Quick reference tools">
            {hasQuickReference ? <Link className="pilot-area-card pilot-area-card-featured" href={href("quick-reference")}><small>At a glance</small><strong>Quick Reference</strong><p>Published limits and performance in one compact workspace.</p><span>Open →</span></Link> : null}
            {emergency ? <Link className="pilot-area-card pilot-area-card-critical" href={href(emergency.key)}><small>{emergency.kicker}</small><strong>{emergency.title}</strong><p>{emergency.text}</p><span>Open →</span></Link> : null}
          </div>
        </section> : null}
        {modules.length ? <section className="training-hub-section">
          <div className="training-hub-heading"><p className="eyebrow">TOOLS</p><h2>Planning & limits</h2></div>
          <div className="pilot-area-grid" aria-label="Reference tools">
            {modules.map((module) => <Link className="pilot-area-card" href={href(module.key)} key={module.key}><small>{module.kicker}</small><strong>{module.title}</strong><p>{module.text}</p><span>Open →</span></Link>)}
          </div>
        </section> : null}
      </section>
    </main>
  );
}
