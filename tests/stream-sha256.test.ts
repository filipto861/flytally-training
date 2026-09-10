import assert from "node:assert/strict";
import test from "node:test";

import { sha256ReadableStream } from "../lib/stream-sha256.ts";

const encoder = new TextEncoder();

function chunks(...values:string[]):ReadableStream<Uint8Array>{
  return new ReadableStream<Uint8Array>({start(controller){for(const value of values)controller.enqueue(encoder.encode(value));controller.close();}});
}

test("streamed SHA-256 matches the canonical multi-chunk digest without buffering", async () => {
  const result = await sha256ReadableStream(chunks("a","b","c"));
  assert.equal(result.bytes, 3);
  assert.equal(result.sha256, "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  assert.equal(result.hasPdfSignature,false);
});

test("PDF signature is recognized even when split across stream chunks", async () => {
  const result=await sha256ReadableStream(chunks("%P","D","F-1.7\nbody"));
  assert.equal(result.hasPdfSignature,true);
  assert.equal(result.bytes,13);
});

test("MIME-looking non-PDF bytes are not accepted as a PDF signature",async()=>{
  const result=await sha256ReadableStream(chunks("hello PDF"));
  assert.equal(result.hasPdfSignature,false);
});

test("streamed SHA-256 handles an empty stream deterministically", async () => {
  const result = await sha256ReadableStream(chunks());
  assert.equal(result.bytes, 0);
  assert.equal(result.sha256, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  assert.equal(result.hasPdfSignature,false);
});
