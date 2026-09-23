"use client";

import { usePathname } from "next/navigation";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";

import { getAircraftProductModeForPathname } from "@/lib/aircraft-content-ia";
import {
  fastPathChecklistProgress,
  restoreFastPathChecklistSession,
  saveFastPathChecklistSession,
  toggleFastPathChecklistItem,
} from "@/lib/fast-path/checklist-adapter";
import {
  fastPathTabForShortcut,
  initialFastPathPanelState,
  reduceFastPathPanelState,
  type FastPathTab,
} from "@/lib/fast-path/panel-state";
import {
  normalizeChecklistSessionSnapshot,
  type ChecklistSessionSnapshot,
} from "@/lib/checklist-session";
import type { RuntimeChecklist } from "@/lib/checklist-runtime";

type FtFastPathContextValue = {
  readonly aircraftId: string;
  readonly panelOpen: boolean;
  readonly activeTab: FastPathTab;
  readonly openPanel: (tab: FastPathTab) => void;
  readonly closePanel: () => void;
  readonly selectTab: (tab: FastPathTab) => void;
  readonly shortcutsReady: boolean;
  readonly checklist?: RuntimeChecklist;
  readonly checklistSnapshot?: ChecklistSessionSnapshot;
  readonly checklistHydrated: boolean;
  readonly checklistProgress: {
    readonly completed: number;
    readonly total: number;
    readonly active: boolean;
  };
  readonly toggleChecklistItem: (itemId: string) => void;
  readonly selectChecklistPhase: (phaseId: string) => void;
};

const FtFastPathContext = createContext<FtFastPathContextValue | null>(null);

export function FtFastPathProvider({
  aircraftId,
  checklist,
  selectedVariant,
  children,
}: Readonly<{
  aircraftId: string;
  checklist?: RuntimeChecklist;
  selectedVariant?: string;
  children: ReactNode;
}>) {
  const [panel, dispatch] = useReducer(
    reduceFastPathPanelState,
    initialFastPathPanelState,
  );
  const pathname = usePathname();
  const operationalMode = getAircraftProductModeForPathname(pathname, aircraftId) === "efb";

  const [checklistSnapshot, setChecklistSnapshot] =
    useState<ChecklistSessionSnapshot | undefined>(() =>
      checklist ? normalizeChecklistSessionSnapshot(undefined, checklist) : undefined,
    );
  const [checklistHydrated, setChecklistHydrated] = useState(false);
  const [shortcutsReady, setShortcutsReady] = useState(false);

  useEffect(() => {
    if (!checklist) {
      setChecklistSnapshot(undefined);
      setChecklistHydrated(true);
      return;
    }
    setChecklistSnapshot(
      restoreFastPathChecklistSession(
        checklist,
        window.sessionStorage,
        selectedVariant,
        window.localStorage,
      ),
    );
    setChecklistHydrated(true);
  }, [checklist, selectedVariant]);

  useEffect(() => {
    if (!checklist || !checklistSnapshot || !checklistHydrated) return;
    try {
      saveFastPathChecklistSession(
        checklist,
        checklistSnapshot,
        window.sessionStorage,
        selectedVariant,
      );
    } catch {
      // Fast path remains usable when sessionStorage is unavailable.
    }
  }, [checklist, checklistHydrated, checklistSnapshot, selectedVariant]);

  const openPanel = useCallback((tab: FastPathTab) => {
    dispatch({ type: "open", tab });
  }, []);
  const closePanel = useCallback(() => {
    dispatch({ type: "close" });
  }, []);
  const selectTab = useCallback((tab: FastPathTab) => {
    dispatch({ type: "select", tab });
  }, []);

  useEffect(() => {
    if (!operationalMode) {
      closePanel();
      setShortcutsReady(false);
      return;
    }

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      const tab = fastPathTabForShortcut(event);
      if (tab) {
        event.preventDefault();
        openPanel(tab);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        closePanel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    setShortcutsReady(true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closePanel, openPanel, operationalMode]);

  const toggleChecklistItem = useCallback(
    (itemId: string) => {
      if (!checklist) return;
      setChecklistSnapshot((current) => {
        const snapshot =
          current ?? normalizeChecklistSessionSnapshot(undefined, checklist);
        return toggleFastPathChecklistItem(snapshot, itemId, checklist);
      });
    },
    [checklist],
  );

  const selectChecklistPhase = useCallback(
    (phaseId: string) => {
      if (!checklist) return;
      setChecklistSnapshot((current) =>
        normalizeChecklistSessionSnapshot(
          {
            ...(current ?? normalizeChecklistSessionSnapshot(undefined, checklist)),
            selectedPhaseId: phaseId,
          },
          checklist,
        ),
      );
    },
    [checklist],
  );

  const checklistProgress = useMemo(
    () =>
      checklist && checklistSnapshot
        ? fastPathChecklistProgress(checklist, checklistSnapshot)
        : { completed: 0, total: 0, active: false },
    [checklist, checklistSnapshot],
  );

  const value = useMemo<FtFastPathContextValue>(
    () => ({
      aircraftId,
      panelOpen: panel.open,
      activeTab: panel.activeTab,
      openPanel,
      closePanel,
      selectTab,
      shortcutsReady,
      checklist,
      checklistSnapshot,
      checklistHydrated,
      checklistProgress,
      toggleChecklistItem,
      selectChecklistPhase,
    }),
    [
      aircraftId,
      checklist,
      checklistHydrated,
      checklistProgress,
      checklistSnapshot,
      closePanel,
      openPanel,
      panel.activeTab,
      panel.open,
      selectChecklistPhase,
      selectTab,
      shortcutsReady,
      toggleChecklistItem,
    ],
  );

  return (
    <FtFastPathContext.Provider value={value}>
      {children}
    </FtFastPathContext.Provider>
  );
}

export function useFtFastPath(): FtFastPathContextValue {
  const value = useContext(FtFastPathContext);
  if (!value) throw new Error("useFtFastPath must be used within FtFastPathProvider");
  return value;
}
