/**
 * New aircraft-workspace shell gate.
 *
 * Only literal 'true' enables. Guard against accidental truthy values.
 */
export function isNewShellEnabled(): boolean {
  return process.env.FT_NEW_SHELL === "true";
}
