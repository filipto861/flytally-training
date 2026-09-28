import { FtFastPathScopeRegistrar } from "@/components/ft-fast-path/FtFastPathScopeRegistrar";
import {
  filterChecklistForConfiguration,
  filterLimitationsForConfiguration,
  filterPerformanceForConfiguration,
} from "@/lib/aircraft-applicability";
import { getBundledPerformancePackage } from "@/lib/bundled-performance-content";
import { getBundledReferencePerformancePackage } from "@/lib/bundled-reference-performance-content";
import {
  normalizeLegacyFlightFlow,
  normalizeUniversalChecklist,
} from "@/lib/checklist-runtime";
import { getPublishedAircraftModule } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import { resolveFastPathQrh } from "@/lib/fast-path/qrh-adapter";
import {
  fastPathScopeIdentity,
  type FastPathWorkspaceProjection,
} from "@/lib/fast-path/workspace-projection";
import { getOperationalFlightReadiness } from "@/lib/operational-content-readiness";
import { mergePerformanceDatasets } from "@/lib/performance-package";
import { toReferencePresentation } from "@/lib/reference-presentation";
import type {
  AircraftChecklistContent,
  AircraftLimitationsContent,
  AircraftPerformanceContent,
} from "@/lib/universal-aircraft-content";
import { resolveWorkspaceAircraftScopeFromSearchParam } from "@/lib/workspace-aircraft-scope";

function queryVariantValues(variant: string | readonly string[] | undefined): readonly string[] {
  if (variant === undefined) return [];
  return typeof variant === "string" ? [variant] : variant;
}

export async function FtWorkspaceScopeSlot({
  aircraftId,
  variant,
}: Readonly<{
  aircraftId: string;
  variant?: string | string[];
}>) {
  const repository = getTrainingContentRepository();
  const bundledPerformance = getBundledPerformancePackage(aircraftId);
  const bundledReferencePerformance =
    getBundledReferencePerformancePackage(aircraftId);
  const [
    aircraft,
    universalChecklist,
    legacyChecklist,
    publishedPerformance,
    publishedAbnormal,
    publishedLimitations,
    operationalReadiness,
  ] = await Promise.all([
    repository.getAircraft(aircraftId),
    getPublishedAircraftModule<AircraftChecklistContent>(
      repository,
      aircraftId,
      "checklists",
    ),
    repository.getNormalFlight(aircraftId),
    getPublishedAircraftModule<AircraftPerformanceContent>(
      repository,
      aircraftId,
      "performance",
    ),
    getPublishedAircraftModule<unknown>(
      repository,
      aircraftId,
      "abnormal",
    ),
    getPublishedAircraftModule<AircraftLimitationsContent>(
      repository,
      aircraftId,
      "limitations",
    ),
    getOperationalFlightReadiness(aircraftId),
  ]);
  if (!aircraft) return null;

  const scope = resolveWorkspaceAircraftScopeFromSearchParam(
    aircraft,
    variant,
  );
  const selectedProfile =
    scope.status === "selected" && scope.variantKey
      ? aircraft.variantProfiles?.find(
          (profile) => profile.key === scope.variantKey,
        )
      : undefined;
  const profileLabel =
    scope.status === "selected"
      ? selectedProfile?.displayName
        ?? scope.variantKey
        ?? "Common configuration"
      : scope.status === "unselected"
        ? "Configuration not selected"
        : scope.status === "unknown-variant"
          ? "Unknown configuration"
          : "Invalid configuration";

  let projection: FastPathWorkspaceProjection = {
    scope: fastPathScopeIdentity(scope),
    queryVariantValues: queryVariantValues(variant),
    profileLabel,
    performanceDatasets: [],
  };

  if (scope.status === "selected") {
    const configuration = scope.configuration;
    const configuredChecklist =
      operationalReadiness.checklists.ready && universalChecklist
        ? filterChecklistForConfiguration(
            universalChecklist,
            configuration,
          )
        : undefined;
    const checklist =
      configuredChecklist?.phases.length
        ? normalizeUniversalChecklist(configuredChecklist)
        : !universalChecklist && legacyChecklist
          ? normalizeLegacyFlightFlow(legacyChecklist)
          : undefined;

    const configuredPublishedPerformance =
      operationalReadiness.performance.ready && publishedPerformance
        ? filterPerformanceForConfiguration(
            publishedPerformance,
            configuration,
          )
        : undefined;
    const configuredBundledPerformance = bundledPerformance
      ? filterPerformanceForConfiguration(
          bundledPerformance.content,
          configuration,
        )
      : undefined;
    const performanceDatasets = mergePerformanceDatasets(
      configuredPublishedPerformance?.datasets ?? [],
      configuredBundledPerformance?.datasets ?? [],
    );

    const emergency = resolveFastPathQrh(
      publishedAbnormal,
      configuration,
      operationalReadiness.abnormal.ready,
    );

    const configuredLimitations = publishedLimitations
      ? filterLimitationsForConfiguration(
          publishedLimitations,
          configuration,
        )
      : undefined;
    const reference = toReferencePresentation(configuredLimitations);
    const referencePerformance = bundledReferencePerformance
      ? filterPerformanceForConfiguration(
          bundledReferencePerformance.content,
          configuration,
        )
      : undefined;

    projection = {
      ...projection,
      ...(checklist ? { checklist } : {}),
      ...(emergency ? { emergency } : {}),
      ...(reference ? { reference } : {}),
      ...(referencePerformance ? { referencePerformance } : {}),
      performanceDatasets,
      ...(bundledPerformance?.takeoffCalculator
        ? { takeoffCalculator: bundledPerformance.takeoffCalculator }
        : {}),
    };
  }

  return (
    <>
      <span
        hidden
        data-ft-workspace-scope-slot="true"
        data-aircraft-id={scope.aircraftId}
        data-scope-status={scope.status}
        data-selection-source={scope.selectionSource}
        {...("requestedVariant" in scope && scope.requestedVariant !== undefined
          ? { "data-requested-variant": scope.requestedVariant }
          : {})}
        {...(scope.status === "selected"
          ? {
              "data-variant-key": scope.variantKey ?? "common",
              "data-effective-configuration-snapshot-id":
                scope.effectiveConfigurationSnapshotId,
            }
          : {})}
        {...(scope.status === "configuration-invalid"
          ? { "data-scope-reason": scope.reason }
          : {})}
      />
      <FtFastPathScopeRegistrar projection={projection} />
    </>
  );
}
