import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { WeightBalanceCalculator } from "@/components/weight-balance-calculator";
import { resolveSelectedVariant } from "@/lib/aircraft-applicability";
import { getPublishedAircraftModule } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import type { AircraftWeightBalanceContent } from "@/lib/universal-weight-balance";

export default async function WeightBalancePage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ aircraftId: string }>;
  searchParams: Promise<{ variant?: string }>;
}>) {
  const [{ aircraftId }, { variant }] = await Promise.all([params, searchParams]);
  const repository = getTrainingContentRepository();
  const [aircraft, content] = await Promise.all([
    repository.getAircraft(aircraftId),
    getPublishedAircraftModule<AircraftWeightBalanceContent>(repository, aircraftId, "weight-balance"),
  ]);
  if (!aircraft || !content) notFound();

  const selectedVariant = resolveSelectedVariant(variant, aircraft.variants);

  return (
    <main className="shell aircraft-detail">
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="weight-balance" variants={aircraft.variants} variantProfiles={aircraft.variantProfiles} selectedVariant={selectedVariant} />
      <section className="workspace-section-hero">
        <p className="eyebrow">Weight &amp; Balance · {aircraft.displayName}{selectedVariant ? ` · ${selectedVariant}` : ""}</p>
        <h1>Weight &amp; Balance</h1>
        <p className="lede">Check takeoff and planned landing mass and centre of gravity from the published empty-aircraft data, loading stations and CG envelope.</p>
      </section>
      <WeightBalanceCalculator content={content} />
    </main>
  );
}
