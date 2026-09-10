export const MAX_MANUAL_ASSET_BYTES = 128 * 1024 * 1024;

export type ManualUploadMetadata = {
  readonly aircraftId: string;
  readonly originalName: string;
  readonly sizeBytes: number;
  readonly checksumSha256: string;
};

const aircraftIdPattern = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;
const sha256Pattern = /^[a-f0-9]{64}$/;

export function validateManualUploadMetadata(input: ManualUploadMetadata): ManualUploadMetadata {
  const aircraftId = input.aircraftId.trim();
  const originalName = input.originalName.trim();
  const checksumSha256 = input.checksumSha256.trim().toLowerCase();
  const sizeBytes = Number(input.sizeBytes);

  if (!aircraftIdPattern.test(aircraftId)) throw new Error("Invalid aircraft id.");
  if (!originalName || originalName.length > 255 || /[\r\n\0]/.test(originalName)) throw new Error("Invalid manual filename.");
  if (!originalName.toLowerCase().endsWith(".pdf")) throw new Error("Controlled manual assets must be PDF files.");
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > MAX_MANUAL_ASSET_BYTES) throw new Error(`Manual PDF must be between 1 byte and ${MAX_MANUAL_ASSET_BYTES} bytes.`);
  if (!sha256Pattern.test(checksumSha256)) throw new Error("A lowercase or uppercase SHA-256 checksum is required.");

  return { aircraftId, originalName, sizeBytes, checksumSha256 };
}

export function manualAssetPathname(aircraftId: string, assetId: string): string {
  if (!aircraftIdPattern.test(aircraftId)) throw new Error("Invalid aircraft id.");
  if (!/^[0-9a-f-]{36}$/i.test(assetId)) throw new Error("Invalid manual asset id.");
  return `manuals/${aircraftId}/${assetId}.pdf`;
}
