export type ControlledManualExpectedMetadata = {
  readonly pathname: string;
  readonly size_bytes: number | string;
  readonly content_type: string;
};

export type StoredBlobMetadata = {
  readonly size: number;
  readonly contentType?: string;
};

export function controlledManualMetadataMatches(expected: ControlledManualExpectedMetadata, actual: StoredBlobMetadata): boolean {
  const expectedType = expected.content_type.split(";", 1)[0]?.trim().toLowerCase();
  const actualType = actual.contentType?.split(";", 1)[0]?.trim().toLowerCase();
  return Number(expected.size_bytes) === Number(actual.size)
    && expectedType === "application/pdf"
    && actualType === "application/pdf";
}
