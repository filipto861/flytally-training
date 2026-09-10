import assert from "node:assert/strict";
import test from "node:test";

import { sha256ReadableStream } from "../lib/stream-sha256.ts";

const encoder = new TextEncoder();

test("streamed SHA-256 matches the canonical multi-chunk digest without buffering", async () => {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode("a"));
      controller.enqueue(encoder.encode("b"));
      controller.enqueue(encoder.encode("c"));
      controller.close();
    },
  });
  const result = await sha256ReadableStream(stream);
  assert.equal(result.bytes, 3);
  assert.equal(result.sha256, "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
});

test("streamed SHA-256 handles an empty stream deterministically", async () => {
  const stream = new ReadableStream<Uint8Array>({ start(controller) { controller.close(); } });
  const result = await sha256ReadableStream(stream);
  assert.equal(result.bytes, 0);
  assert.equal(result.sha256, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
});
