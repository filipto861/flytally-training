import { notFound, redirect } from "next/navigation";

import { FtFlightPage } from "@/components/ft-flight/FtFlightPage";
import { resolveSelectedVariant, withVariantQuery } from "@/lib/aircraft-applicability";
import { getActiveFlight } from "@/lib/active-flight/store";
import { getTrainingContentRepository } from "@/lib/content-store";
import { isNewShellEnabled } from "@/lib/feature-flags";
import { getTrainingSession } from "@/lib/training-session";

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
  const session = await getTrainingSession();
  const activeFlight = session
    ? await getActiveFlight(session.subject, aircraft.id)
    : undefined;

  return (
    <FtFlightPage
      aircraftId={aircraft.id}
      aircraftName={aircraft.displayName}
      selectedVariant={selectedVariant}
      activeFlight={activeFlight}
    />
  );
}
