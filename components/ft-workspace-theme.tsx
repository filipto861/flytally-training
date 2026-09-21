"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type WorkspaceTheme = "light" | "dark";

type WorkspaceThemeContextValue = {
  readonly theme: WorkspaceTheme;
  readonly setTheme: (theme: WorkspaceTheme) => void;
};

const STORAGE_KEY = "flytally-training-workspace-theme";
const WorkspaceThemeContext = createContext<WorkspaceThemeContextValue | null>(null);

function storedTheme(): WorkspaceTheme | undefined {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : undefined;
  } catch {
    return undefined;
  }
}

function preferredTheme(): WorkspaceTheme {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function WorkspaceThemeProvider({
  children,
  className = "",
}: Readonly<{
  children: ReactNode;
  className?: string;
}>) {
  const [theme, setThemeState] = useState<WorkspaceTheme>("light");

  useEffect(() => {
    setThemeState(storedTheme() ?? preferredTheme());
  }, []);

  const value = useMemo<WorkspaceThemeContextValue>(() => ({
    theme,
    setTheme(nextTheme) {
      setThemeState(nextTheme);
      try {
        window.localStorage.setItem(STORAGE_KEY, nextTheme);
      } catch {
        // Theme preference remains session-local when browser storage is unavailable.
      }
    },
  }), [theme]);

  const classes = ["ft-workspace", className].filter(Boolean).join(" ");

  return (
    <WorkspaceThemeContext.Provider value={value}>
      <div className={classes} data-theme={theme}>
        {children}
      </div>
    </WorkspaceThemeContext.Provider>
  );
}

export function useWorkspaceTheme(): WorkspaceThemeContextValue {
  const value = useContext(WorkspaceThemeContext);
  if (!value) throw new Error("useWorkspaceTheme must be used within WorkspaceThemeProvider.");
  return value;
}
