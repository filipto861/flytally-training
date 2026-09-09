export type ReferenceSource = {
  readonly chapter: number;
  readonly section: string;
  readonly manualPage: string;
};

export type QuickReferenceItem = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly note?: string;
  readonly source: readonly ReferenceSource[];
};

export type QuickReferenceGroup = {
  readonly id: string;
  readonly title: string;
  readonly flyPriority: number;
  readonly items: readonly QuickReferenceItem[];
};

export type KnowledgeQuestion = {
  readonly id: string;
  readonly area: string;
  readonly prompt: string;
  readonly choices: readonly string[];
  readonly correctIndex: number;
  readonly explanation: string;
  readonly source: readonly ReferenceSource[];
};

export type AircraftReferenceKnowledge = {
  readonly aircraftId: string;
  readonly referenceNote: string;
  readonly groups: readonly QuickReferenceGroup[];
  readonly questions: readonly KnowledgeQuestion[];
};

const source = (chapter: number, section: string, manualPage: string): ReferenceSource => ({ chapter, section, manualPage });

export const learjet3536ReferenceKnowledge: AircraftReferenceKnowledge = {
  aircraftId: "learjet-35-36",
  referenceNote:
    "Simulator familiarization reference derived from the registered FlightSafety Learjet 35/36 training manual. Performance-derived speeds, AFM limitations and the current aircraft QRH remain controlling; FlyTally does not turn variable data into false fixed limits.",
  groups: [
    {
      id: "takeoff-landing",
      title: "Takeoff & landing cues",
      flyPriority: 1,
      items: [
        {
          id: "v-speeds",
          label: "V1 / VR / V2",
          value: "SET from current performance data",
          note: "These are performance-derived for the actual weight/configuration; do not use a fixed generic value.",
          source: [source(18, "Takeoff Setup / Standard Callouts", "18-8–18-9")],
        },
        {
          id: "v2-plus-30",
          label: "Flap retraction cue",
          value: "V2 + 30",
          note: "Training flow uses V2 + 30 as the cue for flaps up / After Takeoff checklist.",
          source: [source(18, "Takeoff Procedures", "18-13")],
        },
        {
          id: "full-flaps-cue",
          label: "Full flaps training cue",
          value: "Below 150 kt",
          note: "Use only with the aircraft-specific limitations/performance data applicable to the simulator configuration.",
          source: [source(18, "Standard Callouts — Approach", "18-11")],
        },
        {
          id: "air-ignition",
          label: "Air ignition",
          value: "ON for takeoff and landing",
          source: [source(7, "Ignition — Selective Mode", "7-14")],
        },
      ],
    },
    {
      id: "fuel",
      title: "Fuel",
      flyPriority: 2,
      items: [
        {
          id: "fuel-35",
          label: "Learjet 35 usable fuel",
          value: "≈ 6,238 lb",
          source: [source(5, "Fuel Tanks and Tank Venting — General", "5-3")],
        },
        {
          id: "fuel-36",
          label: "Learjet 36 usable fuel",
          value: "≈ 7,440 lb",
          source: [source(5, "Fuel Tanks and Tank Venting — General", "5-3")],
        },
        {
          id: "wing-fuel-takeoff",
          label: "Wing fuel for takeoff / intentional go-around",
          value: "At least 600 lb",
          source: [source(5, "Fuel Tanks and Tank Venting — General", "5-3")],
        },
      ],
    },
    {
      id: "pressurization",
      title: "Pressurization",
      flyPriority: 3,
      items: [
        {
          id: "press-auto",
          label: "Normal mode",
          value: "AUTO",
          source: [source(12, "Normal System Operation — Before Takeoff", "12-8")],
        },
        {
          id: "press-rate",
          label: "RATE reference",
          value: "9 o’clock ≈ 500–600 fpm",
          source: [source(12, "Pressurization Control Module", "12-4")],
        },
        {
          id: "press-diff",
          label: "Current-model normal differential",
          value: "≈ 9.2 psid",
          note: "Configuration/serial-number differences apply; verify the modeled aircraft and controlling manual.",
          source: [source(12, "Pressurization — Introduction", "12-1")],
        },
      ],
    },
    {
      id: "power-hydraulics",
      title: "Electrical & hydraulics",
      flyPriority: 4,
      items: [
        {
          id: "generator-rating",
          label: "Generator rating",
          value: "30 V / 400 A each",
          note: "One generator can sustain the normal DC load.",
          source: [source(2, "Electrical Power Systems — Introduction", "2-1")],
        },
        {
          id: "hydraulic-pressure",
          label: "Main hydraulic pressure",
          value: "≈ 1,550 psi",
          source: [source(13, "Hydraulic Power System — General", "13-1")],
        },
      ],
    },
    {
      id: "engine-start",
      title: "Engine & start",
      flyPriority: 5,
      items: [
        {
          id: "engine-indications",
          label: "Primary engine indications",
          value: "N2 · ITT · N1",
          source: [source(7, "Engine Instrumentation", "7-21")],
        },
        {
          id: "starter-release",
          label: "Automatic starter release",
          value: "≈ 45% or 50% N2",
          note: "Threshold depends on fuel-computer/configuration.",
          source: [source(7, "Other Start Functions", "7-20")],
        },
      ],
    },
    {
      id: "flight-controls",
      title: "Flight controls",
      flyPriority: 6,
      items: [
        {
          id: "primary-controls",
          label: "Primary controls",
          value: "Mechanical — no hydraulic/electric boost",
          source: [source(15, "Flight Controls — General", "15-1")],
        },
        {
          id: "yaw-damper",
          label: "Yaw damper",
          value: "One engaged in flight",
          source: [source(15, "Yaw Damper", "15-23")],
        },
      ],
    },
  ],
  questions: [
    {
      id: "q-generator-capacity",
      area: "Electrical",
      prompt: "After one generator fails in flight, what is the key electrical-system mental model?",
      choices: ["Both generators are required for any DC power", "One generator can sustain the normal DC load", "Only the emergency battery remains", "The inverters become DC generators"],
      correctIndex: 1,
      explanation: "Each engine-driven generator is rated 30 V / 400 A and the training source states that one generator can sustain the normal DC load.",
      source: [source(2, "Electrical Power Systems — Introduction", "2-1")],
    },
    {
      id: "q-hydraulic-pressure",
      area: "Hydraulics",
      prompt: "What main hydraulic pressure should you have in mind as the normal Learjet training reference?",
      choices: ["About 550 psi", "About 1,000 psi", "About 1,550 psi", "About 3,000 psi"],
      correctIndex: 2,
      explanation: "The source-backed training reference is approximately 1,550 psi.",
      source: [source(13, "Hydraulic Power System — General", "13-1")],
    },
    {
      id: "q-primary-controls",
      area: "Flight controls",
      prompt: "How are the primary aileron, elevator and rudder controls actuated?",
      choices: ["Hydraulically boosted", "Electrically signaled", "Mechanically, without hydraulic/electric boost", "Pneumatically"],
      correctIndex: 2,
      explanation: "Primary flight controls are mechanical. Hydraulics are used by secondary systems such as flaps and spoilers/spoilerons.",
      source: [source(15, "Flight Controls — General", "15-1")],
    },
    {
      id: "q-fuel-mental-model",
      area: "Fuel",
      prompt: "Which fuel-system mental model is most useful for the Learjet 35/36?",
      choices: ["Engines feed directly from every tank equally", "Wing-fed engines with tip/fuselage transfer management", "Fuselage tank feeds engines directly at all times", "Only tip tanks feed the engines"],
      correctIndex: 1,
      explanation: "The engines are supplied from the wing system while tip/fuselage fuel is managed through transfer logic.",
      source: [source(5, "Fuel Tanks and Tank Venting — General", "5-3")],
    },
    {
      id: "q-wing-fuel",
      area: "Fuel",
      prompt: "What wing-fuel minimum does the training source specify for takeoff or an intentional go-around?",
      choices: ["300 lb", "600 lb", "1,000 lb", "No minimum"],
      correctIndex: 1,
      explanation: "The registered training source specifies at least 600 lb in the wings for takeoff or an intentional go-around.",
      source: [source(5, "Fuel Tanks and Tank Venting — General", "5-3")],
    },
    {
      id: "q-press-mode",
      area: "Pressurization",
      prompt: "What is the normal pressurization mode in the training flow?",
      choices: ["MAN", "AUTO", "OFF", "EMER only"],
      correctIndex: 1,
      explanation: "Normal pressurization setup uses AUTO with expected cruise altitude and a suitable cabin rate selected.",
      source: [source(12, "Normal System Operation — Before Takeoff", "12-8")],
    },
    {
      id: "q-start-monitor",
      area: "Powerplant",
      prompt: "Which indications are central to monitoring an engine start?",
      choices: ["Hydraulic pressure and cabin rate", "N2 and ITT, with N1 as a primary engine indication", "Only N1", "Fuel quantity only"],
      correctIndex: 1,
      explanation: "N2 and ITT are central during the start; N1 is the third primary engine indication.",
      source: [source(7, "Engine Instrumentation", "7-21")],
    },
    {
      id: "q-starter-release",
      area: "Powerplant",
      prompt: "Why does FlyTally show the starter-release value as 45% or 50% N2 rather than one exact number?",
      choices: ["The value is random", "It depends on fuel-computer/configuration", "It depends only on outside temperature", "The manual gives no information"],
      correctIndex: 1,
      explanation: "The applicable automatic release threshold differs with configuration; FlyTally preserves that distinction instead of flattening it.",
      source: [source(7, "Other Start Functions", "7-20")],
    },
    {
      id: "q-air-ignition",
      area: "Powerplant",
      prompt: "When is selective air ignition used in the normal training flow?",
      choices: ["Only during cruise", "Takeoff and landing", "Only after shutdown", "Never"],
      correctIndex: 1,
      explanation: "The source-backed normal flow uses L and R AIR IGN ON for takeoff and landing.",
      source: [source(7, "Ignition — Selective Mode", "7-14")],
    },
    {
      id: "q-vspeeds",
      area: "Performance",
      prompt: "How should V1, VR and V2 be handled in Quick Reference?",
      choices: ["Use one fixed Learjet value", "Calculate/set them from current performance data", "Ignore them in simulation", "Always use 150 kt"],
      correctIndex: 1,
      explanation: "V-speeds are performance-derived for the actual condition. FlyTally deliberately does not publish a false universal value.",
      source: [source(18, "Takeoff Setup / Standard Callouts", "18-8–18-9")],
    },
  ],
};
