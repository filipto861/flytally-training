import { notFound, redirect } from "next/navigation";

import { FtFlightPage } from "@/components/ft-flight/FtFlightPage";
import { resolveSelectedVariant, withVariantQuery } from "@/lib/aircraft-applicability";
import { getTrainingContentRepository } from "@/lib/content-store";
import { isNewShellEnabled } from "@/lib/feature-flags";

export default async function FlightPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ aircraftId: string }>;
  searchParams: Promise<{ variant?: string }>;
}>) {
  const [{ aircraftId }, { variant }] = await Promise.all([params, searchParams]);

  if (!isNewShellEnabled()) {
    redirect(withVariantQuery(`/aircraft/${aircraftId}/fly`, variant));
  }

  const aircraft = await getTrainingContentRepository().getAircraft(aircraftId);
  if (!aircraft) notFound();

  const selectedVariant = resolveSelectedVariant(variant, aircraft.variants);

  return (
    <FtFlightPage
      aircraftId={aircraft.id}
      aircraftName={aircraft.displayName}
      selectedVariant={selectedVariant}
    />
  );
}
