import assert from "node:assert/strict";
import test from "node:test";

import type {
  AircraftChecklistContent,
  AircraftPerformanceContent,
  AircraftProcedureContent,
} from "../lib/universal-aircraft-content.ts";
import type { AircraftWeightBalanceContent } from "../lib/universal-weight-balance.ts";
import {
  buildV31AcceptancePerformance,
  buildV31AcceptanceWeightBalance,
} from "./fixtures/v31-second-aircraft.ts";

const acceptanceUrl = process.env.TRAINING_ACCEPTANCE_DATABASE_URL?.trim();

test("a sparse second aircraft can be created, published and read through the generic PostgreSQL path without aircraft-specific application code", { skip: !acceptanceUrl }, async () => {
  process.env.TRAINING_DATABASE_URL = acceptanceUrl;
  const [
    { initializeTrainingDatabase },
    { createAircraft, addAircraftVariant, createSourceReference },
    { registerGovernedManualRevision },
    { publishGovernedAircraft },
    { createGovernedDraftVersion, approveGovernedContentVersion, publishGovernedContentVersion },
    { PostgresTrainingContentRepository },
    { getAircraftContentBundle },
    { validateContentPayload },
    { configurationForAircraftVariant, filterChecklistForConfiguration, filterProceduresForConfiguration, filterPerformanceForConfiguration },
    { buildPerformanceCalculatorProfile, calculateLandingDistance, calculateTakeoffDistance, getMetricLookupResults },
    { calculateWeightBalance },
    { sql },
  ] = await Promise.all([
    import("../lib/database-bootstrap.ts"),
    import("../lib/content-admin-repository.ts"),
    import("../lib/governed-manual-registration.ts"),
    import("../lib/aircraft-publication.ts"),
    import("../lib/content-governed-lifecycle.ts"),
    import("../lib/postgres-content-repository.ts"),
    import("../lib/content-repository.ts"),
    import("../lib/content-contracts.ts"),
    import("../lib/aircraft-applicability.ts"),
    import("../lib/performance-calculator.ts"),
    import("../lib/weight-balance-calculator.ts"),
    import("../lib/db.ts"),
  ]);
  await initializeTrainingDatabase();

  const aircraftId = `acceptance-light-sep-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const revisionId = `${aircraftId}-r1`;
  const manualId = `${aircraftId}-manual`;
  const subject = "acceptance-harness";
  const embeddedSource = { manualId, chapter: "1", section: "Synthetic acceptance", pageLabel: "1" } as const;

  const checklists: AircraftChecklistContent = {
    aircraftId,
    title: "Acceptance Light SEP Checklists",
    sourceNote: "Synthetic sparse-aircraft acceptance content.",
    phases: [{
      id: "before-start",
      title: "Before start",
      sequence: 10,
      items: [
        {
          id: "fuel-selector",
          challenge: "Fuel selector",
          response: "ON",
          procedureId: "fuel-system-preparation",
          explanation: "Synthetic acceptance item used to prove checklist-to-procedure linking.",
          sources: [embeddedSource],
        },
        {
          id: "variant-a-check",
          challenge: "Variant A configuration",
          response: "CHECK",
          applicability: { variants: ["A"] },
          sources: [embeddedSource],
        },
        {
          id: "variant-b-check",
          challenge: "Variant B configuration",
          response: "CHECK",
          applicability: { variants: ["B"] },
          sources: [embeddedSource],
        },
      ],
      sources: [embeddedSource],
    }],
  };

  const procedures: AircraftProcedureContent = {
    aircraftId,
    title: "Acceptance Light SEP Procedures",
    sourceNote: "Synthetic sparse-aircraft acceptance content.",
    procedures: [{
      id: "fuel-system-preparation",
      title: "Fuel system preparation",
      phase: "Before start",
      summary: "A deliberately small source-backed procedure for the acceptance harness.",
      steps: [{
        id: "fuel-selector-on",
        action: "Set the fuel selector to ON.",
        expectedResult: "Fuel supply is selected for engine operation.",
        verification: "Selected fuel position agrees with the intended configuration.",
        sources: [embeddedSource],
      }],
      completionCriteria: ["Fuel source selected"],
      sources: [embeddedSource],
    }],
  };

  const performance = buildV31AcceptancePerformance(aircraftId, embeddedSource);
  const weightBalance = buildV31AcceptanceWeightBalance(aircraftId, embeddedSource);

  const domains = { checklists, procedures, performance, "weight-balance": weightBalance } as const;

  try {
    await createAircraft({
      id: aircraftId,
      manufacturer: "Acceptance",
      model: "Light SEP",
      displayName: "Acceptance Light SEP",
    }, subject);
    await addAircraftVariant(aircraftId, "A");
    await addAircraftVariant(aircraftId, "B");
    await registerGovernedManualRevision({
      aircraftId,
      manualId,
      revisionId,
      title: "Acceptance Light SEP Manual",
      publisher: "FlyTally Acceptance",
      sourceKind: "POH",
      revision: "1",
      issueDate: "2026-09",
      authorityRole: "OPERATING_REFERENCE",
      authorityNote: "Synthetic disposable acceptance source.",
      sourceUri: "acceptance://light-sep-manual.pdf",
      checksumSha256: "a".repeat(64),
    }, subject);
    const referenceId = await createSourceReference({ revisionId, chapter: "1", section: "Synthetic acceptance", pageLabel: "1" }, subject);

    for (const [domain, payload] of Object.entries(domains)) {
      assert.deepEqual(validateContentPayload(domain as keyof typeof domains, payload, aircraftId), []);
      const versionId = await createGovernedDraftVersion({
        aircraftId,
        domain,
        contentKey: "bundle",
        payload,
        origin: "human",
        sourceReferenceIds: [referenceId],
      }, subject);
      await approveGovernedContentVersion(versionId, subject, "Disposable sparse-aircraft acceptance fixture.");
      await publishGovernedContentVersion(versionId, subject);
    }
    await publishGovernedAircraft(aircraftId);

    const repository = new PostgresTrainingContentRepository();
    const bundle = await getAircraftContentBundle(repository, aircraftId);
    assert.ok(bundle);
    assert.equal(bundle.aircraft.id, aircraftId);
    assert.deepEqual(bundle.publishedModuleDomains, ["checklists", "performance", "procedures", "weight-balance"]);
    assert.deepEqual(bundle.capabilities, {
      checklists: true,
      procedures: true,
      performance: true,
      weightBalance: true,
      limitations: false,
      systems: false,
      abnormalEmergency: false,
      flows: false,
      avionics: false,
      knowledge: false,
      manual: true,
      quickStart: false,
      normalFlight: false,
      cockpitOrientation: false,
      quickReference: false,
    });
    assert.ok((await repository.listAircraft()).some((aircraft) => aircraft.id === aircraftId));

    const storedChecklists = await repository.getPublishedModule<AircraftChecklistContent>(aircraftId, "checklists");
    const storedProcedures = await repository.getPublishedModule<AircraftProcedureContent>(aircraftId, "procedures");
    const storedPerformance = await repository.getPublishedModule<AircraftPerformanceContent>(aircraftId, "performance");
    const storedWeightBalance = await repository.getPublishedModule<AircraftWeightBalanceContent>(aircraftId, "weight-balance");
    assert.ok(storedChecklists && storedProcedures && storedPerformance && storedWeightBalance);

    const configuration = configurationForAircraftVariant(bundle.aircraft, "A");
    const configuredChecklists = filterChecklistForConfiguration(storedChecklists, configuration);
    const configuredProcedures = filterProceduresForConfiguration(storedProcedures, configuration);
    const configuredPerformance = filterPerformanceForConfiguration(storedPerformance, configuration);
    assert.deepEqual(configuredChecklists.phases[0]?.items.map((item) => item.id), ["fuel-selector", "variant-a-check"]);
    assert.deepEqual(configuredProcedures.procedures.map((procedure) => procedure.id), ["fuel-system-preparation"]);
    assert.deepEqual(configuredPerformance.datasets.map((dataset) => dataset.id), ["departure-penalties", "arrival-surface-table", "arrival-reference-values"]);

    const profile = buildPerformanceCalculatorProfile(configuredPerformance.datasets);
    const takeoff = calculateTakeoffDistance(profile, { dryDistance: 500, runwayAvailable: 700, weight: 1000, surface: "damp" });
    assert.equal(takeoff.status, "ready");
    assert.equal(takeoff.correctedDistance, 550);
    const landing = calculateLandingDistance(profile, { dryDistance: 400, runwayAvailable: 800, surface: "ice", oatC: 4 });
    assert.equal(landing.status, "ready");
    assert.equal(landing.correctedDistance, 720);
    assert.deepEqual(getMetricLookupResults(profile.landingSpeedDataset, 900), [
      { key: "referenceVelocity", label: "Reference speed", unit: "KIAS", value: 70 },
      { key: "approachVelocity", label: "Approach speed", unit: "KIAS", value: 75 },
    ]);

    assert.equal(storedWeightBalance.units?.mass?.label, "lb");
    assert.equal(storedWeightBalance.units?.volume?.label, "US gal");
    const wb = calculateWeightBalance(storedWeightBalance, {
      values: {
        pilot: 80 * (storedWeightBalance.units?.mass?.fromNormalized ?? 1),
        fuel: 40 * (storedWeightBalance.units?.volume?.fromNormalized ?? 1),
      },
      landingFuelValue: 10 * (storedWeightBalance.units?.volume?.fromNormalized ?? 1),
    });
    assert.equal(wb.status, "ready");
    assert.ok(Math.abs((wb.takeoff?.massKg ?? 0) - 508.8) < 1e-7);

    for (const absentDomain of ["limitations", "systems", "flows", "avionics", "knowledge", "abnormal", "learning", "normal-flight", "orientation", "reference-knowledge"] as const) {
      assert.equal(await repository.getPublishedModule(aircraftId, absentDomain), undefined, `${absentDomain} must stay absent for the sparse aircraft`);
    }
  } finally {
    await sql`DELETE FROM training_aircraft_types WHERE aircraft_id=${aircraftId}`;
  }
});
