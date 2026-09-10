import { createHash } from "node:crypto";

export type StreamSha256Result = {
  readonly sha256: string;
  readonly bytes: number;
};

/**
 * Hash a Web ReadableStream incrementally so controlled manuals can be verified
 * without buffering the complete PDF in a Training function's memory.
 */
export async function sha256ReadableStream(stream: ReadableStream<Uint8Array>): Promise<StreamSha256Result> {
  const hash = createHash("sha256");
  const reader = stream.getReader();
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value?.byteLength) continue;
      bytes += value.byteLength;
      hash.update(value);
    }
  } finally {
    reader.releaseLock();
  }
  return { sha256: hash.digest("hex"), bytes };
}
