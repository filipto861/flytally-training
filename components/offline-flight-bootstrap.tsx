"use client";

import { useEffect, useState } from "react";

import styles from "./offline-flight-bootstrap.module.css";

type OfflineState = "preparing" | "ready" | "offline" | "unsupported";

export function OfflineFlightBootstrap() {
  const [state, setState] = useState<OfflineState>("preparing");

  useEffect(() => {
    let mounted = true;
    const updateConnectivity = () => {
      if (!mounted) return;
      if (!navigator.onLine) setState("offline");
    };
    window.addEventListener("offline", updateConnectivity);
    window.addEventListener("online", () => mounted && setState("ready"));

    if (!("serviceWorker" in navigator)) {
      setState(navigator.onLine ? "unsupported" : "offline");
      return () => { mounted = false; window.removeEventListener("offline", updateConnectivity); };
    }

    void (async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        const registration = await navigator.serviceWorker.ready;
        registration.active?.postMessage({ type: "CACHE_FLIGHT_PAGE", url: window.location.href });
        if (navigator.storage?.persist) void navigator.storage.persist();
        if (mounted) setState(navigator.onLine ? "ready" : "offline");
      } catch {
        if (mounted) setState(navigator.onLine ? "unsupported" : "offline");
      }
    })();

    return () => {
      mounted = false;
      window.removeEventListener("offline", updateConnectivity);
    };
  }, []);

  const label = state === "offline" ? "Offline"
    : state === "ready" ? "Offline ready"
      : state === "unsupported" ? "Online"
        : "Preparing offline";

  return <span className={`${styles.status} ${state === "offline" ? styles.offline : ""}`} data-offline-state={state}>{label}</span>;
}
