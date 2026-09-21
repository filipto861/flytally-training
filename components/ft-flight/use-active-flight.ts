"use client";

import { useCallback, useEffect, useState } from "react";

import {
  ACTIVE_FLIGHT_MIRROR_EVENT,
  clearActiveFlightMirror,
  readActiveFlightMirror,
  reconcileActiveFlightMirror,
  writeActiveFlightMirror,
} from "@/lib/active-flight/mirror";
import type { ActiveFlight } from "@/lib/active-flight/types";

export function useActiveFlightState(
  aircraftId: string,
  serverFlight: ActiveFlight | null | undefined,
) {
  const [flight, setFlightState] = useState<ActiveFlight | null>(serverFlight ?? null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const local = readActiveFlightMirror(window.localStorage, aircraftId);
    const reconciled = reconcileActiveFlightMirror(serverFlight, local);
    setFlightState(reconciled);

    if (serverFlight !== undefined) {
      if (serverFlight) writeActiveFlightMirror(window.localStorage, serverFlight);
      else clearActiveFlightMirror(window.localStorage, aircraftId);
    }

    const handleMirrorChange = () => {
      setFlightState(readActiveFlightMirror(window.localStorage, aircraftId));
    };
    window.addEventListener(ACTIVE_FLIGHT_MIRROR_EVENT, handleMirrorChange);
    setHydrated(true);
    return () => window.removeEventListener(ACTIVE_FLIGHT_MIRROR_EVENT, handleMirrorChange);
  }, [aircraftId, serverFlight]);

  const setFlight = useCallback((next: ActiveFlight | null) => {
    if (next) writeActiveFlightMirror(window.localStorage, next);
    else clearActiveFlightMirror(window.localStorage, aircraftId);
    setFlightState(next);
    window.dispatchEvent(new Event(ACTIVE_FLIGHT_MIRROR_EVENT));
  }, [aircraftId]);

  return { flight, hydrated, setFlight };
}
