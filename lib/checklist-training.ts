export type ChecklistTrainingMode = "run" | "learn" | "practice" | "flow" | "challenge";

export const checklistTrainingModes = [
  {
    key: "run",
    label: "Run",
    description: "Use the concise checklist directly and mark each item complete as you proceed.",
  },
  {
    key: "learn",
    label: "Learn",
    description: "See the action, explanation, verification and source while you work through the checklist.",
  },
  {
    key: "practice",
    label: "Practice",
    description: "Run the checklist without explanations and build repetition.",
  },
  {
    key: "flow",
    label: "Flow",
    description: "Perform the sequence from memory first, then reveal the checklist to verify it.",
  },
  {
    key: "challenge",
    label: "Challenge & Response",
    description: "Read the challenge, answer it yourself, then reveal and confirm the response.",
  },
] as const satisfies readonly {
  key: ChecklistTrainingMode;
  label: string;
  description: string;
}[];

export type ChecklistChallengeResponse = {
  challenge: string;
  response: string | null;
};

export function splitChecklistChallenge(action: string): ChecklistChallengeResponse {
  const separator = " — ";
  const separatorIndex = action.indexOf(separator);

  if (separatorIndex < 0) {
    return { challenge: action.trim(), response: null };
  }

  return {
    challenge: action.slice(0, separatorIndex).trim(),
    response: action.slice(separatorIndex + separator.length).trim() || null,
  };
}

export function isChecklistTrainingMode(value: string): value is ChecklistTrainingMode {
  return checklistTrainingModes.some((mode) => mode.key === value);
}
