"use client";

import { useMemo, useState } from "react";

import { materializeLegacyPerformanceContracts } from "@/lib/performance-contract-migration";
import {
  buildPerformanceCalculatorProfile,
  calculateLandingDistance,
  calculateNativeDistanceGrid,
  calculateTakeoffDistance,
  getLandingSpeeds,
  getLandingSurfaceOptions,
  getLandingWeights,
  getNativeGridSurfaceOptions,
  getTakeoffSurfaceOptions,
  getTakeoffWeights,
  type DistanceCalculation,
  type NativeDistanceCalculation,
} from "@/lib/performance-calculator";
import type { PilotTakeoffCalculatorDefinition } from "@/lib/pilot-takeoff-calculator";
import type { PerformanceDataset, TrainingSourceReference } from "@/lib/universal-aircraft-content";
import { DeclarativePerformanceWorkspace } from "./declarative-performance-workspace";
import { PerformanceExplorer } from "./performance-explorer";
import { PilotTakeoffCalculator } from "./pilot-takeoff-calculator";
import styles from "./performance-calculator.module.css";

type Mode = "takeoff" | "landing";

function numberFromInput(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatDistance(value: number | undefined): string {
  if (value === undefined) return "—";
  return `${Math.round(value).toLocaleString("en-US")} ft`;
}

function formatMeters(value: number | undefined): string {
  if (value === undefined) return "—";
  return `${Math.round(value).toLocaleString("en-US")} m`;
}

function formatFactor(value: number | undefined): string {
  if (value === undefined) return "—";
  return `× ${Number(value.toFixed(2)).toString()}`;
}

function sourceLine(sources: readonly TrainingSourceReference[] | undefined): string | undefined {
  if (!sources?.length) return undefined;
  return sources.map((source) => [source.section, source.pageLabel ? `p. ${source.pageLabel}` : undefined].filter(Boolean).join(" · ")).join(" · ");
}

function ResultStatus({ calculation }: Readonly<{ calculation: DistanceCalculation }>) {
  if (calculation.status === "ready") {
    const runwayCopy = calculation.withinRunway === undefined
      ? "Enter available runway to see the margin."
      : calculation.withinRunway
        ? "Within the entered runway length."
        : "Exceeds the entered runway length.";
    return <div className={`${styles.status} ${calculation.withinRunway === false ? styles.statusAlert : styles.statusReady}`}><strong>Calculated</strong><span>{runwayCopy}</span></div>;
  }
  return <div className={`${styles.status} ${calculation.status === "unsupported" ? styles.statusAlert : ""}`}><strong>{calculation.status === "unsupported" ? "No source-backed result" : "Waiting for inputs"}</strong><span>{calculation.reason}</span></div>;
}

function DistanceResults({ calculation, label }: Readonly<{ calculation: DistanceCalculation; label: string }>) {
  return (
    <>
      <ResultStatus calculation={calculation} />
      <div className={styles.primaryResult}>
        <span>{label}</span>
        <strong>{formatDistance(calculation.correctedDistance)}</strong>
      </div>
      <div className={styles.resultGrid}>
        <div><span>Correction factor</span><strong>{formatFactor(calculation.factor)}</strong></div>
        <div><span>Runway margin</span><strong>{calculation.margin === undefined ? "—" : `${calculation.margin >= 0 ? "+" : ""}${formatDistance(calculation.margin)}`}</strong></div>
        <div><span>Runway used</span><strong>{calculation.runwayUsePercent === undefined ? "—" : `${Math.round(calculation.runwayUsePercent)}%`}</strong></div>
      </div>
    </>
  );
}

function NativeResultStatus({ calculation }: Readonly<{ calculation: NativeDistanceCalculation }>) {
  if (calculation.status === "ready") {
    const runwayCopy = calculation.withinRunway === undefined
      ? "Enter available runway to see the 50 ft distance margin."
      : calculation.withinRunway
        ? "50 ft distance is within the entered runway length."
        : "50 ft distance exceeds the entered runway length.";
    return <div className={`${styles.status} ${calculation.withinRunway === false ? styles.statusAlert : styles.statusReady}`}><strong>Calculated from published grid</strong><span>{runwayCopy}</span></div>;
  }
  return <div className={`${styles.status} ${calculation.status === "unsupported" ? styles.statusAlert : ""}`}><strong>{calculation.status === "unsupported" ? "Outside source envelope" : "Waiting for inputs"}</strong><span>{calculation.reason}</span></div>;
}

function NativeDistanceResults({ calculation, operation }: Readonly<{ calculation: NativeDistanceCalculation; operation: "Takeoff" | "Landing" }>) {
  const method = calculation.method === "exact-source-row"
    ? "Exact source row"
    : calculation.method === "bounded-linear-interpolation"
      ? "Bounded interpolation"
      : "—";
  return (
    <>
      <NativeResultStatus calculation={calculation} />
      <div className={styles.primaryResult}>
        <span>{operation} distance over 50 ft</span>
        <strong>{formatMeters(calculation.distance50ftM)}</strong>
      </div>
      <div className={styles.resultGrid}>
        <div><span>Ground run</span><strong>{formatMeters(calculation.groundRunM)}</strong></div>
        <div><span>50 ft margin</span><strong>{calculation.distance50ftMarginM === undefined ? "—" : `${calculation.distance50ftMarginM >= 0 ? "+" : ""}${formatMeters(calculation.distance50ftMarginM)}`}</strong></div>
        <div><span>Runway used</span><strong>{calculation.distance50ftUsePercent === undefined ? "—" : `${Math.round(calculation.distance50ftUsePercent)}%`}</strong></div>
      </div>
      <div className={styles.resultGrid}>
        <div><span>ISA deviation</span><strong>{calculation.isaDeviationC === undefined ? "—" : `${calculation.isaDeviationC >= 0 ? "+" : ""}${calculation.isaDeviationC.toFixed(1)}°C`}</strong></div>
        <div><span>Source ISA temp</span><strong>{calculation.sourceIsaTemperatureC === undefined ? "—" : `${calculation.sourceIsaTemperatureC.toFixed(1)}°C`}</strong></div>
        <div><span>Method</span><strong>{method}</strong></div>
      </div>
    </>
  );
}

function LegacyPerformanceCalculator({
  datasets,
  disclaimer,
}: Readonly<{
  datasets: readonly PerformanceDataset[];
  disclaimer?: string;
}>) {
  const profile = useMemo(() => buildPerformanceCalculatorProfile(datasets), [datasets]);
  const takeoffSurfaces = useMemo(() => getTakeoffSurfaceOptions(profile), [profile]);
  const takeoffWeights = useMemo(() => getTakeoffWeights(profile), [profile]);
  const landingSurfaces = useMemo(() => getLandingSurfaceOptions(profile), [profile]);
  const landingWeights = useMemo(() => getLandingWeights(profile), [profile]);
  const nativeTakeoffSurfaces = useMemo(() => getNativeGridSurfaceOptions(profile.takeoffGridDataset), [profile]);
  const nativeLandingSurfaces = useMemo(() => getNativeGridSurfaceOptions(profile.landingGridDataset), [profile]);

  const [mode, setMode] = useState<Mode>("takeoff");
  const [takeoffDry, setTakeoffDry] = useState("");
  const [takeoffRunway, setTakeoffRunway] = useState("");
  const [takeoffWeight, setTakeoffWeight] = useState("");
  const [takeoffSurface, setTakeoffSurface] = useState("dry");
  const [landingDry, setLandingDry] = useState("");
  const [landingRunway, setLandingRunway] = useState("");
  const [landingWeight, setLandingWeight] = useState("");
  const [landingSurface, setLandingSurface] = useState("Dry");
  const [landingOat, setLandingOat] = useState("");

  const [takeoffAltitudeFt, setTakeoffAltitudeFt] = useState("");
  const [takeoffOatC, setTakeoffOatC] = useState("");
  const [takeoffRunwayM, setTakeoffRunwayM] = useState("");
  const [takeoffGridSurface, setTakeoffGridSurface] = useState("");
  const [landingAltitudeFt, setLandingAltitudeFt] = useState("");
  const [landingGridOatC, setLandingGridOatC] = useState("");
  const [landingRunwayM, setLandingRunwayM] = useState("");
  const [landingGridSurface, setLandingGridSurface] = useState("");

  const selectedTakeoffGridSurface = takeoffGridSurface || nativeTakeoffSurfaces[0] || "";
  const selectedLandingGridSurface = landingGridSurface || nativeLandingSurfaces[0] || "";

  const nativeTakeoffCalculation = useMemo(() => calculateNativeDistanceGrid(profile.takeoffGridDataset, {
    airportAltitudeFt: numberFromInput(takeoffAltitudeFt),
    oatC: numberFromInput(takeoffOatC),
    surface: selectedTakeoffGridSurface,
    runwayAvailableM: numberFromInput(takeoffRunwayM),
  }), [profile.takeoffGridDataset, takeoffAltitudeFt, takeoffOatC, selectedTakeoffGridSurface, takeoffRunwayM]);

  const nativeLandingCalculation = useMemo(() => calculateNativeDistanceGrid(profile.landingGridDataset, {
    airportAltitudeFt: numberFromInput(landingAltitudeFt),
    oatC: numberFromInput(landingGridOatC),
    surface: selectedLandingGridSurface,
    runwayAvailableM: numberFromInput(landingRunwayM),
  }), [profile.landingGridDataset, landingAltitudeFt, landingGridOatC, selectedLandingGridSurface, landingRunwayM]);

  const takeoffCalculation = useMemo(() => calculateTakeoffDistance(profile, {
    dryDistance: numberFromInput(takeoffDry),
    runwayAvailable: numberFromInput(takeoffRunway),
    weight: numberFromInput(takeoffWeight),
    surface: takeoffSurface,
  }), [profile, takeoffDry, takeoffRunway, takeoffWeight, takeoffSurface]);

  const landingCalculation = useMemo(() => calculateLandingDistance(profile, {
    dryDistance: numberFromInput(landingDry),
    runwayAvailable: numberFromInput(landingRunway),
    surface: landingSurface,
    oatC: numberFromInput(landingOat),
  }), [profile, landingDry, landingRunway, landingSurface, landingOat]);

  const landingSpeeds = useMemo(() => getLandingSpeeds(profile, numberFromInput(landingWeight)), [profile, landingWeight]);
  const temperatureLimitedLanding = landingSurface === "Compacted snow" || landingSurface === "Wet ice";
  const nativeTakeoff = Boolean(profile.takeoffGridDataset);
  const nativeLanding = Boolean(profile.landingGridDataset);
  const activeSourceDatasets = mode === "takeoff"
    ? (nativeTakeoff ? [profile.takeoffGridDataset] : [profile.takeoffFactorDataset]).filter((dataset): dataset is PerformanceDataset => Boolean(dataset))
    : (nativeLanding ? [profile.landingGridDataset] : [profile.landingFactorDataset, profile.landingSpeedDataset]).filter((dataset): dataset is PerformanceDataset => Boolean(dataset));

  return (
    <section className={styles.wrapper} aria-label="Performance calculator">
      <div className={styles.modeSwitch} role="group" aria-label="Performance operation">
        <button aria-pressed={mode === "takeoff"} className={mode === "takeoff" ? styles.modeActive : undefined} onClick={() => setMode("takeoff")} type="button">Takeoff</button>
        <button aria-pressed={mode === "landing"} className={mode === "landing" ? styles.modeActive : undefined} onClick={() => setMode("landing")} type="button">Landing</button>
      </div>

      {mode === "takeoff" && nativeTakeoff ? (
        <div className={styles.calculatorGrid}>
          <section className={styles.inputPanel}>
            <div className={styles.panelHeading}><span>01</span><div><h2>Takeoff inputs</h2><p>Enter the conditions used by the published performance grid.</p></div></div>
            <div className={styles.fields}>
              <label><span>Airport altitude</span><div className={styles.inputWithUnit}><input inputMode="decimal" min="0" onChange={(event) => setTakeoffAltitudeFt(event.target.value)} placeholder="0–10,000" type="number" value={takeoffAltitudeFt}/><small>ft</small></div></label>
              <label><span>OAT</span><div className={styles.inputWithUnit}><input inputMode="decimal" onChange={(event) => setTakeoffOatC(event.target.value)} placeholder="°C" step="any" type="number" value={takeoffOatC}/><small>°C</small></div></label>
              <label><span>Runway surface</span><select onChange={(event) => setTakeoffGridSurface(event.target.value)} value={selectedTakeoffGridSurface}>{nativeTakeoffSurfaces.map((surface) => <option key={surface} value={surface}>{surface}</option>)}</select></label>
              <label><span>Runway available</span><div className={styles.inputWithUnit}><input inputMode="decimal" min="0" onChange={(event) => setTakeoffRunwayM(event.target.value)} placeholder="optional" type="number" value={takeoffRunwayM}/><small>m</small></div></label>
            </div>
            <div className={styles.boundary}><strong>Published-table envelope</strong><p>Altitude and OAT are converted to the ISA deviation represented by the source table. Exact rows are used directly; between published rows FlyTally performs bounded linear interpolation only because this dataset explicitly enables it. It never extrapolates beyond the table.</p></div>
          </section>
          <aside className={styles.resultPanel}>
            <div className={styles.panelHeadingInverse}><span>02</span><div><h2>Takeoff result</h2><p>Ground run and 50 ft obstacle distance from the published grid</p></div></div>
            <NativeDistanceResults calculation={nativeTakeoffCalculation} operation="Takeoff" />
          </aside>
        </div>
      ) : mode === "takeoff" ? (
        <div className={styles.calculatorGrid}>
          <section className={styles.inputPanel}>
            <div className={styles.panelHeading}><span>01</span><div><h2>Takeoff inputs</h2><p>Start with the corrected dry field length from the controlling chart.</p></div></div>
            <div className={styles.fields}>
              <label><span>Dry takeoff field length</span><div className={styles.inputWithUnit}><input inputMode="decimal" min="0" onChange={(event) => setTakeoffDry(event.target.value)} placeholder="e.g. 3800" type="number" value={takeoffDry}/><small>ft</small></div></label>
              <label><span>Available runway / TORA</span><div className={styles.inputWithUnit}><input inputMode="decimal" min="0" onChange={(event) => setTakeoffRunway(event.target.value)} placeholder="optional" type="number" value={takeoffRunway}/><small>ft</small></div></label>
              {takeoffSurfaces.length > 1 ? <label className={styles.wideField}><span>Runway condition / takeoff configuration</span><select onChange={(event) => setTakeoffSurface(event.target.value)} value={takeoffSurface}>{takeoffSurfaces.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label> : null}
              {takeoffSurface !== "dry" && takeoffWeights.length ? <label className={styles.wideField}><span>Takeoff weight · exact source row</span><select onChange={(event) => setTakeoffWeight(event.target.value)} value={takeoffWeight}><option value="">Select weight…</option>{takeoffWeights.map((weight) => <option key={weight} value={weight}>{weight.toLocaleString("en-US")} lb</option>)}</select></label> : null}
            </div>
            <div className={styles.boundary}><strong>Dry baseline first</strong><p>FlyTally does not reconstruct a missing AFM takeoff chart. Enter the dry field length obtained from the applicable approved/source chart; only the encoded correction factor is applied here.</p></div>
          </section>
          <aside className={styles.resultPanel}>
            <div className={styles.panelHeadingInverse}><span>02</span><div><h2>Takeoff result</h2><p>Source factor × entered dry field length</p></div></div>
            <DistanceResults calculation={takeoffCalculation} label="Corrected takeoff field length" />
          </aside>
        </div>
      ) : nativeLanding ? (
        <div className={styles.calculatorGrid}>
          <section className={styles.inputPanel}>
            <div className={styles.panelHeading}><span>01</span><div><h2>Landing inputs</h2><p>Enter the conditions used by the published landing grid.</p></div></div>
            <div className={styles.fields}>
              <label><span>Airport altitude</span><div className={styles.inputWithUnit}><input inputMode="decimal" min="0" onChange={(event) => setLandingAltitudeFt(event.target.value)} placeholder="0–10,000" type="number" value={landingAltitudeFt}/><small>ft</small></div></label>
              <label><span>OAT</span><div className={styles.inputWithUnit}><input inputMode="decimal" onChange={(event) => setLandingGridOatC(event.target.value)} placeholder="°C" step="any" type="number" value={landingGridOatC}/><small>°C</small></div></label>
              <label><span>Runway surface</span><select onChange={(event) => setLandingGridSurface(event.target.value)} value={selectedLandingGridSurface}>{nativeLandingSurfaces.map((surface) => <option key={surface} value={surface}>{surface}</option>)}</select></label>
              <label><span>Runway available / LDA</span><div className={styles.inputWithUnit}><input inputMode="decimal" min="0" onChange={(event) => setLandingRunwayM(event.target.value)} placeholder="optional" type="number" value={landingRunwayM}/><small>m</small></div></label>
            </div>
            <div className={styles.boundary}><strong>Published-table envelope</strong><p>The result uses the source grid at the entered altitude and OAT. No weight, wind, slope or runway-condition correction is invented when the source dataset does not provide one.</p></div>
          </section>
          <aside className={styles.resultPanel}>
            <div className={styles.panelHeadingInverse}><span>02</span><div><h2>Landing result</h2><p>Ground run and 50 ft obstacle distance from the published grid</p></div></div>
            <NativeDistanceResults calculation={nativeLandingCalculation} operation="Landing" />
          </aside>
        </div>
      ) : (
        <div className={styles.calculatorGrid}>
          <section className={styles.inputPanel}>
            <div className={styles.panelHeading}><span>01</span><div><h2>Landing inputs</h2><p>Use the applicable dry landing-distance chart as the starting point.</p></div></div>
            <div className={styles.fields}>
              <label><span>Dry landing distance</span><div className={styles.inputWithUnit}><input inputMode="decimal" min="0" onChange={(event) => setLandingDry(event.target.value)} placeholder="e.g. 3000" type="number" value={landingDry}/><small>ft</small></div></label>
              <label><span>Landing distance available / LDA</span><div className={styles.inputWithUnit}><input inputMode="decimal" min="0" onChange={(event) => setLandingRunway(event.target.value)} placeholder="optional" type="number" value={landingRunway}/><small>ft</small></div></label>
              {landingSurfaces.length > 1 ? <label><span>Runway surface</span><select onChange={(event) => setLandingSurface(event.target.value)} value={landingSurface}>{landingSurfaces.map((surface) => <option key={surface} value={surface}>{surface}</option>)}</select></label> : null}
              {landingWeights.length ? <label><span>Landing weight · VREF/VAPP</span><select onChange={(event) => setLandingWeight(event.target.value)} value={landingWeight}><option value="">Select weight…</option>{landingWeights.map((weight) => <option key={weight} value={weight}>{weight.toLocaleString("en-US")} lb</option>)}</select></label> : null}
              {temperatureLimitedLanding ? <label className={styles.wideField}><span>OAT · required for this surface</span><div className={styles.inputWithUnit}><input inputMode="decimal" onChange={(event) => setLandingOat(event.target.value)} placeholder="≤ 4.4" step="any" type="number" value={landingOat}/><small>°C</small></div></label> : null}
            </div>
            <div className={styles.boundary}><strong>Chart-derived baseline</strong><p>The entered dry distance must already include the applicable altitude, temperature, weight, wind, gradient and aircraft-configuration chart work. FlyTally applies only the published surface factor stored in the training data.</p></div>
          </section>
          <aside className={styles.resultPanel}>
            <div className={styles.panelHeadingInverse}><span>02</span><div><h2>Landing result</h2><p>Distance correction and exact stored landing speeds</p></div></div>
            <DistanceResults calculation={landingCalculation} label="Corrected landing distance" />
            <div className={styles.speedResults}>
              <div><span>VREF</span><strong>{landingSpeeds?.vref === undefined ? "—" : `${landingSpeeds.vref} KIAS`}</strong></div>
              <div><span>VAPP</span><strong>{landingSpeeds?.vapp === undefined ? "—" : `${landingSpeeds.vapp} KIAS`}</strong></div>
            </div>
            {landingWeight && !landingSpeeds ? <p className={styles.inlineWarning}>No exact VREF/VAPP source row exists for this selected weight; no interpolation is performed.</p> : null}
          </aside>
        </div>
      )}

      <details className={styles.methodDetails}>
        <summary>Calculation method & sources</summary>
        <div className={styles.methodBody}>
          {((mode === "takeoff" && nativeTakeoff) || (mode === "landing" && nativeLanding))
            ? <p><strong>Published grid first.</strong> Exact source rows are used unchanged. Inputs between rows are interpolated only inside a dataset marked for bounded linear interpolation; FlyTally never extrapolates outside the published altitude/temperature envelope. The source manual does not explicitly prescribe an interpolation method, so interpolated results are identified as software interpolation.</p>
            : <p><strong>No hidden extrapolation.</strong> Correction factors and landing speeds are accepted only from exact stored source rows. The dry baseline is entered by the pilot because the complete source chart grid is not encoded in FlyTally.</p>}
          {activeSourceDatasets.map((dataset) => <div className={styles.sourceItem} key={dataset.id}><strong>{dataset.title}</strong>{sourceLine(dataset.sources) ? <span>{sourceLine(dataset.sources)}</span> : null}{dataset.notes?.length ? <ul>{dataset.notes.map((note) => <li key={note}>{note}</li>)}</ul> : null}</div>)}
          {disclaimer ? <p className={styles.disclaimer}>{disclaimer}</p> : <p className={styles.disclaimer}>Training aid only. Verify performance using the applicable approved aircraft/operator documentation.</p>}
        </div>
      </details>

      <details className={styles.referenceDrawer}>
        <summary>Reference data & other performance tables</summary>
        <div className={styles.referenceBody}><PerformanceExplorer datasets={datasets} /></div>
      </details>
    </section>
  );
}


export function PerformanceCalculator({
  datasets,
  disclaimer,
  takeoffCalculator,
}: Readonly<{
  datasets: readonly PerformanceDataset[];
  disclaimer?: string;
  takeoffCalculator?: PilotTakeoffCalculatorDefinition;
}>) {
  const runtimeDatasets = materializeLegacyPerformanceContracts(datasets);
  const hasDeclaredOperational = runtimeDatasets.some((dataset) =>
    dataset.calculator && (dataset.calculator.operation === "takeoff" || dataset.calculator.operation === "landing")
  );
  if (!hasDeclaredOperational && !takeoffCalculator) {
    return <LegacyPerformanceCalculator datasets={runtimeDatasets} disclaimer={disclaimer} />;
  }

  const declared = runtimeDatasets.filter((dataset) =>
    dataset.calculator && (dataset.calculator.operation === "takeoff" || dataset.calculator.operation === "landing")
  );
  return (
    <section className={styles.wrapper} aria-label="Performance calculator">
      {takeoffCalculator ? <PilotTakeoffCalculator datasets={runtimeDatasets} definition={takeoffCalculator} /> : null}
      <DeclarativePerformanceWorkspace datasets={declared} />
      <details className={styles.methodDetails}>
        <summary>Calculation method & sources</summary>
        <div className={styles.methodBody}>
          <p><strong>Declarative calculator contract.</strong> Input labels, units, calculator bindings, exact lookup rules and constraints come from the active source-backed datasets. Interpolation is used only where a dataset explicitly permits bounded interpolation; extrapolation is never performed.</p>
          {declared.map((dataset) => <div className={styles.sourceItem} key={dataset.id}><strong>{dataset.title}</strong>{sourceLine(dataset.sources) ? <span>{sourceLine(dataset.sources)}</span> : null}{dataset.notes?.length ? <ul>{dataset.notes.map((note) => <li key={note}>{note}</li>)}</ul> : null}</div>)}
          <p className={styles.disclaimer}>{disclaimer ?? "Training aid only. Verify performance using the applicable approved aircraft/operator documentation."}</p>
        </div>
      </details>
      <details className={styles.referenceDrawer}>
        <summary>Reference data & other performance tables</summary>
        <div className={styles.referenceBody}><PerformanceExplorer datasets={datasets} /></div>
      </details>
    </section>
  );
}
