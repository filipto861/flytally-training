import type {
  AircraftPerformanceContent,
  TrainingSourceReference,
} from "../../lib/universal-aircraft-content.ts";
import type { AircraftWeightBalanceContent } from "../../lib/universal-weight-balance.ts";

export function buildV31AcceptancePerformance(
  aircraftId: string,
  source: TrainingSourceReference,
): AircraftPerformanceContent {
  return {
    aircraftId,
    title: "Acceptance Light SEP Performance",
    sourceNote: "Synthetic M2C content with deliberately non-reference-aircraft vocabulary.",
    datasets: [
      {
        id: "departure-penalties",
        title: "Departure penalties",
        description: "Synthetic exact-row correction factors used only by the disposable acceptance harness.",
        kind: "lookup-table",
        phase: "takeoff",
        calculator: {
          kind: "distance-factor",
          operation: "takeoff",
          baselineDistanceInput: { key: "chartDistance", label: "Chart distance", unit: "m" },
          runwayAvailableInput: { key: "tora", label: "TORA", unit: "m", optional: true },
          selector: {
            kind: "output-options",
            label: "Runway condition",
            lookupAxis: "massBand",
            baseline: { value: "clean", label: "Published baseline", fixedFactor: 1 },
            options: [{ value: "damp", label: "Damp", factorOutputKey: "dampPenalty" }],
          },
        },
        axes: [{ key: "massBand", label: "Mass band", unit: "kg", values: [1000, 1200] }],
        outputs: [{ key: "dampPenalty", label: "Damp factor" }],
        rows: [
          { inputs: { massBand: 1000 }, outputs: { dampPenalty: 1.1 } },
          { inputs: { massBand: 1200 }, outputs: { dampPenalty: 1.2 } },
        ],
        interpolation: "none",
        applicability: { variants: ["A"] },
        sources: [source],
      },
      {
        id: "arrival-surface-table",
        title: "Arrival surface table",
        kind: "lookup-table",
        phase: "landing",
        calculator: {
          kind: "distance-factor",
          operation: "landing",
          baselineDistanceInput: { key: "chartDistance", label: "Chart distance", unit: "m" },
          runwayAvailableInput: { key: "lda", label: "LDA", unit: "m", optional: true },
          selector: {
            kind: "axis",
            label: "Runway state",
            axisKey: "runwayCondition",
            factorOutput: "multiplier",
            baseline: { value: "normal", label: "Published baseline", fixedFactor: 1 },
          },
          constraints: [{
            when: { axisKey: "runwayCondition", values: ["ice"] },
            input: { key: "surfaceTemperature", label: "Surface temperature", unit: "°C" },
            operator: "lte",
            value: 5,
            message: "Ice factor is published only at or below 5°C.",
          }],
        },
        axes: [{ key: "runwayCondition", label: "Runway state", values: ["wet", "ice"] }],
        outputs: [{ key: "multiplier", label: "Distance multiplier" }],
        rows: [
          { inputs: { runwayCondition: "wet" }, outputs: { multiplier: 1.25 } },
          { inputs: { runwayCondition: "ice" }, outputs: { multiplier: 1.8 } },
        ],
        interpolation: "none",
        applicability: { variants: ["A"] },
        sources: [source],
      },
      {
        id: "arrival-reference-values",
        title: "Arrival reference values",
        kind: "lookup-table",
        phase: "landing",
        calculator: {
          kind: "metric-lookup",
          operation: "landing",
          axisKey: "landingMass",
          outputKeys: ["referenceVelocity", "approachVelocity"],
        },
        axes: [{ key: "landingMass", label: "Landing mass", unit: "kg", values: [900, 1000] }],
        outputs: [
          { key: "referenceVelocity", label: "Reference speed", unit: "KIAS" },
          { key: "approachVelocity", label: "Approach speed", unit: "KIAS" },
        ],
        rows: [
          { inputs: { landingMass: 900 }, outputs: { referenceVelocity: 70, approachVelocity: 75 } },
          { inputs: { landingMass: 1000 }, outputs: { referenceVelocity: 73, approachVelocity: 78 } },
        ],
        interpolation: "none",
        applicability: { variants: ["A"] },
        sources: [source],
      },
    ],
  };
}

export function buildV31AcceptanceWeightBalance(
  aircraftId: string,
  source: TrainingSourceReference,
): AircraftWeightBalanceContent {
  return {
    aircraftId,
    title: "Acceptance Weight & Balance",
    applicability: { variants: ["A"] },
    units: {
      mass: { label: "lb", fromNormalized: 2.2046226218, decimals: 0 },
      arm: { label: "in", fromNormalized: 0.03937007874, decimals: 1 },
      moment: { label: "lb·in", fromNormalized: 0.0867961662, decimals: 0 },
      volume: { label: "US gal", fromNormalized: 0.2641720524, decimals: 1 },
    },
    empty: {
      massKg: 400,
      armMm: 800,
      momentKgMm: 320000,
      sources: [source],
    },
    limits: {
      maxTakeoffMassKg: 600,
      maxLandingMassKg: 600,
      envelope: [
        { massKg: 400, forwardCgMm: 700, aftCgMm: 1000 },
        { massKg: 600, forwardCgMm: 700, aftCgMm: 1000 },
      ],
      sources: [source],
    },
    stations: [
      { id: "pilot", label: "Pilot", armMm: 900, input: "mass-kg", required: true, sources: [source] },
      { id: "fuel", label: "Fuel", armMm: 600, input: "fuel-litres", required: true, densityKgPerL: 0.72, maxVolumeL: 100, sources: [source] },
    ],
    fuelBurnStationId: "fuel",
    sourceNote: "Synthetic imperial-presentation acceptance data.",
  };
}
