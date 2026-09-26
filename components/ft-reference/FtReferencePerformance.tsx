"use client";

import { useMemo, useState } from "react";

import {
  getPerformanceSelectionState,
  performanceScalarKey,
  type PerformanceFilters,
} from "@/lib/performance-runtime";
import type {
  AircraftPerformanceContent,
  PerformanceAxis,
  PerformanceScalar,
} from "@/lib/universal-aircraft-content";

import styles from "./reference-performance.module.css";

function isNumericAxis(axis: PerformanceAxis): boolean {
  return axis.values.length > 0
    && axis.values.every((value) => typeof value === "number" && Number.isFinite(value));
}

function numericEnvelope(axis: PerformanceAxis): { min: number; max: number } | undefined {
  if (!isNumericAxis(axis)) return undefined;
  const values = axis.values as readonly number[];
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function scalarLabel(value: PerformanceScalar): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: Math.abs(value) < 10 ? 3 : 1,
  }).format(value);
}

function formatOutput(value: PerformanceScalar | undefined): string {
  if (value === undefined) return "—";
  return typeof value === "number" ? formatNumber(value) : scalarLabel(value);
}

function sourceKey(source: { manualId: string; section?: string; pageLabel?: string }): string {
  return [source.manualId, source.section, source.pageLabel].filter(Boolean).join(" · ");
}

export function FtReferencePerformance({
  content,
}: Readonly<{
  content: AircraftPerformanceContent;
}>) {
  const datasets = content.datasets;
  const [datasetId, setDatasetId] = useState(datasets[0]?.id ?? "");
  const [inputs, setInputs] = useState<Readonly<Record<string, string>>>({});

  const dataset = datasets.find((item) => item.id === datasetId) ?? datasets[0];

  const filters = useMemo<PerformanceFilters>(() => {
    if (!dataset) return {};

    const next: Record<string, string> = {};
    for (const axis of dataset.axes) {
      const raw = inputs[axis.key];
      if (!raw) continue;

      if (isNumericAxis(axis)) {
        const numeric = Number(raw);
        if (Number.isFinite(numeric)) {
          next[axis.key] = performanceScalarKey(numeric);
        }
      } else {
        next[axis.key] = raw;
      }
    }
    return next;
  }, [dataset, inputs]);

  const state = useMemo(
    () => dataset ? getPerformanceSelectionState(dataset, filters) : undefined,
    [dataset, filters],
  );

  if (!dataset || !state) return null;

  const allInputsPresent = state.missingAxisKeys.length === 0;
  const unavailable = allInputsPresent && !state.resultRow;
  const notes = dataset.notes ?? [];
  const sourceLines = [...new Set((dataset.sources ?? []).map(sourceKey))];

  return (
    <section
      className={styles.workspace}
      aria-labelledby="reference-performance-heading"
      data-ft-reference-performance="true"
    >
      <header className={styles.header}>
        <div>
          <p>EFB · REF</p>
          <h2 id="reference-performance-heading">Climb / cruise lookup</h2>
          <span>
            Enter current conditions for an exact or bounded interpolated reference result.
          </span>
        </div>
        <span className={styles.referenceOnly}>REFERENCE LOOKUP</span>
      </header>

      {datasets.length > 1 ? (
        <div className={styles.datasetPicker}>
          <label htmlFor="reference-performance-dataset">Regime</label>
          <select
            id="reference-performance-dataset"
            value={dataset.id}
            onChange={(event) => {
              setDatasetId(event.target.value);
              setInputs({});
            }}
          >
            {datasets.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className={styles.calculator}>
        <section className={styles.inputs} aria-label="Reference performance inputs">
          <div className={styles.sectionHeading}>
            <strong>Inputs</strong>
            <span>{dataset.title}</span>
          </div>

          <div className={styles.inputGrid}>
            {dataset.axes.map((axis) => {
              const numeric = isNumericAxis(axis);
              const envelope = numericEnvelope(axis);
              const inputId = `reference-performance-${dataset.id}-${axis.key}`;

              return (
                <label className={styles.field} htmlFor={inputId} key={axis.key}>
                  <span>
                    <strong>{axis.label}</strong>
                    {axis.unit ? <small>{axis.unit}</small> : null}
                  </span>

                  {numeric ? (
                    <input
                      id={inputId}
                      type="number"
                      inputMode="decimal"
                      step="any"
                      min={envelope?.min}
                      max={envelope?.max}
                      value={inputs[axis.key] ?? ""}
                      placeholder={envelope ? `${envelope.min}–${envelope.max}` : undefined}
                      onChange={(event) => {
                        const value = event.target.value;
                        setInputs((current) => ({
                          ...current,
                          [axis.key]: value,
                        }));
                      }}
                    />
                  ) : (
                    <select
                      id={inputId}
                      value={inputs[axis.key] ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        setInputs((current) => ({
                          ...current,
                          [axis.key]: value,
                        }));
                      }}
                    >
                      <option value="">Select</option>
                      {axis.values.map((value) => {
                        const key = performanceScalarKey(value);
                        return (
                          <option key={key} value={key}>
                            {scalarLabel(value)}
                          </option>
                        );
                      })}
                    </select>
                  )}

                  {envelope ? (
                    <small className={styles.envelope}>
                      Published envelope {formatNumber(envelope.min)}–{formatNumber(envelope.max)}{axis.unit ? ` ${axis.unit}` : ""}
                    </small>
                  ) : null}
                </label>
              );
            })}
          </div>
        </section>

        <section className={styles.results} aria-live="polite" aria-label="Reference performance result">
          <div className={styles.sectionHeading}>
            <strong>Result</strong>
            {state.resultKind ? (
              <span className={styles.resultKind}>
                {state.resultKind === "stored" ? "SOURCE ROW" : "INTERPOLATED"}
              </span>
            ) : null}
          </div>

          {!allInputsPresent ? (
            <div className={styles.emptyResult}>
              <strong>Enter all inputs.</strong>
              <span>
                {state.missingAxisKeys.length} field{state.missingAxisKeys.length === 1 ? "" : "s"} remaining.
              </span>
            </div>
          ) : unavailable ? (
            <div className={styles.unavailable}>
              <strong>Unavailable</strong>
              <span>
                The selected point is outside a complete published source region or crosses a blocked source boundary.
              </span>
            </div>
          ) : (
            <div className={styles.outputGrid}>
              {dataset.outputs.map((output) => (
                <div className={styles.output} key={output.key}>
                  <span>{output.label}</span>
                  <strong>
                    {formatOutput(state.resultRow?.outputs[output.key])}
                    {output.unit ? <small> {output.unit}</small> : null}
                  </strong>
                </div>
              ))}
            </div>
          )}

          {state.resultKind === "interpolated" ? (
            <p className={styles.interpolationNote}>
              Software-derived from {state.supportingRows.length} published supporting source row{state.supportingRows.length === 1 ? "" : "s"}. No extrapolation.
            </p>
          ) : null}
        </section>
      </div>

      <details className={styles.sourceDetails}>
        <summary>Source, effectivity & boundaries</summary>
        <div>
          {dataset.description ? <p>{dataset.description}</p> : null}
          {notes.length ? (
            <ul>
              {notes.filter(Boolean).map((note) => <li key={note}>{note}</li>)}
            </ul>
          ) : null}
          {sourceLines.length ? (
            <p className={styles.sources}>
              {sourceLines.map((source) => <span key={source}>{source}</span>)}
            </p>
          ) : null}
          {content.disclaimer ? <p className={styles.disclaimer}>{content.disclaimer}</p> : null}
        </div>
      </details>
    </section>
  );
}
