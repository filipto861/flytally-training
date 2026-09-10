import assert from "node:assert/strict";
import test from "node:test";
import { MAX_MANUAL_ASSET_BYTES, manualAssetPathname, validateManualUploadMetadata } from "../lib/manual-asset-input.ts";

test("controlled manual upload metadata is normalized and bounded", () => {
  const result = validateManualUploadMetadata({ aircraftId:"test-aircraft", originalName:" Manual.PDF ", sizeBytes:1024, checksumSha256:"A".repeat(64) });
  assert.equal(result.originalName,"Manual.PDF");
  assert.equal(result.checksumSha256,"a".repeat(64));
  assert.throws(()=>validateManualUploadMetadata({...result,originalName:"manual.exe"}));
  assert.throws(()=>validateManualUploadMetadata({...result,sizeBytes:MAX_MANUAL_ASSET_BYTES+1}));
  assert.throws(()=>validateManualUploadMetadata({...result,checksumSha256:"abc"}));
});

test("manual storage path never derives from the uploaded filename", () => {
  const path = manualAssetPathname("test-aircraft","123e4567-e89b-12d3-a456-426614174000");
  assert.equal(path,"manuals/test-aircraft/123e4567-e89b-12d3-a456-426614174000.pdf");
  assert.ok(!path.includes(".."));
});
