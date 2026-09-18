import type { TrainingAircraft } from "../../lib/aircraft-catalog.ts";
import type { AircraftPerformanceContent } from "../../lib/universal-aircraft-content.ts";
import type { AircraftWeightBalanceContent } from "../../lib/universal-weight-balance.ts";

/**
 * Source-backed acceptance values copied from the effective production package
 * for the real v3.1 second aircraft. This fixture is test evidence only; learner
 * runtime code must never import it or branch on this aircraft identity.
 */
export const realSecondAircraft: TrainingAircraft = {
  id: "bristell-lsa",
  manufacturer: "BRM AERO, s.r.o.",
  model: "BRISTELL LSA",
  displayName: "BRISTELL LSA",
  variants: ["sn809-2025"],
  variantProfiles: [{
    key: "sn809-2025",
    displayName: "S/N 809/2025 · OK-EUI 10",
    equipmentTags: [
      "sn-809-2025",
      "rotax-912-uls-3",
      "woodcomp-kw-21",
      "hydraulic-constant-speed-prop",
      "long-wing-9.13m",
      "day-vfr",
    ],
  }],
  manuals: [],
};

const performanceApplicability = {
  variants: ["sn809-2025"],
  note: "Production S/N-specific performance applicability.",
} as const;

export const realSecondAircraftPerformance: AircraftPerformanceContent = {
  aircraftId: realSecondAircraft.id,
  title: "Performance",
  datasets: [
    {
      id: "takeoff-distance-grid",
      title: "Takeoff — concrete / grass",
      kind: "lookup-table",
      axes: [
        { key: "airportAltitudeFt", label: "Airport altitude", unit: "ft", values: [0, 2000] },
        { key: "isaDeviationC", label: "ISA deviation", unit: "°C", values: [0, 10] },
        { key: "surface", label: "Runway surface", values: ["Concrete", "Grass"] },
      ],
      outputs: [
        { key: "oatC", label: "Published table temperature", unit: "°C" },
        { key: "groundRunM", label: "Takeoff run", unit: "m" },
        { key: "distance50ftM", label: "Distance over 50 ft obstacle", unit: "m" },
      ],
      rows: [
        { inputs: { airportAltitudeFt: 0, isaDeviationC: 0, surface: "Concrete" }, outputs: { oatC: 15, groundRunM: 140, distance50ftM: 380 } },
        { inputs: { airportAltitudeFt: 0, isaDeviationC: 10, surface: "Concrete" }, outputs: { oatC: 25, groundRunM: 150, distance50ftM: 410 } },
        { inputs: { airportAltitudeFt: 2000, isaDeviationC: 0, surface: "Concrete" }, outputs: { oatC: 11, groundRunM: 160, distance50ftM: 430 } },
        { inputs: { airportAltitudeFt: 2000, isaDeviationC: 10, surface: "Concrete" }, outputs: { oatC: 21, groundRunM: 170, distance50ftM: 460 } },
      ],
      interpolation: "linear-explicit",
      applicability: performanceApplicability,
    },
    {
      id: "landing-distance-grid",
      title: "Landing — concrete / grass",
      kind: "lookup-table",
      axes: [
        { key: "airportAltitudeFt", label: "Airport altitude", unit: "ft", values: [0] },
        { key: "isaDeviationC", label: "ISA deviation", unit: "°C", values: [0] },
        { key: "surface", label: "Runway surface", values: ["Concrete"] },
      ],
      outputs: [
        { key: "oatC", label: "Published table temperature", unit: "°C" },
        { key: "groundRunM", label: "Landing run", unit: "m" },
        { key: "distance50ftM", label: "Distance over 50 ft obstacle", unit: "m" },
      ],
      rows: [
        { inputs: { airportAltitudeFt: 0, isaDeviationC: 0, surface: "Concrete" }, outputs: { oatC: 15, groundRunM: 90, distance50ftM: 290 } },
      ],
      interpolation: "linear-explicit",
      applicability: performanceApplicability,
    },
  ],
};

const source = [{
  manualId: "brmaero-bristell-lsa-flight-manual-cz",
  chapter: "6",
  section: "6.2.1–6.3 S/N 809/2025 weight and balance",
  pageLabel: "6-4–6-7",
}] as const;

export const realSecondAircraftWeightBalance: AircraftWeightBalanceContent = {
  aircraftId: realSecondAircraft.id,
  title: "Weight & Balance",
  applicability: {
    variants: ["sn809-2025"],
    note: "Empty-aircraft data and loading stations are specific to S/N 809/2025.",
  },
  empty: {
    massKg: 382,
    armMm: 744.15,
    momentKgMm: 284265.2,
    sources: source,
  },
  limits: {
    maxTakeoffMassKg: 600,
    maxLandingMassKg: 600,
    envelope: [
      { massKg: 382, forwardCgMm: 750, aftCgMm: 885 },
      { massKg: 600, forwardCgMm: 750, aftCgMm: 885 },
    ],
    cgScale: {
      label: "% MAC",
      points: [{ cgMm: 750, value: 25 }, { cgMm: 885, value: 35 }],
    },
    sources: source,
  },
  stations: [
    { id: "pilot", label: "Pilot", armMm: 1156, input: "mass-kg", required: true, minimumMassKg: 55, sources: source },
    { id: "passenger", label: "Passenger", armMm: 1156, input: "mass-kg", sources: source },
    { id: "rear-baggage", label: "Baggage behind seats", armMm: 1806, input: "mass-kg", maxMassKg: 15, sources: source },
    { id: "wing-baggage-left", label: "Left wing baggage", armMm: 1036, input: "mass-kg", maxMassKg: 20, sources: source },
    { id: "wing-baggage-right", label: "Right wing baggage", armMm: 1036, input: "mass-kg", maxMassKg: 20, sources: source },
    { id: "fuel", label: "Fuel", armMm: 606, input: "fuel-litres", required: true, maxMassKg: 89, maxVolumeL: 120, densityKgPerL: 0.725, sources: source },
  ],
  fuelBurnStationId: "fuel",
};
