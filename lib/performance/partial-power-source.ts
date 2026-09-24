export const partialPowerThrustReverserConfigurations = [
  "none",
  "aeronca",
  "tr4000",
] as const;

export type PartialPowerThrustReverserConfiguration =
  typeof partialPowerThrustReverserConfigurations[number];

export type PartialPowerN1SourceCell = {
  readonly ambientTemperatureF: number;
  readonly assumedTemperatureF: number;
  readonly n1: number;
  /**
   * Source typography only. It deliberately carries no operational meaning
   * until the applicable AFM text defines that meaning.
   */
  readonly sourceStyle?: "parenthesized";
};

export type PartialPowerN1SourceExtract = {
  readonly schemaVersion: 1;
  readonly status: "source-extract-only";
  readonly id: string;
  readonly title: string;
  readonly configuration: {
    readonly thrustReversers: PartialPowerThrustReverserConfiguration;
    readonly label: string;
  };
  readonly source: {
    readonly manualId: string;
    readonly document: string;
    readonly pageLabel: string;
    readonly revision: string;
    readonly section: string;
    readonly title: string;
  };
  readonly axes: {
    readonly ambientTemperatureF: readonly number[];
    readonly assumedTemperatureF: readonly number[];
  };
  readonly output: {
    readonly key: "reducedN1";
    readonly unit: "%N1";
    readonly sourcePrecision: 0.1;
  };
  readonly cells: readonly PartialPowerN1SourceCell[];
  readonly constraints: {
    readonly antiIce: "OFF";
    readonly maxN1ReductionPct: number | null;
    readonly pressureAltitudeLimitFt: number | null;
    readonly operationalUseBlocked: true;
  };
  readonly notes: readonly string[];
};

type UnknownRecord = Record<string, unknown>;

const object = (value: unknown): value is UnknownRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const text = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const finiteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const finiteNumberArray = (value: unknown): value is number[] =>
  Array.isArray(value) && value.length > 0 && value.every(finiteNumber);

const unique = (values: readonly number[]): boolean =>
  new Set(values).size === values.length;

function isConfiguration(
  value: unknown,
): value is PartialPowerThrustReverserConfiguration {
  return typeof value === "string"
    && (partialPowerThrustReverserConfigurations as readonly string[]).includes(value);
}

/**
 * Validates source-extraction evidence only.
 *
 * Passing this validator does not make a dataset operational. The explicit
 * `source-extract-only` / `operationalUseBlocked` boundary is intentional
 * until source semantics and declared-distance dependencies are complete.
 */
export function validatePartialPowerN1SourceExtract(
  value: unknown,
): string[] {
  const errors: string[] = [];
  if (!object(value)) return ["source extract must be an object"];

  if (value.schemaVersion !== 1) errors.push("schemaVersion must equal 1");
  if (value.status !== "source-extract-only") {
    errors.push('status must equal "source-extract-only"');
  }
  if (!text(value.id)) errors.push("id is required");
  if (!text(value.title)) errors.push("title is required");

  const configuration = object(value.configuration) ? value.configuration : null;
  if (
    !configuration
    || !isConfiguration(configuration.thrustReversers)
    || !text(configuration.label)
  ) {
    errors.push("configuration must identify an explicit thrust-reverser schedule");
  }

  const source = object(value.source) ? value.source : null;
  if (
    !source
    || !text(source.manualId)
    || !text(source.document)
    || !text(source.pageLabel)
    || !text(source.revision)
    || !text(source.section)
    || !text(source.title)
  ) {
    errors.push("source provenance is incomplete");
  }

  const axes = object(value.axes) ? value.axes : null;
  const ambient = axes && finiteNumberArray(axes.ambientTemperatureF)
    ? axes.ambientTemperatureF
    : null;
  const assumed = axes && finiteNumberArray(axes.assumedTemperatureF)
    ? axes.assumedTemperatureF
    : null;
  if (!ambient || !assumed || !unique(ambient) || !unique(assumed)) {
    errors.push("temperature axes must be non-empty unique numeric arrays");
  }

  const output = object(value.output) ? value.output : null;
  if (
    !output
    || output.key !== "reducedN1"
    || output.unit !== "%N1"
    || output.sourcePrecision !== 0.1
  ) {
    errors.push("output must preserve the source reduced-N1 precision contract");
  }

  const constraints = object(value.constraints) ? value.constraints : null;
  if (
    !constraints
    || constraints.antiIce !== "OFF"
    || constraints.operationalUseBlocked !== true
    || (
      constraints.maxN1ReductionPct !== null
      && !finiteNumber(constraints.maxN1ReductionPct)
    )
    || (
      constraints.pressureAltitudeLimitFt !== null
      && !finiteNumber(constraints.pressureAltitudeLimitFt)
    )
  ) {
    errors.push("constraints do not match the source-extraction boundary");
  }

  if (!Array.isArray(value.notes) || value.notes.some((note) => !text(note))) {
    errors.push("notes must be an array of non-empty strings");
  }

  if (!Array.isArray(value.cells) || value.cells.length === 0) {
    errors.push("cells are required");
    return errors;
  }

  const coordinates = new Set<string>();
  value.cells.forEach((candidate, index) => {
    if (!object(candidate)) {
      errors.push(`cells[${index}] must be an object`);
      return;
    }

    const ambientTemperatureF = candidate.ambientTemperatureF;
    const assumedTemperatureF = candidate.assumedTemperatureF;
    const n1 = candidate.n1;
    if (
      !finiteNumber(ambientTemperatureF)
      || !finiteNumber(assumedTemperatureF)
      || !finiteNumber(n1)
    ) {
      errors.push(`cells[${index}] must contain finite numeric coordinates and N1`);
      return;
    }

    if (ambient && !ambient.includes(ambientTemperatureF)) {
      errors.push(`cells[${index}] ambient temperature is outside the declared axis`);
    }
    if (assumed && !assumed.includes(assumedTemperatureF)) {
      errors.push(`cells[${index}] assumed temperature is outside the declared axis`);
    }
    if (assumedTemperatureF < ambientTemperatureF) {
      errors.push(`cells[${index}] assumes a temperature below ambient`);
    }

    if (
      candidate.sourceStyle !== undefined
      && candidate.sourceStyle !== "parenthesized"
    ) {
      errors.push(`cells[${index}] has unsupported sourceStyle`);
    }

    const coordinate = `${ambientTemperatureF}:${assumedTemperatureF}`;
    if (coordinates.has(coordinate)) {
      errors.push(`cells[${index}] duplicates coordinate ${coordinate}`);
    }
    coordinates.add(coordinate);
  });

  return errors;
}
