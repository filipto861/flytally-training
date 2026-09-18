import type {
  PerformanceDataset,
  PerformancePhase,
  PerformanceRunwayDistanceGridCalculator,
} from "./universal-aircraft-content.ts";

const legacyGridKeys = {
  altitudeAxis: "airportAltitudeFt",
  isaDeviationAxis: "isaDeviationC",
  surfaceAxis: "surface",
  sourceTemperatureOutput: "oatC",
  groundRunOutput: "groundRunM",
  obstacleDistanceOutput: "distance50ftM",
} as const;

function hasAxis(dataset: PerformanceDataset, key: string): boolean {
  return dataset.axes.some((axis) => axis.key === key);
}

function hasOutput(dataset: PerformanceDataset, key: string): boolean {
  return dataset.outputs.some((output) => output.key === key);
}

function legacyRunwayGridOperation(dataset: PerformanceDataset): "takeoff" | "landing" | undefined {
  const identity = `${dataset.id} ${dataset.title}`.toLowerCase();
  if (/\btakeoff\b/.test(identity)) return "takeoff";
  if (/\blanding\b/.test(identity)) return "landing";
  return undefined;
}

function isLegacyRunwayDistanceGrid(dataset: PerformanceDataset): boolean {
  return hasAxis(dataset, legacyGridKeys.altitudeAxis)
    && hasAxis(dataset, legacyGridKeys.isaDeviationAxis)
    && hasAxis(dataset, legacyGridKeys.surfaceAxis)
    && hasOutput(dataset, legacyGridKeys.sourceTemperatureOutput)
    && hasOutput(dataset, legacyGridKeys.groundRunOutput)
    && hasOutput(dataset, legacyGridKeys.obstacleDistanceOutput)
    && Boolean(legacyRunwayGridOperation(dataset));
}

function outputUnit(dataset: PerformanceDataset, key: string): string | undefined {
  return dataset.outputs.find((output) => output.key === key)?.unit;
}

function axisUnit(dataset: PerformanceDataset, key: string): string | undefined {
  return dataset.axes.find((axis) => axis.key === key)?.unit;
}

function migratedRunwayGridCalculator(
  dataset: PerformanceDataset,
  operation: "takeoff" | "landing",
): PerformanceRunwayDistanceGridCalculator {
  const temperatureUnit = outputUnit(dataset, legacyGridKeys.sourceTemperatureOutput)
    ?? axisUnit(dataset, legacyGridKeys.isaDeviationAxis);
  const distanceUnit = outputUnit(dataset, legacyGridKeys.obstacleDistanceOutput)
    ?? outputUnit(dataset, legacyGridKeys.groundRunOutput);

  return {
    kind: "runway-distance-grid",
    operation,
    bindings: { ...legacyGridKeys },
    oatInput: {
      key: "outsideAirTemperature",
      label: "OAT",
      ...(temperatureUnit ? { unit: temperatureUnit } : {}),
    },
    runwayAvailableInput: {
      key: "runwayAvailable",
      label: operation === "takeoff" ? "Runway available / TORA" : "Runway available / LDA",
      ...(distanceUnit ? { unit: distanceUnit } : {}),
      optional: true,
    },
    obstacleHeight: { value: 50, unit: "ft" },
  };
}

/**
 * Temporary data-compatibility boundary for already-published pre-v3.1 runway
 * grids. New Studio content must publish calculator metadata explicitly.
 *
 * This adapter materializes the old structural convention into the same
 * declarative contract consumed by every new aircraft. It contains no aircraft
 * identity checks and never changes rows, interpolation policy or source data.
 */
export function materializeLegacyPerformanceContracts(
  datasets: readonly PerformanceDataset[],
): readonly PerformanceDataset[] {
  return datasets.map((dataset) => {
    if (dataset.calculator || !isLegacyRunwayDistanceGrid(dataset)) return dataset;
    const operation = legacyRunwayGridOperation(dataset);
    if (!operation) return dataset;
    return {
      ...dataset,
      phase: (dataset.phase ?? operation) as PerformancePhase,
      calculator: migratedRunwayGridCalculator(dataset, operation),
    };
  });
}
