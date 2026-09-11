import type { TrainingContentDomain } from "./content-admin-types.ts";
import { universalTrainingContentDomains, type UniversalTrainingContentDomain } from "./universal-aircraft-content.ts";

export const structuredAuthoringDomains = [...universalTrainingContentDomains, "abnormal"] as const;
export type StructuredAuthoringDomain = UniversalTrainingContentDomain | "abnormal";

export function isStructuredAuthoringDomain(value: string): value is StructuredAuthoringDomain {
  return (structuredAuthoringDomains as readonly string[]).includes(value);
}

export function structuredAuthoringDomainLabel(domain: StructuredAuthoringDomain): string {
  if (domain === "abnormal") return "Abnormal & emergency";
  return domain.charAt(0).toUpperCase() + domain.slice(1);
}

export function createStructuredStarterPayload(aircraftId: string, domain: StructuredAuthoringDomain): Record<string, unknown> {
  switch (domain) {
    case "checklists":
      return {
        aircraftId,
        title: "",
        phases: [{ id: "", title: "", sequence: 1, items: [{ id: "", challenge: "" }] }],
      };
    case "procedures":
      return {
        aircraftId,
        title: "",
        procedures: [{ id: "", title: "", steps: [{ id: "", action: "" }] }],
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
        }],
      };
    case "limitations":
      return {
        aircraftId,
        title: "",
        groups: [{ id: "", title: "", items: [{ id: "", label: "", value: "" }] }],
      };
    case "systems":
      return {
        aircraftId,
        title: "",
        systems: [{ id: "", title: "", summary: "" }],
      };
    case "flows":
      return {
        aircraftId,
        title: "",
        flows: [{ id: "", title: "", steps: [{ id: "", action: "" }] }],
      };
    case "avionics":
      return {
        aircraftId,
        title: "",
        topics: [{ id: "", title: "", summary: "" }],
      };
    case "knowledge":
      return {
        aircraftId,
        title: "",
        questions: [{ id: "", area: "", prompt: "", choices: ["", ""], correctIndex: 0, explanation: "" }],
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
          stages: [{
            id: "",
            label: "",
            prompt: "",
            expectedResponse: [""],
            explanation: "",
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
