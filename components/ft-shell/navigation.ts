export function ftFastPathDestinations(aircraftId: string) {
  const base = `/aircraft/${aircraftId}`;
  return [
    { key: "checklist", label: "CHECKLIST", href: `${base}/fly` },
    { key: "qrh", label: "QRH", href: `${base}/abnormal` },
    { key: "perf", label: "PERF", href: `${base}/performance` },
    { key: "ref", label: "REF", href: `${base}/reference` },
  ] as const;
}
