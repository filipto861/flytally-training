"use client";

import { useMemo, useState } from "react";

import { calculateWeightBalance, formatWeightBalanceValue, normalizedToWeightBalanceDisplay, weightBalanceUnit } from "@/lib/weight-balance-calculator";
import type { AircraftWeightBalanceContent, WeightBalanceStation } from "@/lib/universal-weight-balance";
import type { TrainingSourceReference } from "@/lib/universal-aircraft-content";
import styles from "./weight-balance-calculator.module.css";

function numberFromInput(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function stationUnit(content: AircraftWeightBalanceContent, station: WeightBalanceStation): string {
  return weightBalanceUnit(content, station.input === "fuel-litres" ? "volume" : "mass").label;
}

function sourceLabel(source: TrainingSourceReference): string {
  return [source.section, source.pageLabel ? `p. ${source.pageLabel}` : undefined].filter(Boolean).join(" · ");
}

export function WeightBalanceCalculator({ content }: Readonly<{ content: AircraftWeightBalanceContent }>) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [landingFuel, setLandingFuel] = useState("");
  const fuelStation = content.fuelBurnStationId
    ? content.stations.find((station) => station.id === content.fuelBurnStationId)
    : undefined;

  const calculation = useMemo(() => calculateWeightBalance(content, {
    values: Object.fromEntries(content.stations.map((station) => [station.id, numberFromInput(values[station.id] ?? "")])),
    landingFuelValue: fuelStation ? numberFromInput(landingFuel) : undefined,
  }), [content, values, fuelStation, landingFuel]);

  const sourceReferences = useMemo(() => {
    const all = [
      ...content.empty.sources,
      ...content.limits.sources,
      ...content.stations.flatMap((station) => station.sources),
    ];
    const seen = new Set<string>();
    return all.filter((source) => {
      const key = `${source.manualId}|${source.chapter ?? ""}|${source.section ?? ""}|${source.pageLabel}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [content]);

  const updateStation = (id: string, value: string) => setValues((current) => ({ ...current, [id]: value }));
  const takeoff = calculation.takeoff;
  const landing = calculation.landing;
  const usefulLoad = content.limits.maxTakeoffMassKg - content.empty.massKg;
  const cgScaleLabel = content.limits.cgScale?.label;

  return (
    <section className={styles.wrapper} aria-label="Weight and balance calculator">
      <div className={styles.calculatorGrid}>
        <section className={styles.inputPanel}>
          <div className={styles.panelHeading}>
            <span>01</span>
            <div><h2>Loading</h2><p>Enter the actual planned loading for this aircraft configuration.</p></div>
          </div>

          <div className={styles.baseline}>
            <div><span>Empty mass</span><strong>{formatWeightBalanceValue(content, "mass", content.empty.massKg)}</strong></div>
            <div><span>Empty CG</span><strong>{formatWeightBalanceValue(content, "arm", content.empty.armMm)}</strong></div>
            <div><span>Useful load</span><strong>{formatWeightBalanceValue(content, "mass", usefulLoad)}</strong></div>
            <div><span>MTOW</span><strong>{formatWeightBalanceValue(content, "mass", content.limits.maxTakeoffMassKg)}</strong></div>
          </div>

          <div className={styles.fields}>
            {content.stations.map((station) => (
              <div className={styles.stationField} key={station.id}>
                <label>
                  <span>{station.label}</span>
                  <div className={styles.inputWithUnit}>
                    <input
                      inputMode="decimal"
                      min="0"
                      onChange={(event) => updateStation(station.id, event.target.value)}
                      placeholder={station.required ? "required" : "0"}
                      step="any"
                      type="number"
                      value={values[station.id] ?? ""}
                    />
                    <small>{stationUnit(content, station)}</small>
                  </div>
                </label>
                <p>
                  Arm {formatWeightBalanceValue(content, "arm", station.armMm)}
                  {station.minimumMassKg !== undefined ? ` · min ${formatWeightBalanceValue(content, "mass", station.minimumMassKg)}` : ""}
                  {station.maxMassKg !== undefined ? ` · max ${formatWeightBalanceValue(content, "mass", station.maxMassKg)}` : ""}
                  {station.maxVolumeL !== undefined ? ` · max ${formatWeightBalanceValue(content, "volume", station.maxVolumeL)}` : ""}
                </p>
              </div>
            ))}
            {fuelStation ? (
              <div className={`${styles.stationField} ${styles.landingFuel}`}>
                <label>
                  <span>{fuelStation.label} at landing</span>
                  <div className={styles.inputWithUnit}>
                    <input inputMode="decimal" min="0" onChange={(event) => setLandingFuel(event.target.value)} placeholder="required" step="any" type="number" value={landingFuel} />
                    <small>{stationUnit(content, fuelStation)}</small>
                  </div>
                </label>
                <p>Used to verify the CG after planned fuel burn.</p>
              </div>
            ) : null}
          </div>

          {fuelStation ? <div className={styles.warningBox}><strong>Check the landing CG too</strong><p>Fuel burn can move the centre of gravity. FlyTally therefore checks both the departure and planned landing state instead of validating takeoff only.</p></div> : null}
        </section>

        <aside className={styles.resultPanel}>
          <div className={styles.panelHeadingInverse}>
            <span>02</span>
            <div><h2>Loading result</h2><p>Mass, moment and CG against the published envelope.</p></div>
          </div>

          <div className={`${styles.status} ${calculation.status === "ready" ? styles.statusReady : calculation.status === "invalid" ? styles.statusAlert : ""}`}>
            <strong>{calculation.status === "ready" ? "Within published limits" : calculation.status === "invalid" ? "Loading not within limits" : "Waiting for loading"}</strong>
            <span>{calculation.status === "ready" ? "Takeoff and landing states satisfy the encoded mass and CG limits." : calculation.reason ?? "Complete the required fields."}</span>
          </div>

          <div className={styles.phaseGrid}>
            <section>
              <small>Takeoff</small>
              <strong>{formatWeightBalanceValue(content, "mass", takeoff?.massKg)}</strong>
              <dl>
                <div><dt>CG</dt><dd>{formatWeightBalanceValue(content, "arm", takeoff?.cgMm)}</dd></div>
                {cgScaleLabel ? <div><dt>{cgScaleLabel}</dt><dd>{takeoff?.cgDisplayValue === undefined ? "—" : `${takeoff.cgDisplayValue.toFixed(1)}%`}</dd></div> : null}
                <div><dt>Moment</dt><dd>{formatWeightBalanceValue(content, "moment", takeoff?.momentKgMm)}</dd></div>
                <div><dt>Envelope</dt><dd>{takeoff?.forwardLimitMm === undefined || takeoff.aftLimitMm === undefined ? "—" : `${formatWeightBalanceValue(content, "arm", takeoff.forwardLimitMm)}–${formatWeightBalanceValue(content, "arm", takeoff.aftLimitMm)}`}</dd></div>
              </dl>
            </section>
            {fuelStation ? <section>
              <small>Landing</small>
              <strong>{formatWeightBalanceValue(content, "mass", landing?.massKg)}</strong>
              <dl>
                <div><dt>CG</dt><dd>{formatWeightBalanceValue(content, "arm", landing?.cgMm)}</dd></div>
                {cgScaleLabel ? <div><dt>{cgScaleLabel}</dt><dd>{landing?.cgDisplayValue === undefined ? "—" : `${landing.cgDisplayValue.toFixed(1)}%`}</dd></div> : null}
                <div><dt>Moment</dt><dd>{formatWeightBalanceValue(content, "moment", landing?.momentKgMm)}</dd></div>
                <div><dt>CG shift</dt><dd>{calculation.cgShiftMm === undefined ? "—" : `${calculation.cgShiftMm >= 0 ? "+" : ""}${normalizedToWeightBalanceDisplay(content, "arm", calculation.cgShiftMm).toFixed(weightBalanceUnit(content, "arm").decimals ?? 1)} ${weightBalanceUnit(content, "arm").label}`}</dd></div>
              </dl>
            </section> : null}
          </div>

          {calculation.issues.length ? <ul className={styles.issues}>{calculation.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul> : null}
        </aside>
      </div>

      <details className={styles.sourceDetails}>
        <summary>Method & source boundary</summary>
        <div>
          <p>The calculator uses the published empty-aircraft moment and station arms. Each entered load contributes mass × arm; total CG is total moment ÷ total mass. No station arm or envelope limit is inferred from another aircraft.</p>
          {sourceReferences.map((source) => <p key={`${source.manualId}-${source.pageLabel}-${source.section ?? ""}`}><strong>{source.manualId}</strong><span>{sourceLabel(source)}</span></p>)}
          {content.sourceNote ? <p>{content.sourceNote}</p> : null}
          <p className={styles.disclaimer}>{content.disclaimer ?? "Training/planning aid only. Verify the current aircraft weight-and-balance records and applicable operating documentation before flight."}</p>
        </div>
      </details>
    </section>
  );
}
