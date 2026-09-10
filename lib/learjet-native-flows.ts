import type { AircraftFlowsContent, TrainingSourceReference } from "./universal-aircraft-content.ts";

const AIRCRAFT_ID = "learjet-35-36";
const JAYDEE_SOURCE_ID = "jaydee-learjet-35a-msfs-guide-v1-35-wip1";

const source = (pageLabel: string, section: string): TrainingSourceReference => ({
  manualId: JAYDEE_SOURCE_ID,
  section,
  pageLabel,
});

const applicability = {
  variants: ["35A"] as const,
  note: "Simulator workflow sourced from the JayDee Learjet 35A MS Flight Simulator guide; do not generalize it to another Learjet variant or real aircraft procedure without a controlling source.",
};

export const learjet3536NativeFlows: AircraftFlowsContent = {
  aircraftId: AIRCRAFT_ID,
  title: "Learjet 35A Simulator Flows",
  sourceNote: "Simulator-efficient memory flows structured from JayDee v1.35.WIP1, pages 2–5. JayDee labels the guide FOR FLIGHT SIMULATOR ONLY.",
  disclaimer: "SIMULATOR WORKFLOW ONLY. The source explicitly states that some procedures are intentionally altered from real-world procedures for efficient simulator operation. These flows never override AFM, QRH, approved supplements, operator SOPs or other controlling aircraft sources.",
  flows: [
    {
      id: "preflight-setup",
      title: "Preflight setup flow",
      phase: "Preflight / Power-up",
      applicability,
      sources: [source("2", "PREFLIGHT CHECK (FULL)")],
      steps: [
        { id: "pf-config", action: "EFB configuration, externals, fuel and payload — SET AS DESIRED", sources: [source("2", "PREFLIGHT CHECK (FULL)")] },
        { id: "pf-controls-oxygen", action: "Flight controls — FREE/FULL; oxygen system — CHECK", sources: [source("2", "PREFLIGHT CHECK (FULL)")] },
        { id: "pf-breakers-gear", action: "Circuit breakers — CHECK; anti-skid — ON; landing gear selector — DOWN", sources: [source("2", "PREFLIGHT CHECK (FULL)")] },
        { id: "pf-bleed-fuel-trim", action: "Bleed air — ON; jet pumps — ON; pitch trim — PRIMARY", sources: [source("2", "PREFLIGHT CHECK (FULL)")] },
        { id: "pf-batteries", action: "Battery check — PERFORM; BAT 1 and BAT 2 — ON", verification: "Voltage indications and emergency-power indication behave as described by the simulator guide.", sources: [source("2", "PREFLIGHT CHECK (FULL) — Battery Check")] },
        { id: "pf-inverters", action: "Inverter system check — PERFORM; PRI and SEC inverters — ON", verification: "Required inverter lights/AC voltage indications are normal in the modeled aircraft.", sources: [source("2", "PREFLIGHT CHECK (FULL) — Inverter System Check")] },
        { id: "pf-pressure", action: "Emergency air and hydraulic pressure — CHECK; hydraulic pump — OFF after check", sources: [source("2", "PREFLIGHT CHECK (FULL)")] },
        { id: "pf-warning-tests", action: "Warning, gear-light, fire-detection, cabin-altitude, Mach/stall warning tests — PERFORM as required", sources: [source("2", "PREFLIGHT CHECK (FULL) — system tests")] },
        { id: "pf-press-climate", action: "Pressurization and climate controls — CHECK / SET for planned cruise", verification: "AUTO selected, cruise altitude set and desired cabin rate selected.", sources: [source("2", "PREFLIGHT CHECK (FULL) — Pressurization & Climate Controls")] },
        { id: "pf-trim-ap-yd", action: "Trim, autopilot monitor and yaw-damper tests — PERFORM", sources: [source("2", "PREFLIGHT CHECK (FULL) — Trim / Autopilot / Yaw Damper tests")] },
        { id: "pf-fuel", action: "Fuel panel — SET; fuel counter — ZERO; quantities — CHECK; transfer/crossflow — NORMAL for start", sources: [source("2", "PREFLIGHT CHECK (FULL) — Fuel Panel")] },
      ],
    },
    {
      id: "engine-start",
      title: "Engine start flow",
      phase: "Engine start",
      applicability,
      sources: [source("3", "ENGINE START")],
      steps: [
        { id: "start-ready", action: "Covers/chocks — REMOVED; cabin door — CLOSED; anti-ice — OFF; fuel computers — ON", sources: [source("3", "ENGINE START")] },
        { id: "start-electrical", action: "Batteries — voltage CHECK; primary inverter — ON; parking brake — SET; hydraulic pump — OFF", sources: [source("3", "ENGINE START")] },
        { id: "start-lights", action: "Beacon and navigation lights — ON; thrust levers — CUT-OFF; engine sync — OFF", sources: [source("3", "ENGINE START")] },
        { id: "start-selector", action: "Selected Start-Gen switch — START", sources: [source("3", "ENGINE START — perform")] },
        { id: "start-idle", action: "At minimum 10% N2 with N1 rotation — thrust lever to IDLE", verification: "AIR IGN and starter-engage indications illuminate as modeled.", sources: [source("3", "ENGINE START — perform")] },
        { id: "start-monitor", action: "Monitor ITT, oil pressure and fuel flow through the start", sources: [source("3", "ENGINE START — perform")] },
        { id: "start-release", action: "At approximately 45–50% N2 — verify starter disengaged and start/ignition indications extinguished", sources: [source("3", "ENGINE START — perform")] },
        { id: "start-gen", action: "GPU — DISCONNECT as applicable; Start-Gen switch — GEN; generator output and engine indications — CHECK", sources: [source("3", "ENGINE START")] },
        { id: "start-other", action: "Other engine — START or continue to after-engine-start flow", sources: [source("3", "ENGINE START")] },
      ],
    },
    {
      id: "before-takeoff",
      title: "Before takeoff flow",
      phase: "Before takeoff",
      applicability,
      sources: [source("3", "BEFORE TAKEOFF")],
      steps: [
        { id: "bto-controls-config", action: "Flight controls — FULL/FREE; reversers — ARM; spoilers — RETRACTED; flaps and trim — SET FOR TAKEOFF", sources: [source("3", "BEFORE TAKEOFF")] },
        { id: "bto-avionics", action: "Avionics/frequencies and autopilot setup — CHECK; N1 reminder — SET", sources: [source("3", "BEFORE TAKEOFF")] },
        { id: "bto-ice", action: "Anti-ice — AS REQUIRED; pitot heat — ON; windshield heat — HOLD", sources: [source("3", "BEFORE TAKEOFF")] },
        { id: "bto-systems", action: "PRI/SEC inverters, AIR IGN, stall warning, bleed air, pressurization, cabin air and climate — SET", sources: [source("3", "BEFORE TAKEOFF")] },
        { id: "bto-yd", action: "Yaw-damper PRI/SEC power — ON; annunciator/warning lights — CONSIDER", sources: [source("3", "BEFORE TAKEOFF")] },
        { id: "bto-external", action: "Departure clearance/transponder/weather radar and exterior lights — SET for departure", sources: [source("3", "BEFORE TAKEOFF")] },
      ],
    },
    {
      id: "takeoff",
      title: "Takeoff flow",
      phase: "Takeoff",
      applicability,
      sources: [source("3", "TAKEOFF")],
      steps: [
        { id: "to-lineup", action: "Line up, hold brakes and stabilize approximately 40% N1", sources: [source("3", "TAKEOFF")] },
        { id: "to-release-power", action: "Release brakes and set takeoff power", sources: [source("3", "TAKEOFF")] },
        { id: "to-speedalive", action: "At airspeed alive — nosewheel steering OFF", sources: [source("3", "TAKEOFF")] },
        { id: "to-rotate", action: "At VR — rotate toward approximately 9° pitch up", sources: [source("3", "TAKEOFF")] },
        { id: "to-positive", action: "Positive rate — GEAR UP and YAW DAMPER ON", sources: [source("3", "TAKEOFF")] },
        { id: "to-v2", action: "Maintain at least V2 and no more than 200 KIAS during the initial profile", sources: [source("3", "TAKEOFF")] },
        { id: "to-flaps", action: "At V2 + 30 — FLAPS UP", sources: [source("3", "TAKEOFF")] },
        { id: "to-climb", action: "At 1,500 ft — CLIMB POWER; accelerate to 250 KIAS", sources: [source("3", "TAKEOFF")] },
      ],
    },
    {
      id: "climb-cruise-descent",
      title: "Climb, cruise and descent flow",
      phase: "Enroute",
      applicability,
      sources: [source("4", "AFTER TAKE-OFF / CLIMB; CRUISE; DESCENT")],
      steps: [
        { id: "ccd-climb", action: "Climb power — SET; reversers — OFF; flaps/gear — UP; engine sync and yaw damper — ON", sources: [source("4", "AFTER TAKE-OFF / CLIMB")] },
        { id: "ccd-monitor", action: "Anti-ice — AS REQUIRED; AIR IGN — OFF; pressurization/climate — MONITOR; hydraulic pressure — CHECK", sources: [source("4", "AFTER TAKE-OFF / CLIMB")] },
        { id: "ccd-10k-up", action: "At 10,000 ft — passenger signs/lights as required; at transition altitude — altimeters STD", sources: [source("4", "AFTER TAKE-OFF / CLIMB")] },
        { id: "ccd-cruise", action: "Cruise power — SET; fuel balance — CHECK/MANAGE; anti-ice and pressurization/climate — MONITOR", sources: [source("4", "CRUISE")] },
        { id: "ccd-descent-data", action: "Before descent — VREF/go-around speeds and N1 limit CHECKED/BUGGED; avionics/frequencies — SET", sources: [source("4", "DESCENT")] },
        { id: "ccd-descent-cabin", action: "Pressurization — landing elevation and desired rate SET; cabin — ADVISED/SECURED as applicable", sources: [source("4", "DESCENT")] },
        { id: "ccd-10k-down", action: "At 10,000 ft — passenger signs/lights as required; at transition level — altimeters LOCAL QNH", sources: [source("4", "DESCENT")] },
      ],
    },
    {
      id: "approach-landing",
      title: "Approach and landing flow",
      phase: "Approach / Landing",
      applicability,
      sources: [source("5", "APPROACH / BEFORE LANDING / LANDING")],
      steps: [
        { id: "app-check", action: "Approach — circuit breakers, hydraulic/emergency-air pressure, fuel balance, landing/go-around data and avionics — CHECK", sources: [source("5", "APPROACH")] },
        { id: "app-config", action: "Before landing — GEAR DOWN/3 GREEN; AIR IGN and landing lights — ON; anti-skid — ON; spoilers — RETRACTED; flaps 20°; engine sync — OFF", sources: [source("5", "BEFORE LANDING")] },
        { id: "app-final", action: "Final — flaps 40°, speed toward VREF, autopilot and yaw damper OFF", sources: [source("5", "VISUAL PATTERN LANDING / INSTRUMENT LANDING")] },
        { id: "app-landing-check", action: "Landing check — flaps FULL, landing gear DOWN/GREEN, yaw damper OFF", sources: [source("5", "LANDING CHECK")] },
        { id: "app-threshold", action: "At threshold/approximately 50 ft — reduce thrust levers gradually toward IDLE, flare and touch main gear first", sources: [source("5", "LANDING")] },
        { id: "app-reverse", action: "Reverse — use if necessary", sources: [source("5", "LANDING")] },
      ],
    },
    {
      id: "after-landing-shutdown",
      title: "After landing and shutdown flow",
      phase: "After landing / Shutdown",
      applicability,
      sources: [source("5", "AFTER LANDING / CLEAR OF RUNWAY; SHUTDOWN")],
      steps: [
        { id: "als-clean", action: "Flaps — UP; spoilers — RETRACTED; reversers — DISARMED", sources: [source("5", "AFTER LANDING / CLEAR OF RUNWAY")] },
        { id: "als-lights", action: "Strobes/recognition lights — OFF; landing lights — TAXI; AIR IGN — OFF", sources: [source("5", "AFTER LANDING / CLEAR OF RUNWAY")] },
        { id: "als-heat-air", action: "Cabin air — OFF; anti-ice — AS REQUIRED; pitot and windshield heat — OFF", sources: [source("5", "AFTER LANDING / CLEAR OF RUNWAY")] },
        { id: "als-avionics", action: "Transponder/weather radar — STBY or OFF; hydraulic pressure — CHECK", sources: [source("5", "AFTER LANDING / CLEAR OF RUNWAY")] },
        { id: "als-park", action: "Parking brake — SET; anti-ice — OFF; avionics/switches — secure per simulator flow", sources: [source("5", "SHUTDOWN")] },
        { id: "als-attitude-emergency", action: "Standby attitude gyro — CAGE; emergency power system — OFF", sources: [source("5", "SHUTDOWN")] },
        { id: "als-engines", action: "After the guide's approximately 2-minute idle period — thrust levers CUT-OFF; Start-Gen switches — OFF", sources: [source("5", "SHUTDOWN")] },
        { id: "als-electrical-fuel", action: "Inverters — OFF; fuel transfer — OFF; crossflow — CLOSE; exterior lights — OFF; batteries — OFF", sources: [source("5", "SHUTDOWN")] },
        { id: "als-efb", action: "EFB chocks/covers — SET AS DESIRED", sources: [source("5", "SHUTDOWN")] },
      ],
    },
  ],
};
