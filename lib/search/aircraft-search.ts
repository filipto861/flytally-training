import type { TrainingAircraft } from "../aircraft-catalog";
import type { TrainingContentDomain } from "../content-admin-types";
import type { TrainingContentRepository } from "../content-repository";
import type {
  AircraftChecklistContent,
  AircraftLimitationsContent,
  AircraftPerformanceContent,
  AircraftProcedureDefinitionContent,
  AircraftSystemsContent,
  ProcedureNode,
  TrainingSourceReference,
} from "../universal-aircraft-content";
import type {
  AircraftAbnormalEmergencyContent,
  AircraftQrhStep,
} from "../universal-abnormal-emergency";

export const aircraftSearchResultTypes = [
  "procedure",
  "memoryItem",
  "limitation",
  "system",
  "component",
  "performance",
  "scenario",
  "source",
] as const;

export type AircraftSearchResultType = typeof aircraftSearchResultTypes[number];

export type AircraftSearchResult = {
  readonly id: string;
  readonly title: string;
  readonly type: AircraftSearchResultType;
  readonly context: string;
  readonly href: string;
  readonly source: string;
};

type SearchCandidate = AircraftSearchResult & {
  readonly searchableContext: string;
};

const TYPE_PRIORITY: Readonly<Record<AircraftSearchResultType, number>> = {
  procedure: 0,
  limitation: 1,
  memoryItem: 2,
  component: 3,
  system: 4,
  performance: 5,
  scenario: 6,
  source: 7,
};

const SEARCH_DOMAINS: readonly TrainingContentDomain[] = [
  "checklists",
  "procedures",
  "performance",
  "limitations",
  "systems",
  "abnormal",
];

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("en-US");
}

function sourceContext(sources: readonly TrainingSourceReference[] | undefined): string {
  if (!sources?.length) return "";
  const first = sources[0];
  return [
    first.manualId,
    first.chapter ? `Ch ${first.chapter}` : undefined,
    first.section,
    first.pageLabel ? `p. ${first.pageLabel}` : undefined,
  ]
    .filter(Boolean)
    .join(" · ");
}

function result(
  aircraftId: string,
  type: AircraftSearchResultType,
  id: string,
  title: string,
  context: string,
  route: string,
  source: string,
  extraSearchText = "",
): SearchCandidate {
  return {
    id: `${type}:${id}`,
    title,
    type,
    context,
    href: route ? `/aircraft/${aircraftId}/${route}` : `/aircraft/${aircraftId}`,
    source,
    searchableContext: [context, extraSearchText].filter(Boolean).join(" · "),
  };
}

function graphMemoryItems(
  aircraftId: string,
  procedureId: string,
  procedureTitle: string,
  nodes: readonly ProcedureNode[],
  source: string,
): SearchCandidate[] {
  const items: SearchCandidate[] = [];
  for (const node of nodes) {
    if (!("memoryItem" in node) || node.memoryItem !== true) continue;
    const title =
      node.kind === "action"
        ? node.action
        : node.kind === "reference"
          ? node.instruction
          : procedureTitle;
    items.push(
      result(
        aircraftId,
        "memoryItem",
        `${procedureId}:${node.id}`,
        title,
        `Memory Item · ${procedureTitle}`,
        `procedures#${encodeURIComponent(procedureId)}`,
        sourceContext(node.sources) || source,
      ),
    );
  }
  return items;
}

function procedureCandidates(
  aircraftId: string,
  content: AircraftProcedureDefinitionContent | undefined,
): SearchCandidate[] {
  if (!content) return [];
  const candidates: SearchCandidate[] = [
    result(
      aircraftId,
      "procedure",
      "procedures",
      content.title,
      "Procedures",
      "procedures",
      "procedures",
    ),
  ];

  for (const procedure of content.procedures) {
    const context = [procedure.phase, procedure.summary].filter(Boolean).join(" · ") || "Procedure";
    const source = sourceContext(procedure.sources) || "procedures";
    candidates.push(
      result(
        aircraftId,
        "procedure",
        procedure.id,
        procedure.title,
        context,
        `procedures#${encodeURIComponent(procedure.id)}`,
        source,
      ),
    );
    if (procedure.graph) {
      candidates.push(
        ...graphMemoryItems(
          aircraftId,
          procedure.id,
          procedure.title,
          procedure.graph.nodes,
          source,
        ),
      );
    }
  }
  return candidates;
}

function checklistCandidates(
  aircraftId: string,
  content: AircraftChecklistContent | undefined,
): SearchCandidate[] {
  if (!content) return [];
  return [
    result(
      aircraftId,
      "procedure",
      "checklist",
      content.title,
      "Checklist",
      "checklists",
      "checklists",
    ),
    ...content.phases.map((phase) =>
      result(
        aircraftId,
        "procedure",
        `checklist:${phase.id}`,
        phase.title,
        `Checklist · ${content.title}`,
        `checklists#${encodeURIComponent(phase.id)}`,
        sourceContext(phase.sources) || "checklists",
        phase.items.map((item) => [item.challenge, item.response].filter(Boolean).join(" ")).join(" "),
      ),
    ),
  ];
}

function performanceCandidates(
  aircraftId: string,
  content: AircraftPerformanceContent | undefined,
): SearchCandidate[] {
  if (!content) return [];
  return [
    result(
      aircraftId,
      "performance",
      "performance",
      content.title,
      "Performance",
      "performance",
      "performance",
    ),
    ...content.datasets.map((dataset) =>
      result(
        aircraftId,
        "performance",
        dataset.id,
        dataset.title,
        [dataset.phase ? `Performance · ${dataset.phase}` : "Performance", dataset.description]
          .filter(Boolean)
          .join(" · "),
        `performance#${encodeURIComponent(dataset.id)}`,
        sourceContext(dataset.sources) || "performance",
        [
          dataset.notes?.join(" "),
          dataset.axes.map((axis) => axis.label).join(" "),
          dataset.outputs.map((output) => output.label).join(" "),
        ]
          .filter(Boolean)
          .join(" "),
      ),
    ),
  ];
}

function limitationCandidates(
  aircraftId: string,
  content: AircraftLimitationsContent | undefined,
): SearchCandidate[] {
  if (!content) return [];
  const candidates: SearchCandidate[] = [];
  for (const group of content.groups) {
    for (const item of group.items) {
      const value = [item.value, item.unit].filter((part) => part !== undefined).join(" ");
      candidates.push(
        result(
          aircraftId,
          "limitation",
          item.id,
          item.label,
          [group.title, value, item.condition].filter(Boolean).join(" · "),
          `limitations#${encodeURIComponent(item.id)}`,
          sourceContext(item.sources ?? group.sources) || "limitations",
        ),
      );
    }
  }
  return candidates;
}

function systemCandidates(
  aircraftId: string,
  content: AircraftSystemsContent | undefined,
): SearchCandidate[] {
  if (!content) return [];
  const candidates: SearchCandidate[] = [];
  for (const system of content.systems) {
    const source = sourceContext(system.sources) || "systems";
    candidates.push(
      result(
        aircraftId,
        "system",
        system.id,
        system.title,
        system.summary,
        `systems#${encodeURIComponent(system.id)}`,
        source,
        [
          system.mentalModel,
          system.controls?.join(" "),
          system.indications?.join(" "),
          system.remember?.join(" "),
        ]
          .filter(Boolean)
          .join(" "),
      ),
    );
    system.components?.forEach((component, index) => {
      candidates.push(
        result(
          aircraftId,
          "component",
          `${system.id}:${index}`,
          component,
          `Component · ${system.title}`,
          `systems#${encodeURIComponent(system.id)}`,
          source,
        ),
      );
    });
  }
  return candidates;
}

function qrhStepSearchText(steps: readonly AircraftQrhStep[]): string {
  const parts: string[] = [];
  for (const step of steps) {
    if (step.kind === "action" || step.kind === "information") {
      parts.push(step.label ?? "", step.text);
      parts.push(...(step.notices?.map((notice) => notice.text) ?? []));
      continue;
    }

    parts.push(...(step.notices?.map((notice) => notice.text) ?? []));
    for (const branch of step.branches) {
      parts.push(branch.label, qrhStepSearchText(branch.steps));
    }
  }
  return parts.filter(Boolean).join(" ");
}

function abnormalCandidates(
  aircraftId: string,
  content: AircraftAbnormalEmergencyContent | undefined,
): SearchCandidate[] {
  if (!content) return [];

  if (content.schemaVersion === 2) {
    return content.scenarios.map((scenario) => {
      const firstStageSource = scenario.stages.flatMap((stage) => stage.sources)[0];
      const source =
        sourceContext(scenario.sources) ||
        (firstStageSource ? sourceContext([firstStageSource]) : "") ||
        "abnormal";
      const classLabel = scenario.procedureClass === "emergency" ? "Emergency" : "Abnormal";
      const sourceSearchText = scenario.stages
        .map((stage) =>
          [
            stage.label,
            stage.notices?.map((notice) => notice.text).join(" "),
            qrhStepSearchText(stage.steps),
          ]
            .filter(Boolean)
            .join(" "),
        )
        .join(" ");

      return result(
        aircraftId,
        "scenario",
        scenario.id,
        scenario.title,
        [classLabel, scenario.category, scenario.phase].filter(Boolean).join(" · "),
        `abnormal#${encodeURIComponent(scenario.id)}`,
        source,
        sourceSearchText,
      );
    });
  }

  return content.scenarios.map((scenario) =>
    result(
      aircraftId,
      "scenario",
      scenario.id,
      scenario.title,
      [scenario.category, scenario.phase, scenario.summary].filter(Boolean).join(" · "),
      `abnormal#${encodeURIComponent(scenario.id)}`,
      sourceContext(scenario.sources) || "abnormal",
      [scenario.setup, scenario.objectives.join(" ")].join(" "),
    ),
  );
}

function sourceCandidates(aircraftId: string, aircraft: TrainingAircraft): SearchCandidate[] {
  return aircraft.manuals.map((manual) =>
    result(
      aircraftId,
      "source",
      manual.id,
      manual.title,
      [manual.publisher, manual.revision, manual.issueDate].filter(Boolean).join(" · "),
      "",
      manual.id,
      [manual.sourceKind, manual.authorityRole].join(" "),
    ),
  );
}

async function publishedModule<T>(
  repository: TrainingContentRepository,
  aircraftId: string,
  domain: TrainingContentDomain,
): Promise<T | undefined> {
  return repository.getPublishedModule?.<T>(aircraftId, domain, "bundle");
}

async function collectCandidates(
  repository: TrainingContentRepository,
  aircraftId: string,
  aircraft: TrainingAircraft,
): Promise<SearchCandidate[]> {
  const domains = new Set(
    repository.listPublishedModuleDomains
      ? await repository.listPublishedModuleDomains(aircraftId)
      : SEARCH_DOMAINS,
  );

  const [checklists, procedures, performance, limitations, systems, abnormal, learning, normalFlight, abnormalLegacy, referenceKnowledge] =
    await Promise.all([
      domains.has("checklists")
        ? publishedModule<AircraftChecklistContent>(repository, aircraftId, "checklists")
        : undefined,
      domains.has("procedures")
        ? publishedModule<AircraftProcedureDefinitionContent>(repository, aircraftId, "procedures")
        : undefined,
      domains.has("performance")
        ? publishedModule<AircraftPerformanceContent>(repository, aircraftId, "performance")
        : undefined,
      domains.has("limitations")
        ? publishedModule<AircraftLimitationsContent>(repository, aircraftId, "limitations")
        : undefined,
      domains.has("systems")
        ? publishedModule<AircraftSystemsContent>(repository, aircraftId, "systems")
        : undefined,
      domains.has("abnormal")
        ? publishedModule<AircraftAbnormalEmergencyContent>(repository, aircraftId, "abnormal")
        : undefined,
      repository.getLearningContent(aircraftId),
      repository.getNormalFlight(aircraftId),
      repository.getAbnormalTraining(aircraftId),
      repository.getReferenceKnowledge(aircraftId),
    ]);

  const candidates: SearchCandidate[] = [
    ...checklistCandidates(aircraftId, checklists),
    ...procedureCandidates(aircraftId, procedures),
    ...performanceCandidates(aircraftId, performance),
    ...limitationCandidates(aircraftId, limitations),
    ...systemCandidates(aircraftId, systems),
    ...abnormalCandidates(aircraftId, abnormal),
    ...sourceCandidates(aircraftId, aircraft),
  ];

  if (!systems) {
    for (const system of learning?.systems ?? []) {
      candidates.push(
        result(
          aircraftId,
          "system",
          `legacy:${system.id}`,
          system.title,
          system.mentalModel,
          `systems#${encodeURIComponent(system.id)}`,
          "learning",
          [system.pilotControls.join(" "), system.pilotMonitors.join(" "), system.remember.join(" ")].join(" "),
        ),
      );
    }
  }

  if (!checklists && normalFlight) {
    candidates.push(
      result(
        aircraftId,
        "procedure",
        "legacy-checklist",
        normalFlight.title,
        "Checklist",
        "checklists",
        "normal-flight",
      ),
      ...normalFlight.phases.map((phase) =>
        result(
          aircraftId,
          "procedure",
          `legacy-checklist:${phase.id}`,
          phase.title,
          `Checklist · ${normalFlight.title}`,
          `checklists#${encodeURIComponent(phase.id)}`,
          "normal-flight",
          phase.items.map((item) => [item.action, item.why].filter(Boolean).join(" ")).join(" "),
        ),
      ),
    );
  }

  if (!abnormal && abnormalLegacy) {
    for (const scenario of abnormalLegacy.scenarios) {
      candidates.push(
        result(
          aircraftId,
          "scenario",
          `legacy:${scenario.id}`,
          scenario.title,
          [scenario.category, scenario.phase, scenario.summary].join(" · "),
          `abnormal#${encodeURIComponent(scenario.id)}`,
          "abnormal",
          [scenario.setup, scenario.objectives.join(" ")].join(" "),
        ),
      );
    }
  }

  if (!limitations && referenceKnowledge) {
    for (const group of referenceKnowledge.groups) {
      for (const item of group.items) {
        candidates.push(
          result(
            aircraftId,
            "limitation",
            `legacy:${item.id}`,
            item.label,
            [group.title, item.value, item.note].filter(Boolean).join(" · "),
            `reference#${encodeURIComponent(item.id)}`,
            "reference-knowledge",
          ),
        );
      }
    }
  }

  return candidates;
}

function matchRank(candidate: SearchCandidate, normalizedQuery: string): number | null {
  const title = normalize(candidate.title);
  const context = normalize(candidate.searchableContext);

  if (title === normalizedQuery) return 0;
  if (title.startsWith(normalizedQuery)) return 1;

  const escaped = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`(^|[^a-z0-9])${escaped}`, "i").test(title)) return 2;
  if (title.includes(normalizedQuery)) return 3;
  if (context.includes(normalizedQuery)) return 4;
  return null;
}

export function isValidAircraftSearchId(value: string): boolean {
  return value.length > 0 && value.length <= 128 && /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(value);
}

export async function searchAircraft(
  repository: TrainingContentRepository,
  aircraftId: string,
  query: string,
  limit = 20,
): Promise<readonly AircraftSearchResult[]> {
  const normalizedQuery = normalize(query);
  if (normalizedQuery.length < 2 || !isValidAircraftSearchId(aircraftId)) return [];

  const aircraft = await repository.getAircraft(aircraftId);
  if (!aircraft) return [];

  const candidates = await collectCandidates(repository, aircraftId, aircraft);
  const boundedLimit = Math.max(1, Math.min(50, Math.trunc(limit) || 20));

  return candidates
    .map((candidate) => ({ candidate, rank: matchRank(candidate, normalizedQuery) }))
    .filter((entry): entry is { candidate: SearchCandidate; rank: number } => entry.rank !== null)
    .sort(
      (left, right) =>
        left.rank - right.rank ||
        TYPE_PRIORITY[left.candidate.type] - TYPE_PRIORITY[right.candidate.type] ||
        left.candidate.title.localeCompare(right.candidate.title),
    )
    .slice(0, boundedLimit)
    .map(({ candidate: { searchableContext: _searchableContext, ...publicResult } }) => publicResult);
}
