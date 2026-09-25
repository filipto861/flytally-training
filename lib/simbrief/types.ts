export type SimBriefIdentityKind = "alias" | "pilot-id";

export type SimBriefIdentity = {
  readonly kind: SimBriefIdentityKind;
  readonly value: string;
};

export type SimBriefAircraftProfile = {
  readonly aircraftId: string;
  readonly acceptedIcaoCodes: readonly string[];
};

export type SimBriefImportedField = "departure" | "destination" | "weight";

export type SimBriefPrefillProvenance = {
  readonly provider: "simbrief";
  readonly requestId: string;
  readonly generatedAt: string | null;
  readonly importedAt: string;
  readonly aircraftIcaoCode: string;
  readonly fields: readonly SimBriefImportedField[];
};

export type SimBriefLatestOfp = {
  readonly departure: {
    readonly icao: string;
    readonly name?: string;
  };
  readonly destination: {
    readonly icao: string;
    readonly name?: string;
  };
  readonly weight?: {
    readonly value: number;
    readonly unit: "kg" | "lb";
  };
  readonly aircraftIcaoCode: string;
  readonly requestId: string;
  readonly generatedAt: string | null;
};
