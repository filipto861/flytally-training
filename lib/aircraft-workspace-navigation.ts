import type { TrainingContentDomain } from "./content-admin-types.ts";

export type AircraftModuleNavKey =
  | "overview"
  | "checklists"
  | "procedures"
  | "performance"
  | "limitations"
  | "systems"
  | "flows"
  | "avionics"
  | "abnormal"
  | "knowledge"
  | "progress";

export type AircraftWorkspaceSection = {
  readonly key: AircraftModuleNavKey;
  readonly label: string;
  readonly href: string;
};

type ModuleDefinition = AircraftWorkspaceSection & {
  readonly available: (domains: ReadonlySet<TrainingContentDomain>) => boolean;
};

const always = () => true;
const has = (...required: readonly TrainingContentDomain[]) =>
  (domains: ReadonlySet<TrainingContentDomain>) => required.some((domain) => domains.has(domain));

export function aircraftWorkspaceSections(
  aircraftId: string,
  publishedDomains: readonly TrainingContentDomain[],
): readonly AircraftWorkspaceSection[] {
  const base = `/aircraft/${aircraftId}`;
  const domains = new Set<TrainingContentDomain>(publishedDomains);
  const definitions: readonly ModuleDefinition[] = [
    { key: "overview", label: "Aircraft", href: base, available: always },
    { key: "checklists", label: "Checklists", href: `${base}/checklists`, available: has("checklists", "normal-flight") },
    { key: "procedures", label: "Procedures", href: `${base}/procedures`, available: has("procedures") },
    { key: "performance", label: "Performance", href: `${base}/performance`, available: has("performance") },
    { key: "limitations", label: "Limitations", href: `${base}/limitations`, available: has("limitations") },
    { key: "systems", label: "Systems", href: `${base}/systems`, available: has("systems", "learning") },
    { key: "flows", label: "Flows", href: `${base}/flows`, available: has("flows") },
    { key: "avionics", label: "Avionics", href: `${base}/avionics`, available: has("avionics") },
    { key: "abnormal", label: "Abnormal", href: `${base}/abnormal`, available: has("abnormal") },
    { key: "knowledge", label: "Knowledge", href: `${base}/knowledge`, available: has("knowledge", "reference-knowledge") },
    { key: "progress", label: "Progress", href: `${base}/progress-overview`, available: always },
  ];
  return definitions.filter((section) => section.available(domains)).map(({ available: _available, ...section }) => section);
}
