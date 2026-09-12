"use client";

import { useEffect, useState } from "react";

const DISMISSED_KEY = "flytally:pwa-install-dismissed:v1";

type InstallChoice = {
  readonly outcome: "accepted" | "dismissed";
};

type BeforeInstallPromptEvent = Event & {
  prompt(): Promise<void>;
  readonly userChoice: Promise<InstallChoice>;
};

function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches
    || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

function isIosDevice(): boolean {
  const classicIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const touchMac = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return classicIos || touchMac;
}

function isMobileContext(): boolean {
  return window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 900;
}

export function PwaInstallCard() {
  const [eligible, setEligible] = useState(false);
  const [ios, setIos] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone() || window.localStorage.getItem(DISMISSED_KEY) === "1") return;

    const mobile = isMobileContext();
    const iosDevice = isIosDevice();
    setIos(iosDevice);
    if (mobile && iosDevice) setEligible(true);

    const onBeforeInstallPrompt = (event: Event) => {
      if (!isMobileContext()) return;
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setEligible(true);
    };
    const onInstalled = () => {
      setEligible(false);
      setInstallPrompt(null);
      setShowIosHelp(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    window.localStorage.setItem(DISMISSED_KEY, "1");
    setEligible(false);
  };

  const install = async () => {
    if (ios) {
      setShowIosHelp(true);
      return;
    }
    if (!installPrompt) return;

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setEligible(false);
      setInstallPrompt(null);
    }
  };

  if (!eligible) return null;

  return (
    <section className="pwa-install-card" aria-label="Install FlyTally Training">
      <div className="pwa-install-copy">
        <strong>Install FlyTally Training</strong>
        <span>Open it full screen like an app. Fly pages can be prepared for offline use.</span>
      </div>
      <div className="pwa-install-actions">
        <button className="pwa-install-primary" type="button" onClick={install}>
          {ios ? "Install on iPhone" : "Install app"}
        </button>
        <button className="pwa-install-secondary" type="button" onClick={dismiss}>Not now</button>
      </div>
      {showIosHelp ? <p className="pwa-install-help">In Safari, tap Share, then Add to Home Screen.</p> : null}
    </section>
  );
}
