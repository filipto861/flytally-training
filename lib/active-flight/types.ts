export type ActiveFlightLifecycle = "ACTIVE" | "PREVIOUS" | "ARCHIVED";

export type ActiveFlightAirport = {
  readonly icao: string;
  readonly name?: string;
};

export type ActiveFlightRunway = {
  readonly identifier: string;
};

export type ActiveFlightWeight = {
  readonly value: number;
  readonly unit: "kg" | "lb";
};

export type ActiveFlightConfiguration = {
  readonly flaps: string;
  readonly antiIce?: boolean;
};

export type ActiveFlightWeather = {
  readonly metar: string;
  readonly observedAt: string;
  readonly fetchedAt: string;
};

export type ActiveFlightPerformanceDependency = {
  readonly snapshotId: string;
};

export type ActiveFlightBrief = {
  readonly notes?: string;
};

export type ActiveFlight = {
  readonly id: string;
  readonly aircraftId: string;
  readonly accountSubject: string;
  readonly lifecycle: ActiveFlightLifecycle;
  readonly departure: ActiveFlightAirport;
  readonly destination: ActiveFlightAirport;
  /**
   * Legacy/convenience reference only. Performance owns runway selection per
   * operation, so an Active Flight may exist before a runway is known.
   */
  readonly runway: ActiveFlightRunway | null;
  readonly weight: ActiveFlightWeight;
  /**
   * Legacy/convenience reference only. Performance owns operation-specific
   * configuration such as takeoff/landing flaps.
   */
  readonly configuration: ActiveFlightConfiguration | null;
  readonly weather: ActiveFlightWeather | null;
  readonly performanceDependency: ActiveFlightPerformanceDependency;
  readonly brief: ActiveFlightBrief | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly activatedAt: string;
  readonly deactivatedAt: string | null;
  readonly archivedAt: string | null;
};

export type ActiveFlightInput = {
  readonly aircraftId: string;
  readonly departure: ActiveFlightAirport;
  readonly destination: ActiveFlightAirport;
  readonly runway?: ActiveFlightRunway | null;
  readonly weight: ActiveFlightWeight;
  readonly configuration?: ActiveFlightConfiguration | null;
  readonly brief?: ActiveFlightBrief | null;
};

export type ActiveFlightPatch = Partial<Omit<ActiveFlightInput, "aircraftId">>;

export const LOCAL_ACTIVE_FLIGHT_SUBJECT = "local";

export function canTransitionActiveFlight(
  from: ActiveFlightLifecycle,
  to: ActiveFlightLifecycle,
): boolean {
  return (from === "ACTIVE" && to === "PREVIOUS")
    || (from === "PREVIOUS" && to === "ARCHIVED");
}

export function transitionActiveFlight(
  flight: ActiveFlight,
  to: ActiveFlightLifecycle,
  at: string,
): ActiveFlight {
  if (!canTransitionActiveFlight(flight.lifecycle, to)) {
    throw new Error("Invalid Active Flight transition: " + flight.lifecycle + " -> " + to);
  }
  const timestamp = new Date(at).toISOString();
  if (to === "PREVIOUS") {
    return {
      ...flight,
      lifecycle: "PREVIOUS",
      updatedAt: timestamp,
      deactivatedAt: timestamp,
    };
  }
  return {
    ...flight,
    lifecycle: "ARCHIVED",
    updatedAt: timestamp,
    archivedAt: timestamp,
  };
}
