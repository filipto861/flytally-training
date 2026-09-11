import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { parseSourceRecordEvidence } from "../lib/source-record-input.ts";

const component=fs.readFileSync(new URL("../components/source-fingerprint-input.tsx",import.meta.url),"utf8");
const page=fs.readFileSync(new URL("../app/admin/aircraft/[aircraftId]/sources/page.tsx",import.meta.url),"utf8");
const actions=fs.readFileSync(new URL("../app/admin/actions.ts",import.meta.url),"utf8");
const registration=fs.readFileSync(new URL("../lib/governed-manual-registration.ts",import.meta.url),"utf8");
const bootstrap=fs.readFileSync(new URL("../lib/database-bootstrap.ts",import.meta.url),"utf8");
const root=new URL("..",import.meta.url);
const exists=(path:string)=>fs.existsSync(new URL(path,root));

test("local source fingerprint never submits the PDF bytes",()=>{
  assert.match(component,/crypto\.subtle\.digest\("SHA-256"/);assert.match(component,/type="file"/);assert.doesNotMatch(component,/type="file"[^>]*name=/);assert.doesNotMatch(component,/fetch\(|FormData|presign/i);
  for(const field of ["sourceOriginalName","sourceSizeBytes","localChecksum"])assert.match(component,new RegExp(`name="${field}"`));
  assert.match(component,/PDF itself will not be uploaded or stored by FlyTally/);
});

test("Sources workspace exposes source records, not a document library",()=>{
  assert.match(page,/Source records & references/);assert.match(page,/Source documents are not hosted by FlyTally/);assert.match(page,/SourceFingerprintInput/);
  assert.doesNotMatch(page,/ManualAssetUploader|listManualAssets|\/api\/admin\/manual-assets|Open source/);
});

test("server registration persists provenance metadata but has no hosted asset lifecycle",()=>{
  assert.match(actions,/parseSourceRecordEvidence/);assert.match(registration,/source_metadata/);assert.match(registration,/checksum_sha256/);assert.doesNotMatch(actions,/assetId/);assert.doesNotMatch(registration,/training_manual_assets|blob_url|@vercel\/blob/);assert.doesNotMatch(bootstrap,/training_manual_assets|ensureManualAssetSchema/);
});

test("manual upload and download surfaces no longer exist",()=>{
  for(const path of ["components/manual-asset-uploader.tsx","app/api/admin/manual-assets/presign/route.ts","app/api/admin/manual-assets/finalize/route.ts","app/api/admin/manual-assets/[assetId]/download/route.ts","lib/manual-assets.ts","lib/controlled-manual-readiness.ts"])assert.equal(exists(path),false,path);
});

test("source evidence supports local fingerprint, external metadata and metadata-only records",()=>{
  const hash="a".repeat(64);
  assert.deepEqual(parseSourceRecordEvidence({sourceOriginalName:"AFM.pdf",sourceSizeBytes:"1234",localChecksum:hash}),{sourceUri:undefined,checksumSha256:hash,sourceMetadata:{intakeMode:"local-fingerprint",documentHostedByFlyTally:false,originalName:"AFM.pdf",sizeBytes:1234}});
  assert.deepEqual(parseSourceRecordEvidence({sourceUri:"https://example.invalid/source",externalChecksum:hash}),{sourceUri:"https://example.invalid/source",checksumSha256:hash,sourceMetadata:{intakeMode:"external-metadata",documentHostedByFlyTally:false}});
  assert.deepEqual(parseSourceRecordEvidence({}),{sourceUri:undefined,checksumSha256:undefined,sourceMetadata:{intakeMode:"metadata-only",documentHostedByFlyTally:false}});
  assert.throws(()=>parseSourceRecordEvidence({sourceOriginalName:"AFM.pdf",localChecksum:hash}),/incomplete/);
});
