export type ScenarioSessionState = {
  readonly selectedId: string;
  readonly stageIndex: number;
  readonly revealed: boolean;
  readonly finished: boolean;
  readonly completedIds: readonly string[];
  readonly repeatIds: readonly string[];
};

export type ScenarioSessionAction =
  | { readonly type: "select"; readonly scenarioId: string }
  | { readonly type: "reveal" }
  | {
      readonly type: "advance";
      readonly scenarioId: string;
      readonly stageCount: number;
    }
  | { readonly type: "repeat-now" }
  | { readonly type: "toggle-repeat"; readonly scenarioId: string };

export function initialScenarioSessionState(
  firstScenarioId?: string,
): ScenarioSessionState {
  return {
    selectedId: firstScenarioId ?? "",
    stageIndex: 0,
    revealed: false,
    finished: false,
    completedIds: [],
    repeatIds: [],
  };
}

function uniqueAppend(
  values: readonly string[],
  value: string,
): readonly string[] {
  return values.includes(value) ? values : [...values, value];
}

export function scenarioSessionReducer(
  state: ScenarioSessionState,
  action: ScenarioSessionAction,
): ScenarioSessionState {
  switch (action.type) {
    case "select":
      return {
        ...state,
        selectedId: action.scenarioId,
        stageIndex: 0,
        revealed: false,
        finished: false,
      };
    case "reveal":
      return state.finished ? state : { ...state, revealed: true };
    case "advance": {
      const lastIndex = Math.max(0, action.stageCount - 1);
      if (state.stageIndex < lastIndex) {
        return {
          ...state,
          stageIndex: state.stageIndex + 1,
          revealed: false,
        };
      }
      return {
        ...state,
        finished: true,
        completedIds: uniqueAppend(state.completedIds, action.scenarioId),
      };
    }
    case "repeat-now":
      return {
        ...state,
        stageIndex: 0,
        revealed: false,
        finished: false,
      };
    case "toggle-repeat":
      return {
        ...state,
        repeatIds: state.repeatIds.includes(action.scenarioId)
          ? state.repeatIds.filter((id) => id !== action.scenarioId)
          : [...state.repeatIds, action.scenarioId],
      };
  }
}
