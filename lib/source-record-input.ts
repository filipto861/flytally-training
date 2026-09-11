export type SourceRecordEvidenceInput = {
  readonly sourceOriginalName?: string;
  readonly sourceSizeBytes?: string;
  readonly localChecksum?: string;
  readonly sourceUri?: string;
  readonly externalChecksum?: string;
};

export type SourceRecordEvidence = {
  readonly sourceUri?: string;
  readonly checksumSha256?: string;
  readonly sourceMetadata: Readonly<Record<string,unknown>>;
};

const sha256Pattern=/^[a-f0-9]{64}$/i;

function optionalText(value:string|undefined,max:number):string|undefined{
  const normalized=value?.trim()??"";
  if(!normalized)return undefined;
  if(normalized.length>max||/[\r\n\0]/.test(normalized))throw new Error("Invalid source metadata.");
  return normalized;
}

function checksum(value:string|undefined,label:string):string|undefined{
  const normalized=value?.trim().toLowerCase()??"";
  if(!normalized)return undefined;
  if(!sha256Pattern.test(normalized))throw new Error(`${label} must contain 64 hexadecimal characters.`);
  return normalized;
}

export function parseSourceRecordEvidence(input:SourceRecordEvidenceInput):SourceRecordEvidence{
  const sourceOriginalName=optionalText(input.sourceOriginalName,255);
  const sizeText=input.sourceSizeBytes?.trim()??"";
  const localChecksum=checksum(input.localChecksum,"Local SHA-256 fingerprint");
  const sourceUri=optionalText(input.sourceUri,2048);
  const externalChecksum=checksum(input.externalChecksum,"External SHA-256 fingerprint");
  const hasAnyLocal=Boolean(sourceOriginalName||sizeText||localChecksum);

  let sizeBytes:number|undefined;
  if(hasAnyLocal){
    sizeBytes=Number(sizeText);
    if(!sourceOriginalName||!localChecksum||!Number.isSafeInteger(sizeBytes)||sizeBytes<1)throw new Error("Local source fingerprint metadata is incomplete.");
    if(!sourceOriginalName.toLowerCase().endsWith(".pdf"))throw new Error("Local source fingerprint must describe a PDF file.");
  }
  if(localChecksum&&externalChecksum&&localChecksum!==externalChecksum)throw new Error("Local and external SHA-256 fingerprints disagree.");

  const checksumSha256=localChecksum??externalChecksum;
  const intakeMode=localChecksum?"local-fingerprint":(sourceUri||externalChecksum)?"external-metadata":"metadata-only";
  const sourceMetadata:Record<string,unknown>={intakeMode,documentHostedByFlyTally:false};
  if(sourceOriginalName)sourceMetadata.originalName=sourceOriginalName;
  if(sizeBytes)sourceMetadata.sizeBytes=sizeBytes;

  return {sourceUri,checksumSha256,sourceMetadata};
}
