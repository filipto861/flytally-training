export const commonAircraftEquipmentProfileKey = "__common__";

export function mergeAircraftEquipmentTags(
  common: readonly string[] | undefined,
  variant: readonly string[] | undefined,
): readonly string[] {
  return [...new Set([...(common ?? []), ...(variant ?? [])])];
}
