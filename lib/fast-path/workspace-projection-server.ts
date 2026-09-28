import "server-only";

import {
  filterChecklistForConfiguration,
  filterLimitationsForConfiguration,
  filterPerformanceForConfiguration,
} from "../aircraft-applicability.ts";
import { getBundledPerformancePackage } from "../bundled-performance-content.ts";
import { getBundledReferencePerformancePackage } from "../bundled-reference-performance-content.ts";
import {
  normalizeLegacyFlightFlow,
  normalizeUniversalChecklist,
} from "../checklist-runtime.ts";
import { getPublishedAircraftModule } from "../content-repository.ts";
import { getTrainingContentRepository } from "../content-store.ts";
import { resolveFastPathQrh } from "./qrh-adapter.ts";
import { getOperationalFlightReadiness } from "../operational-content-readiness.ts";
import { mergePerformanceDatasets } from "../performance-package.ts";
import { toReferencePresentation } from "../reference-presentation.ts";
import type {
  AircraftChecklistContent,
  AircraftLimitationsContent,
  AircraftPerformanceContent,
} from "../universal-aircraft-content.ts";
import {
  isSelectedWorkspaceAircraftScope,
  resolveWorkspaceAircraftScopeFromSearchParam,
} from "../workspace-aircraft-scope.ts";
import {
  toFastPathWorkspaceScopeIdentity,
  workspaceVariantRequestKey,
  type FastPathWorkspaceProjection,
} from "./workspace-projection.ts";

export async function getFastPathWorkspaceProjection(
  aircraftId: string,
  requestedVariant: string | readonly string[] | undefined,
): Promise<FastPathWorkspaceProjection | undefined> {
  const repository = getTrainingContentRepository();
  const aircraft = await repository.getAircraft(aircraftId);
  if (!aircraft) return undefined;

  const scope = resolveWorkspaceAircraftScopeFromSearchParam(
    aircraft,
    requestedVariant,
  );
  const requestKey = workspaceVariantRequestKey(requestedVariant);
  const scopeIdentity = toFastPathWorkspaceScopeIdentity(scope);

  if (!isSelectedWorkspaceAircraftScope(scope)) {
    return {
      aircraftId,
      requestKey,
      scope: scopeIdentity,
      performanceDatasets: [],
    };
  }

  const bundledPerformance = getBundledPerformancePackage(aircraftId);
  const bundledReferencePerformance =
    getBundledReferencePerformancePackage(aircraftId);
  const [
    universalChecklist,
    legacyChecklist,
    publishedPerformance,
    publishedAbnormal,
    publishedLimitations,
    operationalReadiness,
  ] = await Promise.all([
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

  const configuredChecklist = universalChecklist
    ? filterChecklistForConfiguration(
        universalChecklist,
        scope.configuration,
      )
    : undefined;
  const checklist =
    configuredChecklist?.phases.length
      ? normalizeUniversalChecklist(configuredChecklist)
      : !universalChecklist && legacyChecklist
        ? normalizeLegacyFlightFlow(legacyChecklist)
        : undefined;

  const configuredPublishedPerformance = publishedPerformance
    ? filterPerformanceForConfiguration(
        publishedPerformance,
        scope.configuration,
      )
    : undefined;
  const configuredBundledPerformance = bundledPerformance
    ? filterPerformanceForConfiguration(
        bundledPerformance.content,
        scope.configuration,
      )
    : undefined;
  const performanceDatasets = mergePerformanceDatasets(
    configuredPublishedPerformance?.datasets ?? [],
    configuredBundledPerformance?.datasets ?? [],
  );

  const emergency = resolveFastPathQrh(
    publishedAbnormal,
    scope.configuration,
    operationalReadiness.abnormal.ready,
  );

  const configuredLimitations = publishedLimitations
    ? filterLimitationsForConfiguration(
        publishedLimitations,
        scope.configuration,
      )
    : undefined;
  const reference = toReferencePresentation(configuredLimitations);
  const referencePerformance = bundledReferencePerformance
    ? filterPerformanceForConfiguration(
        bundledReferencePerformance.content,
        scope.configuration,
      )
    : undefined;

  return {
    aircraftId,
    requestKey,
    scope: scopeIdentity,
    ...(checklist ? { checklist } : {}),
    ...(emergency ? { emergency } : {}),
    performanceDatasets,
    ...(bundledPerformance?.takeoffCalculator
      ? { takeoffCalculator: bundledPerformance.takeoffCalculator }
      : {}),
    ...(reference ? { reference } : {}),
    ...(referencePerformance?.datasets.length
      ? { referencePerformance }
      : {}),
  };
}
