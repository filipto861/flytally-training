export type RunwayEnd = {
  readonly ident: string;
  readonly headingTrueDeg?: number;
  readonly elevationFt?: number;
  readonly latitudeDeg?: number;
  readonly longitudeDeg?: number;
  readonly displacedThresholdFt?: number;
};

export type RunwaySurface = {
  readonly id: string;
  readonly surfaceLengthFt: number;
  readonly widthFt?: number;
  readonly surface?: string;
  readonly closed: boolean;
  readonly ends: readonly RunwayEnd[];
};

export type AirportRecord = {
  readonly icao: string;
  readonly name: string;
  readonly municipality?: string;
  readonly countryCode: string;
  readonly elevationFt: number;
  readonly runways: readonly RunwaySurface[];
};

export type AirportDatasetV1 = {
  readonly schemaVersion: 1;
  readonly generatedAt: string;
  readonly source: {
    readonly id: "ourairports";
    readonly snapshotDate: string;
  };
  readonly airports: readonly AirportRecord[];
};

export type SelectedRunwayContext = {
  readonly airportIcao: string;
  readonly runwayIdent: string;
  readonly airportElevationFt: number;
  readonly runwayEndElevationFt?: number;
  readonly headingTrueDeg?: number;
  readonly surfaceLengthFt: number;
  readonly availableTakeoffLengthFt?: number;
  readonly surface?: string;
};

export type InputSource = "manual" | "airport-db";

export type SourcedValue<T> = {
  readonly value: T;
  readonly source: InputSource;
  readonly dirty: boolean;
};
