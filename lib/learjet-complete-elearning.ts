import {
  learjet3536NativeChecklists,
  learjet3536NativeLimitations,
  learjet3536NativePerformance,
  learjet3536NativeProcedures,
  learjet3536NativeSystems,
} from "./learjet-native-content.ts";
import type {
  AircraftAvionicsContent,
  AircraftFlowsContent,
  AircraftProcedureContent,
  AircraftSystemsContent,
  TrainingSourceReference,
} from "./universal-aircraft-content.ts";

const AIRCRAFT_ID = "learjet-35-36";
const FSI = "fsi-learjet-35-36-ptm-r1-1";
const FLYSIMWARE = "flysimware-learjet-35a-msfs-v1-2";
const JAYDEE = "jaydee-learjet-35a-checklist-v1-35-wip1";

const fsi = (chapter: number, section: string, pageLabel: string): TrainingSourceReference => ({
  manualId: FSI,
  chapter: String(chapter),
  section,
  pageLabel,
});
const flysimware = (section: string, pageLabel: string): TrainingSourceReference => ({
  manualId: FLYSIMWARE,
  section,
  pageLabel,
});
const jaydee = (section: string, pageLabel: string): TrainingSourceReference => ({
  manualId: JAYDEE,
  section,
  pageLabel,
});

const authorityDisclaimer =
  "Training/familiarization content only. The applicable AFM, approved supplements, operator SOPs and regulatory publications remain controlling and take precedence if they differ from this training material.";

/**
 * M24 deepens the real-aircraft systems syllabus. Simulator sources are not
 * merged into these system facts: they live in dedicated implementation and
 * workflow modules so their lower authority remains visible to the learner.
 */
export const learjet3536CompleteSystems: AircraftSystemsContent = {
  ...learjet3536NativeSystems,
  title: "Learjet 35/36 Complete Systems Course",
  sourceNote:
    "FlightSafety Learjet 35/36 Pilot Training Manual Revision 1.1 is the core systems syllabus. The manual itself is a training reference; manufacturer and regulatory publications remain controlling.",
  systems: [
    {
      id: "aircraft-general",
      title: "Aircraft General, Structure & Doors",
      summary:
        "Build the aircraft-level picture first: two-pilot transport-category Learjet 35/36, its pressure vessel, wing and empennage, access doors and the major system interfaces that the later lessons expand.",
      mentalModel:
        "Know what is structural, what penetrates the pressure vessel, and where each major system lives before memorizing switch logic.",
      components: [
        "Fuselage pressure vessel and nose/tailcone sections",
        "Wing and tip-tank structure",
        "Empennage",
        "Passenger/crew door and emergency exit",
        "Nose and tailcone service/access areas",
      ],
      indications: ["Door/security indications where installed", "External condition observed during preflight"],
      normalOperation: [
        "Confirm doors/exits are correctly secured before pressurization",
        "Use the aircraft configuration and serial-number applicability when studying later systems",
      ],
      limitations: ["Maximum operating altitude in the training manual: 45,000 ft"],
      remember: [
        "The training manual covers 35, 35A, 36 and 36A serial-number ranges; system architecture can change materially across those ranges.",
        "Do not infer an AAK/ECR installation merely from the model name.",
      ],
      sources: [fsi(1, "Aircraft General — Introduction / Structures / Aircraft Systems", "1-1–1-14")],
    },
    ...learjet3536NativeSystems.systems,
    {
      id: "lighting",
      title: "Lighting",
      summary:
        "Internal and external lighting is distributed across DC buses, with landing/taxi lights using separate TAXI and LDG LT relay paths and brightness/current arrangements.",
      mentalModel:
        "Treat lighting as a set of electrically supplied consumers whose switch position and bus source matter; do not memorize it as one master lighting system.",
      components: ["Navigation/position lights", "Beacon/strobe lights", "Recognition lights", "Landing/taxi lights", "Cockpit/cabin lighting"],
      controls: ["Exterior-light switches", "Landing-light OFF/TAXI/LDG LT selections", "Cockpit/cabin dimming controls"],
      indications: ["Selected light operation", "Associated electrical load"],
      normalOperation: ["Select the exterior-light configuration appropriate to the flight phase"],
      remember: ["The landing/taxi lights use TAXI and full landing-light relay/current paths rather than a single brightness setting."],
      sources: [fsi(3, "Lighting — Exterior Lighting Controls / Landing-Taxi Lights", "3-1–3-10")],
    },
    {
      id: "master-warning",
      title: "Master Warning & Annunciators",
      summary:
        "The glareshield and system annunciators provide the crew's attention-getting layer. Master-warning behavior, lamp testing and the underlying system indication must be understood together.",
      mentalModel:
        "Master warning gets your attention; the associated annunciator tells you what system needs diagnosis. Resetting attention logic does not fix the fault.",
      components: ["Glareshield annunciator panel", "Pilot and copilot MSTR WARN lights", "System advisory/warning annunciators", "Test and dim functions"],
      controls: ["Glareshield TEST controls", "MSTR WARN reset", "Annunciator DIM/test controls as fitted"],
      indications: ["Red/amber annunciators", "Flashing/steady master-warning indications according to configuration"],
      normalOperation: ["Test the warning/annunciator system during the appropriate preflight checks", "Identify the system annunciator before acting on a warning"],
      remember: ["A warning-light test confirms the indication path; it does not test every underlying component failure mode."],
      sources: [fsi(4, "Master Warning System — Controls, Indications and Questions", "4-1–4-7")],
    },
    {
      id: "fire-protection",
      title: "Fire Protection",
      summary:
        "Engine fire detection drives FIRE PULL/MSTR WARN indications; the fire-handle and bottle system isolates affected services and provides extinguishing-agent discharge capability.",
      mentalModel:
        "Separate detection, isolation/arming and bottle discharge in your head. They are related stages, not one automatic action.",
      components: ["Engine fire-detection system", "FIRE PULL handles", "Extinguisher bottles", "Armed/discharge circuits", "External discharge indicators"],
      controls: ["Fire-detection test selector/button", "FIRE PULL handle", "Extinguisher ARMED/discharge controls"],
      indications: ["FIRE PULL illumination", "MSTR WARN", "Bottle armed/discharge indication"],
      abnormalCues: ["Engine fire warning", "Persistent fire indication after first bottle"],
      remember: ["Pulling the affected fire handle closes that engine's main fuel, hydraulic and bleed-air shutoff valves and arms extinguishing capability."],
      sources: [fsi(8, "Fire Protection — Detection / Extinguishing / Questions", "8-1–8-7")],
    },
    {
      id: "air-conditioning",
      title: "Air Conditioning & Environmental Control",
      summary:
        "Bleed-air conditioning and optional/installed cooling or heating equipment control cockpit/cabin temperature. The environmental system shares pneumatic and electrical resources with other aircraft systems.",
      mentalModel:
        "Conditioning is downstream of bleed-air supply and temperature-control hardware; an environmental symptom can therefore originate in pneumatics, electrical supply or the local temperature-control path.",
      components: ["Bleed-air flow-control path", "Temperature-control/H-valve system", "Cabin/cockpit air distribution", "Freon cooling where installed", "Auxiliary cabin heater where installed"],
      controls: ["CABIN AIR", "COCKPIT AIR / cabin controls as fitted", "Temperature controls", "Cabin blower", "Auxiliary heat/Freon controls where installed"],
      indications: ["Temperature-control indication", "Cabin/cockpit temperature response"],
      abnormalCues: ["No temperature response", "Unexpected loss of conditioning with pneumatic/electrical abnormal indications"],
      remember: ["Configuration matters: optional cooling/heating equipment is not universal across the fleet."],
      sources: [fsi(11, "Air Conditioning — General / Controls / Questions", "11-1–11-22")],
    },
    {
      id: "avionics-airdata-autoflight",
      title: "Air Data, Flight Director & Autopilot",
      summary:
        "The training manual describes FC-200 and FC-530 installations, pitot-static/air-data architecture, flight-director/autopilot modes and installation-dependent copilot, terrain/traffic and RVSM equipment.",
      mentalModel:
        "First identify which AFCS/air-data configuration the aircraft has. Then learn mode engagement, source selection and disconnect/reversion behavior for that configuration.",
      components: ["Pitot-static sources", "Air-data equipment", "FC-200 or FC-530 AFCS", "Flight director", "Autopilot", "Altitude-alerting/RVSM equipment as installed"],
      controls: ["Autopilot/flight-director control panel", "Control-wheel disconnect/trim controls", "Navigation-source selectors", "Static-source controls"],
      indications: ["ADI/HSI command and mode annunciation", "Altitude capture/alerting", "Autopilot engagement/disconnect", "Air-data indications"],
      abnormalCues: ["Unexpected mode reversion", "Autopilot disconnect", "Pitot/static or air-data disagreement"],
      remember: ["FC-200 and FC-530 are not interchangeable study profiles; configuration must be identified first."],
      sources: [fsi(16, "Avionics — FC-200 / FC-530 / Autoflight / RVSM", "16-1–16-43")],
    },
    {
      id: "miscellaneous-systems",
      title: "Miscellaneous Systems & Ground/Air Logic",
      summary:
        "Squat-switch and relay-box logic distributes ground/air state to several otherwise unrelated systems, including gear, antiskid, steering, spoilers, pressurization, trim warnings and selected avionics functions.",
      mentalModel:
        "A squat-switch problem can create symptoms in several systems at once because ground/air state is a shared logic input.",
      components: ["Main-gear squat switches", "Squat-switch relay box", "Ground/air interlocks", "Related stall-warning and trim logic"],
      indications: ["System behavior changing between ground and air logic", "Unexpected interlock or warning behavior"],
      abnormalCues: ["Multiple apparently unrelated systems showing incorrect ground/air behavior"],
      remember: [
        "Both main-gear squat switches must be in air mode for the relay box to provide air-mode signals.",
        "Some systems receive direct squat-switch inputs even if the relay-box circuit breaker state changes.",
      ],
      sources: [fsi(17, "Miscellaneous Systems — Squat Switches / Relay Box", "17-1–17-11")],
    },
    {
      id: "weight-balance",
      title: "Weight & Balance",
      summary:
        "Dispatch loading must remain inside the applicable configuration's center-of-gravity envelope; the training chapter provides loading tables, fuel moments and configuration-specific envelopes.",
      mentalModel:
        "Weight and balance is not one maximum-weight check. Aircraft configuration, zero-fuel condition, fuel burn and CG movement all matter.",
      components: ["Applicable CG envelope", "Basic aircraft/loading data", "Passenger/baggage moments", "Usable-fuel moments", "Fuel-used moment loss"],
      controls: ["Preflight load planning and calculation"],
      indications: ["Computed weight, moment and CG position"],
      normalOperation: ["Verify the planned and expected flight-loading states remain within the applicable envelope"],
      remember: ["The pilot is responsible for ensuring the aircraft is loaded within the applicable CG envelope."],
      sources: [fsi(19, "Weight and Balance — Introduction / Computation", "19-1–19-14")],
    },
    {
      id: "crm",
      title: "Crew Resource Management",
      summary:
        "CRM ties technical knowledge to two-pilot operation: communication, monitoring, workload management, situational awareness and structured decision making.",
      mentalModel:
        "The Learjet is a two-pilot transport-category aircraft; knowing a system is not enough if the crew cannot detect, communicate and manage a developing problem.",
      components: ["Communication", "Situational awareness", "Workload/resource management", "Decision making", "Monitoring and cross-check"],
      normalOperation: ["Use clear PF/PM role allocation", "Use SOPs and cross-checks to trap deviations", "Apply structured decision making when time permits"],
      remember: ["T-DODAR: Time, Diagnose, Options, Decide, Assign/Act, Review."],
      sources: [fsi(21, "Crew Resource Management — Decision Making / T-DODAR", "21-1–21-10")],
    },
  ],
};

export const learjet3536CompleteProcedures: AircraftProcedureContent = {
  ...learjet3536NativeProcedures,
  title: "Learjet 35/36 Complete Operating & Maneuver Procedures",
  sourceNote:
    "Core procedures are structured from FlightSafety Chapter 18 and relevant system chapters. They remain training procedures and do not replace the applicable AFM, QRH or operator SOP.",
  procedures: [
    ...learjet3536NativeProcedures.procedures,
    {
      id: "visual-pattern-normal",
      title: "Visual traffic pattern — two engines",
      phase: "Approach",
      summary: "Use the Chapter 18 visual-pattern profile to manage configuration and VREF additives through entry, downwind and final.",
      steps: [
        { id: "visual-entry", action: "Enter with gear and flaps up at not less than VREF + 40 kt and complete the Approach checklist.", sources: [fsi(18, "Visual Approach Normal", "18-28")] },
        { id: "visual-downwind-8", action: "On downwind select flaps 8° and target VREF + 30 kt.", sources: [fsi(18, "Visual Approach Normal", "18-28")] },
        { id: "visual-downwind-20", action: "At the appropriate point select flaps 20°, gear down and target VREF + 20 kt; complete Before Landing checklist.", sources: [fsi(18, "Visual Approach Normal", "18-28")] },
        { id: "visual-final", action: "On final configure flaps 40° and stabilize at VREF minimum for the normal two-engine landing profile.", sources: [fsi(18, "Visual Approach Normal", "18-28")] },
      ],
      sources: [fsi(18, "Visual Approach Normal", "18-28")],
    },
    {
      id: "visual-pattern-single-engine",
      title: "Visual traffic pattern — single engine",
      phase: "Approach",
      summary: "The single-engine pattern follows the normal pattern except the final configuration remains flaps 20° at VREF + 10 kt.",
      steps: [
        { id: "se-visual-entry", action: "Enter with gear and flaps up at not less than VREF + 40 kt and complete the Approach checklist.", sources: [fsi(18, "Visual Approach Single Engine", "18-29")] },
        { id: "se-visual-downwind", action: "Progress through flaps 8° / VREF + 30 and then flaps 20°, gear down / VREF + 20 on downwind.", sources: [fsi(18, "Visual Approach Single Engine", "18-29")] },
        { id: "se-visual-final", action: "Fly final with flaps 20° at VREF + 10 kt through landing; rudder trim may be reduced on final at PF discretion.", sources: [fsi(18, "Visual Approach Single Engine", "18-29")] },
      ],
      sources: [fsi(18, "Visual Approach Single Engine", "18-29")],
    },
    {
      id: "flaps-up-landing",
      title: "Flaps-up landing training profile",
      phase: "Approach",
      summary: "Use the Chapter 18 flaps-up profile and recognize the landing-distance penalty before attempting the maneuver in training.",
      steps: [
        { id: "fu-distance", action: "Determine corrected landing distance using the training-manual factor before committing to the approach.", expectedResult: "Training-manual corrected landing distance is normal landing distance × 1.35.", sources: [fsi(18, "Flaps Up Landing", "18-30")] },
        { id: "fu-entry", action: "Enter with gear/flaps up at VREF + 40 kt and complete the Approach checklist.", sources: [fsi(18, "Flaps Up Landing", "18-30")] },
        { id: "fu-downwind", action: "Select gear down on downwind, complete Before Landing checklist and maintain VREF + 40 kt.", sources: [fsi(18, "Flaps Up Landing", "18-30")] },
        { id: "fu-final", action: "Fly final at VREF + 30 kt and disengage yaw damper before touchdown.", sources: [fsi(18, "Flaps Up Landing", "18-30")] },
      ],
      sources: [fsi(18, "Flaps Up Landing", "18-30")],
    },
    {
      id: "precision-approach",
      title: "Precision instrument approach training profile",
      phase: "Approach",
      summary: "Chapter 18 configuration/speed gates for a stabilized precision approach.",
      steps: [
        { id: "pa-iaf", action: "Approaching IAF: gear/flaps up, VREF + 40 kt minimum, Approach checklist complete.", sources: [fsi(18, "Precision Approach Normal", "18-31") ] },
        { id: "pa-outbound", action: "IAF outbound: flaps 8°, VREF + 30 kt minimum; descend if required.", sources: [fsi(18, "Precision Approach Normal", "18-31") ] },
        { id: "pa-inbound", action: "On course inbound: flaps 20°, gear down, VREF + 20 kt minimum; complete Before Landing checklist to flaps 40°.", sources: [fsi(18, "Precision Approach Normal", "18-31") ] },
        { id: "pa-faf", action: "At FAF for the normal two-engine profile: flaps 40°, VREF minimum, Before Landing checklist complete.", sources: [fsi(18, "Precision Approach Normal", "18-31") ] },
        { id: "pa-single-engine", action: "For a single-engine precision approach, maintain flaps 20° at VREF + 10 kt from FAF inbound.", sources: [fsi(18, "Precision Approach Normal", "18-31") ] },
      ],
      sources: [fsi(18, "Precision Approach Normal", "18-31")],
    },
    {
      id: "nonprecision-approach",
      title: "Non-precision instrument approach training profile",
      phase: "Approach",
      summary: "Use the same staged configuration concept while respecting the non-precision procedure and stabilized final segment.",
      steps: [
        { id: "npa-iaf", action: "Approaching IAF: gear/flaps up, VREF + 40 kt, Approach checklist complete.", sources: [fsi(18, "Non-Precision Approach Normal", "18-32–18-33") ] },
        { id: "npa-outbound", action: "IAF outbound: flaps 8°, VREF + 30 kt; descend if required.", sources: [fsi(18, "Non-Precision Approach Normal", "18-32–18-33") ] },
        { id: "npa-inbound", action: "On course inbound: flaps 20°, gear down, VREF + 20 kt; complete Before Landing checklist to flaps 40°.", sources: [fsi(18, "Non-Precision Approach Normal", "18-32–18-33") ] },
        { id: "npa-faf", action: "At FAF for the normal two-engine profile: flaps 40° and VREF minimum.", sources: [fsi(18, "Non-Precision Approach Normal", "18-32–18-33") ] },
        { id: "npa-single-engine", action: "For a single-engine non-precision approach, maintain flaps 20° at VREF + 10 kt from FAF inbound.", sources: [fsi(18, "Non-Precision Approach Normal", "18-32–18-33") ] },
      ],
      sources: [fsi(18, "Non-Precision Approach Normal", "18-32–18-33")],
    },
    {
      id: "go-around-profile",
      title: "Go-around / balked landing",
      phase: "Go-around",
      summary: "Apply the Chapter 18 go-around profile, with AFCS-specific handling where applicable.",
      steps: [
        { id: "ga-simultaneous", action: "Simultaneously disengage autopilot as required, establish approximately 9° nose-up, set takeoff power or as required, and verify spoilers retracted.", sources: [fsi(18, "Go-Around/Balked Landing", "18-35")] },
        { id: "ga-flaps20", action: "At or above VREF select flaps 20°.", sources: [fsi(18, "Go-Around/Balked Landing", "18-35")] },
        { id: "ga-positive", action: "With positive rate, select gear up and yaw damper on.", sources: [fsi(18, "Go-Around/Balked Landing", "18-35")] },
        { id: "ga-climb-speed", action: "Accelerate to approach climb speed, approximately VREF + 7 kt.", sources: [fsi(18, "Go-Around/Balked Landing", "18-35")] },
        { id: "ga-clear", action: "Clear of obstacles, accelerate to VREF + 30 kt and retract flaps.", sources: [fsi(18, "Go-Around/Balked Landing", "18-35")] },
      ],
      sources: [fsi(18, "Go-Around/Balked Landing", "18-35")],
    },
    {
      id: "single-engine-drift-down",
      title: "Single-engine drift-down speed schedule",
      phase: "Abnormal / high altitude",
      summary: "Training schedule for minimum sink above the single-engine ceiling and approximate best-rate climb below it.",
      steps: [
        { id: "dd-power", action: "After engine failure, set maximum continuous thrust on the operating engine.", sources: [fsi(18, "Single-Engine Drift Down", "18-36") ] },
        { id: "dd-170", action: "Maintain altitude until airspeed reaches 170 KIAS, then descend at 170 KIAS until reaching Mach 0.50.", sources: [fsi(18, "Single-Engine Drift Down", "18-36") ] },
        { id: "dd-mach", action: "Descend at Mach 0.50 until airspeed reaches 200 KIAS.", sources: [fsi(18, "Single-Engine Drift Down", "18-36") ] },
        { id: "dd-200", action: "Descend at 200 KIAS to the single-engine cruise altitude.", sources: [fsi(18, "Single-Engine Drift Down", "18-36") ] },
      ],
      notices: undefined,
      sources: [fsi(18, "Single-Engine Drift Down", "18-36")],
    },
    {
      id: "pilot-incapacitation",
      title: "Pilot incapacitation recognition and response",
      phase: "Abnormal / CRM",
      summary: "Use SOP discipline, monitoring and the two-communication rule to recognize incapacitation early and recover crew capacity.",
      steps: [
        { id: "incap-recognize", action: "Treat failure to respond to two verbal communications, or failure to respond/correct a significant deviation, as an incapacitation trigger under the training-manual two-communication rule.", sources: [fsi(18, "Pilot Incapacitation", "18-40") ] },
        { id: "incap-control", action: "Remaining pilot immediately takes control and returns the aircraft to profile if required.", sources: [fsi(18, "Pilot Incapacitation", "18-40") ] },
        { id: "incap-resources", action: "Use available resources, including autopilot and other crewmembers; declare an emergency or go around when conditions warrant.", sources: [fsi(18, "Pilot Incapacitation", "18-40") ] },
      ],
      sources: [fsi(18, "Pilot Incapacitation", "18-40")],
    },
  ],
};

/**
 * This is intentionally a separate FLOW module, not the real-standard
 * checklist. JayDee explicitly labels the source simulator-only and states
 * that some procedures were intentionally altered. The learner can drill the
 * workflow while always seeing that authority boundary.
 */
export const learjet3536JayDeeFlows: AircraftFlowsContent = {
  aircraftId: AIRCRAFT_ID,
  title: "Learjet 35A Workflow Drill — JayDee v1.35.WIP1",
  sourceNote:
    "Use this to rehearse the short checklist you supplied. It is deliberately kept separate from the FlightSafety-based real-standard checklist because the source explicitly states that some procedures are altered for simulator use.",
  disclaimer:
    "Simulator workflow reference only. It must not override the FlightSafety training course, the applicable AFM/QRH, approved supplements or operator SOPs.",
  flows: [
    {
      id: "jd-preflight-full",
      title: "Full preflight / powered checks",
      phase: "Preflight",
      applicability: { variants: ["35A"], note: "JayDee workflow is written for a Learjet 35A simulator implementation." },
      steps: [
        { id: "jd-pf-config", action: "Set aircraft configuration, externals, fuel and payload as desired.", sources: [jaydee("Normal Procedures — Preflight Check (Full)", "2")] },
        { id: "jd-pf-controls", action: "Flight controls — free and full movement; oxygen system — check; circuit breakers — check.", sources: [jaydee("Normal Procedures — Preflight Check (Full)", "2")] },
        { id: "jd-pf-emerg", action: "Exercise the emergency-power check sequence and return EMER BAT to the workflow's stated standby condition.", verification: "Attitude gyro/EMER PWR and gear-down indications respond as described by the source.", sources: [jaydee("Normal Procedures — Preflight Check (Full)", "2")] },
        { id: "jd-pf-battery", action: "Perform the two-battery voltage/EMER PWR check, then select both batteries on.", sources: [jaydee("Normal Procedures — Preflight Check (Full)", "2")] },
        { id: "jd-pf-inverters", action: "Perform primary/secondary inverter and AC-bus checks; finish with both inverters on.", sources: [jaydee("Normal Procedures — Preflight Check (Full)", "2")] },
        { id: "jd-pf-hyd", action: "Check emergency air and hydraulic pressure; use the auxiliary pump if required by the workflow, then return it off.", sources: [jaydee("Normal Procedures — Preflight Check (Full)", "2")] },
        { id: "jd-pf-warning", action: "Perform warning light, landing-gear-light, fire-detection and cabin-altitude warning checks.", sources: [jaydee("Normal Procedures — Preflight Check (Full)", "2")] },
        { id: "jd-pf-mach", action: "Perform stick-puller/Mach warning, Mach trim and stall-warning tests in the sequence described by the checklist.", sources: [jaydee("Normal Procedures — Preflight Check (Full)", "2")] },
      ],
      sources: [jaydee("Normal Procedures — Preflight Check (Full)", "2")],
    },
    {
      id: "jd-engine-start",
      title: "Engine start",
      phase: "Start",
      applicability: { variants: ["35A"] },
      steps: [
        { id: "jd-es-ready", action: "Covers/chocks removed, cabin door closed, anti-ice off, fuel computers on, batteries/inverter checked, parking brake set, hydraulic pump off, beacon/nav lights on, thrust levers cut off, engine sync off.", sources: [jaydee("Engine Start", "3")] },
        { id: "jd-es-start", action: "Selected START-GEN — START.", sources: [jaydee("Engine Start", "3")] },
        { id: "jd-es-idle", action: "At minimum 10% N2 with N1 rotation, move the thrust lever to IDLE and monitor the start.", verification: "AIR IGN / starter indications, ITT, oil pressure and fuel flow behave as the workflow describes.", sources: [jaydee("Engine Start", "3")] },
        { id: "jd-es-release", action: "At approximately 45–50% N2, verify starter and AIR IGN release/extinguish.", sources: [jaydee("Engine Start", "3")] },
        { id: "jd-es-gen", action: "Disconnect GPU as applicable, select START-GEN to GEN, check DC volts/amps and normal engine indications; repeat for the other engine or continue after-start checks.", sources: [jaydee("Engine Start", "3")] },
      ],
      sources: [jaydee("Engine Start", "3")],
    },
    {
      id: "jd-after-start-before-taxi",
      title: "After engine start / before taxi checks",
      phase: "Before taxi",
      applicability: { variants: ["35A"] },
      steps: [
        { id: "jd-at-spoileron", action: "Perform the source's spoileron/reset and spoiler extension/retraction check sequence.", sources: [jaydee("After Engine Start / Before Taxi", "3")] },
        { id: "jd-at-generator", action: "With both engines running, perform the generator-load check described by the source.", sources: [jaydee("After Engine Start / Before Taxi", "3")] },
        { id: "jd-at-governor", action: "Perform left/right fuel-control-governor response checks exactly as described in the simulator workflow.", sources: [jaydee("After Engine Start / Before Taxi", "3")] },
        { id: "jd-at-wshld", action: "Perform first-flight-of-day windshield-heat purge/check if applicable to the simulation workflow.", sources: [jaydee("After Engine Start / Before Taxi", "3")] },
      ],
      sources: [jaydee("After Engine Start / Before Taxi", "3")],
    },
    {
      id: "jd-before-takeoff",
      title: "Before takeoff",
      phase: "Before takeoff",
      applicability: { variants: ["35A"] },
      steps: [
        { id: "jd-bto-controls", action: "Flight controls full/free; reversers arm; avionics/frequencies and autopilot setup checked; N1 reminder set; spoilers retracted.", sources: [jaydee("Before Takeoff", "3") ] },
        { id: "jd-bto-config", action: "Set takeoff flaps (8° or 20°) and takeoff trim; anti-ice as required; pitot heat on; windshield heat as specified by the workflow.", sources: [jaydee("Before Takeoff", "3") ] },
        { id: "jd-bto-systems", action: "Verify radio altimeter, both inverters, AIR IGN, stall warning, bleed, pressurization, cabin air/climate and yaw-damper power as described.", sources: [jaydee("Before Takeoff", "3") ] },
        { id: "jd-bto-external", action: "Set transponder/weather radar and exterior lights for departure as required by the workflow.", sources: [jaydee("Before Takeoff", "3") ] },
      ],
      sources: [jaydee("Before Takeoff", "3")],
    },
    {
      id: "jd-takeoff-climb",
      title: "Takeoff and initial climb",
      phase: "Takeoff / climb",
      applicability: { variants: ["35A"] },
      steps: [
        { id: "jd-to-lineup", action: "Line up/brake, stabilize approximately 40% N1, release brakes and set the source-defined takeoff power.", sources: [jaydee("Takeoff", "3") ] },
        { id: "jd-to-alive", action: "At airspeed alive release nosewheel steering; at VR rotate to approximately 9° nose up.", sources: [jaydee("Takeoff", "3") ] },
        { id: "jd-to-positive", action: "Positive rate: gear up and yaw damper on; maintain at least V2 and not more than 200 KIAS in the workflow.", sources: [jaydee("Takeoff", "3") ] },
        { id: "jd-to-flaps", action: "At V2 + 30 retract flaps; at 1,500 ft set climb power and accelerate toward the workflow climb profile.", sources: [jaydee("Takeoff", "3") ] },
      ],
      sources: [jaydee("Takeoff / Enroute Climb Profile", "3–4")],
    },
    {
      id: "jd-climb-cruise-descent",
      title: "After takeoff, climb, cruise and descent",
      phase: "Enroute",
      applicability: { variants: ["35A"] },
      steps: [
        { id: "jd-cl-climb", action: "Set climb power; verify reversers off, flaps/gear up, engine sync/yaw damper as specified, anti-ice as required and AIR IGN off; monitor pressurization, climate, hydraulics and AOA.", sources: [jaydee("After Take-off / Climb", "4")] },
        { id: "jd-cl-10", action: "At 10,000 ft configure passenger signs and landing/recognition lights as required; at transition altitude set standard pressure.", sources: [jaydee("After Take-off / Climb", "4")] },
        { id: "jd-cl-cruise", action: "Set cruise power, manage fuel balance, anti-ice and pressurization/climate.", sources: [jaydee("Cruise", "4")] },
        { id: "jd-cl-descent", action: "Before/descent: determine and bug VREF/go-around speed and N1 limit, set avionics/frequencies, configure anti-ice/windshield heat and pressurization for landing elevation, and brief/secure cabin as stated.", sources: [jaydee("Descent", "4")] },
      ],
      sources: [jaydee("After Take-off / Climb / Cruise / Descent", "4")],
    },
    {
      id: "jd-approach-landing",
      title: "Approach and landing workflow",
      phase: "Approach / landing",
      applicability: { variants: ["35A"] },
      steps: [
        { id: "jd-app-check", action: "Before downwind or localizer capture, check circuit breakers, hydraulic/emergency-air pressure, fuel balance, speeds/N1 and avionics/frequencies.", sources: [jaydee("Approach", "5") ] },
        { id: "jd-app-before-landing", action: "On downwind or glideslope: gear down/three green, AIR IGN on, landing lights on, anti-skid on, spoilers retracted, flaps 20°, engine sync off.", sources: [jaydee("Before Landing", "5") ] },
        { id: "jd-app-final", action: "Use the source's visual or instrument profile to reach final, then flaps 40°, VREF and AP/YD off for its landing drill.", sources: [jaydee("Visual Pattern Landing / Instrument Landing", "5") ] },
        { id: "jd-app-land", action: "At the threshold/flare use the source's power reduction and touchdown technique; reverse as necessary in the simulator workflow.", sources: [jaydee("Landing", "5") ] },
      ],
      sources: [jaydee("Approach / Before Landing / Landing", "5")],
    },
    {
      id: "jd-go-around",
      title: "Go-around workflow",
      phase: "Go-around",
      applicability: { variants: ["35A"] },
      steps: [
        { id: "jd-ga-power", action: "Takeoff power and approximately 9° pitch up; maintain at least VREF.", sources: [jaydee("Go-Around", "5") ] },
        { id: "jd-ga-positive", action: "Positive rate: gear up and yaw damper on.", sources: [jaydee("Go-Around", "5") ] },
        { id: "jd-ga-20", action: "At VREF + 7 select flaps 20°; at VREF + 30 retract flaps.", sources: [jaydee("Go-Around", "5") ] },
        { id: "jd-ga-climb", action: "At 1,500 ft set climb power and accelerate toward 250 KIAS per the workflow.", sources: [jaydee("Go-Around", "5") ] },
      ],
      sources: [jaydee("Go-Around", "5")],
    },
    {
      id: "jd-after-landing-shutdown",
      title: "After landing and shutdown",
      phase: "After landing / shutdown",
      applicability: { variants: ["35A"] },
      steps: [
        { id: "jd-al-config", action: "Clear of runway: flaps up, spoilers retracted, reversers disarmed, exterior lights and AIR IGN configured, cabin air/anti-ice/pitot/windshield heat/transponder/radar set as the workflow specifies.", sources: [jaydee("After Landing / Clear of Runway", "5") ] },
        { id: "jd-al-hyd", action: "Check hydraulic pressure; observe the workflow's optional single-engine shutdown/cooldown note only as a simulator-workflow item.", sources: [jaydee("After Landing / Clear of Runway", "5") ] },
        { id: "jd-sd-park", action: "Parking brake set; anti-ice off; configure switches for shutdown; cage standby attitude gyro; emergency power off.", sources: [jaydee("Shutdown", "5") ] },
        { id: "jd-sd-engine", action: "After the source's stated cooldown, thrust levers cut off, START-GEN off, inverters off, fuel transfer off, cross-flow closed, exterior lights and batteries off; apply EFB chocks/covers as desired.", sources: [jaydee("Shutdown", "5") ] },
      ],
      sources: [jaydee("After Landing / Shutdown", "5")],
    },
  ],
};

/**
 * Model-specific implementation learning for the Flysimware Learjet 35A.
 * These topics answer "where/how is this represented in this add-on?" while
 * the FlightSafety systems course answers "how does the aircraft system work?".
 */
export const learjet3536FlysimwareAvionics: AircraftAvionicsContent = {
  aircraftId: AIRCRAFT_ID,
  title: "Flysimware Learjet 35A Cockpit & Avionics Implementation",
  sourceNote:
    "Implementation supplement for the Flysimware Learjet 35A v1.2. Use it to learn the add-on's controls, panels, navigation choices and EFB after learning the real-standard system concept.",
  disclaimer:
    "Simulator implementation reference only. Control interaction and modeled behavior may differ from a specific real Learjet installation and never override approved aircraft documentation.",
  topics: [
    {
      id: "fsm-cockpit-map",
      title: "Cockpit panel map",
      summary: "Learn the add-on's main panel, pilot/copilot panels, engine panel, glareshield, start/pressurization/anti-ice panels, center pedestal, throttle quadrant and sidewalls as a practical navigation index.",
      configuration: "Flysimware Learjet 35A v1.2",
      remember: ["Use the panel map to find a control; use the FlightSafety lesson to understand the underlying aircraft system."],
      sources: [flysimware("Cockpit — Overview of Panels", "5, 8–9")],
    },
    {
      id: "fsm-autopilot",
      title: "Autopilot / flight-director panel implementation",
      summary: "The add-on documents lateral/vertical modes including SPD, V/S, GS, ALT/SEL and ALT HLD and how its panel presents those selections.",
      configuration: "Flysimware implementation; installed avionics package may change available behavior.",
      procedures: ["Identify the active navigation source before selecting NAV/GS", "Use ALT/SEL for capture of the preselected altitude", "Confirm the resulting active mode rather than relying only on the button press"],
      remember: ["GS requires valid glideslope data and NAV mode according to the Flysimware manual."],
      sources: [flysimware("Autopilot Panel — Vertical Modes", "68")],
    },
    {
      id: "fsm-start-panel",
      title: "Start panel and engine-start interaction",
      summary: "Locate and operate the modeled start/generator, ignition and related start controls in the add-on, then monitor the same N2/ITT/N1 concepts taught in the real-standard powerplant course.",
      configuration: "Flysimware Learjet 35A v1.2",
      remember: ["The implementation manual teaches mouse/control interaction; the FlightSafety source remains the system-concept reference."],
      sources: [flysimware("Cockpit Detailed Information — Start Panel / Engine Start", "5, 63–67")],
    },
    {
      id: "fsm-annunciators",
      title: "Annunciator and warning panel implementation",
      summary: "Use the add-on panel documentation to recognize modeled annunciators such as fuel pressure, door, generator, cabin-altitude and anti-ice indications.",
      configuration: "Flysimware Learjet 35A v1.2",
      remember: ["Do not memorize an annunciator in isolation; connect it to the system lesson and the configuration that generates it."],
      sources: [flysimware("Annunciator Warning Panel", "55–61")],
    },
    {
      id: "fsm-lower-center-tests",
      title: "Lower-center panel and system-test interaction",
      summary: "The add-on documents anti-skid, stall-warning, hydraulic-pump and warning/test selector interactions, including how modeled Mach, fire, cabin-altitude and stall tests are triggered.",
      configuration: "Flysimware Learjet 35A v1.2",
      remember: ["Treat the add-on test steps as implementation knowledge; compare system meaning against the FlightSafety chapters."],
      sources: [flysimware("Lower Center Panel Detailed Information", "72")],
    },
    {
      id: "fsm-yaw-damper",
      title: "Yaw-damper implementation",
      summary: "The center-pedestal documentation describes primary/secondary yaw-damper power, test and engagement indications for the modeled FC-530-equipped installation.",
      configuration: "FC-530-style Flysimware implementation",
      procedures: ["Power the selected system", "Use the documented test function and observe effort/annunciator response", "Engage only one PRI/SEC system at a time as modeled"],
      sources: [flysimware("Center Pedestal — Yaw Damper", "77")],
    },
    {
      id: "fsm-navigation-options",
      title: "Navigation-unit options",
      summary: "The EFB avionics page can select GNS530, GTN750 or GTN750Xi options depending on the platform/product configuration; the source says changes are ground-only for proper initialization.",
      configuration: "Flysimware add-on option, not a universal Learjet installation",
      remember: ["Choose the avionics lesson that matches the simulated installation; do not generalize one GPS package to the aircraft type."],
      sources: [flysimware("EFB — Avionics Page", "98")],
    },
    {
      id: "fsm-efb-performance",
      title: "EFB environment/performance page",
      summary: "The add-on EFB can combine runway selection with live METAR or manual weather inputs and aircraft configuration to generate simulator performance outputs.",
      configuration: "Flysimware EFB implementation",
      remember: ["These simulator-generated values are not a substitute for approved real-aircraft performance data."],
      sources: [flysimware("EFB — Environment / Performance", "86, 90")],
    },
    {
      id: "fsm-fuel-efb",
      title: "EFB fuel servicing",
      summary: "The Flysimware fuel page controls simulated fuel loading/servicing and can display quantity in pounds or gallons.",
      configuration: "Flysimware EFB implementation",
      sources: [flysimware("EFB — Fuel Page", "95")],
    },
    {
      id: "fsm-failures",
      title: "Failure-generation tools for training",
      summary: "The add-on provides MTBF, speed-triggered and scheduled failure modes plus maintenance/reset controls for repeatable training scenarios.",
      configuration: "Flysimware EFB implementation",
      procedures: ["Use scheduled mode for repeatable scenario training", "Hide failure-list information when practicing recognition rather than diagnosis-by-menu", "Reset failures/maintenance only as needed for the next training objective"],
      remember: ["Failure injection is a training tool, not an aircraft-system source of authority."],
      sources: [flysimware("EFB — Failures Page", "92")],
    },
  ],
};

export const learjet3536CompleteCoreModules = [
  { aircraftId: AIRCRAFT_ID, domain: "checklists" as const, payload: learjet3536NativeChecklists },
  { aircraftId: AIRCRAFT_ID, domain: "procedures" as const, payload: learjet3536CompleteProcedures },
  { aircraftId: AIRCRAFT_ID, domain: "performance" as const, payload: learjet3536NativePerformance },
  { aircraftId: AIRCRAFT_ID, domain: "limitations" as const, payload: learjet3536NativeLimitations },
  { aircraftId: AIRCRAFT_ID, domain: "systems" as const, payload: learjet3536CompleteSystems },
  { aircraftId: AIRCRAFT_ID, domain: "flows" as const, payload: learjet3536JayDeeFlows },
  { aircraftId: AIRCRAFT_ID, domain: "avionics" as const, payload: learjet3536FlysimwareAvionics },
] as const;
