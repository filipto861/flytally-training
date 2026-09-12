"use client";

import { useEffect, useState } from "react";

import styles from "./offline-flight-bootstrap.module.css";

type OfflineState = "preparing" | "ready" | "offline" | "unsupported";

const CACHE_CONFIRM_TIMEOUT_MS = 6000;

function canonicalFlightUrl(rawUrl: string): string {
  const source = new URL(rawUrl, window.location.origin);
  const canonical = new URL(source.pathname, source.origin);
  const variant = source.searchParams.get("variant");
  if (variant) canonical.searchParams.set("variant", variant);
  return canonical.toString();
}

function waitForActivation(worker: ServiceWorker): Promise<void> {
  if (worker.state === "activated") return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      worker.removeEventListener("statechange", handleStateChange);
      reject(new Error("Service worker activation timed out."));
    }, CACHE_CONFIRM_TIMEOUT_MS);
    const handleStateChange = () => {
      if (worker.state === "activated") {
        window.clearTimeout(timeout);
        worker.removeEventListener("statechange", handleStateChange);
        resolve();
      } else if (worker.state === "redundant") {
        window.clearTimeout(timeout);
        worker.removeEventListener("statechange", handleStateChange);
        reject(new Error("Service worker became redundant."));
      }
    };
    worker.addEventListener("statechange", handleStateChange);
  });
}

async function resolveActiveWorker(registration: ServiceWorkerRegistration): Promise<ServiceWorker | undefined> {
  const pending = registration.installing ?? registration.waiting;
  if (pending) {
    try { await waitForActivation(pending); } catch { /* fall back to the current active worker */ }
  }
  return registration.active ?? navigator.serviceWorker.controller ?? undefined;
}

function requestFlightCache(worker: ServiceWorker, url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    let settled = false;
    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      channel.port1.close();
      resolve(value);
    };
    const timeout = window.setTimeout(() => finish(false), CACHE_CONFIRM_TIMEOUT_MS);
    channel.port1.onmessage = (event) => {
      finish(event.data?.type === "CACHE_FLIGHT_PAGE_RESULT" && event.data?.ok === true);
    };
    try {
      worker.postMessage({ type: "CACHE_FLIGHT_PAGE", url }, [channel.port2]);
    } catch {
      finish(false);
    }
  });
}

async function verifyFlightCache(rawUrl: string): Promise<boolean> {
  if (!("caches" in window)) return false;
  try {
    const raw = await window.caches.match(rawUrl);
    if (raw) return true;
    return Boolean(await window.caches.match(canonicalFlightUrl(rawUrl)));
  } catch {
    return false;
  }
}

export function OfflineFlightBootstrap() {
  const [state, setState] = useState<OfflineState>("preparing");

  useEffect(() => {
    let mounted = true;

    if (!("serviceWorker" in navigator)) {
      setState("unsupported");
      return () => { mounted = false; };
    }

    const prepareOffline = async () => {
      if (mounted && navigator.onLine) setState("preparing");
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        const worker = await resolveActiveWorker(registration);
        let cached = worker ? await requestFlightCache(worker, window.location.href) : false;
        if (!cached) cached = await verifyFlightCache(window.location.href);
        if (navigator.storage?.persist) void navigator.storage.persist();
        if (mounted) setState(navigator.onLine ? (cached ? "ready" : "unsupported") : "offline");
      } catch {
        if (mounted) setState(navigator.onLine ? "unsupported" : "offline");
      }
    };

    const handleOffline = () => { if (mounted) setState("offline"); };
    const handleOnline = () => { if (mounted) void prepareOffline(); };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    void prepareOffline();

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
