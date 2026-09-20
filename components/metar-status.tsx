"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  classifyFreshness,
  getClientCachedMetar,
  setClientCachedMetar,
} from "@/lib/weather/metar-cache";
import {
  canApplyMetarFreshness,
  formatMetarAge,
  formatObservationZulu,
  isMetarSnapshot,
} from "@/lib/weather/metar-snapshot-helpers";
import type { MetarCacheEntry, MetarFreshness, MetarSnapshot } from "@/lib/weather/metar-types";

import styles from "./metar-status.module.css";

export interface MetarStatusProps {
  readonly icao: string | null;
  readonly onApply: (snapshot: MetarSnapshot) => void;
}

type ViewState = {
  readonly kind: "idle" | "loading" | "ready" | "error";
  readonly snapshot?: MetarSnapshot;
  readonly cachedAt?: number;
  readonly freshness?: MetarFreshness;
  readonly message?: string;
};

function fallbackState(entry: MetarCacheEntry | null, offline: boolean, message?: string): ViewState {
  if (!entry) {
    return {
      kind: "error",
      freshness: offline ? "offline" : undefined,
      message: offline
        ? "Live weather unavailable. Manual inputs remain available."
        : (message ?? "Live weather unavailable."),
    };
  }
  return {
    kind: "ready",
    snapshot: entry.snapshot,
    cachedAt: entry.cachedAt,
    freshness: offline ? "offline" : classifyFreshness(entry.cachedAt),
    message,
  };
}

function windText(snapshot: MetarSnapshot): string {
  if (snapshot.windCalm) return "Calm";
  const direction = snapshot.windVariable
    ? "VRB"
    : snapshot.windDirectionTrueDeg === undefined
      ? "---"
      : String(Math.round(snapshot.windDirectionTrueDeg)).padStart(3, "0");
  const speed = snapshot.windSpeedKt === undefined ? "--" : Math.round(snapshot.windSpeedKt);
  const gust = snapshot.windGustKt === undefined ? "" : `G${Math.round(snapshot.windGustKt)}`;
  return `${direction}/${speed}${gust} KT`;
}

export function MetarStatus({ icao, onApply }: MetarStatusProps) {
  const [view, setView] = useState<ViewState>({ kind: "idle" });
  const [online, setOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine);
  const requestId = useRef(0);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const requestLive = useCallback(async (station: string, fallback: MetarCacheEntry | null) => {
    const currentRequest = ++requestId.current;
    setView((current) => ({
      kind: "loading",
      snapshot: current.snapshot ?? fallback?.snapshot,
      cachedAt: current.cachedAt ?? fallback?.cachedAt,
      freshness: current.freshness ?? (fallback ? classifyFreshness(fallback.cachedAt) : undefined),
    }));
    try {
      const response = await fetch(`/api/weather/metar?icao=${encodeURIComponent(station)}`, { cache: "no-store" });
      if (currentRequest !== requestId.current) return;
      if (response.status === 204) {
        setView(fallbackState(fallback, false, "No METAR report is available for this station."));
        return;
      }
      if (!response.ok) {
        setView(fallbackState(fallback, false, "Live weather unavailable. Manual inputs remain available."));
        return;
      }
      const payload: unknown = await response.json();
      if (!isMetarSnapshot(payload)) {
        setView(fallbackState(fallback, false, "Live weather returned an invalid response."));
        return;
      }
      setClientCachedMetar(station, payload);
      setView({
        kind: "ready",
        snapshot: payload,
        cachedAt: Date.now(),
        freshness: "live",
      });
    } catch {
      if (currentRequest !== requestId.current) return;
      setView(fallbackState(fallback, typeof navigator !== "undefined" && !navigator.onLine));
    }
  }, []);

  useEffect(() => {
    requestId.current += 1;
    if (!icao) {
      setView({ kind: "idle" });
      return;
    }
    const cached = getClientCachedMetar(icao);
    if (!online) {
      setView(fallbackState(cached, true));
      return;
    }
    if (cached && classifyFreshness(cached.cachedAt) === "live") {
      setView({
        kind: "ready",
        snapshot: cached.snapshot,
        cachedAt: cached.cachedAt,
        freshness: "live",
      });
      return;
    }
    void requestLive(icao, cached);
  }, [icao, online, requestLive]);

  if (!icao) return null;

  const snapshot = view.snapshot;
  const cachedFreshness = view.cachedAt === undefined ? undefined : classifyFreshness(view.cachedAt);
  const displayFreshness = view.freshness ?? cachedFreshness;
  const expired = cachedFreshness === "expired";
  const canApply = Boolean(snapshot && displayFreshness && canApplyMetarFreshness(expired ? "expired" : displayFreshness));
  const badge = (displayFreshness ?? (view.kind === "loading" ? "live" : "cached")).toUpperCase();

  return (
    <section className={styles.card} aria-label="METAR status" role="region">
      <div className={styles.header}>
        <div>
          <strong>{icao} · METAR</strong>
          {snapshot ? (
            <span>
              {formatObservationZulu(snapshot.observedAt)} · {formatMetarAge(snapshot.observedAt)}
            </span>
          ) : null}
        </div>
        {displayFreshness ? (
          <span className={styles.badge} data-freshness={displayFreshness}>{badge}</span>
        ) : null}
      </div>

      <div aria-live="polite" className={styles.status}>
        {view.kind === "loading" ? "Fetching METAR…" : null}
        {displayFreshness === "offline" && snapshot && view.cachedAt !== undefined
          ? `Using cached METAR (${formatMetarAge(new Date(view.cachedAt).toISOString())})`
          : null}
        {view.message ? view.message : null}
      </div>

      {snapshot ? (
        <>
          <div className={styles.weather}>
            <div><span>Wind</span><strong>{windText(snapshot)}</strong></div>
            <div><span>OAT</span><strong>{snapshot.temperatureC === undefined ? "—" : `${snapshot.temperatureC}°C`}</strong></div>
            <div><span>QNH</span><strong>{snapshot.qnhHpa === undefined ? "—" : `${Math.round(snapshot.qnhHpa)} hPa`}</strong></div>
          </div>
          <div className={styles.actions}>
            <button
              disabled={!online || view.kind === "loading"}
              onClick={() => void requestLive(icao, getClientCachedMetar(icao))}
              type="button"
            >
              <svg className={styles.buttonIcon} viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 7v5h-5" />
                <path d="M19 12a7 7 0 1 0-2.1 5" />
              </svg>
              <span>Refresh</span>
            </button>
            <button
              disabled={!canApply}
              onClick={() => snapshot && onApply(snapshot)}
              type="button"
            >
              <svg className={styles.buttonIcon} viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 4v11" />
                <path d="m8 11 4 4 4-4" />
                <path d="M5 19h14" />
              </svg>
              <span>{displayFreshness === "offline" ? "Apply cached values" : "Apply to inputs"}</span>
            </button>
          </div>
          {expired ? <p className={styles.expired}>Cached METAR is more than 12 hours old and cannot be applied.</p> : null}
        </>
      ) : null}
    </section>
  );
}
