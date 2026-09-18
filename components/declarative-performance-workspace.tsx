"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  calculateDistanceFactor,
  getMetricLookupResults,
  type DistanceCalculation,
  type MetricLookupResult,
  type NativeDistanceCalculation,
} from "@/lib/performance-calculator";
import { calculateOperationalNativeDistanceGrid } from "@/lib/operational-performance-policy";
import { performanceScalarFromKey, performanceScalarKey } from "@/lib/performance-runtime";
import type {
  PerformanceAxis,
  PerformanceCalculatorConstraint,
  PerformanceDataset,
  PerformanceDistanceFactorCalculator,
  PerformanceScalar,
} from "@/lib/universal-aircraft-content";
import styles from "./operational-performance.module.css";

type Operation = "takeoff" | "landing";
type PersistedState = {
  readonly mode?: Operation;
  readonly values?: Readonly<Record<string, string>>;
};

const numberValue = (value: string | undefined): number | undefined => {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const displayNumber = (value: number | undefined): string => {
  if (value === undefined) return "—";
  const rounded = Math.abs(value) >= 100 ? Math.round(value) : Number(value.toFixed(2));
  return rounded.toLocaleString("en-US");
};

const displayValue = (value: PerformanceScalar | undefined, unit?: string): string =>
  value === undefined ? "—" : `${typeof value === "number" ? displayNumber(value) : String(value)}${unit ? ` ${unit}` : ""}`;

const fieldKey = (dataset: PerformanceDataset, key: string): string => `${dataset.id}:${key}`;
const axis = (dataset: PerformanceDataset, key: string): PerformanceAxis | undefined => dataset.axes.find((candidate) => candidate.key === key);
const output = (dataset: PerformanceDataset, key: string) => dataset.outputs.find((candidate) => candidate.key === key);

function scalarOptions(source: PerformanceAxis | undefined): readonly { key: string; label: string }[] {
  return source?.values.map((value) => ({ key: performanceScalarKey(value), label: displayValue(value, source.unit) })) ?? [];
}

function selectedScalar(raw: string | undefined): PerformanceScalar | undefined {
  return raw ? performanceScalarFromKey(raw) : undefined;
}

function factorOptions(dataset: PerformanceDataset, calculator: PerformanceDistanceFactorCalculator): readonly { value: string; label: string }[] {
  const baseline = { value: calculator.selector.baseline.value, label: calculator.selector.baseline.label };
  if (calculator.selector.kind === "output-options") {
    return [baseline, ...calculator.selector.options.map((option) => ({ value: option.value, label: option.label }))];
  }
  const selectorAxis = axis(dataset, calculator.selector.axisKey);
  return [baseline, ...(selectorAxis?.values ?? []).map((value) => ({ value: String(value), label: displayValue(value, selectorAxis?.unit) }))];
}

function constraintApplies(
  constraint: PerformanceCalculatorConstraint,
  calculator: PerformanceDistanceFactorCalculator,
  selection: string,
  lookupValue: PerformanceScalar | undefined,
): boolean {
  if (!constraint.when) return true;
  if (constraint.when.selectorValues && !constraint.when.selectorValues.includes(selection)) return false;
  if (constraint.when.axisKey && constraint.when.values) {
    let actual: PerformanceScalar | undefined;
    if (calculator.selector.kind === "axis" && constraint.when.axisKey === calculator.selector.axisKey) actual = selection;
    if (calculator.selector.lookupAxis && constraint.when.axisKey === calculator.selector.lookupAxis) actual = lookupValue;
    if (actual === undefined || !constraint.when.values.some((candidate) => candidate === actual)) return false;
  }
  return true;
}

function uniqueApplicableConstraints(
  calculator: PerformanceDistanceFactorCalculator,
  selection: string,
  lookupValue: PerformanceScalar | undefined,
): readonly PerformanceCalculatorConstraint[] {
  const seen = new Set<string>();
  return (calculator.constraints ?? []).filter((constraint) => {
    if (!constraintApplies(constraint, calculator, selection, lookupValue) || seen.has(constraint.input.key)) return false;
    seen.add(constraint.input.key);
    return true;
  });
}

function Status({ calculation }: Readonly<{ calculation: DistanceCalculation | NativeDistanceCalculation }>) {
  if (calculation.status === "ready") return null;
  return <strong className={styles.status}>{calculation.reason ?? "Enter inputs"}</strong>;
}

export function DeclarativePerformanceWorkspace({
  datasets,
  storageKey,
}: Readonly<{
  datasets: readonly PerformanceDataset[];
  storageKey?: string;
}>) {
  const declared = useMemo(
    () => datasets.filter((dataset) => dataset.calculator && (dataset.calculator.operation === "takeoff" || dataset.calculator.operation === "landing")),
    [datasets],
  );
  const operations = useMemo(
    () => (["takeoff", "landing"] as const).filter((operation) => declared.some((dataset) => dataset.calculator?.operation === operation)),
    [declared],
  );
  const initialMode = operations[0] ?? "takeoff";
  const [mode, setMode] = useState<Operation>(initialMode);
  const [values, setValues] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(!storageKey);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const restored = JSON.parse(raw) as PersistedState;
        if (restored.mode && operations.includes(restored.mode)) setMode(restored.mode);
        if (restored.values && typeof restored.values === "object") setValues({ ...restored.values });
      }
    } catch {
      // Operational calculator remains available without storage.
    }
    setHydrated(true);
  }, [operations, storageKey]);

  useEffect(() => {
    if (!storageKey || !hydrated) return;
    try { window.localStorage.setItem(storageKey, JSON.stringify({ mode, values } satisfies PersistedState)); } catch { /* non-blocking */ }
  }, [hydrated, mode, storageKey, values]);

  const set = (dataset: PerformanceDataset, key: string, value: string) =>
    setValues((current) => ({ ...current, [fieldKey(dataset, key)]: value }));
  const get = (dataset: PerformanceDataset, key: string) => values[fieldKey(dataset, key)] ?? "";

  const gridDataset = declared.find((dataset) => dataset.calculator?.kind === "runway-distance-grid" && dataset.calculator.operation === mode);
  const factorDataset = declared.find((dataset) => dataset.calculator?.kind === "distance-factor" && dataset.calculator.operation === mode);
  const metricDataset = declared.find((dataset) => dataset.calculator?.kind === "metric-lookup" && dataset.calculator.operation === mode);

  let mainCalculation: DistanceCalculation | NativeDistanceCalculation | undefined;
  let mainLabel = "";
  let mainValue = "—";
  let secondaryResults: readonly { label: string; value: string }[] = [];
  let inputFields: ReactNode = null;

  if (gridDataset?.calculator?.kind === "runway-distance-grid") {
    const calculator = gridDataset.calculator;
    const altitudeAxis = axis(gridDataset, calculator.bindings.altitudeAxis);
    const surfaceAxis = axis(gridDataset, calculator.bindings.surfaceAxis);
    const deviationAxis = axis(gridDataset, calculator.bindings.isaDeviationAxis);
    const temperatureOutput = output(gridDataset, calculator.bindings.sourceTemperatureOutput);
    const groundRunOutput = output(gridDataset, calculator.bindings.groundRunOutput);
    const obstacleOutput = output(gridDataset, calculator.bindings.obstacleDistanceOutput);
    const surfaceOptions = surfaceAxis?.values.filter((value): value is string => typeof value === "string") ?? [];
    const selectedSurface = get(gridDataset, calculator.bindings.surfaceAxis) || surfaceOptions[0] || "";
    const calculation = calculateOperationalNativeDistanceGrid(gridDataset, {
      airportAltitudeFt: numberValue(get(gridDataset, calculator.bindings.altitudeAxis)),
      oatC: numberValue(get(gridDataset, calculator.oatInput.key)),
      surface: selectedSurface,
      runwayAvailableM: numberValue(get(gridDataset, calculator.runwayAvailableInput.key)),
    });
    mainCalculation = calculation;
    mainLabel = obstacleOutput?.label ?? "Obstacle distance";
    mainValue = displayValue(calculation.distance50ftM, obstacleOutput?.unit);
    secondaryResults = [
      { label: groundRunOutput?.label ?? "Ground run", value: displayValue(calculation.groundRunM, groundRunOutput?.unit) },
      { label: "Margin", value: displayValue(calculation.distance50ftMarginM, obstacleOutput?.unit) },
      { label: "Runway used", value: calculation.distance50ftUsePercent === undefined ? "—" : `${Math.round(calculation.distance50ftUsePercent)}%` },
      { label: deviationAxis?.label ?? "ISA deviation", value: displayValue(calculation.isaDeviationC, deviationAxis?.unit) },
      { label: temperatureOutput?.label ?? "Source temperature", value: displayValue(calculation.sourceIsaTemperatureC, temperatureOutput?.unit) },
      { label: "Method", value: calculation.method === "bounded-linear-interpolation" ? "Bounded interpolation" : calculation.method === "exact-source-row" ? "Published row" : "—" },
    ];
    inputFields = <>
      <label><span>{altitudeAxis?.label ?? "Altitude"}</span><div><input inputMode="decimal" onChange={(event) => set(gridDataset, calculator.bindings.altitudeAxis, event.target.value)} step="any" type="number" value={get(gridDataset, calculator.bindings.altitudeAxis)}/>{altitudeAxis?.unit ? <small>{altitudeAxis.unit}</small> : null}</div></label>
      <label><span>{calculator.oatInput.label}</span><div><input inputMode="decimal" onChange={(event) => set(gridDataset, calculator.oatInput.key, event.target.value)} step="any" type="number" value={get(gridDataset, calculator.oatInput.key)}/>{calculator.oatInput.unit ? <small>{calculator.oatInput.unit}</small> : null}</div></label>
      <label><span>{surfaceAxis?.label ?? "Surface"}</span><select onChange={(event) => set(gridDataset, calculator.bindings.surfaceAxis, event.target.value)} value={selectedSurface}>{surfaceOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <label><span>{calculator.runwayAvailableInput.label}</span><div><input inputMode="decimal" min="0" onChange={(event) => set(gridDataset, calculator.runwayAvailableInput.key, event.target.value)} placeholder={calculator.runwayAvailableInput.optional ? "optional" : undefined} step="any" type="number" value={get(gridDataset, calculator.runwayAvailableInput.key)}/>{calculator.runwayAvailableInput.unit ? <small>{calculator.runwayAvailableInput.unit}</small> : null}</div></label>
    </>;
  } else if (factorDataset?.calculator?.kind === "distance-factor") {
    const calculator = factorDataset.calculator;
    const options = factorOptions(factorDataset, calculator);
    const selection = get(factorDataset, "selector") || calculator.selector.baseline.value;
    const lookupAxisKey = calculator.selector.lookupAxis;
    const lookupAxis = lookupAxisKey ? axis(factorDataset, lookupAxisKey) : undefined;
    const lookupRaw = lookupAxisKey ? get(factorDataset, lookupAxisKey) : "";
    const lookupValue = selectedScalar(lookupRaw);
    const constraints = uniqueApplicableConstraints(calculator, selection, lookupValue);
    const constraintInputs = Object.fromEntries(constraints.map((constraint) => [constraint.input.key, numberValue(get(factorDataset, constraint.input.key))]));
    const calculation = calculateDistanceFactor(factorDataset, {
      baselineDistance: numberValue(get(factorDataset, calculator.baselineDistanceInput.key)),
      runwayAvailable: numberValue(get(factorDataset, calculator.runwayAvailableInput.key)),
      selection,
      lookupValue,
      constraintInputs,
    });
    mainCalculation = calculation;
    mainLabel = `Corrected ${calculator.baselineDistanceInput.label}`;
    mainValue = displayValue(calculation.correctedDistance, calculator.baselineDistanceInput.unit);
    secondaryResults = [
      { label: "Factor", value: calculation.factor === undefined ? "—" : `× ${Number(calculation.factor.toFixed(2))}` },
      { label: "Margin", value: displayValue(calculation.margin, calculator.runwayAvailableInput.unit ?? calculator.baselineDistanceInput.unit) },
      { label: "Runway used", value: calculation.runwayUsePercent === undefined ? "—" : `${Math.round(calculation.runwayUsePercent)}%` },
    ];
    inputFields = <>
      <label><span>{calculator.baselineDistanceInput.label}</span><div><input inputMode="decimal" min="0" onChange={(event) => set(factorDataset, calculator.baselineDistanceInput.key, event.target.value)} step="any" type="number" value={get(factorDataset, calculator.baselineDistanceInput.key)}/>{calculator.baselineDistanceInput.unit ? <small>{calculator.baselineDistanceInput.unit}</small> : null}</div></label>
      <label><span>{calculator.runwayAvailableInput.label}</span><div><input inputMode="decimal" min="0" onChange={(event) => set(factorDataset, calculator.runwayAvailableInput.key, event.target.value)} placeholder={calculator.runwayAvailableInput.optional ? "optional" : undefined} step="any" type="number" value={get(factorDataset, calculator.runwayAvailableInput.key)}/>{calculator.runwayAvailableInput.unit ? <small>{calculator.runwayAvailableInput.unit}</small> : null}</div></label>
      <label><span>{calculator.selector.label}</span><select onChange={(event) => set(factorDataset, "selector", event.target.value)} value={selection}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
      {lookupAxis && lookupAxisKey ? <label><span>{lookupAxis.label}</span><select onChange={(event) => set(factorDataset, lookupAxisKey, event.target.value)} value={lookupRaw}><option value="">Select…</option>{scalarOptions(lookupAxis).map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}</select></label> : null}
      {constraints.map((constraint) => <label key={constraint.input.key}><span>{constraint.input.label}</span><div><input inputMode="decimal" onChange={(event) => set(factorDataset, constraint.input.key, event.target.value)} step="any" type="number" value={get(factorDataset, constraint.input.key)}/>{constraint.input.unit ? <small>{constraint.input.unit}</small> : null}</div></label>)}
    </>;
  }

  let metricResults: readonly MetricLookupResult[] | undefined;
  let metricField: ReactNode = null;
  if (metricDataset?.calculator?.kind === "metric-lookup") {
    const metricAxis = axis(metricDataset, metricDataset.calculator.axisKey);
    const raw = get(metricDataset, metricDataset.calculator.axisKey);
    metricResults = getMetricLookupResults(metricDataset, selectedScalar(raw));
    metricField = metricAxis ? <label><span>{metricAxis.label}</span><select onChange={(event) => set(metricDataset, metricAxis.key, event.target.value)} value={raw}><option value="">Select…</option>{scalarOptions(metricAxis).map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}</select></label> : null;
  }

  if (!gridDataset && !factorDataset && !metricDataset) return null;

  return (
    <section className={styles.performance} aria-label="Declarative operational performance">
      {operations.length > 1 ? <div className={styles.modeSwitch} role="group" aria-label="Performance operation">
        {operations.map((operation) => <button aria-pressed={mode === operation} className={mode === operation ? styles.active : undefined} key={operation} onClick={() => setMode(operation)} type="button">{operation === "takeoff" ? "Takeoff" : "Landing"}</button>)}
      </div> : null}
      <div className={styles.grid}>
        <section className={styles.inputs}>
          <h2>{mode === "takeoff" ? "Takeoff" : "Landing"}</h2>
          <div className={styles.fields}>{inputFields}{metricField}</div>
        </section>
        <section className={`${styles.results} ${mainCalculation?.withinRunway === false ? styles.alert : ""}`}>
          <h2>Result</h2>
          {mainCalculation ? <Status calculation={mainCalculation} /> : null}
          {mainCalculation?.status === "ready" ? <>
            <div className={styles.primary}><span>{mainLabel}</span><strong>{mainValue}</strong></div>
            <div className={styles.resultGrid}>{secondaryResults.slice(0, 3).map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>
            {secondaryResults.length > 3 ? <div className={styles.resultGrid}>{secondaryResults.slice(3).map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div> : null}
          </> : null}
          {metricResults?.length ? <div className={styles.resultGrid}>{metricResults.map((metric) => <div key={metric.key}><span>{metric.label}</span><strong>{displayValue(metric.value, metric.unit)}</strong></div>)}</div> : null}
          {metricDataset && get(metricDataset, metricDataset.calculator?.kind === "metric-lookup" ? metricDataset.calculator.axisKey : "") && !metricResults ? <strong className={styles.status}>No exact source row exists for this selection. No interpolation is performed.</strong> : null}
        </section>
      </div>
    </section>
  );
}
