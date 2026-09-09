export type CockpitRegionId =
  | "pilot-instrument"
  | "center-instrument"
  | "center-switch"
  | "copilot-lower-right"
  | "pedestal";

export type CockpitSourceReference = {
  readonly chapter: number;
  readonly section: string;
  readonly manualPage: string;
};

export type CockpitRegion = {
  readonly id: CockpitRegionId;
  readonly label: string;
  readonly description: string;
};

export type CockpitControlLocation = {
  readonly id: string;
  readonly label: string;
  readonly regionId: CockpitRegionId;
  readonly description: string;
  readonly checklistItemIds: readonly string[];
  readonly source: CockpitSourceReference;
};

export type CockpitOrientation = {
  readonly aircraftId: string;
  readonly title: string;
  readonly sourceNote: string;
  readonly regions: readonly CockpitRegion[];
  readonly controls: readonly CockpitControlLocation[];
};

export const learjet3536CockpitOrientation: CockpitOrientation = {
  aircraftId: "learjet-35-36",
  title: "Learjet 35/36 cockpit orientation",
  sourceNote:
    "Region-level simulator orientation derived only from panel locations explicitly supported by the FlightSafety Learjet 35/36 Pilot Training Manual. The schematic is not to scale and does not claim exact switch coordinates.",
  regions: [
    { id: "pilot-instrument", label: "Pilot instrument panel", description: "Primary pilot-side instruments and annunciations." },
    { id: "center-instrument", label: "Center instrument panel", description: "Shared engine instrumentation in the center field of view." },
    { id: "center-switch", label: "Center switch panel", description: "Shared switching and selected indications below the center instruments." },
    { id: "copilot-lower-right", label: "Copilot lower-right switch panel", description: "Right-side systems switching, including bleed-air controls on applicable aircraft." },
    { id: "pedestal", label: "Pedestal", description: "Center pedestal / throttle-quadrant area. Exact control mappings are added only when source-backed." },
  ],
  controls: [
    {
      id: "generator-start-switches",
      label: "GEN–OFF–START switches",
      regionId: "center-switch",
      description: "The two starter-generator switches are located on the center switch panel.",
      checklistItemIds: ["start-switch", "generator-on"],
      source: { chapter: 2, section: "Generators — Controls / Figure 2-8", manualPage: "2-5" },
    },
    {
      id: "engine-instruments",
      label: "N2 / ITT / N1 engine instruments",
      regionId: "center-instrument",
      description: "Primary engine instruments are arranged in two vertical rows on the center instrument panel.",
      checklistItemIds: ["monitor-start"],
      source: { chapter: 7, section: "Engine Instrumentation — Figure 7-22", manualPage: "7-21" },
    },
    {
      id: "flap-position-indicator",
      label: "FLAP position indicator",
      regionId: "center-switch",
      description: "The vertical-scale FLAP position indicator is mounted on the center switch panel.",
      checklistItemIds: ["flaps-up", "flaps-20", "full-flaps"],
      source: { chapter: 15, section: "Flap Position Indicator", manualPage: "15-17" },
    },
    {
      id: "emergency-power-annunciators",
      label: "EMR PWR annunciators",
      regionId: "pilot-instrument",
      description: "Emergency-power annunciators are on the pilot instrument panel. This mapping is for the annunciators, not the emergency-battery switch location.",
      checklistItemIds: [],
      source: { chapter: 2, section: "Dual Emergency Power System", manualPage: "2-20" },
    },
    {
      id: "bleed-air-switches",
      label: "L / R BLEED AIR switches",
      regionId: "copilot-lower-right",
      description: "The L and R BLEED AIR switches are located on the copilot lower-right switch panel.",
      checklistItemIds: [],
      source: { chapter: 9, section: "Bleed Air Switches — Figure 9-3", manualPage: "9-4" },
    },
  ],
};

export function getCockpitOrientation(aircraftId: string): CockpitOrientation | undefined {
  return aircraftId === learjet3536CockpitOrientation.aircraftId ? learjet3536CockpitOrientation : undefined;
}

export function getCockpitLocationForChecklistItem(
  aircraftId: string,
  checklistItemId: string,
): CockpitControlLocation | undefined {
  return getCockpitOrientation(aircraftId)?.controls.find((control) => control.checklistItemIds.includes(checklistItemId));
}
