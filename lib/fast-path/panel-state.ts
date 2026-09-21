export const fastPathTabs = ["checklist", "qrh", "perf", "ref"] as const;

export type FastPathTab = typeof fastPathTabs[number];

export type FastPathPanelState = {
  readonly open: boolean;
  readonly activeTab: FastPathTab;
};

export type FastPathPanelAction =
  | { readonly type: "open"; readonly tab: FastPathTab }
  | { readonly type: "close" }
  | { readonly type: "select"; readonly tab: FastPathTab };

export const initialFastPathPanelState: FastPathPanelState = {
  open: false,
  activeTab: "checklist",
};

export function reduceFastPathPanelState(
  state: FastPathPanelState,
  action: FastPathPanelAction,
): FastPathPanelState {
  switch (action.type) {
    case "open":
      return { open: true, activeTab: action.tab };
    case "close":
      return { ...state, open: false };
    case "select":
      return { ...state, activeTab: action.tab };
    default:
      return state;
  }
}

export function fastPathTabForShortcut(event: Pick<KeyboardEvent, "altKey" | "key">): FastPathTab | undefined {
  if (!event.altKey) return undefined;
  if (event.key === "1") return "checklist";
  if (event.key === "2") return "qrh";
  if (event.key === "3") return "perf";
  if (event.key === "4") return "ref";
  return undefined;
}
