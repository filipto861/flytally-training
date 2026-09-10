import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  privateCapabilityJson,
  privateCapabilityRedirect,
  privateCapabilityText,
} from "../lib/private-capability-response.ts";

const presign = fs.readFileSync(new URL("../app/api/admin/manual-assets/presign/route.ts", import.meta.url), "utf8");
const finalize = fs.readFileSync(new URL("../app/api/admin/manual-assets/finalize/route.ts", import.meta.url), "utf8");
const download = fs.readFileSync(new URL("../app/api/admin/manual-assets/[assetId]/download/route.ts", import.meta.url), "utf8");

function assertPrivateHeaders(response: Response) {
  assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
  assert.equal(response.headers.get("pragma"), "no-cache");
  assert.equal(response.headers.get("expires"), "0");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
}

test("private capability JSON and text responses are non-cacheable and suppress referrers", async () => {
  const json = privateCapabilityJson({ presignedUrl: "https://private.example/capability" });
  assertPrivateHeaders(json);
  assert.deepEqual(await json.json(), { presignedUrl: "https://private.example/capability" });

  const text = privateCapabilityText("Authentication required.", 401);
  assert.equal(text.status, 401);
  assertPrivateHeaders(text);
});

test("private capability redirects protect the signed Location response", () => {
  const response = privateCapabilityRedirect("https://private.example/signed", 307);
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), "https://private.example/signed");
  assertPrivateHeaders(response);
});

test("all controlled-manual API responses use the capability-safe response boundary", () => {
  assert.match(presign, /privateCapabilityJson/);
  assert.match(finalize, /privateCapabilityJson/);
  assert.match(download, /privateCapabilityRedirect/);
  assert.match(download, /privateCapabilityText/);
  assert.doesNotMatch(presign, /Response\.json/);
  assert.doesNotMatch(finalize, /Response\.json/);
  assert.doesNotMatch(download, /Response\.redirect/);
});
