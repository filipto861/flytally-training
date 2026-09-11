"use client";

import { useState } from "react";

export const MAX_LOCAL_SOURCE_FINGERPRINT_BYTES = 128 * 1024 * 1024;

async function sha256(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

export function SourceFingerprintInput() {
  const [originalName,setOriginalName]=useState("");
  const [sizeBytes,setSizeBytes]=useState("");
  const [checksum,setChecksum]=useState("");
  const [message,setMessage]=useState("Optional: select the source PDF to fingerprint it locally. The PDF stays on this device; FlyTally receives only filename, byte count and SHA-256.");
  const [busy,setBusy]=useState(false);

  async function fingerprint(file: File | undefined) {
    setOriginalName("");setSizeBytes("");setChecksum("");
    if(!file){setMessage("No local fingerprint selected. You can still register a metadata-only source record.");return;}
    if(!file.name.toLowerCase().endsWith(".pdf") || (file.type && file.type!=="application/pdf")){
      setMessage("Only PDF source files can be fingerprinted here.");return;
    }
    if(file.size<1 || file.size>MAX_LOCAL_SOURCE_FINGERPRINT_BYTES){
      setMessage(`PDF must be between 1 byte and ${Math.round(MAX_LOCAL_SOURCE_FINGERPRINT_BYTES/1024/1024)} MB for local fingerprinting.`);return;
    }
    setBusy(true);
    try{
      setMessage("Computing SHA-256 in your browser…");
      const value=await sha256(file);
      setOriginalName(file.name);setSizeBytes(String(file.size));setChecksum(value);
      setMessage("Fingerprint ready. The PDF itself will not be uploaded or stored by FlyTally.");
    }catch{
      setMessage("Could not fingerprint this PDF locally.");
    }finally{setBusy(false);}
  }

  return <div>
    <label>Local source fingerprint<input type="file" accept="application/pdf,.pdf" disabled={busy} onChange={event=>void fingerprint(event.currentTarget.files?.[0])}/></label>
    <input type="hidden" name="sourceOriginalName" value={originalName}/>
    <input type="hidden" name="sourceSizeBytes" value={sizeBytes}/>
    <input type="hidden" name="localChecksum" value={checksum}/>
    <p>{message}</p>
    {checksum?<p><strong>SHA-256:</strong> {checksum.slice(0,16)}… · {Number(sizeBytes).toLocaleString()} bytes</p>:null}
  </div>;
}
