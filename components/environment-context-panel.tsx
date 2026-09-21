import type { SelectedRunwayContext } from "@/lib/aviation/airport-types";
import { calculateRunwaySlope } from "@/lib/aviation/runway-slope";
import { calculateWindComponents } from "@/lib/aviation/wind-component";
import type { MetarSnapshot } from "@/lib/weather/metar-types";

import styles from "./environment-context-panel.module.css";

export interface EnvironmentContextPanelProps {
  readonly runwayContext?: SelectedRunwayContext;
  readonly metarSnapshot?: MetarSnapshot | null;
}

function roundedKt(value: number): number {
  const rounded = Math.round(value);
  return Object.is(rounded, -0) ? 0 : rounded;
}

function componentText(headwindKt: number): string {
  const rounded = roundedKt(headwindKt);
  if (rounded < 0) return `Tailwind ${Math.abs(rounded)} kt`;
  return `Headwind ${rounded} kt`;
}

function crosswindText(crosswindKt: number): string {
  const rounded = roundedKt(crosswindKt);
  if (rounded > 0) return `Crosswind ${rounded} kt from right`;
  if (rounded < 0) return `Crosswind ${Math.abs(rounded)} kt from left`;
  return "Crosswind 0 kt";
}

function windSourceText(
  snapshot: MetarSnapshot,
  angleOffDeg: number,
): string {
  if (snapshot.windCalm) return "Wind calm";
  const direction = snapshot.windVariable
    ? "VRB"
    : snapshot.windDirectionTrueDeg === undefined
      ? "---"
      : `${Math.round(snapshot.windDirectionTrueDeg)}°`;
  const speed = snapshot.windSpeedKt === undefined ? "—" : `${Math.round(snapshot.windSpeedKt)} kt`;
  const gust = snapshot.windGustKt === undefined ? "" : `, gusting ${Math.round(snapshot.windGustKt)} kt`;
  return `Wind ${direction} at ${speed}${gust} (${Math.round(angleOffDeg)}° off runway)`;
}

function slopeText(slopePercent: number): string {
  const magnitude = Math.abs(slopePercent).toFixed(1);
  if (Math.abs(slopePercent) < 0.0000001) return "Runway slope 0.0% (level)";
  return slopePercent > 0
    ? `Runway slope +${magnitude}% (uphill)`
    : `Runway slope −${magnitude}% (downhill)`;
}

export function EnvironmentContextPanel({
  runwayContext,
  metarSnapshot,
}: EnvironmentContextPanelProps) {
  if (!runwayContext) return null;

  const windDirectionTrueDeg = metarSnapshot?.windCalm
    ? runwayContext.headingTrueDeg
    : metarSnapshot?.windDirectionTrueDeg;
  const windSpeedKt = metarSnapshot?.windCalm ? 0 : metarSnapshot?.windSpeedKt;
  const wind = (
    metarSnapshot
    && runwayContext.headingTrueDeg !== undefined
    && windDirectionTrueDeg !== undefined
    && windSpeedKt !== undefined
  )
    ? calculateWindComponents({
        windDirectionTrueDeg,
        windSpeedKt,
        windGustKt: metarSnapshot.windGustKt,
        runwayHeadingTrueDeg: runwayContext.headingTrueDeg,
      })
    : undefined;

  const slope = (
    runwayContext.runwayEndElevationFt !== undefined
    && runwayContext.oppositeEndElevationFt !== undefined
  )
    ? calculateRunwaySlope({
        startEndElevationFt: runwayContext.runwayEndElevationFt,
        oppositeEndElevationFt: runwayContext.oppositeEndElevationFt,
        surfaceLengthFt: runwayContext.surfaceLengthFt,
      })
    : undefined;

  return (
    <section
      aria-label="Wind and runway slope context"
      className={styles.card}
      role="region"
    >
      <div className={styles.header}>
        <strong>Environment context</strong>
        <span>{runwayContext.airportIcao} · RWY {runwayContext.runwayIdent}</span>
      </div>

      <div className={styles.grid}>
        {metarSnapshot ? (
          <div className={styles.contextBlock}>
            <h4>Wind</h4>
            {wind ? (
              <dl>
                <div>
                  <dt>Longitudinal component</dt>
                  <dd>{componentText(wind.headwindKt)}</dd>
                </div>
                <div>
                  <dt>Crosswind component</dt>
                  <dd>{crosswindText(wind.crosswindKt)}</dd>
                </div>
                {wind.gustHeadwindKt !== undefined && wind.gustCrosswindKt !== undefined ? (
                  <div>
                    <dt>Gust components</dt>
                    <dd>
                      {componentText(wind.gustHeadwindKt)} · {crosswindText(wind.gustCrosswindKt)}
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt>Source wind</dt>
                  <dd>{windSourceText(metarSnapshot, wind.angleOffDeg)}</dd>
                </div>
              </dl>
            ) : (
              <p className={styles.unavailable}>
                Wind components unavailable — missing runway heading or METAR.
              </p>
            )}
          </div>
        ) : null}

        <div className={styles.contextBlock}>
          <h4>Slope</h4>
          {slope ? (
            <dl>
              <div>
                <dt>Runway gradient</dt>
                <dd>{slopeText(slope.slopePercent)}</dd>
              </div>
              <div>
                <dt>Gradient angle</dt>
                <dd>{Math.abs(slope.slopeDegrees).toFixed(2)}°</dd>
              </div>
            </dl>
          ) : (
            <p className={styles.unavailable}>
              Runway slope unavailable — missing elevation data.
            </p>
          )}
        </div>
      </div>

      <p className={styles.notice}>
        Distance values shown by this calculator are baseline (zero wind, zero slope). Apply AFM wind and gradient corrections manually.
      </p>
    </section>
  );
}
