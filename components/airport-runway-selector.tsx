"use client";

import { useEffect, useMemo, useState } from "react";

import {
  findAirport,
  loadAirportDataset,
  searchAirports,
} from "@/lib/aviation/airport-dataset";
import {
  availableRunwayEnds,
  resolveRunwayEnd,
} from "@/lib/aviation/runway-context";
import type {
  AirportDatasetV1,
  SelectedRunwayContext,
} from "@/lib/aviation/airport-types";

import styles from "./airport-runway-selector.module.css";

type LoadState = "loading" | "ready" | "error";

export function AirportRunwaySelector({
  dataset,
  onChange,
}: Readonly<{
  dataset?: AirportDatasetV1;
  onChange: (context: SelectedRunwayContext | undefined) => void;
}>) {
  const [loadedDataset, setLoadedDataset] = useState<AirportDatasetV1 | undefined>(dataset);
  const [loadState, setLoadState] = useState<LoadState>(dataset ? "ready" : "loading");
  const [query, setQuery] = useState("");
  const [runwayIdent, setRunwayIdent] = useState("");

  useEffect(() => {
    if (dataset) {
      setLoadedDataset(dataset);
      setLoadState("ready");
      return;
    }

    let active = true;
    setLoadState("loading");
    loadAirportDataset()
      .then((value) => {
        if (!active) return;
        setLoadedDataset(value);
        setLoadState("ready");
      })
      .catch(() => {
        if (!active) return;
        setLoadedDataset(undefined);
        setLoadState("error");
      });

    return () => {
      active = false;
    };
  }, [dataset]);

  const selectedAirport = useMemo(
    () => loadedDataset ? findAirport(loadedDataset, query) : undefined,
    [loadedDataset, query],
  );
  const suggestions = useMemo(
    () => loadedDataset ? searchAirports(loadedDataset, query, 12) : [],
    [loadedDataset, query],
  );
  const runwayOptions = useMemo(
    () => selectedAirport ? availableRunwayEnds(selectedAirport) : [],
    [selectedAirport],
  );
  const selectedRunway = runwayOptions.find((option) => option.ident === runwayIdent);

  const handleAirportChange = (value: string) => {
    setQuery(value.toUpperCase());
    setRunwayIdent("");
    onChange(undefined);
  };

  const handleRunwayChange = (value: string) => {
    setRunwayIdent(value);
    onChange(selectedAirport ? resolveRunwayEnd(selectedAirport, value) : undefined);
  };

  return (
    <section className={styles.selector} aria-label="Airport and runway context" data-airport-status={loadState}>
      <div className={styles.fields}>
        <label className={styles.field}>
          <span>Airport (ICAO)</span>
          <input
            aria-label="Airport ICAO"
            autoComplete="off"
            list="flytally-airport-options"
            maxLength={4}
            onChange={(event) => handleAirportChange(event.target.value)}
            placeholder="LKPR"
            value={query}
          />
          <datalist id="flytally-airport-options">
            {suggestions.map((airport) => (
              <option key={airport.icao} value={airport.icao}>
                {airport.name}{airport.municipality ? ` · ${airport.municipality}` : ""}
              </option>
            ))}
          </datalist>
          {selectedAirport ? (
            <small>{selectedAirport.name} · {selectedAirport.elevationFt.toLocaleString("en-US")} ft</small>
          ) : null}
        </label>

        <label className={styles.field}>
          <span>Runway</span>
          <select
            aria-label="Runway"
            disabled={!selectedAirport || !runwayOptions.length}
            onChange={(event) => handleRunwayChange(event.target.value)}
            value={runwayIdent}
          >
            <option value="">Select runway</option>
            {runwayOptions.map((option) => (
              <option key={`${option.runway.id}-${option.ident}`} value={option.ident}>
                {option.ident}
              </option>
            ))}
          </select>
          {selectedRunway ? (
            <small>
              {selectedRunway.runway.surface ?? "Surface n/a"} · {selectedRunway.runway.surfaceLengthFt.toLocaleString("en-US")} ft
              {selectedRunway.runway.widthFt ? ` × ${selectedRunway.runway.widthFt.toLocaleString("en-US")} ft` : ""}
            </small>
          ) : null}
        </label>
      </div>

      {loadState === "loading" ? <p className={styles.status}>Loading airport data…</p> : null}
      {loadState === "error" ? (
        <p className={styles.status} role="status">Airport data unavailable. Manual calculator inputs remain available.</p>
      ) : null}
    </section>
  );
}
