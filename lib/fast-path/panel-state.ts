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

export function fastPathTabForShortcut(
  event: Pick<KeyboardEvent, "ctrlKey" | "shiftKey" | "code">,
): FastPathTab | undefined {
  if (!event.ctrlKey || !event.shiftKey) return undefined;
  if (event.code === "Digit1") return "checklist";
  if (event.code === "Digit2") return "qrh";
  if (event.code === "Digit3") return "perf";
  if (event.code === "Digit4") return "ref";
  return undefined;
}
