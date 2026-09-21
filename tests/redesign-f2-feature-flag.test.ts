import assert from "node:assert/strict";
import test from "node:test";

import { isNewShellEnabled } from "../lib/feature-flags.ts";

const FLAG = "FT_NEW_SHELL";

function restoreFlag(previous: string | undefined): void {
  if (previous === undefined) {
    delete process.env[FLAG];
    return;
  }
  process.env[FLAG] = previous;
}

function withFlag(value: string | undefined, assertion: () => void): void {
  const previous = process.env[FLAG];
  try {
    if (value === undefined) delete process.env[FLAG];
    else process.env[FLAG] = value;
    assertion();
  } finally {
    restoreFlag(previous);
  }
}

test("F2 new shell flag defaults off when env is undefined", () => {
  withFlag(undefined, () => assert.equal(isNewShellEnabled(), false));
});

test("F2 new shell flag enables only for literal true", () => {
  withFlag("true", () => assert.equal(isNewShellEnabled(), true));
});

test("F2 new shell flag rejects explicit false", () => {
  withFlag("false", () => assert.equal(isNewShellEnabled(), false));
});

test("F2 new shell flag rejects numeric truthy convention", () => {
  withFlag("1", () => assert.equal(isNewShellEnabled(), false));
});

test("F2 new shell flag rejects yes", () => {
  withFlag("yes", () => assert.equal(isNewShellEnabled(), false));
});

test("F2 new shell flag is case-sensitive for TRUE", () => {
  withFlag("TRUE", () => assert.equal(isNewShellEnabled(), false));
});

test("F2 new shell flag is case-sensitive for True", () => {
  withFlag("True", () => assert.equal(isNewShellEnabled(), false));
});

test("F2 new shell flag rejects an empty string", () => {
  withFlag("", () => assert.equal(isNewShellEnabled(), false));
});

test("F2 new shell flag rejects whitespace-only values", () => {
  withFlag(" ", () => assert.equal(isNewShellEnabled(), false));
});

test("F2 new shell flag does not mutate process.env", () => {
  const previous = process.env[FLAG];
  const hadFlag = Object.prototype.hasOwnProperty.call(process.env, FLAG);
  try {
    process.env[FLAG] = "true";
    const before = process.env[FLAG];
    assert.equal(isNewShellEnabled(), true);
    assert.equal(process.env[FLAG], before);
  } finally {
    if (hadFlag) restoreFlag(previous);
    else delete process.env[FLAG];
  }
});

test("F2 new shell flag is SSR-safe and requires no window global", () => {
  assert.equal("window" in globalThis, false);
  withFlag("true", () => assert.equal(isNewShellEnabled(), true));
});
