"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { TrainingAircraftVariantProfile } from "@/lib/aircraft-catalog";
import styles from "./aircraft-variant-selector.module.css";

export function AircraftVariantSelector({
  variants,
  variantProfiles = [],
  selectedVariant,
}: Readonly<{
  variants: readonly string[];
  variantProfiles?: readonly TrainingAircraftVariantProfile[];
  selectedVariant?: string;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const profiles = variants.map((variant) => variantProfiles.find((profile) => profile.key === variant) ?? {
    key: variant,
    displayName: variant,
    equipmentTags: [] as readonly string[],
  });

  if (profiles.length <= 1) return null;

  function selectVariant(variant: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (variant) next.set("variant", variant); else next.delete("variant");
    const query = next.toString();
    const hash = typeof window === "undefined" ? "" : window.location.hash;
    router.replace(`${pathname}${query ? `?${query}` : ""}${hash}`, { scroll: false });
  }

  return (
    <label className={styles.selector} aria-label="Aircraft variant">
      <span>Variant</span>
      <select value={selectedVariant ?? ""} onChange={(event) => selectVariant(event.target.value)}>
        <option value="">Common / all</option>
        {profiles.map((profile) => <option key={profile.key} value={profile.key}>{profile.displayName}</option>)}
      </select>
    </label>
  );
}
