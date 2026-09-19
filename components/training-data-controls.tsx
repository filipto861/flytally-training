"use client";

import { useState } from "react";\nimport styles from "./training-data-controls.module.css";

async function clearDeviceData() {
  try { window.localStorage.clear(); } catch {}
  try { window.sessionStorage.clear(); } catch {}
  if ("caches" in window) {
    try {
      const names = await window.caches.keys();
      await Promise.all(names.filter(name => name.startsWith("flytally-")).map(name => window.caches.delete(name)));
    } catch {}
  }
  if ("serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
    } catch {}
  }
}

export function TrainingDataControls() {
  const [confirm,setConfirm]=useState("");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");

  async function deleteProgress() {
    if (confirm !== "DELETE TRAINING DATA" || busy) return;
    setBusy(true);setMessage("");
    try {
      const response=await fetch("/api/account/data",{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify({confirm})});
      if(!response.ok){setMessage("Training data could not be deleted.");return}
      await clearDeviceData();
      setConfirm("");
      setMessage("Server progress was deleted and FlyTally Training data on this device was cleared.");
    } catch {
      setMessage("Training data could not be deleted.");
    } finally { setBusy(false); }
  }

  async function clearThisDevice() {
    setBusy(true);setMessage("");
    try { await clearDeviceData();setMessage("FlyTally Training data on this device was cleared."); }
    finally { setBusy(false); }
  }

  return <div className={styles.root}>
    <section className={styles.section}>
      <h3>Clear this device</h3>
      <p>Removes local Training progress, saved session state and offline FlyTally caches from this browser. It does not delete server progress.</p>
      <div className={styles.actions}><button className="header-action header-action-secondary" type="button" onClick={clearThisDevice} disabled={busy} data-loading={busy?"true":undefined}>{busy?"Working…":"Clear this device"}</button></div>
    </section>
    <section className={`${styles.section} ${styles.divided}`}>
      <h3>Delete Training progress</h3>
      <p>Deletes server-side learner progress and state. A privacy reset marker blocks older locally cached events from another device from being uploaded again after this reset.</p>
      <label className={styles.label}>Type DELETE TRAINING DATA
        <input value={confirm} onChange={event=>setConfirm(event.target.value)} autoComplete="off"/>
      </label>
      <div className={styles.actions}><button className="header-action header-action-secondary" type="button" onClick={deleteProgress} disabled={busy||confirm!=="DELETE TRAINING DATA"} data-loading={busy?"true":undefined}>{busy?"Working…":"Delete Training progress"}</button></div>
    </section>
    {message?<p role="status" className={styles.message}>{message}</p>:null}
  </div>;
}
