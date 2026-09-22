import type {
  AircraftLimitationsContent,
  LimitationGroup,
  LimitationItem,
  TrainingNotice,
  TrainingSourceReference,
} from "./universal-aircraft-content.ts";

export type ReferencePresentationItem = {
  readonly id: string;
  readonly label: string;
  readonly value: string | number;
  readonly unit?: string;
  readonly condition?: string;
  readonly notices: readonly TrainingNotice[];
  readonly sources: readonly TrainingSourceReference[];
};

export type ReferencePresentationGroup = {
  readonly id: string;
  readonly title: string;
  readonly items: readonly ReferencePresentationItem[];
  readonly sources: readonly TrainingSourceReference[];
};

export type ReferencePresentation = {
  readonly title: string;
  readonly sourceNote?: string;
  readonly disclaimer?: string;
  readonly groups: readonly ReferencePresentationGroup[];
  readonly itemCount: number;
};

function projectItem(item: LimitationItem): ReferencePresentationItem {
  return {
    id: item.id,
    label: item.label,
    value: item.value,
    ...(item.unit ? { unit: item.unit } : {}),
    ...(item.condition ? { condition: item.condition } : {}),
    notices: item.notices ?? [],
    sources: item.sources ?? [],
  };
}

function projectGroup(group: LimitationGroup): ReferencePresentationGroup {
  return {
    id: group.id,
    title: group.title,
    items: group.items.map(projectItem),
    sources: group.sources ?? [],
  };
}

export function toReferencePresentation(
  content: AircraftLimitationsContent | undefined,
): ReferencePresentation | undefined {
  if (!content?.groups.length) return undefined;

  const groups = content.groups
    .map(projectGroup)
    .filter((group) => group.items.length > 0);
  if (!groups.length) return undefined;

  return {
    title: content.title,
    ...(content.sourceNote ? { sourceNote: content.sourceNote } : {}),
    ...(content.disclaimer ? { disclaimer: content.disclaimer } : {}),
    groups,
    itemCount: groups.reduce((sum, group) => sum + group.items.length, 0),
  };
}
