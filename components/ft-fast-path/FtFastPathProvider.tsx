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

import { getAircraftProductModeForPathname } from "@/lib/aircraft-product-mode";
import { useActiveFlightState } from "@/components/ft-flight/use-active-flight";
import type { ActiveFlight } from "@/lib/active-flight/types";
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
  checklistSessionStorageKey,
  initialChecklistPhaseId,
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
  readonly resetChecklistPhase: (phaseId: string) => void;
  readonly resetChecklistAll: () => void;
};

const FtFastPathContext = createContext<FtFastPathContextValue | null>(null);

export function FtFastPathProvider({
  aircraftId,
  checklist,
  selectedVariant,
  activeFlight,
  children,
}: Readonly<{
  aircraftId: string;
  checklist?: RuntimeChecklist;
  selectedVariant?: string;
  activeFlight?: ActiveFlight | null;
  children: ReactNode;
}>) {
  const pathname = usePathname();
  const efbMode = getAircraftProductModeForPathname(pathname, aircraftId) === "efb";
  const { flight } = useActiveFlightState(aircraftId, activeFlight);
  const checklistSessionScope = efbMode
    ? `flight:${flight?.lifecycle === "ACTIVE" ? flight.id : "no-active-flight"}`
    : undefined;
  const checklistStorageKey = checklist
    ? checklistSessionStorageKey(
        checklist,
        selectedVariant,
        checklistSessionScope,
      )
    : undefined;
  const [panel, dispatch] = useReducer(
    reduceFastPathPanelState,
    initialFastPathPanelState,
  );
  const [checklistSnapshot, setChecklistSnapshot] =
    useState<ChecklistSessionSnapshot | undefined>(() =>
      checklist ? normalizeChecklistSessionSnapshot(undefined, checklist) : undefined,
    );
  const [hydratedChecklistKey, setHydratedChecklistKey] = useState<string>();
  const [shortcutsReady, setShortcutsReady] = useState(false);

  const checklistHydrated =
    !checklist || (
      Boolean(checklistStorageKey)
      && hydratedChecklistKey === checklistStorageKey
    );

  useEffect(() => {
    if (!checklist || !checklistStorageKey) {
      setChecklistSnapshot(undefined);
      setHydratedChecklistKey(undefined);
      return;
    }
    const canonicalStorage = efbMode
      ? window.localStorage
      : window.sessionStorage;
    const previousCanonicalStorage = efbMode
      ? window.sessionStorage
      : undefined;
    setChecklistSnapshot(
      restoreFastPathChecklistSession(
        checklist,
        canonicalStorage,
        selectedVariant,
        window.localStorage,
        checklistSessionScope,
        previousCanonicalStorage,
      ),
    );
    setHydratedChecklistKey(checklistStorageKey);
  }, [
    checklist,
    checklistSessionScope,
    checklistStorageKey,
    efbMode,
    selectedVariant,
  ]);

  useEffect(() => {
    if (
      !checklist
      || !checklistSnapshot
      || !checklistHydrated
      || !checklistStorageKey
    ) return;
    try {
      saveFastPathChecklistSession(
        checklist,
        checklistSnapshot,
        efbMode ? window.localStorage : window.sessionStorage,
        selectedVariant,
        checklistSessionScope,
      );
    } catch {
      // Checklist remains usable when browser persistence is unavailable.
    }
  }, [
    checklist,
    checklistHydrated,
    checklistSessionScope,
    checklistSnapshot,
    checklistStorageKey,
    efbMode,
    selectedVariant,
  ]);

  const openPanel = useCallback((tab: FastPathTab) => {
    if (!efbMode) return;
    dispatch({ type: "open", tab });
  }, [efbMode]);
  const closePanel = useCallback(() => {
    dispatch({ type: "close" });
  }, []);
  const selectTab = useCallback((tab: FastPathTab) => {
    dispatch({ type: "select", tab });
  }, []);

  useEffect(() => {
    if (efbMode) return;
    dispatch({ type: "close" });
  }, [efbMode]);

  useEffect(() => {
    if (!efbMode) {
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
      setShortcutsReady(false);
    };
  }, [closePanel, efbMode, openPanel]);

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

  const resetChecklistPhase = useCallback(
    (phaseId: string) => {
      if (!checklist) return;
      const phase = checklist.phases.find((candidate) => candidate.id === phaseId);
      if (!phase) return;
      const phaseItemIds = new Set(phase.items.map((item) => item.id));
      setChecklistSnapshot((current) => {
        const snapshot =
          current ?? normalizeChecklistSessionSnapshot(undefined, checklist);
        return normalizeChecklistSessionSnapshot(
          {
            ...snapshot,
            completedIds: snapshot.completedIds.filter(
              (itemId) => !phaseItemIds.has(itemId),
            ),
            revealedFlowPhaseIds: snapshot.revealedFlowPhaseIds.filter(
              (candidate) => candidate !== phaseId,
            ),
            revealedResponseIds: snapshot.revealedResponseIds.filter(
              (itemId) => !phaseItemIds.has(itemId),
            ),
          },
          checklist,
        );
      });
    },
    [checklist],
  );

  const resetChecklistAll = useCallback(() => {
    if (!checklist) return;
    setChecklistSnapshot((current) => {
      const snapshot =
        current ?? normalizeChecklistSessionSnapshot(undefined, checklist);
      return normalizeChecklistSessionSnapshot(
        {
          ...snapshot,
          selectedPhaseId: initialChecklistPhaseId(checklist),
          completedIds: [],
          revealedFlowPhaseIds: [],
          revealedResponseIds: [],
        },
        checklist,
      );
    });
  }, [checklist]);

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
      resetChecklistPhase,
      resetChecklistAll,
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
      resetChecklistAll,
      resetChecklistPhase,
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

export function useOptionalFtFastPath(): FtFastPathContextValue | null {
  return useContext(FtFastPathContext);
}

export function useFtFastPath(): FtFastPathContextValue {
  const value = useOptionalFtFastPath();
  if (!value) throw new Error("useFtFastPath must be used within FtFastPathProvider");
  return value;
}
