import { learjet3536OperationalLimitations, learjet3536OperationalPerformance } from "./learjet-pilot-takeoff-data.ts";
import type { AircraftLimitationsContent, AircraftPerformanceContent, PerformanceDataset, TrainingSourceReference } from "./universal-aircraft-content.ts";

const CAE = "cae-simuflite-learjet-35-36-crh-feb-2007";
const FSI = "fsi-learjet-35-36-ptm-r1-1";
const cae = (section: string, pageLabel: string): TrainingSourceReference => ({ manualId: CAE, section, pageLabel });
const fsi = (chapter: number, section: string, pageLabel: string): TrainingSourceReference => ({ manualId: FSI, chapter: String(chapter), section, pageLabel });

const startTaxiRows = [1, 2].flatMap((engines) => Array.from({ length: 60 }, (_, index) => index + 1).map((minutes) => ({
  inputs: { engines, minutes },
  outputs: { fuel: Math.round(3.5 * engines * minutes * 10) / 10 },
})));

const cgRows = Array.from({ length: 301 }, (_, index) => Math.round((360 + index * 0.1) * 10) / 10).map((station) => ({
  inputs: { station },
  outputs: { percentMac: Math.round((((station - 362.17) / 82.75) * 100) * 100) / 100 },
}));

const oxygenBase = [
  [40000, 251, 80, 48, 35, 28, 25, 22],
  [35000, 182, 71, 45, 33, 26, 24, 20],
  [30000, 135, 63, 42, 32, 26, 23, 20],
  [25000, 105, 56, 39, 30, 25, 23, 20],
] as const;
const occupancies = ["2 crew", "2 crew + 2 pax", "2 crew + 4 pax", "2 crew + 6 pax", "2 crew + 8 pax", "2 crew + 9 pax", "2 crew + 11 pax"] as const;
const oxygenPressures = Array.from({ length: 28 }, (_, index) => 500 + index * 50).filter((pressure) => pressure <= 1850);
const oxygenScaledRows = oxygenBase.flatMap(([cabinAltitude, ...durations]) =>
  occupancies.flatMap((occupancy, occupancyIndex) => oxygenPressures.map((systemPressure) => ({
    inputs: { cabinAltitude, occupancy, systemPressure },
    outputs: { duration: Math.round(durations[occupancyIndex] * (systemPressure / 1850)) },
  }))),
);

const practicalCalculators: readonly PerformanceDataset[] = [
  {
    id: "cae-start-taxi-takeoff-fuel",
    title: "Start / taxi / takeoff fuel allowance — CAE source formula",
    description: "CAE states that fuel for start/taxi/takeoff is normally 3.5 lb per engine per minute. This grid is direct arithmetic from that source formula.",
    kind: "lookup-table",
    axes: [
      { key: "engines", label: "Engines operating", values: [1, 2] },
      { key: "minutes", label: "Elapsed time", unit: "min", values: Array.from({ length: 60 }, (_, index) => index + 1) },
    ],
    outputs: [{ key: "fuel", label: "Fuel allowance", unit: "lb" }],
    rows: startTaxiRows,
    interpolation: "none",
    notes: ["SOURCE FORMULA MATERIALIZATION. Formula: 3.5 lb × engines × minutes."],
    sources: [cae("Flight Planning — Aircraft Loading Form", "5-9")],
  },
  {
    id: "cae-cg-percent-mac",
    title: "CG fuselage station → % MAC — CAE source formula",
    description: "CAE gives %MAC = [(Fuselage Station CG − 362.17) / 82.75] × 100. The stored grid applies that formula at 0.1-station increments for quick cockpit/planning reference.",
    kind: "lookup-table",
    axes: [{ key: "station", label: "CG fuselage station", unit: "in", values: cgRows.map((row) => row.inputs.station) }],
    outputs: [{ key: "percentMac", label: "CG", unit: "% MAC" }],
    rows: cgRows,
    interpolation: "none",
    notes: ["SOURCE FORMULA MATERIALIZATION. Use the aircraft's actual weighing/loading data and applicable AFM CG envelope as controlling data."],
    sources: [cae("Flight Planning — Aircraft Loading Form / Weight and Balance Procedure", "5-9–5-10")],
  },
  {
    id: "cae-oxygen-duration-pressure-scaled",
    title: "Oxygen duration adjusted for system pressure — CAE source formula",
    description: "CAE directs crews to multiply chart duration by actual system pressure / 1,850 when the oxygen system is not fully charged. This calculator grid applies that exact formula to the unambiguous high-altitude chart rows.",
    kind: "lookup-table",
    axes: [
      { key: "cabinAltitude", label: "Cabin altitude", unit: "ft", values: [25000, 30000, 35000, 40000] },
      { key: "occupancy", label: "Occupancy", values: occupancies },
      { key: "systemPressure", label: "System pressure", unit: "PSI", values: oxygenPressures },
    ],
    outputs: [{ key: "duration", label: "Approx. oxygen duration", unit: "min" }],
    rows: oxygenScaledRows,
    interpolation: "none",
    notes: ["SOURCE FORMULA MATERIALIZATION. Values are rounded to the nearest minute after applying actual pressure / 1,850.", "Crew mask mode / chart bold-light distinctions remain source-specific; use current approved oxygen documentation operationally."],
    sources: [cae("Oxygen System — Oxygen Duration Chart", "4J-6")],
  },
];

export const learjet3536MaximumPracticalPerformance: AircraftPerformanceContent = {
  ...learjet3536OperationalPerformance,
  title: "Learjet 35/36 Operational Performance & Flight Planning",
  sourceNote: `${learjet3536OperationalPerformance.sourceNote} Explicit CAE planning formulas are also materialized into cockpit-usable grids without creating an unsupported aircraft model.`,
  datasets: [...learjet3536OperationalPerformance.datasets, ...practicalCalculators],
};

export const learjet3536MaximumPracticalLimitations: AircraftLimitationsContent = {
  ...learjet3536OperationalLimitations,
  title: "Learjet 35/36 Operational Quick Reference & Limits",
  groups: [
    ...learjet3536OperationalLimitations.groups,
    {
      id: "takeoff-landing-operational-limits",
      title: "Takeoff & landing operational limits",
      items: [
        { id: "demonstrated-crosswind", label: "Demonstrated crosswind component", value: 24.7, unit: "kt", sources: [cae("Limitations — Takeoff and Landing Operational Limits", "3-20")] },
        { id: "nws-max", label: "Nosewheel steering maximum speed", value: 45, unit: "kt groundspeed", sources: [cae("Limitations — Takeoff and Landing Operational Limits", "3-20")] },
        { id: "nws-antiskid-lights", label: "Nosewheel steering max with any 2 right anti-skid lights illuminated", value: 10, unit: "kt groundspeed", sources: [cae("Limitations — Takeoff and Landing Operational Limits", "3-20")] },
        { id: "to-ldg-max-pa", label: "Maximum pressure altitude for takeoff/landing", value: 10000, unit: "ft", sources: [cae("Limitations — Takeoff and Landing Operational Limits", "3-20")] },
        { id: "tailwind-max", label: "Maximum tailwind component", value: 10, unit: "kt", sources: [cae("Limitations — Takeoff and Landing Operational Limits", "3-20")] },
        { id: "main-tire-speed", label: "Main tire limiting speed", value: 182, unit: "kt groundspeed", sources: [cae("Limitations — Takeoff and Landing Operational Limits", "3-20")] },
        { id: "runway-water-slush", label: "Maximum water/slush accumulation", value: "3/4 in / 19 mm", sources: [cae("Limitations — Takeoff and Landing Operational Limits", "3-20")] },
        { id: "tip-fuel-landing", label: "Maximum tip-tank fuel for landing", value: 925, unit: "lb each tip", sources: [cae("Limitations — Takeoff and Landing Operational Limits", "3-20")] },
        { id: "wing-fuel-takeoff", label: "Minimum fuel each wing for takeoff / intentional go-around", value: 600, unit: "lb", sources: [cae("Limitations — Takeoff and Landing Operational Limits", "3-20")] },
        { id: "cold-hyd-warm", label: "OAT below −25°C: engine run before takeoff", value: 3, unit: "min", condition: "To bring hydraulic system to normal operating temperature.", sources: [cae("Limitations — Takeoff and Landing Operational Limits", "3-20")] },
        { id: "vortex-generators", label: "Maximum missing vortex generators per wing", value: 3, sources: [cae("Limitations — Takeoff and Landing Operational Limits", "3-20")] },
        { id: "cabin-pressure-to-ldg", label: "Takeoff or landing with cabin pressurized", value: "PROHIBITED", sources: [cae("Limitations — Takeoff and Landing Operational Limits", "3-20")] },
      ],
      sources: [cae("Limitations — Takeoff and Landing Operational Limits", "3-20")],
    },
    {
      id: "enroute-load-limits",
      title: "Enroute structural limits",
      items: [
        { id: "load-flaps-up", label: "Flight load acceleration — flaps up", value: "+3.0 to −1.0 G", condition: "Equivalent level coordinated bank reference approximately 70° at the positive-G limit.", sources: [cae("Limitations — Enroute Operational Limits", "3-21")] },
        { id: "load-flaps-down", label: "Flight load acceleration — flaps down", value: "+2.0 to 0.0 G", condition: "Equivalent level coordinated bank reference approximately 60° at the positive-G limit.", sources: [cae("Limitations — Enroute Operational Limits", "3-21")] },
        { id: "max-altitude", label: "Maximum operating altitude", value: 45000, unit: "ft", sources: [cae("Limitations — Enroute Operational Limits", "3-21")] },
      ],
      sources: [cae("Limitations — Enroute Operational Limits", "3-21")],
    },
    {
      id: "fc530-autopilot-limits",
      title: "FC-530 autopilot / flight director — quick limits",
      items: [
        { id: "fc530-max-speed", label: "Maximum autopilot operating speed", value: "VMO/MMO", sources: [cae("Limitations — J.E.T. FC-530 Autopilot/Flight Director", "3-23–3-24")] },
        { id: "fc530-min-appr", label: "Minimum autopilot altitude — approach", value: 200, unit: "ft AGL", sources: [cae("Limitations — J.E.T. FC-530 Autopilot/Flight Director", "3-24")] },
        { id: "fc530-min-cruise", label: "Minimum autopilot altitude — cruise", value: 1000, unit: "ft AGL", sources: [cae("Limitations — J.E.T. FC-530 Autopilot/Flight Director", "3-24")] },
        { id: "fc530-fuel-imbalance", label: "Maximum lateral fuel imbalance for autopilot use", value: 200, unit: "lb", sources: [cae("Limitations — J.E.T. FC-530 Autopilot/Flight Director", "3-24")] },
        { id: "fc530-takeoff-landing", label: "Autopilot pitch/roll axis for takeoff or landing", value: "PROHIBITED", sources: [cae("Limitations — J.E.T. FC-530 Autopilot/Flight Director", "3-23–3-24")] },
        { id: "fc530-static-source", label: "Switching static source with autopilot engaged", value: "DISENGAGE AP FIRST", sources: [cae("Limitations — J.E.T. FC-530 Autopilot/Flight Director", "3-24")] },
        { id: "fc530-vor-flaps", label: "VOR approach flap requirement", value: "8° or more", sources: [cae("Limitations — J.E.T. FC-530 Autopilot/Flight Director", "3-24")] },
      ],
      sources: [cae("Limitations — J.E.T. FC-530 Autopilot/Flight Director", "3-23–3-24")],
    },
    {
      id: "fc200-autopilot-limits",
      title: "FC-200 autopilot / flight director — quick limits",
      items: [
        { id: "fc200-max-speed", label: "Maximum autopilot operating speed", value: "VMO/MMO", sources: [cae("Limitations — J.E.T. FC-200 Flight Control System", "3-23")] },
        { id: "fc200-takeoff-landing", label: "Autopilot pitch/roll axis for takeoff or landing", value: "PROHIBITED", sources: [cae("Limitations — J.E.T. FC-200 Flight Control System", "3-23")] },
        { id: "fc200-spoilers", label: "Spoiler extension with autopilot engaged", value: "PROHIBITED", sources: [cae("Limitations — J.E.T. FC-200 Flight Control System", "3-23")] },
        { id: "fc200-heavy-weather", label: "Heavy precipitation / severe turbulence", value: "SPD/V/S/ALT/G/S OFF; YD/LVL/SOFT ON", sources: [cae("Limitations — J.E.T. FC-200 Flight Control System", "3-23")] },
      ],
      sources: [cae("Limitations — J.E.T. FC-200 Flight Control System", "3-23")],
    },
    {
      id: "drag-chute-limits",
      title: "Drag chute",
      items: [
        { id: "drag-inflight", label: "Deployment in flight", value: "PROHIBITED", sources: [cae("Limitations — Drag Chute", "3-24")] },
        { id: "drag-speed", label: "Maximum deployment speed", value: 150, unit: "KIAS", sources: [cae("Limitations — Drag Chute", "3-24")] },
        { id: "drag-tr", label: "Simultaneous use with thrust reversers", value: "PROHIBITED", sources: [cae("Limitations — Drag Chute", "3-24")] },
        { id: "drag-xwind", label: "Demonstrated crosswind velocity", value: 20, unit: "kt", sources: [cae("Limitations — Drag Chute", "3-24")] },
      ],
      sources: [cae("Limitations — Drag Chute", "3-24")],
    },
    {
      id: "electrical-limits",
      title: "Electrical power — operating limits",
      items: [
        { id: "leadacid-start-cold", label: "Lead-acid battery start minimum — ≤70°F / 21°C", value: 24, unit: "V each", sources: [cae("Limitations — Electrical and Lighting / Batteries", "3-25")] },
        { id: "leadacid-start-hot", label: "Lead-acid battery start minimum — ≥110°F / 43°C", value: 25, unit: "V each", condition: "CAE directs interpolation between 70°F and 110°F.", sources: [cae("Limitations — Electrical and Lighting / Batteries", "3-25")] },
        { id: "nicad-start", label: "Ni-cad battery start minimum", value: 23, unit: "V each", sources: [cae("Limitations — Electrical and Lighting / Batteries", "3-25")] },
        { id: "external-power-current", label: "Maximum external-power amperage", value: 1100, unit: "A", sources: [cae("Limitations — External Power", "3-25")] },
        { id: "generator-ground", label: "Generator output maximum — ground", value: 320, unit: "A", sources: [cae("Limitations — Generator Limits", "3-25")] },
        { id: "generator-flight", label: "Generator output maximum — flight", value: 400, unit: "A", sources: [cae("Limitations — Generator Limits", "3-25")] },
      ],
      sources: [cae("Limitations — Electrical and Lighting", "3-25")],
    },
    {
      id: "environmental-limits",
      title: "Environmental / pressurization limits",
      items: [
        { id: "freon-early", label: "Freon cooling maximum altitude — early config without FCN 89-1", value: "FL180", condition: "S/N 35-002 to 505; 36-002 to 053 without FCN 89-1.", sources: [cae("Limitations — Environmental System", "3-26")] },
        { id: "freon-late", label: "Freon cooling maximum altitude — late/FCN 89-1", value: "FL350", condition: "S/N 35-506 subsequent; 36-054 subsequent; prior aircraft with FCN 89-1.", sources: [cae("Limitations — Environmental System", "3-26")] },
        { id: "ac-two-eng", label: "Air conditioner / aux heat after start — both engines", value: "each ammeter <250 A", sources: [cae("Limitations — Environmental System", "3-26")] },
        { id: "ac-one-eng-early", label: "Air conditioner / aux heat after start — one engine, early electrical config", value: "ammeter <200 A", condition: "S/N 35-002 to 147; 36-002 to 035.", sources: [cae("Limitations — Environmental System", "3-26")] },
        { id: "ac-one-eng-late", label: "Air conditioner / aux heat after start — one engine, later electrical config", value: "ammeter <150 A", condition: "S/N 35-148 subsequent; 36-036 subsequent.", sources: [cae("Limitations — Environmental System", "3-26")] },
        { id: "press-diff", label: "Maximum differential pressure", value: 10.0, unit: "PSI", sources: [cae("Limitations — Pressurization Limit", "3-26")] },
      ],
      sources: [cae("Limitations — Environmental System", "3-26")],
    },
    {
      id: "fuel-operational-limits",
      title: "Fuel — operational limits & low-fuel cues",
      items: [
        { id: "zero-wing-tip-standard", label: "Maximum zero wing/tip fuel weight", value: 13500, unit: "lb", sources: [cae("Limitations — Zero Wing/Tip Fuel Weight", "3-14")] },
        { id: "zero-wing-tip-extra", label: "Maximum zero wing/tip fuel weight with additional fuselage fuel", value: 14000, unit: "lb", condition: "Up to 500 lb additional fuselage fuel; transfer before total wing quantity reaches 2,250 lb.", sources: [cae("Limitations — Zero Wing/Tip Fuel Weight", "3-14")] },
        { id: "fuselage-transfer-failure-vmo", label: "If additional fuselage fuel cannot be transferred", value: 325, unit: "KIAS VMO", sources: [cae("Limitations — Zero Wing/Tip Fuel Weight", "3-14")] },
        { id: "cold-fuel-jeta", label: "Takeoff minimum fuel temperature — fuels other than JP-4/equivalent", value: -29, unit: "°C", sources: [cae("Limitations — Fuel Temperature", "3-34")] },
        { id: "absolute-fuel-min", label: "Absolute takeoff minimum fuel temperature", value: -54, unit: "°C", sources: [cae("Limitations — Fuel Temperature", "3-34")] },
        { id: "low-fuel-pitch", label: "≤600 lb in either wing: prolonged nose-up attitude", value: "Avoid ≥10° nose-up", condition: "Source warns of fuel trapping/starvation risk; use minimum required pitch/thrust for low-fuel go-around.", notices: [{ kind: "warning", text: "With 600 lb or less indicated in either wing, prolonged ≥10° nose-up attitude may trap fuel and cause starvation/flameout." }], sources: [cae("Limitations — Pitch Attitude Limits", "3-34")] },
      ],
      sources: [cae("Limitations — Fuel", "3-14, 3-34")],
    },
    {
      id: "hydraulic-oxygen-powerplant-limits",
      title: "Hydraulic, oxygen & powerplant operational limits",
      items: [
        { id: "aux-hyd-duty", label: "Auxiliary hydraulic pump duty cycle", value: "3 min ON / 20 min OFF", sources: [cae("Limitations — Hydraulics", "3-35")] },
        { id: "oxygen-fl250", label: "Above FL250 — later aircraft crew-mask readiness", value: "Quick-donning within 5 sec", condition: "Later effectivity listed by CAE; earlier aircraft have mask-specific requirements.", sources: [cae("Limitations — Oxygen", "3-36")] },
        { id: "oxygen-fl410", label: "Above FL410 — applicable early effectivity", value: "Pilot, copilot and passengers wear oxygen masks", condition: "Aircraft 35-067 through 112 except 107; 36-018 through 031.", sources: [cae("Limitations — Oxygen", "3-36")] },
        { id: "sync-off", label: "Engine synchronizer", value: "OFF for takeoff, landing and single-engine operation", sources: [cae("Limitations — Engine Synchronizer", "3-40")] },
        { id: "max-oil-temp", label: "Maximum oil temperature", value: 140, unit: "°C", sources: [cae("Limitations — Oil Temperature", "3-40")] },
        { id: "max-cont-itt", label: "Maximum continuous ITT", value: 832, unit: "°C", condition: "CAE notes reducing to 795°C or less after 30 minutes of maximum continuous operation for greatest engine life under normal conditions.", sources: [cae("Limitations — Engine Operating Temperatures", "3-38")], notices: [{ kind: "note", text: "795°C after 30 minutes is an engine-life recommendation in CAE, not presented as the maximum-continuous limit." }] },
        { id: "engine-spr", label: "SPR switch", value: "Engine start only", sources: [cae("Limitations — Engine SPR", "3-38")] },
      ],
      sources: [cae("Limitations — Hydraulics / Oxygen / Powerplant", "3-35–3-40")],
    },
    {
      id: "cg-envelope-reference",
      title: "Center-of-gravity envelope reference",
      items: [
        { id: "cg17-fwd-low", label: "17,000 lb config forward CG — ≤10,000 lb", value: "FS 366.31 / 5% MAC", sources: [cae("Limitations — 17,000 lb Center-of-Gravity Envelope", "3-15")] },
        { id: "cg17-fwd-high", label: "17,000 lb config forward CG — 17,000 lb", value: "FS 375.96 / 16.66% MAC", sources: [cae("Limitations — 17,000 lb Center-of-Gravity Envelope", "3-15")] },
        { id: "cg18-fwd-high", label: "18,000 lb config forward CG — 18,000 lb", value: "FS 377.34 / 18.83% MAC", sources: [cae("Limitations — 18,000 lb Center-of-Gravity Envelope", "3-17")] },
        { id: "cg183-fwd-high", label: "18,300 lb config forward CG — 18,300 lb", value: "FS 377.75 / 18.83% MAC", sources: [cae("Limitations — 18,300 lb Center-of-Gravity Envelope", "3-19")] },
        { id: "cg-aft", label: "Aft CG limit", value: "FS 387.00 / 30% MAC", condition: "All weights in the listed CAE envelopes.", sources: [cae("Limitations — Center-of-Gravity Envelopes", "3-15–3-19")] },
      ],
      sources: [cae("Limitations — Center-of-Gravity Envelopes", "3-15–3-19")],
    },
    {
      id: "crew-operating-boundaries",
      title: "Crew / certification operating boundaries",
      items: [
        { id: "crew-min", label: "Minimum flight crew", value: "Pilot and copilot", sources: [cae("Limitations — Operating Limitations", "3-6")], notices: [{ kind: "note", text: "CAE identifies these airplanes as transport-category, two-pilot aircraft." }] },
        { id: "approved-ops", label: "Approved operation", value: "Day/night · VFR/IFR · icing", sources: [cae("Limitations — Operating Limitations", "3-6")] },
        { id: "acro-spins", label: "Aerobatics / spins", value: "PROHIBITED", sources: [cae("Limitations — Operating Limitations", "3-6")] },
        { id: "stall-high-config", label: "Intentional stalls / stick-pusher actuation above 18,000 ft with flaps and/or gear extended", value: "PROHIBITED", sources: [cae("Limitations — Operating Limitations", "3-6")] },
      ],
      sources: [cae("Limitations — Operating Limitations", "3-6")],
    },
  ],
};
