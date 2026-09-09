export type AircraftWorkspaceSection =
  | "overview"
  | "learn"
  | "checklist"
  | "practice"
  | "reference"
  | "progress";

export const aircraftWorkspaceSections = [
  { key: "overview", label: "Aircraft" },
  { key: "learn", label: "Learn" },
  { key: "checklist", label: "Checklist" },
  { key: "practice", label: "Practice" },
  { key: "reference", label: "Reference" },
  { key: "progress", label: "Progress" },
] as const satisfies readonly { key: AircraftWorkspaceSection; label: string }[];

export function aircraftWorkspaceHref(aircraftId: string, section: AircraftWorkspaceSection): string {
  return section === "overview"
    ? `/aircraft/${aircraftId}`
    : `/aircraft/${aircraftId}/${section}`;
}

export function isAircraftWorkspaceSection(value: string): value is AircraftWorkspaceSection {
  return aircraftWorkspaceSections.some((section) => section.key === value);
}
