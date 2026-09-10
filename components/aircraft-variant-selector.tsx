"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import styles from "./aircraft-variant-selector.module.css";

export function AircraftVariantSelector({
  variants,
  selectedVariant,
}: Readonly<{
  variants: readonly string[];
  selectedVariant?: string;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  if (variants.length <= 1) return null;

  function selectVariant(variant: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (variant) next.set("variant", variant); else next.delete("variant");
    const query = next.toString();
    const hash = typeof window === "undefined" ? "" : window.location.hash;
    router.replace(`${pathname}${query ? `?${query}` : ""}${hash}`, { scroll: false });
  }

  return (
    <section className={styles.selector} aria-label="Aircraft configuration">
      <div>
        <p className="eyebrow">Aircraft configuration</p>
        <strong>{selectedVariant ? `Variant ${selectedVariant}` : "Select the aircraft variant"}</strong>
        <span>
          {selectedVariant
            ? "Configuration-specific content is filtered against the selected variant when the published module defines applicability."
            : "Until a variant is selected, FlyTally hides content that is explicitly restricted to a specific variant."}
        </span>
      </div>
      <label>
        <span>Variant</span>
        <select value={selectedVariant ?? ""} onChange={(event) => selectVariant(event.target.value)}>
          <option value="">Common content only</option>
          {variants.map((variant) => <option key={variant} value={variant}>{variant}</option>)}
        </select>
      </label>
    </section>
  );
}
