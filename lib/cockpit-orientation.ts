export type CockpitRegionId = string;

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

/** Legacy compatibility registry. New aircraft orientation is governed content. */
export const cockpitOrientations: readonly CockpitOrientation[] = [];

export function getCockpitOrientation(aircraftId: string): CockpitOrientation | undefined {
  return cockpitOrientations.find((orientation) => orientation.aircraftId === aircraftId);
}

export function getCockpitLocationForChecklistItem(
  aircraftId: string,
  checklistItemId: string,
): CockpitControlLocation | undefined {
  return getCockpitOrientation(aircraftId)?.controls.find((control) => control.checklistItemIds.includes(checklistItemId));
}
