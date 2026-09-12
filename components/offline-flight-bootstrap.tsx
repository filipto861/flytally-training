"use client";

import { useEffect, useState } from "react";

import styles from "./offline-flight-bootstrap.module.css";

type OfflineState = "preparing" | "ready" | "offline" | "unsupported";

export function OfflineFlightBootstrap() {
  const [state, setState] = useState<OfflineState>("preparing");

  useEffect(() => {
    let mounted = true;
    const handleOffline = () => { if (mounted) setState("offline"); };
    const handleOnline = () => { if (mounted) setState("ready"); };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    if (!("serviceWorker" in navigator)) {
      setState("unsupported");
      return () => {
        mounted = false;
        window.removeEventListener("offline", handleOffline);
        window.removeEventListener("online", handleOnline);
      };
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
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const label = state === "offline" ? "Offline"
    : state === "ready" ? "Offline ready"
      : state === "unsupported" ? "Online"
        : "Preparing offline";

  return <span className={`${styles.status} ${state === "offline" ? styles.offline : ""}`} data-offline-state={state}>{label}</span>;
}
