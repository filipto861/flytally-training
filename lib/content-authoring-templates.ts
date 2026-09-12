import type { TrainingContentDomain } from "./content-admin-types.ts";
import { universalTrainingContentDomains, type UniversalTrainingContentDomain } from "./universal-aircraft-content.ts";

export const structuredAuthoringDomains = [...universalTrainingContentDomains, "weight-balance", "abnormal"] as const;
export type StructuredAuthoringDomain = UniversalTrainingContentDomain | "weight-balance" | "abnormal";

export function isStructuredAuthoringDomain(value: string): value is StructuredAuthoringDomain {
  return (structuredAuthoringDomains as readonly string[]).includes(value);
}

export function structuredAuthoringDomainLabel(domain: StructuredAuthoringDomain): string {
  if (domain === "abnormal") return "Abnormal & emergency";
  if (domain === "weight-balance") return "Weight & Balance";
  return domain.charAt(0).toUpperCase() + domain.slice(1);
}

function applicabilityStarter() {
  return { variants: [], equipmentAllOf: [], equipmentAnyOf: [], equipmentNoneOf: [] };
}

export function createStructuredStarterPayload(aircraftId: string, domain: StructuredAuthoringDomain): Record<string, unknown> {
  switch (domain) {
    case "checklists":
      return {
        aircraftId,
        title: "",
        phases: [{ id: "", title: "", sequence: 1, applicability: applicabilityStarter(), items: [{ id: "", challenge: "", applicability: applicabilityStarter() }] }],
      };
    case "procedures":
      return {
        aircraftId,
        title: "",
        procedures: [{ id: "", title: "", applicability: applicabilityStarter(), steps: [{ id: "", action: "" }] }],
      };
    case "performance":
      return {
        aircraftId,
        title: "",
        datasets: [{
          id: "",
          title: "",
          kind: "reference-table",
          axes: [{ key: "axis1", label: "", values: [""] }],
          outputs: [{ key: "output1", label: "" }],
          rows: [{ inputs: { axis1: "" }, outputs: { output1: "" } }],
          interpolation: "none",
          applicability: applicabilityStarter(),
        }],
      };
    case "weight-balance":
      return {
        aircraftId,
        title: "",
        empty: { massKg: 0, armMm: 0, momentKgMm: 0, sources: [{ manualId: "", pageLabel: "" }] },
        limits: {
          maxTakeoffMassKg: 0,
          envelope: [
            { massKg: 0, forwardCgMm: 0, aftCgMm: 0 },
            { massKg: 0, forwardCgMm: 0, aftCgMm: 0 },
          ],
          sources: [{ manualId: "", pageLabel: "" }],
        },
        stations: [{ id: "", label: "", armMm: 0, input: "mass-kg", sources: [{ manualId: "", pageLabel: "" }] }],
      };
    case "limitations":
      return {
        aircraftId,
        title: "",
        groups: [{ id: "", title: "", items: [{ id: "", label: "", value: "", applicability: applicabilityStarter() }] }],
      };
    case "systems":
      return {
        aircraftId,
        title: "",
        systems: [{ id: "", title: "", summary: "", applicability: applicabilityStarter() }],
      };
    case "flows":
      return {
        aircraftId,
        title: "",
        flows: [{ id: "", title: "", applicability: applicabilityStarter(), steps: [{ id: "", action: "" }] }],
      };
    case "avionics":
      return {
        aircraftId,
        title: "",
        topics: [{ id: "", title: "", summary: "", applicability: applicabilityStarter() }],
      };
    case "knowledge":
      return {
        aircraftId,
        title: "",
        questions: [{ id: "", area: "", prompt: "", choices: ["", ""], correctIndex: 0, explanation: "", applicability: applicabilityStarter() }],
      };
    case "abnormal":
      return {
        aircraftId,
        title: "",
        scenarios: [{
          id: "",
          title: "",
          category: "",
          phase: "",
          difficulty: "core",
          minutes: 0,
          summary: "",
          setup: "",
          objectives: [""],
          applicability: applicabilityStarter(),
          stages: [{
            id: "",
            label: "",
            prompt: "",
            expectedResponse: [""],
            explanation: "",
            applicability: applicabilityStarter(),
            sources: [{ manualId: "", pageLabel: "" }],
          }],
          debrief: [""],
        }],
      };
  }
}

export function isModernStructuredDomain(domain: TrainingContentDomain): domain is StructuredAuthoringDomain {
  return isStructuredAuthoringDomain(domain);
}
