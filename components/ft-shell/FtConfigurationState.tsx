import type { WorkspaceAircraftScope } from "@/lib/workspace-aircraft-scope";

export function FtConfigurationState({
  scope,
}: Readonly<{
  scope: Exclude<WorkspaceAircraftScope, { status: "selected" }>;
}>) {
  const copy =
    scope.status === "unselected"
      ? {
          title: "Configuration not selected",
          body: "Select an aircraft configuration before using this operational workspace.",
        }
      : scope.status === "unknown-variant"
        ? {
            title: "Unknown configuration",
            body: "The requested aircraft configuration is not registered for this aircraft.",
          }
        : {
            title: "Invalid configuration",
            body: "The requested aircraft configuration could not be resolved safely.",
          };

  return (
    <main
      aria-label="Aircraft configuration unavailable"
      data-ft-configuration-state={scope.status}
    >
      <section role="status">
        <p>CONFIGURATION</p>
        <h1>{copy.title}</h1>
        <p>{copy.body}</p>
      </section>
    </main>
  );
}

export function FtConfigurationNotice() {
  return (
    <section
      aria-label="Aircraft configuration notice"
      data-ft-configuration-state="unselected"
      role="status"
    >
      <strong>Configuration not selected</strong>
      <p>
        Showing only common aircraft content. Select a configuration to include configuration-specific material.
      </p>
    </section>
  );
}
