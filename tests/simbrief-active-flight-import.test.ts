import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { learjet35aSimBriefProfile } from "../aircraft-data/learjet-35a/simbrief-profile.ts";
import {
  activeFlightDependencyReference,
  parseActiveFlightInput,
} from "../lib/active-flight/validation.ts";
import {
  parseNormalizedSimBriefOfp,
  parseSimBriefIdentity,
  parseSimBriefLatestOfp,
  simBriefAircraftCompatible,
  simBriefLatestOfpUrl,
} from "../lib/simbrief/ofp.ts";
import { fetchLatestSimBriefOfp } from "../lib/simbrief/provider.ts";
import {
  clearSimBriefIdentity,
  readSimBriefIdentity,
  SIMBRIEF_IDENTITY_STORAGE_KEY,
  writeSimBriefIdentity,
  type SimBriefPreferenceStorage,
} from "../lib/simbrief/preferences.ts";

const read = (path: string) =>
  fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

function memoryStorage(): SimBriefPreferenceStorage {
  const values = new Map<string, string>();
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

const rawOfp = {
  fetch: { status: "Success" },
  params: {
    request_id: "123456789",
    time_generated: "1790360000",
    units: "kgs",
  },
  origin: {
    icao_code: "LKPR",
    name: "Vaclav Havel Airport Prague",
  },
  destination: {
    icao_code: "EGSS",
    name: "London Stansted Airport",
  },
  weights: {
    est_tow: "15000",
  },
  aircraft: {
    icaocode: "LJ35",
    icao_code: "LJ35",
  },
};

test("15.1 accepts Navigraph Alias and 1-7 digit Pilot ID without conflating them", () => {
  assert.deepEqual(
    parseSimBriefIdentity({ kind: "alias", value: "Filip Test" }),
    { kind: "alias", value: "Filip Test" },
  );
  assert.deepEqual(
    parseSimBriefIdentity({ kind: "pilot-id", value: "1234567" }),
    { kind: "pilot-id", value: "1234567" },
  );
  assert.equal(
    parseSimBriefIdentity({ kind: "pilot-id", value: "12345678" }),
    null,
  );
  assert.equal(
    parseSimBriefIdentity({ kind: "pilot-id", value: "ABC123" }),
    null,
  );
});

test("15.1 latest-OFP URL uses official JSON v2 and explicit identity kind", () => {
  const alias = simBriefLatestOfpUrl({
    kind: "alias",
    value: "Filip Test",
  });
  assert.equal(alias.origin, "https://www.simbrief.com");
  assert.equal(alias.pathname, "/api/xml.fetcher.php");
  assert.equal(alias.searchParams.get("username"), "Filip Test");
  assert.equal(alias.searchParams.get("userid"), null);
  assert.equal(alias.searchParams.get("json"), "v2");

  const pilotId = simBriefLatestOfpUrl({
    kind: "pilot-id",
    value: "1234567",
  });
  assert.equal(pilotId.searchParams.get("userid"), "1234567");
  assert.equal(pilotId.searchParams.get("username"), null);
  assert.equal(pilotId.searchParams.get("json"), "v2");
});

test("15.1 parses only the normalized OFP fields Active Flight consumes", () => {
  const parsed = parseSimBriefLatestOfp(rawOfp);
  assert.ok(parsed);
  assert.deepEqual(parsed.departure, {
    icao: "LKPR",
    name: "Vaclav Havel Airport Prague",
  });
  assert.deepEqual(parsed.destination, {
    icao: "EGSS",
    name: "London Stansted Airport",
  });
  assert.deepEqual(parsed.weight, { value: 15000, unit: "kg" });
  assert.equal(parsed.aircraftIcaoCode, "LJ35");
  assert.equal(parsed.requestId, "123456789");
  assert.equal(parsed.generatedAt, new Date(1790360000 * 1000).toISOString());

  assert.deepEqual(parseNormalizedSimBriefOfp(parsed), parsed);
});

test("15.1 preserves lb OFP weight units and omits unsupported TOW without losing the route", () => {
  const pounds = parseSimBriefLatestOfp({
    ...rawOfp,
    params: { ...rawOfp.params, units: "lbs" },
    weights: { est_tow: "33000" },
  });
  assert.deepEqual(pounds?.weight, { value: 33000, unit: "lb" });

  const unsupportedWeight = parseSimBriefLatestOfp({
    ...rawOfp,
    params: { ...rawOfp.params, units: "stones" },
  });
  assert.ok(unsupportedWeight);
  assert.equal(unsupportedWeight.weight, undefined);
  assert.equal(unsupportedWeight.departure.icao, "LKPR");
  assert.equal(unsupportedWeight.destination.icao, "EGSS");
});

test("15.1 route import remains valid when Estimated TOW is absent", () => {
  const withoutTow = parseSimBriefLatestOfp({
    ...rawOfp,
    weights: {},
  });
  assert.ok(withoutTow);
  assert.equal(withoutTow.weight, undefined);
  assert.equal(withoutTow.aircraftIcaoCode, "LJ35");
});

test("15.1 Learjet compatibility is aircraft-owned and requires SimBrief ICAO LJ35", () => {
  assert.deepEqual(learjet35aSimBriefProfile.acceptedIcaoCodes, ["LJ35"]);
  assert.equal(
    simBriefAircraftCompatible(learjet35aSimBriefProfile, "LJ35"),
    true,
  );
  assert.equal(
    simBriefAircraftCompatible(learjet35aSimBriefProfile, "LJ45"),
    false,
  );
});

test("15.1 SimBrief identifier preference is device-local and malformed data self-clears", () => {
  const storage = memoryStorage();
  writeSimBriefIdentity(storage, { kind: "alias", value: "Filip Test" });
  assert.equal(
    storage.getItem(SIMBRIEF_IDENTITY_STORAGE_KEY),
    JSON.stringify({ kind: "alias", value: "Filip Test" }),
  );
  assert.deepEqual(readSimBriefIdentity(storage), {
    kind: "alias",
    value: "Filip Test",
  });

  storage.setItem(SIMBRIEF_IDENTITY_STORAGE_KEY, "{broken");
  assert.equal(readSimBriefIdentity(storage), null);
  assert.equal(storage.getItem(SIMBRIEF_IDENTITY_STORAGE_KEY), null);

  writeSimBriefIdentity(storage, { kind: "pilot-id", value: "1234567" });
  clearSimBriefIdentity(storage);
  assert.equal(storage.getItem(SIMBRIEF_IDENTITY_STORAGE_KEY), null);
});

test("15.1 Active Flight accepts field-level SimBrief provenance without changing performance dependency semantics", () => {
  const importedAt = "2026-09-25T20:00:00.000Z";
  const base = {
    aircraftId: "learjet-35a",
    departure: { icao: "LKPR" },
    destination: { icao: "EGSS" },
    weight: { value: 15000, unit: "kg" as const },
    brief: null,
  };
  const withProvenance = parseActiveFlightInput({
    ...base,
    prefillProvenance: {
      provider: "simbrief",
      requestId: "123456789",
      generatedAt: "2026-09-25T19:55:00.000Z",
      importedAt,
      aircraftIcaoCode: "LJ35",
      fields: ["departure", "destination", "weight"],
    },
  });
  assert.ok(withProvenance);
  assert.deepEqual(withProvenance.prefillProvenance?.fields, [
    "departure",
    "destination",
    "weight",
  ]);

  const withoutProvenance = parseActiveFlightInput(base);
  assert.ok(withoutProvenance);
  assert.equal(
    activeFlightDependencyReference(withProvenance),
    activeFlightDependencyReference(withoutProvenance),
  );

  assert.equal(
    parseActiveFlightInput({
      ...base,
      prefillProvenance: {
        provider: "simbrief",
        requestId: "123456789",
        generatedAt: null,
        importedAt,
        aircraftIcaoCode: "LJ35",
        fields: ["weight", "weight"],
      },
    }),
    null,
  );
});

test("15.1 provider fetch uses JSON v2, no-store and a bounded request", async () => {
  let observedUrl: URL | null = null;
  let observedInit: RequestInit | undefined;

  const result = await fetchLatestSimBriefOfp(
    { kind: "alias", value: "Filip Test" },
    async (input, init) => {
      observedUrl = new URL(String(input));
      observedInit = init;
      return new Response(JSON.stringify(rawOfp), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  );

  assert.equal(result.status, "ready");
  assert.equal(observedUrl?.origin, "https://www.simbrief.com");
  assert.equal(observedUrl?.searchParams.get("username"), "Filip Test");
  assert.equal(observedUrl?.searchParams.get("json"), "v2");
  assert.equal(observedInit?.method, "GET");
  assert.equal(observedInit?.cache, "no-store");
  assert.ok(observedInit?.signal instanceof AbortSignal);
});

test("15.1 provider maps no-flight, malformed and unavailable responses fail-closed", async () => {
  assert.deepEqual(
    await fetchLatestSimBriefOfp(
      { kind: "pilot-id", value: "1234567" },
      async () => new Response("not found", { status: 400 }),
    ),
    { status: "not-found" },
  );

  assert.deepEqual(
    await fetchLatestSimBriefOfp(
      { kind: "pilot-id", value: "1234567" },
      async () => new Response("{broken", { status: 200 }),
    ),
    { status: "invalid-response" },
  );

  assert.deepEqual(
    await fetchLatestSimBriefOfp(
      { kind: "pilot-id", value: "1234567" },
      async () => new Response("upstream", { status: 500 }),
    ),
    { status: "unavailable" },
  );
});

test("15.1 proxy is authenticated, explicit-action only and never background-polls SimBrief", () => {
  const route = read("app/api/simbrief/latest/route.ts");
  const provider = read("lib/simbrief/provider.ts");
  const activeFlight = read("components/ft-flight/FtActiveFlight.tsx");

  assert.match(route, /export async function POST/);
  assert.match(route, /isTrustedMutationRequest/);
  assert.match(route, /getTrainingSession/);
  assert.match(route, /unauthorized/);
  assert.match(route, /fetchLatestSimBriefOfp/);
  assert.match(route, /simBriefAircraftCompatible/);

  assert.match(provider, /cache: "no-store"/);
  assert.match(provider, /AbortSignal\.timeout\(10_000\)/);
  assert.match(provider, /simBriefLatestOfpUrl/);
  assert.doesNotMatch(provider, /setInterval|setTimeout\(|cron|poll/i);

  assert.match(activeFlight, /onClick=\{importSimBrief\}/);
  assert.match(activeFlight, /Import latest OFP/);
  assert.doesNotMatch(activeFlight, /useEffect[\s\S]*importLatestSimBriefOfp/);
});

test("15.1 provenance persistence is schema-owned, exported and DML-only at runtime", () => {
  const schema = read("lib/active-flight/schema.ts");
  const migration = read("migrations/20260925_active_flight_prefill_provenance.sql");
  const store = read("lib/active-flight/store.ts");
  const privacy = read("lib/training-privacy.ts");

  assert.match(schema, /prefill_provenance JSONB NULL/);
  assert.match(schema, /ADD COLUMN IF NOT EXISTS prefill_provenance/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS prefill_provenance JSONB NULL/);
  assert.match(store, /prefill_provenance/);
  assert.doesNotMatch(store, /CREATE\s+(TABLE|INDEX)|ALTER\s+TABLE/i);
  assert.match(privacy, /prefill_provenance/);
});


test("15.1 generic runtime contains no Learjet aircraft identity", () => {
  for (const path of [
    "lib/simbrief/types.ts",
    "lib/simbrief/ofp.ts",
    "lib/simbrief/provider.ts",
    "lib/simbrief/client.ts",
    "lib/simbrief/preferences.ts",
    "app/api/simbrief/latest/route.ts",
    "components/ft-flight/FtActiveFlight.tsx",
  ]) {
    const source = read(path);
    assert.doesNotMatch(source, /learjet-35a|LJ35/i, path);
  }
  const aircraftOwned = read("aircraft-data/learjet-35a/simbrief-profile.ts");
  assert.match(aircraftOwned, /aircraftId: "learjet-35a"/);
  assert.match(aircraftOwned, /acceptedIcaoCodes: \["LJ35"\]/);
});

test("15.1 invalid provider generation timestamps fail closed", () => {
  assert.equal(
    parseSimBriefLatestOfp({
      ...rawOfp,
      params: {
        ...rawOfp.params,
        time_generated: "1e309",
      },
    }),
    null,
  );
});
