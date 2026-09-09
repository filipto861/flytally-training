export type SimulatorChecklistSource = {
  readonly chapter: number;
  readonly section: string;
  readonly manualPage: string;
};

export type SimulatorChecklistItem = {
  readonly id: string;
  readonly action: string;
  readonly why?: string;
  readonly source: SimulatorChecklistSource;
};

export type SimulatorChecklistPhase = {
  readonly id: string;
  readonly title: string;
  readonly items: readonly SimulatorChecklistItem[];
};

export type SimulatorFlightFlow = {
  readonly aircraftId: string;
  readonly title: string;
  readonly estimatedMinutes: number;
  readonly sourceNote: string;
  readonly phases: readonly SimulatorChecklistPhase[];
};

export const learjet3536ColdDarkFlow: SimulatorFlightFlow = {
  aircraftId: "learjet-35-36",
  title: "Cold & Dark to Shutdown",
  estimatedMinutes: 75,
  sourceNote:
    "Simulator-oriented flow derived from the FlightSafety Learjet 35/36 Pilot Training Manual. It is intentionally simplified for simulator use and is not an approved aircraft checklist.",
  phases: [
    {
      id: "cold-dark",
      title: "Cold & Dark · Power up",
      items: [
        { id: "batteries-on", action: "BAT 1 and BAT 2 — ON", why: "Connect both aircraft batteries to the battery-charging bus.", source: { chapter: 2, section: "DC Power — Batteries / Controls", manualPage: "2-3" } },
        { id: "emer-power-on", action: "Emergency power — ON", why: "The manual describes ON as the normal position for the emergency power system.", source: { chapter: 2, section: "Emergency Battery", manualPage: "2-19" } },
        { id: "inverters-on", action: "Primary and secondary inverters — ON", why: "Both inverters normally operate in parallel to supply AC equipment.", source: { chapter: 2, section: "AC Power — Inverters", manualPage: "2-15" } },
        { id: "fuel-counter-reset", action: "Fuel used counter — RESET", why: "The training manual calls for the fuel counter to be reset before engine start.", source: { chapter: 7, section: "Fuel Flow", manualPage: "7-13" } },
        { id: "pressurization-setup", action: "Pressurization — AUTO; set cruise altitude and rate", why: "Normal setup uses AUTO, expected cruise altitude and approximately the 9 o'clock rate position.", source: { chapter: 12, section: "Normal System Operation — Before Takeoff", manualPage: "12-8" } }
      ]
    },
    {
      id: "engine-start",
      title: "Engine start",
      items: [
        { id: "start-switch", action: "Selected engine GEN–OFF–START — START", why: "START powers the starter and automatically energizes the associated standby fuel pump and arms ignition.", source: { chapter: 7, section: "Other Start Functions", manualPage: "7-20" } },
        { id: "throttle-idle", action: "Selected thrust lever — CUT-OFF to IDLE", why: "Moving the lever to IDLE during START activates automatic ignition.", source: { chapter: 7, section: "Ignition — Automatic Mode", manualPage: "7-14" } },
        { id: "monitor-start", action: "Monitor N2 and ITT during the start", why: "N2 and ITT are primary engine indications during start and acceleration.", source: { chapter: 7, section: "Engine Instrumentation", manualPage: "7-21" } },
        { id: "starter-release", action: "At about 45–50% N2 — confirm starter/ignition release", why: "With the fuel computer on, the start sequence is automatically terminated at the applicable N2 threshold.", source: { chapter: 7, section: "Other Start Functions", manualPage: "7-20" } },
        { id: "generator-on", action: "At stable idle — GEN", why: "After the engine reaches idle, the start switch may be moved to GEN.", source: { chapter: 7, section: "Other Start Functions", manualPage: "7-20" } },
        { id: "repeat-start", action: "Repeat the start sequence for the other engine", source: { chapter: 7, section: "Starting System", manualPage: "7-16–7-20" } }
      ]
    },
    {
      id: "taxi",
      title: "Before taxi / Taxi",
      items: [
        { id: "electrical-check", action: "Generators and electrical indications — CHECK", why: "Normal DC power is supplied by the two engine-driven generators operating in parallel.", source: { chapter: 2, section: "Generators", manualPage: "2-5–2-6" } },
        { id: "taxi-route", action: "Taxi route — REVIEW", why: "The manual emphasizes verifying the taxi clearance against an airport diagram.", source: { chapter: 18, section: "Taxi Procedures", manualPage: "18-13" } },
        { id: "taxi-checklist", action: "Taxi checklist — COMPLETE", source: { chapter: 18, section: "Taxi Procedures", manualPage: "18-13" } }
      ]
    },
    {
      id: "before-takeoff",
      title: "Before takeoff / Runway lineup",
      items: [
        { id: "air-ignition-on", action: "L and R AIR IGN — ON", why: "Selective air ignition is used for takeoff and landing in the training manual.", source: { chapter: 7, section: "Ignition — Selective Mode", manualPage: "7-14" } },
        { id: "takeoff-speeds", action: "V1, VR, V2 and V2+30 — SET / BUGGED", source: { chapter: 18, section: "Takeoff Setup / Standard Callouts", manualPage: "18-8–18-9" } },
        { id: "toga-fd", action: "TOGA / flight director takeoff setup — SET", why: "The training profile uses GA mode for the takeoff flight-director command.", source: { chapter: 18, section: "Takeoff Setup", manualPage: "18-8" } },
        { id: "lineup-check", action: "Runway lineup checklist — COMPLETE", source: { chapter: 18, section: "Takeoff Procedures", manualPage: "18-13" } }
      ]
    },
    {
      id: "takeoff",
      title: "Takeoff",
      items: [
        { id: "set-power", action: "Takeoff power — SET", source: { chapter: 18, section: "Takeoff Procedures", manualPage: "18-13" } },
        { id: "airspeed-alive", action: "Initial airspeed — CROSS-CHECK", source: { chapter: 18, section: "Takeoff Procedures", manualPage: "18-13" } },
        { id: "eighty", action: "80 kt — CROSS-CHECK", source: { chapter: 18, section: "Standard Callouts", manualPage: "18-9" } },
        { id: "rotate", action: "At VR — ROTATE to takeoff attitude", source: { chapter: 18, section: "Takeoff Procedures", manualPage: "18-13" } },
        { id: "positive-rate", action: "Positive rate — GEAR UP, YAW DAMPER ON", source: { chapter: 18, section: "Takeoff Procedures", manualPage: "18-13" } },
        { id: "flaps-up", action: "At V2 + 30 — FLAPS UP / After Takeoff checklist", source: { chapter: 18, section: "Takeoff Procedures", manualPage: "18-13" } }
      ]
    },
    {
      id: "climb-cruise",
      title: "Climb / Cruise",
      items: [
        { id: "climb-checklist", action: "At transition altitude — standard pressure / Climb checklist", source: { chapter: 18, section: "Standard Callouts", manualPage: "18-9" } },
        { id: "cruise-checklist", action: "When cruise is established — Cruise checklist", source: { chapter: 18, section: "Standard Callouts", manualPage: "18-10" } }
      ]
    },
    {
      id: "descent-approach",
      title: "Descent / Approach",
      items: [
        { id: "descent-checklist", action: "Beginning of descent — Descent checklist", source: { chapter: 18, section: "Standard Callouts", manualPage: "18-10" } },
        { id: "approach-brief", action: "Approach — setup, brief and Approach checklist", source: { chapter: 18, section: "Standard Callouts — Approach", manualPage: "18-11" } },
        { id: "flaps-20", action: "Below applicable speed — FLAPS 20°", source: { chapter: 18, section: "Standard Callouts — Approach", manualPage: "18-11" } },
        { id: "gear-down", action: "GEAR DOWN — verify three green", source: { chapter: 18, section: "Standard Callouts — Approach", manualPage: "18-11" } },
        { id: "before-landing", action: "Before Landing checklist — COMPLETE", source: { chapter: 18, section: "Standard Callouts — Approach", manualPage: "18-11" } },
        { id: "full-flaps", action: "Below 150 kt — FULL FLAPS when required for the approach", source: { chapter: 18, section: "Standard Callouts — Approach", manualPage: "18-11" } }
      ]
    },
    {
      id: "landing",
      title: "Landing / After landing",
      items: [
        { id: "landing-air-ign", action: "L and R AIR IGN — confirm ON", why: "Selective air ignition is used for landing.", source: { chapter: 7, section: "Ignition — Selective Mode", manualPage: "7-14" } },
        { id: "sixty-knots", action: "Landing rollout — note 60 kt call", source: { chapter: 18, section: "Standard Callouts — Landing", manualPage: "18-12" } },
        { id: "after-landing-check", action: "Clear of runway — After Landing checklist", source: { chapter: 18, section: "Checklist Procedures", manualPage: "18-4" } }
      ]
    },
    {
      id: "shutdown",
      title: "Shutdown · Back to cold & dark",
      items: [
        { id: "shutdown-checklist", action: "Shutdown checklist — COMPLETE", why: "The manual defines the normal checklist sequence as continuing through shutdown.", source: { chapter: 18, section: "Checklist Procedures", manualPage: "18-4" } },
        { id: "emer-power-off", action: "Emergency power — OFF before leaving the aircraft", why: "Leaving emergency power on after aircraft power is removed discharges the emergency battery.", source: { chapter: 2, section: "Emergency Battery", manualPage: "2-20" } },
        { id: "battery-hot-items", action: "Battery-hot-bus lights/items — OFF", why: "Battery-hot-bus equipment can discharge the batteries even with normal aircraft power removed.", source: { chapter: 2, section: "Distribution — Battery Hot Buses", manualPage: "2-12" } },
        { id: "batteries-off", action: "BAT 1 and BAT 2 — OFF", source: { chapter: 2, section: "DC Power — Batteries / Controls", manualPage: "2-3" } }
      ]
    }
  ]
};

export function getSimulatorFlightFlow(aircraftId: string): SimulatorFlightFlow | undefined {
  return aircraftId === learjet3536ColdDarkFlow.aircraftId ? learjet3536ColdDarkFlow : undefined;
}
