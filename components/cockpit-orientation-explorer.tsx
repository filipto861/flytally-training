"use client";

import { useMemo, useState } from "react";

import type {
  CockpitControlLocation,
  CockpitOrientation,
  CockpitRegionId,
} from "@/lib/cockpit-orientation";
import styles from "./cockpit-orientation-explorer.module.css";

export function CockpitOrientationExplorer({
  orientation,
  initialControlId,
}: Readonly<{ orientation: CockpitOrientation; initialControlId?: string }>) {
  const initialControl = orientation.controls.find((control) => control.id === initialControlId);
  const [activeRegion, setActiveRegion] = useState<CockpitRegionId>(initialControl?.regionId ?? "center-switch");
  const [activeControlId, setActiveControlId] = useState<string | undefined>(initialControl?.id);

  const controls = useMemo(
    () => orientation.controls.filter((control) => control.regionId === activeRegion),
    [orientation, activeRegion],
  );

  const activeControl = orientation.controls.find((control) => control.id === activeControlId);

  function selectRegion(regionId: CockpitRegionId) {
    setActiveRegion(regionId);
    const first = orientation.controls.find((control) => control.regionId === regionId);
    setActiveControlId(first?.id);
  }

  function selectControl(control: CockpitControlLocation) {
    setActiveRegion(control.regionId);
    setActiveControlId(control.id);
  }

  return (
    <section className={styles.explorer} aria-label="Cockpit orientation explorer">
      <div className={styles.schematic}>
        <div className={styles.caption}>
          <strong>Region schematic</strong>
          <span>Not to scale · verified panel-level locations only</span>
        </div>
        <div className={styles.cockpitGrid}>
          {orientation.regions.map((region) => (
            <button
              aria-pressed={activeRegion === region.id}
              className={`${styles.region} ${styles[region.id]} ${activeRegion === region.id ? styles.activeRegion : ""}`}
              key={region.id}
              onClick={() => selectRegion(region.id)}
              type="button"
            >
              <span>{region.label}</span>
              <small>{orientation.controls.filter((control) => control.regionId === region.id).length} verified items</small>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.detail}>
        <div className={styles.regionHeader}>
          <div>
            <p className="eyebrow">Selected region</p>
            <h2>{orientation.regions.find((region) => region.id === activeRegion)?.label}</h2>
          </div>
          <p>{orientation.regions.find((region) => region.id === activeRegion)?.description}</p>
        </div>

        {controls.length > 0 ? (
          <div className={styles.controlList}>
            {controls.map((control) => (
              <button
                aria-pressed={activeControlId === control.id}
                className={activeControlId === control.id ? styles.activeControl : undefined}
                key={control.id}
                onClick={() => selectControl(control)}
                type="button"
              >
                <strong>{control.label}</strong>
                <span>{control.description}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>No control location has been source-verified for this region yet.</p>
        )}

        {activeControl?.regionId === activeRegion ? (
          <aside className={styles.sourceCard}>
            <span className="source-pill">Source-backed location</span>
            <h3>{activeControl.label}</h3>
            <p>{activeControl.description}</p>
            <small>
              FlightSafety Learjet 35/36 Pilot Training Manual · Ch {activeControl.source.chapter} · {activeControl.source.section} · p. {activeControl.source.manualPage}
            </small>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
