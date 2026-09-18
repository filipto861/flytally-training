"use client";

import { useEffect, useMemo, useState } from "react";

import { materializeLegacyPerformanceContracts } from "@/lib/performance-contract-migration";
import {
  buildPerformanceCalculatorProfile,
  calculateLandingDistance,
  calculateTakeoffDistance,
  getLandingSpeeds,
  getLandingSurfaceOptions,
  getLandingWeights,
  getNativeGridSurfaceOptions,
  getTakeoffSurfaceOptions,
  getTakeoffWeights,
  type NativeDistanceCalculation,
} from "@/lib/performance-calculator";
import { calculateOperationalNativeDistanceGrid } from "@/lib/operational-performance-policy";
import { DeclarativePerformanceWorkspace } from "./declarative-performance-workspace";
import type { PerformanceDataset } from "@/lib/universal-aircraft-content";
import styles from "./operational-performance.module.css";

type Mode = "takeoff" | "landing";
type State = {
  mode: Mode;
  takeoffAltitudeFt: string;
  takeoffOatC: string;
  takeoffRunwayM: string;
  takeoffGridSurface: string;
  takeoffDry: string;
  takeoffRunway: string;
  takeoffWeight: string;
  takeoffSurface: string;
  landingAltitudeFt: string;
  landingOatC: string;
  landingRunwayM: string;
  landingGridSurface: string;
  landingDry: string;
  landingRunway: string;
  landingWeight: string;
  landingSurface: string;
};

const initialState = (mode: Mode): State => ({
  mode,
  takeoffAltitudeFt: "",
  takeoffOatC: "",
  takeoffRunwayM: "",
  takeoffGridSurface: "",
  takeoffDry: "",
  takeoffRunway: "",
  takeoffWeight: "",
  takeoffSurface: "dry",
  landingAltitudeFt: "",
  landingOatC: "",
  landingRunwayM: "",
  landingGridSurface: "",
  landingDry: "",
  landingRunway: "",
  landingWeight: "",
  landingSurface: "Dry",
});

function numberValue(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function meters(value: number | undefined): string { return value === undefined ? "—" : `${Math.round(value)} m`; }
function feet(value: number | undefined): string { return value === undefined ? "—" : `${Math.round(value)} ft`; }
function percent(value: number | undefined): string { return value === undefined ? "—" : `${Math.round(value)}%`; }
function calculationMethod(result: NativeDistanceCalculation): string {
  return result.method === "bounded-linear-interpolation" ? "Interpolated between published rows" : "Published table value";
}

function LegacyOperationalPerformance({
  aircraftId,
  datasets,
  selectedVariant,
}: Readonly<{
  aircraftId: string;
  datasets: readonly PerformanceDataset[];
  selectedVariant?: string;
}>) {
  const profile = useMemo(() => buildPerformanceCalculatorProfile(datasets), [datasets]);
  const hasTakeoff = Boolean(profile.takeoffGridDataset || profile.takeoffFactorDataset);
  const hasLanding = Boolean(profile.landingGridDataset || profile.landingFactorDataset || profile.landingSpeedDataset);
  const key = `flytally:flight-performance:v1:${aircraftId}:${selectedVariant ?? "common"}`;
  const [state, setState] = useState<State>(() => initialState(hasTakeoff ? "takeoff" : "landing"));
  const [hydrated, setHydrated] = useState(false);

  const set = (field: keyof State, value: string) => setState((current) => ({ ...current, [field]: value }));
  const setMode = (mode: Mode) => setState((current) => ({ ...current, mode }));

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const restored = JSON.parse(raw) as Partial<State>;
        const mode: Mode = restored.mode === "landing" || restored.mode === "takeoff" ? restored.mode : hasTakeoff ? "takeoff" : "landing";
        setState({ ...initialState(mode), ...restored, mode });
      }
    } catch {
      // Calculator remains usable without persistent storage.
    }
    setHydrated(true);
  }, [hasTakeoff, key]);

  useEffect(() => {
    if (!hydrated) return;
    try { window.localStorage.setItem(key, JSON.stringify(state)); } catch { /* keep calculator live */ }
  }, [hydrated, key, state]);

  const nativeTakeoffSurfaces = useMemo(() => getNativeGridSurfaceOptions(profile.takeoffGridDataset), [profile.takeoffGridDataset]);
  const nativeLandingSurfaces = useMemo(() => getNativeGridSurfaceOptions(profile.landingGridDataset), [profile.landingGridDataset]);
  const takeoffSurfaces = useMemo(() => getTakeoffSurfaceOptions(profile), [profile]);
  const takeoffWeights = useMemo(() => getTakeoffWeights(profile), [profile]);
  const landingSurfaces = useMemo(() => getLandingSurfaceOptions(profile), [profile]);
  const landingWeights = useMemo(() => getLandingWeights(profile), [profile]);

  const takeoffGridSurface = state.takeoffGridSurface || nativeTakeoffSurfaces[0] || "";
  const landingGridSurface = state.landingGridSurface || nativeLandingSurfaces[0] || "";

  const nativeTakeoff = useMemo(() => calculateOperationalNativeDistanceGrid(profile.takeoffGridDataset, {
    airportAltitudeFt: numberValue(state.takeoffAltitudeFt),
    oatC: numberValue(state.takeoffOatC),
    surface: takeoffGridSurface,
    runwayAvailableM: numberValue(state.takeoffRunwayM),
  }), [profile.takeoffGridDataset, state.takeoffAltitudeFt, state.takeoffOatC, state.takeoffRunwayM, takeoffGridSurface]);

  const nativeLanding = useMemo(() => calculateOperationalNativeDistanceGrid(profile.landingGridDataset, {
    airportAltitudeFt: numberValue(state.landingAltitudeFt),
    oatC: numberValue(state.landingOatC),
    surface: landingGridSurface,
    runwayAvailableM: numberValue(state.landingRunwayM),
  }), [profile.landingGridDataset, state.landingAltitudeFt, state.landingOatC, state.landingRunwayM, landingGridSurface]);

  const factorTakeoff = useMemo(() => calculateTakeoffDistance(profile, {
    dryDistance: numberValue(state.takeoffDry),
    runwayAvailable: numberValue(state.takeoffRunway),
    weight: numberValue(state.takeoffWeight),
    surface: state.takeoffSurface,
  }), [profile, state.takeoffDry, state.takeoffRunway, state.takeoffSurface, state.takeoffWeight]);

  const factorLanding = useMemo(() => calculateLandingDistance(profile, {
    dryDistance: numberValue(state.landingDry),
    runwayAvailable: numberValue(state.landingRunway),
    surface: state.landingSurface,
    oatC: numberValue(state.landingOatC),
  }), [profile, state.landingDry, state.landingOatC, state.landingRunway, state.landingSurface]);

  const landingSpeeds = useMemo(() => getLandingSpeeds(profile, numberValue(state.landingWeight)), [profile, state.landingWeight]);
  const mode = state.mode === "takeoff" && !hasTakeoff ? "landing" : state.mode === "landing" && !hasLanding ? "takeoff" : state.mode;
  const nativeMode = mode === "takeoff" ? Boolean(profile.takeoffGridDataset) : Boolean(profile.landingGridDataset);
  const temperatureLimitedLanding = state.landingSurface === "Compacted snow" || state.landingSurface === "Wet ice";

  return (
    <section className={styles.performance} aria-label="Operational performance">
      {hasTakeoff && hasLanding ? <div className={styles.modeSwitch} role="group" aria-label="Performance operation">
        <button aria-pressed={mode === "takeoff"} className={mode === "takeoff" ? styles.active : undefined} onClick={() => setMode("takeoff")} type="button">Takeoff</button>
        <button aria-pressed={mode === "landing"} className={mode === "landing" ? styles.active : undefined} onClick={() => setMode("landing")} type="button">Landing</button>
      </div> : null}

      {mode === "takeoff" && nativeMode ? <div className={styles.grid}>
        <section className={styles.inputs}>
          <h2>Takeoff</h2>
          <div className={styles.fields}>
            <label><span>Airport altitude</span><div><input inputMode="decimal" onChange={(event) => set("takeoffAltitudeFt", event.target.value)} type="number" value={state.takeoffAltitudeFt}/><small>ft</small></div></label>
            <label><span>OAT</span><div><input inputMode="decimal" onChange={(event) => set("takeoffOatC", event.target.value)} step="any" type="number" value={state.takeoffOatC}/><small>°C</small></div></label>
            <label><span>Surface</span><select onChange={(event) => set("takeoffGridSurface", event.target.value)} value={takeoffGridSurface}>{nativeTakeoffSurfaces.map((surface) => <option key={surface}>{surface}</option>)}</select></label>
            <label><span>Runway available</span><div><input inputMode="decimal" onChange={(event) => set("takeoffRunwayM", event.target.value)} type="number" value={state.takeoffRunwayM}/><small>m</small></div></label>
          </div>
        </section>
        <section className={`${styles.results} ${nativeTakeoff.withinRunway === false ? styles.alert : ""}`}>
          <h2>Result</h2>
          {nativeTakeoff.status === "ready" ? <>
            <div className={styles.primary}><span>50 ft distance</span><strong>{meters(nativeTakeoff.distance50ftM)}</strong></div>
            <div className={styles.method} aria-label="Calculation method">{calculationMethod(nativeTakeoff)}</div>
            <div className={styles.resultGrid}><div><span>Ground run</span><strong>{meters(nativeTakeoff.groundRunM)}</strong></div><div><span>Margin</span><strong>{meters(nativeTakeoff.distance50ftMarginM)}</strong></div><div><span>Runway used</span><strong>{percent(nativeTakeoff.distance50ftUsePercent)}</strong></div></div>
          </> : <strong className={styles.status}>{nativeTakeoff.reason ?? "Enter inputs"}</strong>}
        </section>
      </div> : null}

      {mode === "landing" && nativeMode ? <div className={styles.grid}>
        <section className={styles.inputs}>
          <h2>Landing</h2>
          <div className={styles.fields}>
            <label><span>Airport altitude</span><div><input inputMode="decimal" onChange={(event) => set("landingAltitudeFt", event.target.value)} type="number" value={state.landingAltitudeFt}/><small>ft</small></div></label>
            <label><span>OAT</span><div><input inputMode="decimal" onChange={(event) => set("landingOatC", event.target.value)} step="any" type="number" value={state.landingOatC}/><small>°C</small></div></label>
            <label><span>Surface</span><select onChange={(event) => set("landingGridSurface", event.target.value)} value={landingGridSurface}>{nativeLandingSurfaces.map((surface) => <option key={surface}>{surface}</option>)}</select></label>
            <label><span>Runway available</span><div><input inputMode="decimal" onChange={(event) => set("landingRunwayM", event.target.value)} type="number" value={state.landingRunwayM}/><small>m</small></div></label>
          </div>
        </section>
        <section className={`${styles.results} ${nativeLanding.withinRunway === false ? styles.alert : ""}`}>
          <h2>Result</h2>
          {nativeLanding.status === "ready" ? <>
            <div className={styles.primary}><span>50 ft distance</span><strong>{meters(nativeLanding.distance50ftM)}</strong></div>
            <div className={styles.method} aria-label="Calculation method">{calculationMethod(nativeLanding)}</div>
            <div className={styles.resultGrid}><div><span>Ground run</span><strong>{meters(nativeLanding.groundRunM)}</strong></div><div><span>Margin</span><strong>{meters(nativeLanding.distance50ftMarginM)}</strong></div><div><span>Runway used</span><strong>{percent(nativeLanding.distance50ftUsePercent)}</strong></div></div>
          </> : <strong className={styles.status}>{nativeLanding.reason ?? "Enter inputs"}</strong>}
        </section>
      </div> : null}

      {mode === "takeoff" && !nativeMode ? <div className={styles.grid}>
        <section className={styles.inputs}><h2>Takeoff</h2><div className={styles.fields}>
          <label><span>Dry distance</span><div><input inputMode="decimal" onChange={(event) => set("takeoffDry", event.target.value)} type="number" value={state.takeoffDry}/><small>ft</small></div></label>
          <label><span>Runway available</span><div><input inputMode="decimal" onChange={(event) => set("takeoffRunway", event.target.value)} type="number" value={state.takeoffRunway}/><small>ft</small></div></label>
          <label><span>Surface</span><select onChange={(event) => set("takeoffSurface", event.target.value)} value={state.takeoffSurface}>{takeoffSurfaces.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          {state.takeoffSurface !== "dry" && takeoffWeights.length ? <label><span>Weight</span><select onChange={(event) => set("takeoffWeight", event.target.value)} value={state.takeoffWeight}><option value="">Select</option>{takeoffWeights.map((weight) => <option key={weight} value={weight}>{weight} lb</option>)}</select></label> : null}
        </div></section>
        <section className={`${styles.results} ${factorTakeoff.withinRunway === false ? styles.alert : ""}`}><h2>Result</h2>{factorTakeoff.status === "ready" ? <><div className={styles.primary}><span>Takeoff distance</span><strong>{feet(factorTakeoff.correctedDistance)}</strong></div><div className={styles.resultGrid}><div><span>Factor</span><strong>{factorTakeoff.factor?.toFixed(2) ?? "—"}</strong></div><div><span>Margin</span><strong>{feet(factorTakeoff.margin)}</strong></div><div><span>Runway used</span><strong>{percent(factorTakeoff.runwayUsePercent)}</strong></div></div></> : <strong className={styles.status}>{factorTakeoff.reason ?? "Enter inputs"}</strong>}</section>
      </div> : null}

      {mode === "landing" && !nativeMode ? <div className={styles.grid}>
        <section className={styles.inputs}><h2>Landing</h2><div className={styles.fields}>
          <label><span>Dry distance</span><div><input inputMode="decimal" onChange={(event) => set("landingDry", event.target.value)} type="number" value={state.landingDry}/><small>ft</small></div></label>
          <label><span>Runway available</span><div><input inputMode="decimal" onChange={(event) => set("landingRunway", event.target.value)} type="number" value={state.landingRunway}/><small>ft</small></div></label>
          <label><span>Surface</span><select onChange={(event) => set("landingSurface", event.target.value)} value={state.landingSurface}>{landingSurfaces.map((surface) => <option key={surface}>{surface}</option>)}</select></label>
          {landingWeights.length ? <label><span>Weight</span><select onChange={(event) => set("landingWeight", event.target.value)} value={state.landingWeight}><option value="">Select</option>{landingWeights.map((weight) => <option key={weight} value={weight}>{weight} lb</option>)}</select></label> : null}
          {temperatureLimitedLanding ? <label><span>OAT</span><div><input inputMode="decimal" onChange={(event) => set("landingOatC", event.target.value)} step="any" type="number" value={state.landingOatC}/><small>°C</small></div></label> : null}
        </div></section>
        <section className={`${styles.results} ${factorLanding.withinRunway === false ? styles.alert : ""}`}><h2>Result</h2>{factorLanding.status === "ready" ? <><div className={styles.primary}><span>Landing distance</span><strong>{feet(factorLanding.correctedDistance)}</strong></div><div className={styles.resultGrid}><div><span>VREF</span><strong>{landingSpeeds?.vref === undefined ? "—" : `${landingSpeeds.vref} KIAS`}</strong></div><div><span>VAPP</span><strong>{landingSpeeds?.vapp === undefined ? "—" : `${landingSpeeds.vapp} KIAS`}</strong></div><div><span>Margin</span><strong>{feet(factorLanding.margin)}</strong></div></div></> : <strong className={styles.status}>{factorLanding.reason ?? "Enter inputs"}</strong>}</section>
      </div> : null}
    </section>
  );
}


export function OperationalPerformance({
  aircraftId,
  datasets,
  selectedVariant,
}: Readonly<{
  aircraftId: string;
  datasets: readonly PerformanceDataset[];
  selectedVariant?: string;
}>) {
  const runtimeDatasets = materializeLegacyPerformanceContracts(datasets);
  const hasDeclaredOperational = runtimeDatasets.some((dataset) =>
    dataset.calculator && (dataset.calculator.operation === "takeoff" || dataset.calculator.operation === "landing")
  );
  if (hasDeclaredOperational) {
    return <DeclarativePerformanceWorkspace datasets={runtimeDatasets} storageKey={`flytally:flight-performance:v2:${aircraftId}:${selectedVariant ?? "common"}`} />;
  }
  return <LegacyOperationalPerformance aircraftId={aircraftId} datasets={runtimeDatasets} selectedVariant={selectedVariant} />;
}
