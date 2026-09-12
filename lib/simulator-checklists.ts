export type SimulatorChecklistSource = {
  readonly chapter: number;
  readonly section: string;
  readonly manualPage: string;
};

export type SimulatorChecklistItem = {
  readonly id: string;
  readonly action: string;
  readonly why?: string;
  readonly source: SimulatorChecklistSource;
};

export type SimulatorChecklistPhase = {
  readonly id: string;
  readonly title: string;
  readonly items: readonly SimulatorChecklistItem[];
};

export type SimulatorFlightFlow = {
  readonly aircraftId: string;
  readonly title: string;
  readonly estimatedMinutes: number;
  readonly sourceNote: string;
  readonly phases: readonly SimulatorChecklistPhase[];
};

/** Legacy compatibility registry. New normal-flight content is governed data. */
export const simulatorFlightFlows: readonly SimulatorFlightFlow[] = [];

export function getSimulatorFlightFlow(aircraftId: string): SimulatorFlightFlow | undefined {
  return simulatorFlightFlows.find((flow) => flow.aircraftId === aircraftId);
}
