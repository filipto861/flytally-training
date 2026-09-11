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
  AircraftProcedure,
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

export const learjet3536CompleteSystems: AircraftSystemsContent = {
  ...learjet3536NativeSystems,
  title: "Learjet 35/36 Complete Systems Course",
  sourceNote:
    "FlightSafety Learjet 35/36 Pilot Training Manual Revision 1.1 is the core systems syllabus. Simulator sources are kept in separate implementation/workflow modules.",
  systems: [
    {
      id: "aircraft-general",
      title: "Aircraft General, Structure & Doors",
      summary: "Start with the pressure vessel, wing, empennage, doors/exits and major system locations before learning switch logic.",
      mentalModel: "Know what is structural, what penetrates the pressure vessel, and which aircraft configuration you are studying.",
      components: ["Pressure vessel", "Wing and tip tanks", "Empennage", "Passenger/crew door", "Emergency exit", "Nose and tailcone access areas"],
      indications: ["Door/security indications where installed", "External preflight condition"],
      limitations: ["Training-manual maximum operating altitude: 45,000 ft"],
      remember: ["The manual covers 35, 35A, 36 and 36A serial-number ranges.", "Do not infer AAK/ECR equipment from the model name."],
      sources: [fsi(1, "Aircraft General — Introduction / Structures / Aircraft Systems", "1-1–1-14")],
    },
    ...learjet3536NativeSystems.systems,
    {
      id: "lighting",
      title: "Lighting",
      summary: "Internal and external lighting is distributed across aircraft electrical buses and flight-phase controls.",
      mentalModel: "Treat lights as electrical consumers with specific bus sources and controls, not as one master subsystem.",
      components: ["Navigation/position lights", "Beacon/strobes", "Recognition lights", "Landing/taxi lights", "Cockpit/cabin lighting"],
      controls: ["Exterior-light switches", "Landing/taxi selections", "Cockpit/cabin dimming"],
      indications: ["Selected light operation", "Associated electrical load"],
      sources: [fsi(3, "Lighting — Exterior Lighting / Landing-Taxi Lights", "3-1–3-10")],
    },
    {
      id: "master-warning",
      title: "Master Warning & Annunciators",
      summary: "Master-warning and annunciator logic provides the attention-getting layer for system faults and status changes.",
      mentalModel: "The master warning gets attention; the associated annunciator identifies the system requiring diagnosis.",
      components: ["Glareshield annunciator panel", "MSTR WARN lights", "System annunciators", "Test/dim functions"],
      controls: ["Warning/annunciator test controls", "MSTR WARN reset"],
      indications: ["Red/amber warning and advisory indications", "Configuration-dependent flashing/steady behavior"],
      remember: ["Resetting an attention light does not remove the underlying fault."],
      sources: [fsi(4, "Master Warning System", "4-1–4-7")],
    },
    {
      id: "fire-protection",
      title: "Fire Protection",
      summary: "Engine fire detection, FIRE PULL isolation/arming and extinguisher discharge form distinct stages of the fire-protection system.",
      mentalModel: "Separate detection, isolation/arming and bottle discharge in your head.",
      components: ["Engine fire detection", "FIRE PULL handles", "Extinguisher bottles", "Discharge circuits"],
      controls: ["Fire-detection test", "FIRE PULL handle", "Bottle discharge controls"],
      indications: ["FIRE PULL illumination", "MSTR WARN", "Extinguisher status"],
      abnormalCues: ["Engine fire warning", "Persistent fire indication"],
      remember: ["Pulling the affected fire handle isolates associated fuel, hydraulic and bleed-air services and arms extinguishing capability."],
      sources: [fsi(8, "Fire Protection — Detection / Extinguishing", "8-1–8-7")],
    },
    {
      id: "air-conditioning",
      title: "Air Conditioning & Environmental Control",
      summary: "Bleed-air conditioning plus installed cooling/heating equipment controls cockpit and cabin temperature.",
      mentalModel: "Environmental-control symptoms can originate in pneumatic supply, electrical supply or local temperature-control hardware.",
      components: ["Bleed-air flow control", "Temperature-control/H-valve system", "Cabin/cockpit distribution", "Freon cooling where installed", "Auxiliary heat where installed"],
      controls: ["CABIN AIR", "Temperature controls", "Cabin blower", "Optional cooling/heating controls"],
      indications: ["Temperature-control indication", "Cabin/cockpit temperature response"],
      remember: ["Optional environmental equipment is configuration-dependent."],
      sources: [fsi(11, "Air Conditioning — General / Controls / Questions", "11-1–11-22")],
    },
    {
      id: "avionics-airdata-autoflight",
      title: "Air Data, Flight Director & Autopilot",
      summary: "The training manual describes pitot-static/air-data equipment plus FC-200 and FC-530 flight-director/autopilot installations.",
      mentalModel: "Identify the installed AFCS/air-data configuration first; then learn source selection, mode engagement and reversion/disconnect behavior.",
      components: ["Pitot-static sources", "Air-data equipment", "FC-200/FC-530 AFCS", "Flight director", "Autopilot", "Altitude alerting/RVSM equipment as installed"],
      controls: ["AFCS control panel", "Control-wheel disconnect/trim controls", "Navigation-source selectors", "Static-source controls"],
      indications: ["ADI/HSI command and modes", "Altitude capture/alerting", "Autopilot engagement/disconnect", "Air-data indications"],
      abnormalCues: ["Unexpected mode reversion", "Autopilot disconnect", "Air-data disagreement"],
      remember: ["FC-200 and FC-530 are different configurations and must not be blended into one memorized profile."],
      sources: [fsi(16, "Avionics — FC-200 / FC-530 / Autoflight / RVSM", "16-1–16-43")],
    },
    {
      id: "miscellaneous-systems",
      title: "Miscellaneous Systems & Ground/Air Logic",
      summary: "Squat-switch and relay logic distributes ground/air state to multiple otherwise unrelated systems.",
      mentalModel: "A single ground/air-logic fault can produce symptoms in several systems at once.",
      components: ["Main-gear squat switches", "Squat-switch relay box", "Ground/air interlocks"],
      indications: ["System behavior changing between ground and air logic"],
      abnormalCues: ["Several unrelated systems showing incorrect ground/air behavior"],
      remember: ["Both main-gear squat switches must indicate air mode for the relay box to provide air-mode signals."],
      sources: [fsi(17, "Miscellaneous Systems — Squat Switches / Relay Box", "17-1–17-11")],
    },
    {
      id: "weight-balance",
      title: "Weight & Balance",
      summary: "Loading must remain within the applicable configuration's CG envelope through the relevant fuel/load states.",
      mentalModel: "Weight and balance is not a single maximum-weight check; CG, configuration and fuel burn all matter.",
      components: ["CG envelope", "Basic/loading data", "Passenger/baggage moments", "Fuel moments", "Fuel-used moment loss"],
      normalOperation: ["Verify planned and expected flight-loading states remain inside the applicable envelope"],
      remember: ["The pilot is responsible for ensuring the aircraft remains within the applicable loading envelope."],
      sources: [fsi(19, "Weight and Balance", "19-1–19-14")],
    },
    {
      id: "crm",
      title: "Crew Resource Management",
      summary: "CRM connects technical knowledge to two-pilot operation through communication, monitoring, workload management and decision making.",
      mentalModel: "Knowing the system is insufficient if the crew cannot detect, communicate and manage a developing problem.",
      components: ["Communication", "Situational awareness", "Workload/resource management", "Decision making", "Monitoring/cross-check"],
      normalOperation: ["Use clear PF/PM roles", "Use SOP cross-checks", "Apply structured decision making when time permits"],
      remember: ["T-DODAR: Time, Diagnose, Options, Decide, Assign/Act, Review."],
      sources: [fsi(21, "Crew Resource Management — Decision Making / T-DODAR", "21-1–21-10")],
    },
  ],
};

const extraProcedures: readonly AircraftProcedure[] = [
  {
    id: "visual-pattern-normal",
    title: "Visual traffic pattern — two engines",
    phase: "Approach",
    summary: "Chapter 18 configuration and VREF-additive profile for a normal visual pattern.",
    steps: [
      { id: "visual-entry", action: "Enter with gear/flaps up at VREF + 40 kt minimum and complete the Approach checklist.", sources: [fsi(18, "Visual Approach Normal", "18-28")] },
      { id: "visual-8", action: "On downwind select flaps 8° and target VREF + 30 kt.", sources: [fsi(18, "Visual Approach Normal", "18-28")] },
      { id: "visual-20", action: "Select flaps 20°, gear down and VREF + 20 kt; complete Before Landing checklist.", sources: [fsi(18, "Visual Approach Normal", "18-28")] },
      { id: "visual-final", action: "On final configure flaps 40° and stabilize at VREF minimum.", sources: [fsi(18, "Visual Approach Normal", "18-28")] },
    ],
    sources: [fsi(18, "Visual Approach Normal", "18-28")],
  },
  {
    id: "visual-pattern-single-engine",
    title: "Visual traffic pattern — single engine",
    phase: "Approach",
    summary: "Single-engine pattern with flaps 20° and VREF + 10 kt on final.",
    steps: [
      { id: "se-entry", action: "Enter with gear/flaps up at VREF + 40 kt minimum and complete the Approach checklist.", sources: [fsi(18, "Visual Approach Single Engine", "18-29")] },
      { id: "se-config", action: "Progress through flaps 8° / VREF + 30, then flaps 20°, gear down / VREF + 20 on downwind.", sources: [fsi(18, "Visual Approach Single Engine", "18-29")] },
      { id: "se-final", action: "Fly final with flaps 20° at VREF + 10 kt through landing; PF may reduce rudder trim on final.", sources: [fsi(18, "Visual Approach Single Engine", "18-29")] },
    ],
    sources: [fsi(18, "Visual Approach Single Engine", "18-29")],
  },
  {
    id: "flaps-up-landing",
    title: "Flaps-up landing training profile",
    phase: "Approach",
    summary: "Chapter 18 flaps-up profile including the training-manual landing-distance correction.",
    steps: [
      { id: "fu-distance", action: "Determine corrected landing distance before committing.", expectedResult: "Training-manual correction: normal landing distance × 1.35.", sources: [fsi(18, "Flaps Up Landing", "18-30")] },
      { id: "fu-entry", action: "Entry: gear/flaps up, VREF + 40 kt, Approach checklist complete.", sources: [fsi(18, "Flaps Up Landing", "18-30")] },
      { id: "fu-downwind", action: "Downwind: gear down, Before Landing checklist complete, maintain VREF + 40 kt.", sources: [fsi(18, "Flaps Up Landing", "18-30")] },
      { id: "fu-final", action: "Final: VREF + 30 kt; yaw damper disengaged before touchdown.", sources: [fsi(18, "Flaps Up Landing", "18-30")] },
    ],
    sources: [fsi(18, "Flaps Up Landing", "18-30")],
  },
  {
    id: "precision-approach",
    title: "Precision instrument approach training profile",
    phase: "Approach",
    summary: "Staged Chapter 18 configuration/speed gates for a stabilized precision approach.",
    steps: [
      { id: "pa-iaf", action: "Approaching IAF: gear/flaps up, VREF + 40 kt minimum, Approach checklist complete.", sources: [fsi(18, "Precision Approach Normal", "18-31")] },
      { id: "pa-outbound", action: "IAF outbound: flaps 8°, VREF + 30 kt minimum; descend if required.", sources: [fsi(18, "Precision Approach Normal", "18-31")] },
      { id: "pa-inbound", action: "On course inbound: flaps 20°, gear down, VREF + 20 kt minimum; complete Before Landing checklist to flaps 40°.", sources: [fsi(18, "Precision Approach Normal", "18-31")] },
      { id: "pa-faf", action: "FAF, normal two-engine profile: flaps 40°, VREF minimum, Before Landing checklist complete.", sources: [fsi(18, "Precision Approach Normal", "18-31")] },
      { id: "pa-se", action: "Single-engine: maintain flaps 20° at VREF + 10 kt from FAF inbound.", sources: [fsi(18, "Precision Approach Normal", "18-31")] },
    ],
    sources: [fsi(18, "Precision Approach Normal", "18-31")],
  },
  {
    id: "nonprecision-approach",
    title: "Non-precision instrument approach training profile",
    phase: "Approach",
    summary: "Staged configuration and stabilized final profile for non-precision approaches.",
    steps: [
      { id: "npa-iaf", action: "Approaching IAF: gear/flaps up, VREF + 40 kt, Approach checklist complete.", sources: [fsi(18, "Non-Precision Approach Normal", "18-32–18-33")] },
      { id: "npa-outbound", action: "IAF outbound: flaps 8°, VREF + 30 kt; descend if required.", sources: [fsi(18, "Non-Precision Approach Normal", "18-32–18-33")] },
      { id: "npa-inbound", action: "On course inbound: flaps 20°, gear down, VREF + 20 kt; Before Landing checklist to flaps 40°.", sources: [fsi(18, "Non-Precision Approach Normal", "18-32–18-33")] },
      { id: "npa-faf", action: "FAF, normal two-engine profile: flaps 40° and VREF minimum.", sources: [fsi(18, "Non-Precision Approach Normal", "18-32–18-33")] },
      { id: "npa-se", action: "Single-engine: maintain flaps 20° at VREF + 10 kt from FAF inbound.", sources: [fsi(18, "Non-Precision Approach Normal", "18-32–18-33")] },
    ],
    sources: [fsi(18, "Non-Precision Approach Normal", "18-32–18-33")],
  },
  {
    id: "go-around-profile",
    title: "Go-around / balked landing",
    phase: "Go-around",
    summary: "Chapter 18 go-around profile, retaining AFCS-specific caveats.",
    steps: [
      { id: "ga-simultaneous", action: "Disengage autopilot as required, establish about 9° nose-up, set takeoff power/as required and verify spoilers retracted.", sources: [fsi(18, "Go-Around/Balked Landing", "18-35")] },
      { id: "ga-flaps20", action: "At or above VREF select flaps 20°.", sources: [fsi(18, "Go-Around/Balked Landing", "18-35")] },
      { id: "ga-positive", action: "Positive rate: gear up and yaw damper on.", sources: [fsi(18, "Go-Around/Balked Landing", "18-35")] },
      { id: "ga-vref7", action: "Accelerate to approach climb speed, approximately VREF + 7 kt.", sources: [fsi(18, "Go-Around/Balked Landing", "18-35")] },
      { id: "ga-clear", action: "Clear of obstacles: accelerate to VREF + 30 kt and retract flaps.", sources: [fsi(18, "Go-Around/Balked Landing", "18-35")] },
    ],
    sources: [fsi(18, "Go-Around/Balked Landing", "18-35")],
  },
  {
    id: "single-engine-drift-down",
    title: "Single-engine drift-down speed schedule",
    phase: "Abnormal / high altitude",
    summary: "Training schedule for minimum sink above the single-engine ceiling and approximate best-rate climb below it.",
    steps: [
      { id: "dd-power", action: "Set maximum continuous thrust on the operating engine.", sources: [fsi(18, "Single-Engine Drift Down", "18-36")] },
      { id: "dd-170", action: "Maintain altitude until 170 KIAS, then descend at 170 KIAS until Mach 0.50.", sources: [fsi(18, "Single-Engine Drift Down", "18-36")] },
      { id: "dd-mach", action: "Descend at Mach 0.50 until airspeed reaches 200 KIAS.", sources: [fsi(18, "Single-Engine Drift Down", "18-36")] },
      { id: "dd-200", action: "Descend at 200 KIAS to single-engine cruise altitude.", sources: [fsi(18, "Single-Engine Drift Down", "18-36")] },
    ],
    sources: [fsi(18, "Single-Engine Drift Down", "18-36")],
  },
  {
    id: "pilot-incapacitation",
    title: "Pilot incapacitation recognition and response",
    phase: "Abnormal / CRM",
    summary: "Recognition and immediate crew-resource response based on Chapter 18 monitoring discipline.",
    steps: [
      { id: "incap-recognize", action: "Treat failure to respond to repeated communication or an uncorrected significant deviation as an incapacitation warning per the training profile.", sources: [fsi(18, "Pilot Incapacitation", "18-40")] },
      { id: "incap-control", action: "Remaining pilot takes control and returns the aircraft to a safe profile if required.", sources: [fsi(18, "Pilot Incapacitation", "18-40")] },
      { id: "incap-resources", action: "Use autopilot and available crew resources; declare an emergency or go around when warranted.", sources: [fsi(18, "Pilot Incapacitation", "18-40")] },
    ],
    sources: [fsi(18, "Pilot Incapacitation", "18-40")],
  },
];

export const learjet3536CompleteProcedures: AircraftProcedureContent = {
  ...learjet3536NativeProcedures,
  title: "Learjet 35/36 Complete Operating & Maneuver Procedures",
  sourceNote: "FlightSafety Chapter 18 and related system chapters form the procedure core. Approved aircraft/operator procedures remain controlling.",
  procedures: [...learjet3536NativeProcedures.procedures, ...extraProcedures],
};

const jdApplicability = { variants: ["35A"] as const, note: "JayDee source is written for a Learjet 35A simulator workflow." };
const jdStep = (id: string, action: string, section: string, page: string, verification?: string) => ({
  id,
  action,
  ...(verification ? { verification } : {}),
  sources: [jaydee(section, page)],
});

export const learjet3536JayDeeFlows: AircraftFlowsContent = {
  aircraftId: AIRCRAFT_ID,
  title: "Learjet 35A Workflow Drill — JayDee v1.35.WIP1",
  sourceNote: "This reproduces the short checklist/workflow you supplied as a drill layer, separate from the FlightSafety-based real-standard modules.",
  disclaimer: "Simulator workflow reference only. The source explicitly states that some procedures are intentionally altered from real-world procedures.",
  flows: [
    {
      id: "jd-preflight-full",
      title: "Full preflight / powered checks",
      phase: "Preflight",
      applicability: jdApplicability,
      steps: [
        jdStep("pf-config", "Set EFB configuration/externals, fuel and payload as desired.", "Preflight Check (Full)", "2"),
        jdStep("pf-controls-oxy", "Flight controls full/free; oxygen system and circuit breakers checked.", "Preflight Check (Full)", "2"),
        jdStep("pf-emergency", "Perform emergency-power check sequence and verify the stated gyro/EMER PWR/gear indications.", "Preflight Check (Full)", "2"),
        jdStep("pf-battery", "Perform Battery 1/2 voltage and EMER PWR checks, then select both batteries on.", "Preflight Check (Full)", "2"),
        jdStep("pf-inverter", "Perform primary/secondary inverter and AC-bus checks; finish with both inverters on.", "Preflight Check (Full)", "2"),
        jdStep("pf-pressure", "Check emergency-air and hydraulic pressure; use auxiliary hydraulic pump if required by the workflow, then return it off.", "Preflight Check (Full)", "2"),
        jdStep("pf-warnings", "Perform warning-light, gear-light, fire-detection and cabin-altitude warning checks.", "Preflight Check (Full)", "2"),
        jdStep("pf-flight-warning", "Perform stick-puller/Mach warning, Mach trim and stall-warning checks in the source sequence.", "Preflight Check (Full)", "2"),
      ],
      sources: [jaydee("Normal Procedures — Preflight Check (Full)", "2")],
    },
    {
      id: "jd-engine-start",
      title: "Engine start",
      phase: "Start",
      applicability: jdApplicability,
      steps: [
        jdStep("es-ready", "Covers/chocks removed, door closed, anti-ice off, fuel computers on, electrical/start prerequisites and parking brake checked.", "Engine Start", "3"),
        jdStep("es-start", "Selected START-GEN to START.", "Engine Start", "3"),
        jdStep("es-idle", "At minimum 10% N2 with N1 rotation, move the thrust lever to IDLE and monitor ignition, ITT, oil pressure and fuel flow.", "Engine Start", "3"),
        jdStep("es-release", "At approximately 45–50% N2 verify starter and AIR IGN release/extinguish.", "Engine Start", "3"),
        jdStep("es-gen", "Disconnect GPU as applicable, select GEN, check DC output and engine indications; repeat/continue as required.", "Engine Start", "3"),
      ],
      sources: [jaydee("Engine Start", "3")],
    },
    {
      id: "jd-after-start-before-taxi",
      title: "After engine start / before taxi checks",
      phase: "Before taxi",
      applicability: jdApplicability,
      steps: [
        jdStep("at-spoileron", "Perform the source's spoileron/reset and spoiler extension/retraction check.", "After Engine Start / Before Taxi", "3"),
        jdStep("at-generator", "With both engines running, perform the generator-load check.", "After Engine Start / Before Taxi", "3"),
        jdStep("at-governor", "Perform left/right fuel-control-governor response checks as described by the workflow.", "After Engine Start / Before Taxi", "3"),
        jdStep("at-wshld", "Perform first-flight-of-day windshield-heat purge/check when applicable to this workflow.", "After Engine Start / Before Taxi", "3"),
      ],
      sources: [jaydee("After Engine Start / Before Taxi", "3")],
    },
    {
      id: "jd-before-takeoff",
      title: "Before takeoff",
      phase: "Before takeoff",
      applicability: jdApplicability,
      steps: [
        jdStep("bto-controls", "Flight controls free; reversers armed; avionics/frequencies/autopilot/N1 reminder checked; spoilers retracted.", "Before Takeoff", "3"),
        jdStep("bto-config", "Set takeoff flaps and trim; anti-ice as required; pitot heat and windshield heat configured.", "Before Takeoff", "3"),
        jdStep("bto-systems", "Verify radio altimeter, inverters, AIR IGN, stall warning, bleed, pressurization, cabin air/climate and yaw-damper power.", "Before Takeoff", "3"),
        jdStep("bto-external", "Set transponder/weather radar and exterior lights as required.", "Before Takeoff", "3"),
      ],
      sources: [jaydee("Before Takeoff", "3")],
    },
    {
      id: "jd-takeoff-climb",
      title: "Takeoff and initial climb",
      phase: "Takeoff / climb",
      applicability: jdApplicability,
      steps: [
        jdStep("to-power", "Line up/brake, stabilize around 40% N1, release brakes and set the source-defined takeoff power.", "Takeoff", "3"),
        jdStep("to-rotate", "At airspeed alive release NWS; at VR rotate to approximately 9° nose up.", "Takeoff", "3"),
        jdStep("to-positive", "Positive rate: gear up and yaw damper on; maintain at least V2 and no more than 200 KIAS in this workflow.", "Takeoff", "3"),
        jdStep("to-flaps", "At V2 + 30 retract flaps; at 1,500 ft set climb power and accelerate toward the climb profile.", "Takeoff", "3"),
      ],
      sources: [jaydee("Takeoff / Enroute Climb Profile", "3–4")],
    },
    {
      id: "jd-climb-cruise-descent",
      title: "After takeoff, climb, cruise and descent",
      phase: "Enroute",
      applicability: jdApplicability,
      steps: [
        jdStep("ccd-climb", "Set climb power; verify reversers off, flaps/gear up, engine sync/yaw damper, anti-ice, AIR IGN, pressurization, hydraulics and AOA as described.", "After Take-off / Climb", "4"),
        jdStep("ccd-10000", "At 10,000 ft configure signs/lights; at transition altitude set standard pressure.", "After Take-off / Climb", "4"),
        jdStep("ccd-cruise", "Set cruise power and manage fuel balance, anti-ice and pressurization/climate.", "Cruise", "4"),
        jdStep("ccd-descent", "For descent set/bug VREF, go-around speed and N1 limit; prepare avionics, anti-ice, pressurization and cabin.", "Descent", "4"),
      ],
      sources: [jaydee("After Take-off / Climb / Cruise / Descent", "4")],
    },
    {
      id: "jd-approach-landing",
      title: "Approach and landing workflow",
      phase: "Approach / landing",
      applicability: jdApplicability,
      steps: [
        jdStep("app-check", "Before downwind/LOC capture check circuit breakers, pressures, fuel balance, speeds/N1 and avionics/frequencies.", "Approach", "5"),
        jdStep("app-before-landing", "On downwind/glideslope: gear down/three green, AIR IGN and landing lights on, anti-skid on, spoilers retracted, flaps 20°, engine sync off.", "Before Landing", "5"),
        jdStep("app-final", "Use the source's visual/instrument profile to final, then flaps 40°, VREF and AP/YD off for its landing drill.", "Visual Pattern Landing / Instrument Landing", "5"),
        jdStep("app-land", "At threshold/flare use the workflow's power reduction and touchdown technique; reverse as necessary.", "Landing", "5"),
      ],
      sources: [jaydee("Approach / Before Landing / Landing", "5")],
    },
    {
      id: "jd-go-around",
      title: "Go-around workflow",
      phase: "Go-around",
      applicability: jdApplicability,
      steps: [
        jdStep("jd-ga-power", "Takeoff power and approximately 9° pitch up; maintain at least VREF.", "Go-Around", "5"),
        jdStep("jd-ga-positive", "Positive rate: gear up and yaw damper on.", "Go-Around", "5"),
        jdStep("jd-ga-flaps", "At VREF + 7 select flaps 20°; at VREF + 30 retract flaps.", "Go-Around", "5"),
        jdStep("jd-ga-climb", "At 1,500 ft set climb power and accelerate toward 250 KIAS per the workflow.", "Go-Around", "5"),
      ],
      sources: [jaydee("Go-Around", "5")],
    },
    {
      id: "jd-after-landing-shutdown",
      title: "After landing and shutdown",
      phase: "After landing / shutdown",
      applicability: jdApplicability,
      steps: [
        jdStep("als-clear", "Clear of runway: flaps up, spoilers retracted, reversers disarmed, lights/AIR IGN/cabin air/anti-ice/pitot/windshield heat/transponder/radar configured.", "After Landing / Clear of Runway", "5"),
        jdStep("als-hyd", "Check hydraulic pressure and observe the source's cooldown/optional single-engine note only as a simulator-workflow item.", "After Landing / Clear of Runway", "5"),
        jdStep("als-park", "Parking brake set; anti-ice off; shutdown switch configuration; cage standby attitude gyro; emergency power off.", "Shutdown", "5"),
        jdStep("als-off", "After the stated cooldown: thrust levers cut off, START-GEN/inverters/fuel transfer/cross-flow/lights/batteries off; chocks/covers as desired.", "Shutdown", "5"),
      ],
      sources: [jaydee("After Landing / Shutdown", "5")],
    },
  ],
};

export const learjet3536FlysimwareAvionics: AircraftAvionicsContent = {
  aircraftId: AIRCRAFT_ID,
  title: "Flysimware Learjet 35A Cockpit & Avionics Implementation",
  sourceNote: "Implementation supplement for locating and operating the Flysimware Learjet 35A v1.2 after learning the aircraft-system concept.",
  disclaimer: "Simulator implementation reference only. Modeled controls and behavior may differ from a specific real-aircraft installation.",
  topics: [
    { id: "fsm-cockpit-map", title: "Cockpit panel map", summary: "Practical index of the main panels, sidewalls, glareshield, start/pressurization/anti-ice panels and center pedestal.", configuration: "Flysimware Learjet 35A v1.2", remember: ["Use this to find a control; use the FlightSafety lesson to understand the system."], sources: [flysimware("Cockpit — Overview of Panels", "5, 8–9")] },
    { id: "fsm-autopilot", title: "Autopilot / flight-director panel", summary: "Learn the add-on's lateral/vertical mode controls and confirm the resulting active mode after every selection.", configuration: "Installed navigation package affects behavior.", procedures: ["Confirm navigation source", "Select the desired mode", "Verify active/captured mode rather than relying on the button press"], sources: [flysimware("Autopilot Panel — Vertical Modes", "68")] },
    { id: "fsm-start-panel", title: "Start panel and engine-start interaction", summary: "Locate modeled start/generator and ignition controls while monitoring the N2/ITT/N1 concepts taught in the real-standard powerplant lesson.", configuration: "Flysimware Learjet 35A v1.2", sources: [flysimware("Start Panel / Engine Start", "63–67")] },
    { id: "fsm-annunciators", title: "Annunciator and warning panel", summary: "Recognize modeled fuel-pressure, door, generator, cabin-altitude, anti-ice and other annunciators and connect each to its system lesson.", configuration: "Flysimware Learjet 35A v1.2", sources: [flysimware("Annunciator Warning Panel", "55–61")] },
    { id: "fsm-lower-center-tests", title: "Lower-center panel and system tests", summary: "Learn the add-on interaction for anti-skid, stall-warning, hydraulic-pump and warning/test selector functions.", configuration: "Flysimware Learjet 35A v1.2", sources: [flysimware("Lower Center Panel Detailed Information", "72")] },
    { id: "fsm-yaw-damper", title: "Yaw-damper implementation", summary: "Primary/secondary yaw-damper power, test and engagement interaction for the modeled installation.", configuration: "Flysimware modeled AFCS installation", sources: [flysimware("Center Pedestal — Yaw Damper", "77")] },
    { id: "fsm-navigation-options", title: "Navigation-unit options", summary: "The EFB avionics page can select GNS530, GTN750 or GTN750Xi depending on platform/product configuration; the source requires ground-only changes for initialization.", configuration: "Flysimware option, not a universal Learjet installation", sources: [flysimware("EFB — Avionics Page", "98")] },
    { id: "fsm-efb-performance", title: "EFB environment / performance page", summary: "The add-on can combine runway, weather and simulated aircraft configuration to generate simulator performance outputs.", configuration: "Flysimware EFB", remember: ["Do not substitute simulator-generated values for approved real-aircraft performance data."], sources: [flysimware("EFB — Environment / Performance", "86, 90")] },
    { id: "fsm-fuel-efb", title: "EFB fuel servicing", summary: "Manage simulated fuel loading/servicing and quantity display in pounds or gallons.", configuration: "Flysimware EFB", sources: [flysimware("EFB — Fuel Page", "95")] },
    { id: "fsm-failures", title: "Failure-generation tools", summary: "MTBF, speed-triggered and scheduled failure modes support repeatable training scenarios and maintenance/reset workflows.", configuration: "Flysimware EFB", procedures: ["Use scheduled mode for repeatable scenarios", "Hide the failure list when practicing recognition", "Reset failures only when preparing the next exercise"], sources: [flysimware("EFB — Failures Page", "92")] },
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
