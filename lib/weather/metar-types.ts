export type MetarSnapshot = {
  readonly station: string;
  readonly observedAt: string;
  readonly fetchedAt: string;
  readonly rawText: string;
  readonly temperatureC?: number;
  readonly dewpointC?: number;
  readonly qnhHpa?: number;
  readonly altimeterInHg?: number;
  readonly windDirectionTrueDeg?: number;
  readonly windSpeedKt?: number;
  readonly windGustKt?: number;
  readonly windVariable: boolean;
  readonly windCalm: boolean;
  readonly source: "aviationweather.gov";
};

export type MetarFetchResult =
  | { readonly status: "ready"; readonly snapshot: MetarSnapshot }
  | { readonly status: "no-report" }
  | { readonly status: "invalid-request"; readonly message: string }
  | { readonly status: "rate-limited" }
  | { readonly status: "provider-unavailable" }
  | { readonly status: "timeout" }
  | { readonly status: "malformed-response"; readonly message: string }
  | { readonly status: "network-error"; readonly message: string };

export type MetarCacheEntry = {
  readonly snapshot: MetarSnapshot;
  readonly cachedAt: number;
};

export type MetarFreshness =
  | "live"
  | "cached"
  | "stale"
  | "expired"
  | "offline";
