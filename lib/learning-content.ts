export type LearningSourceReference = {
  readonly chapter: number;
  readonly section: string;
  readonly manualPage: string;
};

export type QuickStartTopic = {
  readonly id: string;
  readonly title: string;
  readonly minutes: number;
  readonly summary: string;
  readonly remember: readonly string[];
  readonly source: readonly LearningSourceReference[];
};

export type EssentialSystemLesson = {
  readonly id: string;
  readonly title: string;
  readonly minutes: number;
  readonly mentalModel: string;
  readonly pilotControls: readonly string[];
  readonly pilotMonitors: readonly string[];
  readonly normalPicture: readonly string[];
  readonly remember: readonly string[];
  readonly variantNote?: string;
  readonly source: readonly LearningSourceReference[];
};

export type AircraftLearningContent = {
  readonly aircraftId: string;
  readonly quickStartTitle: string;
  readonly quickStartDescription: string;
  readonly quickStart: readonly QuickStartTopic[];
  readonly systems: readonly EssentialSystemLesson[];
};

const source = (chapter: number, section: string, manualPage: string): LearningSourceReference => ({
  chapter,
  section,
  manualPage,
});

export const learjet3536LearningContent: AircraftLearningContent = {
  aircraftId: "learjet-35-36",
  quickStartTitle: "Learjet 35/36 Quick Start",
  quickStartDescription:
    "A short simulator briefing before your first cold-and-dark flight. Learn the aircraft mental model first; use the full system lessons only when you want more depth.",
  quickStart: [
    {
      id: "aircraft-picture",
      title: "1. Know the aircraft",
      minutes: 2,
      summary:
        "The Learjet 35/36 is a two-pilot transport-category business jet. For sim training, think of it as a fast, systems-dense aircraft where electrical power, bleed air, hydraulics and fuel transfer all matter before the engines are even producing thrust.",
      remember: [
        "The training source covers Learjet 35, 35A, 36 and 36A variants.",
        "Manual chapter order is reference material; your normal training path is Cold & Dark → Shutdown.",
      ],
      source: [source(1, "Aircraft General — General", "1-1")],
    },
    {
      id: "power-first",
      title: "2. Power first",
      minutes: 3,
      summary:
        "Normal DC power comes from two engine-driven generators. Batteries provide secondary DC power and are central to starting; static inverters turn DC into AC for AC-powered equipment.",
      remember: [
        "Each generator is rated 30 V / 400 A; one generator can sustain the normal DC load.",
        "Emergency battery power is a separate backup layer for selected equipment.",
      ],
      source: [source(2, "Electrical Power Systems — Introduction", "2-1")],
    },
    {
      id: "engine-start-picture",
      title: "3. Understand the start",
      minutes: 4,
      summary:
        "GEN–OFF–START initiates the start sequence. The associated standby fuel pump is energized and ignition is armed; moving the thrust lever from CUT-OFF to IDLE activates ignition. Your main job is to monitor the start rather than memorize the relay logic.",
      remember: [
        "Watch N2 and ITT during start; N1 is the third primary engine indication.",
        "With the fuel computer on, starter release occurs around 45% or 50% N2 depending on configuration.",
        "After a stable idle, the generator can be selected as appropriate for the aircraft/configuration.",
      ],
      source: [
        source(7, "Other Start Functions", "7-20"),
        source(7, "Engine Instrumentation", "7-21"),
      ],
    },
    {
      id: "fuel-picture",
      title: "4. Fuel is a transfer system",
      minutes: 3,
      summary:
        "The engines are supplied from the wing system while tip and fuselage fuel are managed through transfer logic. Wing jet pumps are the normal low-pressure feed; electric standby pumps support starting and several backup/transfer functions.",
      remember: [
        "Learjet 35 and 36 fuel capacities differ materially.",
        "The manual specifies at least 600 lb in the wings for takeoff or an intentional go-around.",
        "Do not treat XFER/FILL or fuselage-valve logic as a generic single-tank system.",
      ],
      source: [
        source(5, "Fuel Tanks and Tank Venting — General", "5-3"),
        source(5, "Boost Pumps", "5-8"),
      ],
    },
    {
      id: "air-cabin-picture",
      title: "5. Bleed air runs more than the cabin",
      minutes: 3,
      summary:
        "Engine bleed air supports pressurization, air conditioning, anti-ice and hydraulic-reservoir pressurization. The cabin is normally controlled automatically by regulating air leaving through the outflow valve.",
      remember: [
        "Normal pressurization uses AUTO.",
        "Set the expected cruise altitude before takeoff and use the RATE control as the cabin-rate target.",
        "Early and current aircraft have meaningful pneumatic/pressurization differences.",
      ],
      source: [
        source(9, "Pneumatics — Introduction", "9-1"),
        source(12, "Pressurization Control Module", "12-4"),
      ],
    },
    {
      id: "hydraulic-controls-picture",
      title: "6. Hydraulics move the heavy stuff",
      minutes: 3,
      summary:
        "Two engine-driven pumps provide the main hydraulic pressure for landing gear, flaps, spoilers/spoilerons, brakes and optional thrust reversers. Primary aileron/elevator/rudder control is mechanical; trim is electrical.",
      remember: [
        "Main hydraulic pressure is approximately 1,550 psi.",
        "The auxiliary hydraulic pump is a backup, but it does not make every subsystem available in every condition.",
        "One yaw damper is intended to be engaged in flight.",
      ],
      source: [
        source(13, "Hydraulic Power System — General", "13-1"),
        source(15, "Flight Controls — General", "15-1"),
        source(15, "Yaw Damper", "15-23"),
      ],
    },
    {
      id: "landing-ice-picture",
      title: "7. Two last things before you fly",
      minutes: 3,
      summary:
        "Landing gear is electrically controlled and hydraulically operated, with pneumatic alternate extension/emergency braking. Ice protection is a mixed system using electrical heat, bleed air and alcohol depending on the protected area and aircraft configuration.",
      remember: [
        "Normal braking is hydraulic and includes antiskid; nosewheel steering is electrical.",
        "Ice protection is not one master heater — different surfaces use different energy sources.",
      ],
      source: [
        source(14, "Landing Gear and Brakes — Introduction", "14-1"),
        source(10, "Ice and Rain Protection — Introduction", "10-1"),
      ],
    },
  ],
  systems: [
    {
      id: "electrical",
      title: "Electrical",
      minutes: 5,
      mentalModel:
        "Two generators are the normal DC sources, batteries provide secondary/start power, and static inverters create AC from DC. The bus architecture is protective and configuration-dependent, so learn the sources before memorizing every bus.",
      pilotControls: ["BAT switches", "GEN–OFF–START switches", "Primary / secondary inverter switches"],
      pilotMonitors: ["Generator availability and caution indications", "DC voltage/load indications", "Battery / emergency-power indications as fitted"],
      normalPicture: ["Both normal generating sources available after start", "Required inverters operating", "No abnormal generator or emergency-power annunciation"],
      remember: ["One 30 V / 400 A generator can sustain normal DC load.", "Emergency battery power is a separate selected-equipment backup, not a replacement for the complete electrical system."],
      variantNote: "Bus architecture and emergency-battery installation vary by serial number and modification status.",
      source: [source(2, "Electrical Power Systems — Introduction", "2-1"), source(2, "Generators — Controls", "2-5")],
    },
    {
      id: "fuel",
      title: "Fuel",
      minutes: 6,
      mentalModel:
        "Treat the Learjet as wing-fed engines plus tip/fuselage transfer management. Jet pumps provide normal motive-flow feed and electric standby pumps support start, backup feed, crossflow and filling logic.",
      pilotControls: ["Standby pump switches", "XFER–FILL", "FUS VALVE / crossflow controls as fitted"],
      pilotMonitors: ["Fuel quantity by tank group", "Transfer/valve indications", "Fuel balance and remaining wing fuel"],
      normalPicture: ["Engines supplied from the wing system", "Transfer performed deliberately rather than leaving fuel stranded", "Transfer indications agree with the selected mode"],
      remember: ["Usable fuel is approximately 6,238 lb on the 35 and 7,440 lb on the 36.", "The manual requires at least 600 lb in the wings for takeoff or an intentional go-around."],
      variantNote: "Fuselage-tank plumbing, gravity transfer and transfer timing differ between models/serial numbers.",
      source: [source(5, "Fuel Tanks and Tank Venting — General", "5-3"), source(5, "Boost Pumps", "5-8"), source(5, "Gravity-flow Transfer System", "5-12")],
    },
    {
      id: "powerplant",
      title: "Powerplant & Start",
      minutes: 5,
      mentalModel:
        "During start, the aircraft automates several support functions around the starter. Your job is to command the sequence, introduce fuel with the thrust lever and monitor the engine indications for a normal acceleration to idle.",
      pilotControls: ["GEN–OFF–START", "Thrust levers CUT-OFF / IDLE", "Air ignition as required by phase"],
      pilotMonitors: ["N2", "ITT", "N1", "Starter-engaged / ignition indications as fitted"],
      normalPicture: ["N2 increases after starter engagement", "Fuel/ignition introduced at IDLE", "Starter and ignition release near the applicable N2 threshold", "Stable idle before generator selection"],
      remember: ["Primary engine indications are N2, ITT and N1.", "Automatic starter release is around 45% or 50% N2 depending on fuel-computer/configuration."],
      variantNote: "Starting details differ across serial-number groups; the training flow uses the common simulator mental model and keeps the source available for aircraft-specific detail.",
      source: [source(7, "Other Start Functions", "7-20"), source(7, "Engine Instrumentation", "7-21")],
    },
    {
      id: "hydraulics",
      title: "Hydraulics",
      minutes: 4,
      mentalModel:
        "Two engine-driven pumps provide the main pressure; an electric auxiliary pump provides backup capability. Hydraulic pressure moves the systems that need force rather than the primary flight controls themselves.",
      pilotControls: ["Auxiliary hydraulic pump when required", "Subsystem controls for gear, flaps, spoilers and brakes"],
      pilotMonitors: ["Hydraulic pressure", "Subsystem position/indication after a hydraulic command"],
      normalPicture: ["Approximately 1,550 psi main pressure", "Hydraulic consumers respond normally without prolonged pump demand"],
      remember: ["Hydraulics power landing gear, flaps, spoiler/spoilerons, brakes and optional reversers.", "The auxiliary pump does not operate the spoiler/spoileron system."],
      source: [source(13, "Hydraulic Power System — General", "13-1"), source(1, "Aircraft Systems — Hydraulic Power Systems", "1-13")],
    },
    {
      id: "pneumatics",
      title: "Pneumatics / Bleed Air",
      minutes: 4,
      mentalModel:
        "Engine compressor bleed air is distributed as low- and high-pressure air. It is a shared resource for pressurization, conditioning, anti-ice and hydraulic-reservoir pressurization.",
      pilotControls: ["L / R BLEED AIR switches", "Emergency bleed/pressurization selections on applicable aircraft"],
      pilotMonitors: ["Bleed-air warning indications", "Downstream pressurization / anti-ice response"],
      normalPicture: ["Bleed sources selected for the phase of flight", "No bleed warning and normal cabin/system response"],
      remember: ["The system can supplement LP bleed with HP air when required.", "The BLEED AIR controls are on the copilot lower-right switch panel."],
      variantNote: "Early and current aircraft have different valve logic and emergency-pressurization architecture.",
      source: [source(9, "Pneumatics — Introduction", "9-1"), source(9, "Bleed Air Switches", "9-4")],
    },
    {
      id: "pressurization",
      title: "Pressurization",
      minutes: 5,
      mentalModel:
        "Bleed air enters the cabin and the outflow valve meters how much leaves. In normal operation, AUTO controls cabin pressure toward the aircraft altitude selected on the cabin controller.",
      pilotControls: ["AUTO–MAN", "Cabin controller / aircraft-altitude setting", "RATE knob", "Manual UP–DN control if required"],
      pilotMonitors: ["Cabin altitude", "Differential pressure", "Cabin rate / warning indications"],
      normalPicture: ["AUTO selected", "Expected cruise altitude set before takeoff", "RATE around the desired cabin climb/descent rate"],
      remember: ["The 9 o’clock RATE position corresponds to roughly 500–600 fpm.", "Current-model normal differential is approximately 9.2 psid at the selected aircraft altitude."],
      variantNote: "System limits and automatic protection differ between early and current aircraft.",
      source: [source(12, "Pressurization — Introduction", "12-1"), source(12, "Pressurization Control Module", "12-4")],
    },
    {
      id: "flight-controls",
      title: "Flight Controls",
      minutes: 5,
      mentalModel:
        "Aileron, elevator and rudder are mechanically actuated with no hydraulic or electric power boost. Trim is electrical. Flaps and spoilers/spoilerons are electrically controlled but hydraulically actuated.",
      pilotControls: ["Control wheel / column / pedals", "Electrical trim", "Flap and spoiler controls", "Yaw damper controls"],
      pilotMonitors: ["Trim position", "Flap / spoiler indications", "Yaw-damper engagement and warning systems"],
      normalPicture: ["Free primary controls", "Correct trim for phase", "One yaw damper engaged in flight", "Secondary controls agree with commanded position"],
      remember: ["Primary controls are mechanical; secondary flaps/spoilers need hydraulics.", "One yaw damper is intended for full-time inflight operation."],
      source: [source(15, "Flight Controls — General", "15-1"), source(15, "Yaw Damper", "15-23")],
    },
    {
      id: "anti-ice",
      title: "Anti-Ice / Rain Protection",
      minutes: 4,
      mentalModel:
        "Ice protection is distributed: some items are electrically heated, others use engine bleed air, and alcohol is used for selected protection. Think by protected surface, not by one master system.",
      pilotControls: ["Pitot/static and sensor heat selections", "Engine / wing / stabilizer anti-ice controls", "Windshield/radome protection controls as fitted"],
      pilotMonitors: ["Anti-ice temperature / warning indications as fitted", "Visible ice accumulation", "Bleed-air system response"],
      normalPicture: ["Required protection selected before/when conditions demand it", "Protected surfaces and system indications respond normally"],
      remember: ["The source describes electrical, bleed-air and alcohol anti-ice methods.", "Configuration varies significantly with serial number and installed modifications."],
      variantNote: "Exact windshield and other anti-ice architecture changes across aircraft groups; use the specific source section before practicing a detailed abnormal.",
      source: [source(10, "Ice and Rain Protection — Introduction", "10-1")],
    },
    {
      id: "landing-gear-brakes",
      title: "Landing Gear & Brakes",
      minutes: 4,
      mentalModel:
        "Normal gear operation is electrical command plus hydraulic movement. Normal braking is hydraulic with antiskid, nosewheel steering is electrical, and alternate gear extension/emergency braking use pneumatic pressure.",
      pilotControls: ["Landing gear control", "Brake pedals / antiskid system", "Nosewheel steering", "Alternate extension / emergency braking when required"],
      pilotMonitors: ["Gear-position indication", "Hydraulic response", "Antiskid / brake indications as fitted"],
      normalPicture: ["Commanded gear position confirmed", "Normal hydraulic braking available", "Antiskid available for normal operation"],
      remember: ["Main gear has dual wheels; the nose gear has a single wheel and self-centers.", "Alternate extension and emergency braking are pneumatic backups."],
      source: [source(14, "Landing Gear and Brakes — Introduction / General", "14-1")],
    },
  ],
};

export function getAircraftLearningContent(aircraftId: string): AircraftLearningContent | undefined {
  return aircraftId === learjet3536LearningContent.aircraftId ? learjet3536LearningContent : undefined;
}

export function getQuickStartMinutes(content: AircraftLearningContent): number {
  return content.quickStart.reduce((sum, topic) => sum + topic.minutes, 0);
}

export function getEssentialSystemsMinutes(content: AircraftLearningContent): number {
  return content.systems.reduce((sum, lesson) => sum + lesson.minutes, 0);
}
