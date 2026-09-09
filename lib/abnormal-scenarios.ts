export type ScenarioStageId = "recognition" | "control" | "immediate" | "continue";

export type ScenarioDifficulty = "core" | "advanced";

export type ScenarioCategory =
  | "Takeoff"
  | "Powerplant"
  | "Fire"
  | "Electrical"
  | "Hydraulics"
  | "Pressurization"
  | "Landing gear"
  | "Anti-ice";

export type ScenarioSourceReference = {
  readonly chapter: number;
  readonly section: string;
  readonly manualPage: string;
};

export type ScenarioStage = {
  readonly id: ScenarioStageId;
  readonly prompt: string;
  readonly expectedResponse: readonly string[];
  readonly why: string;
  readonly source: readonly ScenarioSourceReference[];
};

export type AbnormalScenario = {
  readonly id: string;
  readonly title: string;
  readonly category: ScenarioCategory;
  readonly phase: string;
  readonly difficulty: ScenarioDifficulty;
  readonly minutes: number;
  readonly summary: string;
  readonly setup: string;
  readonly objectives: readonly string[];
  readonly stages: readonly ScenarioStage[];
  readonly debrief: readonly string[];
  readonly variantNote?: string;
  readonly trainingBoundary?: string;
};

export type AircraftAbnormalTraining = {
  readonly aircraftId: string;
  readonly sourceNote: string;
  readonly disclaimer: string;
  readonly scenarios: readonly AbnormalScenario[];
};

const source = (
  chapter: number,
  section: string,
  manualPage: string,
): ScenarioSourceReference => ({ chapter, section, manualPage });

export const learjet3536AbnormalTraining: AircraftAbnormalTraining = {
  aircraftId: "learjet-35-36",
  sourceNote: "FlightSafety Learjet 35/36 Pilot Training Manual, Revision 1.1. Technical pages are cited at each training stage.",
  disclaimer:
    "Simulator familiarization only. FlyTally Training paraphrases the controlled training source; the current approved AFM/QRH and operator SOPs always take precedence.",
  scenarios: [
    {
      id: "rejected-takeoff-before-v1",
      title: "Rejected takeoff before V1",
      category: "Takeoff",
      phase: "Takeoff roll",
      difficulty: "core",
      minutes: 5,
      summary: "Make the reject decision early, keep the aircraft on the runway and convert the remaining runway into stopping performance.",
      setup: "During the takeoff roll, a serious malfunction is presented before V1. The simulator is still on the runway and sufficient stopping distance is assumed for the exercise.",
      objectives: ["Recognize the V1 decision boundary", "Prioritize directional control and stopping", "Transition from immediate actions to the approved checklist"],
      stages: [
        {
          id: "recognition",
          prompt: "A serious malfunction appears before V1. What is the first decision?",
          expectedResponse: ["Reject the takeoff rather than continue the takeoff profile."],
          why: "The Learjet training profile treats the pre-V1 case as the reject side of the takeoff decision boundary.",
          source: [source(18, "Engine Failure Below V1 Speed / Takeoff Rejected", "18-19")],
        },
        {
          id: "control",
          prompt: "The reject has started. What owns your attention before any diagnosis?",
          expectedResponse: ["Maintain runway and directional control.", "Use the available stopping devices deliberately; do not become heads-down diagnosing the fault."],
          why: "A rejected takeoff is first an aircraft-control and stopping problem, then a systems problem.",
          source: [source(18, "Takeoff Rejected", "18-19")],
        },
        {
          id: "immediate",
          prompt: "What immediate stopping actions does the training profile identify?",
          expectedResponse: ["Bring thrust to idle.", "Apply wheel braking and extend spoilers.", "Use installed drag chute or thrust reversers only as applicable and necessary."],
          why: "These actions remove thrust, increase drag and use the primary stopping systems while the aircraft remains controllable on the runway.",
          source: [source(18, "Takeoff Rejected — Figure 18-2", "18-19")],
        },
        {
          id: "continue",
          prompt: "The aircraft is stopping or stopped. What comes next?",
          expectedResponse: ["Note the reject speed and consider brake-energy implications.", "Continue with the approved aborted-takeoff/related abnormal checklist for the actual malfunction."],
          why: "The training manual explicitly points the crew back to the AFM for the aborted-takeoff checklist and brake-energy guidance.",
          source: [source(18, "Engine Failure Below V1 Speed", "18-19")],
        },
      ],
      debrief: ["Did you make the continue/reject decision without hesitation?", "Did you keep directional control ahead of diagnosis?", "Did you remember that brake energy depends on where the reject occurred?"],
      trainingBoundary: "The simulator profile teaches the decision and stopping sequence. Aircraft-specific brake-energy limits and the controlling aborted-takeoff checklist belong to the approved AFM/QRH.",
    },
    {
      id: "engine-failure-at-or-above-v1",
      title: "Engine failure at or above V1",
      category: "Powerplant",
      phase: "Takeoff / initial climb",
      difficulty: "core",
      minutes: 6,
      summary: "Continue the takeoff, control asymmetric thrust and delay checklist work until the aircraft is safely climbing.",
      setup: "An engine fails at or just after V1. The runway is no longer the primary solution; the exercise continues through cleanup and the first safe checklist point.",
      objectives: ["Commit to the post-V1 takeoff", "Hold directional control and the required climb profile", "Separate aircraft control from later memory/checklist work"],
      stages: [
        {
          id: "recognition",
          prompt: "The failure occurs at or above V1. Continue or reject?",
          expectedResponse: ["Normally continue the takeoff."],
          why: "The Learjet training profile places an engine failure at or above V1 on the continue side of the takeoff decision.",
          source: [source(18, "Engine Failure Above V1 Speed", "18-20")],
        },
        {
          id: "control",
          prompt: "What is the PF doing while the failure is being identified?",
          expectedResponse: ["Maintain directional control with the flight controls.", "Rotate at VR and establish the initial climb at V2 with takeoff flaps."],
          why: "The aircraft must remain on the intended flight path before the crew starts managing the failed engine.",
          source: [source(18, "Engine Failure Above V1 Speed", "18-20")],
        },
        {
          id: "immediate",
          prompt: "How is the aircraft cleaned up after the initial climb is established?",
          expectedResponse: ["Retract the landing gear after a positive climb is established.", "When clear of obstacles, accelerate to at least V2 + 30 before flap retraction.", "Then accelerate toward the single-engine climb speed; the training profile notes approximately 200 knots."],
          why: "The profile protects climb performance first and sequences configuration changes only after obstacle clearance.",
          source: [source(18, "Takeoff Engine Failure at or Above V1 — Figure 18-3", "18-20")],
        },
        {
          id: "continue",
          prompt: "When does the engine-failure checklist work start?",
          expectedResponse: ["At a safe altitude, normally not below 400 ft AGL, accomplish the approved memory items.", "Complete the remainder of the Engine Failure/Fire Shutdown and After Takeoff checklist work normally at or above 1,500 ft AGL."],
          why: "The source deliberately delays heads-down procedure work until the aircraft has altitude and a stable flight path.",
          source: [source(18, "Engine Failure Above V1 Speed", "18-20")],
        },
      ],
      debrief: ["Was the V1 decision immediate?", "Did you fly V2 and the asymmetric aircraft before touching the checklist?", "Did cleanup occur only after the appropriate obstacle-clearance point?"],
    },
    {
      id: "engine-fire-in-flight",
      title: "Engine fire in flight",
      category: "Fire",
      phase: "Climb / cruise",
      difficulty: "core",
      minutes: 5,
      summary: "Confirm the affected side, keep one pilot flying and understand what the fire handle and extinguisher controls actually isolate.",
      setup: "An engine fire indication appears in flight. The trainer focuses on recognition, control priority and the verified fire-system effects without inventing an AFM memory-item sequence that is not present in the controlled source set.",
      objectives: ["Confirm the affected engine before destructive actions", "Keep the PF flying while the procedure is run", "Understand fire-handle isolation and extinguisher logic"],
      stages: [
        {
          id: "recognition",
          prompt: "What should be positively identified before an engine is isolated?",
          expectedResponse: ["Confirm the affected engine and the fire indication before committing to irreversible controls."],
          why: "A fire shutdown intentionally removes fuel, hydraulic and bleed-air services from one engine, so correct-side identification matters.",
          source: [source(8, "Fire Protection — Engine fire warning and extinguisher operation", "8-7")],
        },
        {
          id: "control",
          prompt: "Who is flying while the emergency procedure is being completed?",
          expectedResponse: ["One pilot remains dedicated to aircraft control while the other crew member runs the emergency procedure.", "Use memory items only where approved, then call for the proper checklist."],
          why: "The training manual explicitly rejects normal flow-pattern technique for abnormal/emergency work and keeps one pilot flying.",
          source: [source(18, "Abnormal/Emergency Procedures", "18-4")],
        },
        {
          id: "immediate",
          prompt: "When the approved Engine Failure/Fire Shutdown sequence directs use of the FIRE PULL handle, what does that control do?",
          expectedResponse: ["Pulling the affected FIRE PULL/ENG FIRE PULL handle closes the affected engine main fuel, hydraulic and bleed-air shutoff valves.", "It arms both engine fire extinguishers; an illuminated ARMED control is then used to discharge an extinguisher."],
          why: "Knowing the isolation effect prevents the fire handle from becoming a memorized gesture with no systems understanding.",
          source: [source(8, "Fire Protection — Extinguishing system", "8-7")],
        },
        {
          id: "continue",
          prompt: "What if the fire indication persists after the first bottle?",
          expectedResponse: ["The second bottle can be discharged into the affected area when required by the approved procedure.", "Continue the controlling Engine Failure/Fire Shutdown checklist and operational plan for landing/diversion."],
          why: "Both extinguishing bottles can be directed to the affected engine area; the complete operational response remains checklist-controlled.",
          source: [source(8, "Fire Protection — Extinguishing system", "8-7"), source(18, "Abnormal/Emergency Procedures", "18-4")],
        },
      ],
      debrief: ["Did you verify the affected side before isolating it?", "Did the PF remain dedicated to flight path control?", "Can you explain what the fire handle removes from the affected engine?"],
      trainingBoundary: "The controlled training source verifies fire-system function and emergency crew technique, but it does not expose a complete current AFM/QRH memory-item sequence. FlyTally intentionally does not invent one.",
    },
    {
      id: "single-generator-failure",
      title: "Single-generator failure",
      category: "Electrical",
      phase: "Climb / cruise",
      difficulty: "core",
      minutes: 4,
      summary: "Recognize the failed source, confirm the remaining generator is carrying the aircraft and avoid inventing reset actions from generic jet knowledge.",
      setup: "One engine-driven generator becomes unavailable in flight. The remaining generator is still online for this exercise.",
      objectives: ["Distinguish a single-source failure from a total DC-source emergency", "Verify the surviving source and aircraft electrical state", "Know when the approved electrical checklist must take over"],
      stages: [
        {
          id: "recognition",
          prompt: "What are you trying to establish from the indications first?",
          expectedResponse: ["Identify which generator is unavailable and verify that the other generator remains online.", "Check the electrical indications rather than reacting to one annunciator in isolation."],
          why: "The operational consequence is very different between loss of one generator and loss of both normal generating sources.",
          source: [source(2, "Electrical Power Systems — Introduction", "2-1")],
        },
        {
          id: "control",
          prompt: "Does a single-generator failure by itself require you to abandon aircraft control for immediate switching?",
          expectedResponse: ["No. Keep the aircraft stable and confirm the remaining electrical source before checklist actions."],
          why: "The training source states that one 30 V / 400 A generator can sustain the normal DC load.",
          source: [source(2, "Electrical Power Systems — Introduction", "2-1")],
        },
        {
          id: "immediate",
          prompt: "What is the source-backed immediate objective?",
          expectedResponse: ["Verify the surviving generator is supplying the aircraft and monitor voltage/load and related annunciations.", "Do not practice an unverified reset or reconnection sequence."],
          why: "The controlled source supports the source/load mental model, but the exact abnormal reset sequence is not available in the current source set.",
          source: [source(2, "Electrical Power Systems — Introduction", "2-1")],
        },
        {
          id: "continue",
          prompt: "What procedure owns the next switching decisions?",
          expectedResponse: ["Use the current approved generator/electrical abnormal checklist.", "If the second normal source is lost, treat battery endurance as limited and reprioritize according to the approved checklist."],
          why: "Battery power is a backup layer with finite endurance; exact load-shedding and reset logic must remain aircraft/checklist specific.",
          source: [source(2, "Electrical Power Systems — Introduction", "2-1")],
        },
      ],
      debrief: ["Did you verify the surviving source before changing switches?", "Did you avoid turning a single-source failure into a self-induced dual-source failure?", "Did you recognize the boundary between source-backed training and AFM/QRH procedure?"],
      trainingBoundary: "The registered training source does not provide a complete generator-failure reset/recovery checklist. This scenario deliberately stops before any unverified reset sequence.",
    },
    {
      id: "hydraulic-pressure-loss",
      title: "Hydraulic pressure loss",
      category: "Hydraulics",
      phase: "Enroute / before approach",
      difficulty: "core",
      minutes: 5,
      summary: "Freeze unnecessary configuration changes, understand which systems depend on hydraulics and move into the approved hydraulic/alternate-gear procedure.",
      setup: "Hydraulic pressure is lost or an abnormal low-pressure condition is recognized enroute before approach configuration begins.",
      objectives: ["Protect the current aircraft configuration", "Recall the major hydraulic consumers", "Plan alternate gear and braking consequences before arrival"],
      stages: [
        {
          id: "recognition",
          prompt: "What does a confirmed hydraulic pressure loss change immediately?",
          expectedResponse: ["Treat gear, flaps, spoilers/spoilerons and normal braking as affected hydraulic consumers until the approved procedure establishes what remains available."],
          why: "The Learjet hydraulic system powers the high-force secondary systems rather than the mechanically actuated primary flight controls.",
          source: [source(13, "Hydraulic Power System — General", "13-1")],
        },
        {
          id: "control",
          prompt: "What should happen to configuration changes while the failure is being assessed?",
          expectedResponse: ["Keep the aircraft stable and avoid unnecessary gear, flap or spoiler commands until the failure procedure and landing plan are understood."],
          why: "Configuration choices consume or depend on the failed system and can narrow later options.",
          source: [source(13, "Hydraulic Power System — General", "13-1")],
        },
        {
          id: "immediate",
          prompt: "Which procedure does the training source point you toward for an enroute hydraulic-system failure?",
          expectedResponse: ["Transition to the approved Hydraulic System Failure / Alternate Gear Extension procedure rather than assuming the auxiliary pump is the universal first action."],
          why: "The chapter’s training material explicitly directs the pilot to the hydraulic-failure/alternate-extension checklist path.",
          source: [source(13, "Hydraulic Power System — Questions", "13-6")],
        },
        {
          id: "continue",
          prompt: "What landing-system consequences should be in the briefing?",
          expectedResponse: ["Alternate gear extension is pneumatic.", "If normal hydraulic braking is unavailable and emergency air brakes are used, antiskid and differential braking are not available."],
          why: "The landing-gear/brake system has a separate pneumatic emergency layer with different handling characteristics.",
          source: [source(14, "Landing Gear and Brakes — Introduction", "14-1"), source(14, "Emergency Brakes", "14-15")],
        },
      ],
      debrief: ["Did you protect the existing configuration?", "Could you name the hydraulic consumers without confusing them with the mechanical primary controls?", "Did the landing briefing include alternate gear and emergency-brake consequences?"],
      trainingBoundary: "The system chapter confirms the checklist path and backup-system architecture. Exact failure-checklist switch actions remain with the current approved AFM/QRH.",
    },
    {
      id: "cabin-altitude-emergency-descent",
      title: "Cabin altitude / emergency descent",
      category: "Pressurization",
      phase: "High-altitude cruise",
      difficulty: "core",
      minutes: 6,
      summary: "Recognize a cabin-altitude emergency, protect the crew with oxygen and turn a pressurization problem into a controlled descent problem.",
      setup: "At high altitude the cabin altitude rises unexpectedly and the pressurization warning picture indicates that the cabin is no longer being controlled normally.",
      objectives: ["Recognize cabin-altitude warning without relying on one serial-number threshold", "Protect crew capability before troubleshooting", "Fly a disciplined emergency descent within aircraft limits"],
      stages: [
        {
          id: "recognition",
          prompt: "Why should you not memorize one universal Learjet cabin-altitude warning number?",
          expectedResponse: ["Early and current aircraft use different aneroid, annunciator and warning-horn logic.", "Treat an unexpected cabin-altitude rise or valid cabin-altitude warning as the problem, then verify the actual cabin indications."],
          why: "The source documents materially different early/current pressurization warning architecture.",
          source: [source(12, "Aneroid Switches / Cabin Altitude Warning", "12-6")],
        },
        {
          id: "control",
          prompt: "What protects the crew’s ability to keep flying before troubleshooting the pressurization system?",
          expectedResponse: ["Use crew oxygen and establish effective mask communication.", "Keep one pilot flying the aircraft while the emergency procedure is run."],
          why: "Crew performance is the prerequisite for every later pressurization or descent action.",
          source: [source(18, "Abnormal/Emergency Procedures", "18-4"), source(18, "Emergency Descent", "18-27")],
        },
        {
          id: "immediate",
          prompt: "If an emergency descent is required, what is the source-backed flying concept?",
          expectedResponse: ["Reduce thrust and establish the approved emergency-descent configuration.", "Use spoilers as directed and disengage automation as required by the profile.", "Respect MMO/VLE and use landing gear only within its approved operating limits."],
          why: "The descent must rapidly reduce exposure to altitude without creating an overspeed or configuration exceedance.",
          source: [source(18, "Emergency Descent", "18-27")],
        },
        {
          id: "continue",
          prompt: "Once the descent is controlled, what procedure work remains?",
          expectedResponse: ["Continue the approved pressurization/decompression checklist and level at a safe altitude as operationally appropriate.", "Apply the emergency-pressurization logic for the actual early/current aircraft configuration rather than mixing variants."],
          why: "Pneumatic and pressurization architecture changes significantly across the Learjet serial-number groups.",
          source: [source(9, "Emergency Pressurization", "9-5"), source(12, "Aneroid Switches", "12-6")],
        },
      ],
      debrief: ["Did oxygen and crew communication happen before diagnosis?", "Did you treat the descent as a controlled speed/configuration problem?", "Did you avoid applying current-aircraft emergency pressurization logic to an early aircraft?"],
      variantNote: "Early aircraft (35-002 through 112 / 36-002 through 031) and current aircraft (35-113 and subsequent / 36-032 and subsequent) have different pneumatic and pressurization warning/emergency architecture.",
      trainingBoundary: "Use the simulator aircraft’s actual AFM/QRH for mask settings, emergency-pressurization switch logic, target altitude and any operator-specific emergency-descent profile.",
    },
    {
      id: "landing-gear-alternate-extension",
      title: "Landing gear alternate extension",
      category: "Landing gear",
      phase: "Approach preparation",
      difficulty: "core",
      minutes: 5,
      summary: "Stop cycling the system blindly, stabilize the aircraft and transition to the Learjet’s pneumatic alternate-extension architecture.",
      setup: "The landing gear is selected down but the normal locked indication is not obtained. The exercise begins before committing to an approach or landing.",
      objectives: ["Treat indication and mechanism state as separate questions", "Use the approved alternate-extension path", "Brief the shared pneumatic backup and braking consequences"],
      stages: [
        {
          id: "recognition",
          prompt: "The normal down-and-locked picture is missing. What is the correct mental model?",
          expectedResponse: ["Treat it as a landing-gear extension abnormal until the approved procedure establishes actual gear state.", "Do not assume that repeating the normal command will solve an electrical or hydraulic fault."],
          why: "Normal gear operation is electrically controlled and hydraulically actuated, while the alternate system uses a different pneumatic energy source.",
          source: [source(14, "Landing Gear and Brakes — Introduction", "14-1")],
        },
        {
          id: "control",
          prompt: "What should happen before you become occupied with the alternate-extension procedure?",
          expectedResponse: ["Stabilize the aircraft, maintain a safe flight path and create time for the checklist before the landing is committed."],
          why: "An abnormal gear state is easier to manage before the aircraft is low, slow and task-saturated.",
          source: [source(18, "Abnormal/Emergency Procedures", "18-4")],
        },
        {
          id: "immediate",
          prompt: "What system provides the alternate extension, and what special point applies when the fault is electrical?",
          expectedResponse: ["Alternate gear extension uses the emergency pneumatic system.", "If alternate extension is required because of an electrical fault, the emergency gear lever must remain in the down position to prevent inadvertent retraction."],
          why: "The alternate system is independent of the normal hydraulic actuation path, but its control position still matters after extension.",
          source: [source(14, "Alternate Landing Gear Extension", "14-10"), source(14, "Brakes / Alternate extension note", "14-12")],
        },
        {
          id: "continue",
          prompt: "What should the landing briefing include if the hydraulic system is also unavailable?",
          expectedResponse: ["The same emergency air architecture supports emergency braking.", "Emergency braking has no antiskid and no differential braking, so stopping/handling expectations change."],
          why: "A successful gear extension does not automatically restore normal braking capability after a hydraulic failure.",
          source: [source(14, "Emergency Brakes", "14-15")],
        },
      ],
      debrief: ["Did you stop trying generic gear-cycle fixes?", "Did you stabilize before going heads-down?", "Did the approach briefing cover both gear state and braking capability?"],
      trainingBoundary: "FlyTally teaches the verified architecture and key caution. Run the exact alternate-extension sequence from the current approved aircraft checklist.",
    },
    {
      id: "windshield-heat-overheat",
      title: "Windshield heat overheat",
      category: "Anti-ice",
      phase: "Ground / flight in precipitation or icing",
      difficulty: "advanced",
      minutes: 4,
      summary: "Recognize that the Learjet can automatically remove windshield bleed-air heat after an overheat and avoid misdiagnosing the resulting indications.",
      setup: "Windshield heat is selected and the red WSHLD OV HT annunciation appears. The green WSHLD HT indication extinguishes as the automatic protection reacts.",
      objectives: ["Recognize the automatic overheat response", "Keep visibility and icing exposure in the operational picture", "Respect configuration-specific anti-ice and emergency-pressurization interactions"],
      stages: [
        {
          id: "recognition",
          prompt: "Red WSHLD OV HT appears and the green WSHLD HT indication goes out. What has probably happened?",
          expectedResponse: ["The windshield overheat protection has detected excessive outlet temperature and automatically closed the windshield heat shutoff valve."],
          why: "The loss of the green heat indication can be the expected result of automatic overheat protection rather than a second independent failure.",
          source: [source(10, "Windshield Anti-ice — Overheat protection", "10-14")],
        },
        {
          id: "control",
          prompt: "What remains more important than chasing the annunciator?",
          expectedResponse: ["Keep the aircraft controlled and assess actual visibility, precipitation and icing exposure.", "Do not repeatedly force a system that has automatically protected itself."],
          why: "Anti-ice management has to preserve the flight path and visibility while respecting the protection logic.",
          source: [source(10, "Windshield Anti-ice — Overheat protection", "10-14")],
        },
        {
          id: "immediate",
          prompt: "What should you expect as the protected system cools?",
          expectedResponse: ["The overheat annunciation can clear as temperature falls, and the shutoff valve can reopen if the system remains selected according to the applicable configuration."],
          why: "The automatic protection is temperature-driven and can restore flow after the overheat condition clears.",
          source: [source(10, "Windshield Anti-ice — Overheat protection", "10-14")],
        },
        {
          id: "continue",
          prompt: "What related system interaction matters during an emergency-pressurization configuration?",
          expectedResponse: ["With both emergency pressurization valves in the emergency position on the applicable configuration, bleed air is not available for windshield anti-icing.", "Use the approved anti-ice abnormal checklist and plan around the resulting visibility/icing capability."],
          why: "The same bleed-air resource supports multiple systems, so an emergency pressurization configuration can remove windshield anti-ice capability.",
          source: [source(10, "Windshield Anti-ice", "10-14")],
        },
      ],
      debrief: ["Did you interpret the red/green indication pair correctly?", "Did you keep icing and visibility in the decision rather than treating this as an isolated light?", "Did you remember the bleed-air interaction with emergency pressurization?"],
      variantNote: "Windshield anti-ice architecture changes across serial-number groups and modification status. This scenario teaches only behavior explicitly supported by the cited source; verify the simulator tail’s configuration.",
    },
  ],
};

export function getAircraftAbnormalTraining(aircraftId: string): AircraftAbnormalTraining | undefined {
  return aircraftId === learjet3536AbnormalTraining.aircraftId ? learjet3536AbnormalTraining : undefined;
}

export function getAbnormalTrainingMinutes(training: AircraftAbnormalTraining): number {
  return training.scenarios.reduce((total, scenario) => total + scenario.minutes, 0);
}
