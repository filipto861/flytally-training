import { createHash } from "node:crypto";

const PDF_SIGNATURE = new Uint8Array([0x25,0x50,0x44,0x46,0x2d]); // %PDF-

export type StreamSha256Result = {
  readonly sha256: string;
  readonly bytes: number;
  readonly hasPdfSignature: boolean;
};

function matchesPrefix(prefix: Uint8Array, expected: Uint8Array): boolean {
  if (prefix.byteLength < expected.byteLength) return false;
  for (let index=0;index<expected.byteLength;index+=1) {
    if (prefix[index] !== expected[index]) return false;
  }
  return true;
}

/**
 * Hash a Web ReadableStream incrementally and retain only the first five bytes
 * needed to validate the PDF file signature. The complete object is never
 * buffered in Training function memory.
 */
export async function sha256ReadableStream(stream: ReadableStream<Uint8Array>): Promise<StreamSha256Result> {
  const hash = createHash("sha256");
  const reader = stream.getReader();
  const prefix = new Uint8Array(PDF_SIGNATURE.byteLength);
  let prefixBytes = 0;
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value?.byteLength) continue;
      if (prefixBytes < prefix.byteLength) {
        const take = Math.min(prefix.byteLength-prefixBytes,value.byteLength);
        prefix.set(value.subarray(0,take),prefixBytes);
        prefixBytes += take;
      }
      bytes += value.byteLength;
      hash.update(value);
    }
  } finally {
    reader.releaseLock();
  }
  return {
    sha256: hash.digest("hex"),
    bytes,
    hasPdfSignature: prefixBytes === PDF_SIGNATURE.byteLength && matchesPrefix(prefix,PDF_SIGNATURE),
  };
}
