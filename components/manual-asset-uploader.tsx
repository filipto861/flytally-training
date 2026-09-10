"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MAX_MANUAL_ASSET_BYTES } from "@/lib/manual-asset-input";

async function sha256(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

export function ManualAssetUploader({ aircraftId }: Readonly<{aircraftId:string}>) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Select a controlled PDF source. It uploads directly to private object storage; the Training function never receives the PDF body.");

  async function uploadManual(formData: FormData) {
    const file = formData.get("manual") as File | null;
    if (!file || !file.size) return;
    if (!file.name.toLowerCase().endsWith(".pdf") || (file.type && file.type !== "application/pdf")) {
      setMessage("Only PDF manuals are accepted.");
      return;
    }
    if (file.size > MAX_MANUAL_ASSET_BYTES) {
      setMessage(`PDF exceeds the ${Math.round(MAX_MANUAL_ASSET_BYTES / 1024 / 1024)} MB controlled-source limit.`);
      return;
    }

    setBusy(true);
    try {
      setMessage("Computing SHA-256 locally…");
      const checksumSha256 = await sha256(file);
      setMessage("Requesting a short-lived private upload URL…");
      const presignResponse = await fetch("/api/admin/manual-assets/presign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ aircraftId, originalName: file.name, sizeBytes: file.size, checksumSha256 }),
      });
      const presign = await presignResponse.json() as {assetId?:string;presignedUrl?:string;error?:string};
      if (!presignResponse.ok || !presign.assetId || !presign.presignedUrl) throw new Error(presign.error || "Could not authorize the upload.");

      setMessage("Uploading PDF directly to private Blob storage…");
      const uploadResponse = await fetch(presign.presignedUrl, { method: "PUT", headers: { "content-type": "application/pdf" }, body: file });
      if (!uploadResponse.ok) throw new Error(`Private storage upload failed (${uploadResponse.status}).`);

      setMessage("Verifying the stored object…");
      const finalizeResponse = await fetch("/api/admin/manual-assets/finalize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ assetId: presign.assetId }),
      });
      const finalized = await finalizeResponse.json() as {error?:string};
      if (!finalizeResponse.ok) throw new Error(finalized.error || "Stored PDF verification failed.");
      setMessage("Controlled PDF stored and verified. Select it below when registering the immutable manual revision.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Manual upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return <form action={uploadManual}>
    <input name="manual" type="file" accept="application/pdf,.pdf" required disabled={busy}/>
    <button type="submit" disabled={busy}>{busy ? "Working…" : "Upload controlled PDF"}</button>
    <p>{message}</p>
  </form>;
}
