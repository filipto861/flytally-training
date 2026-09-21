import { notFound } from "next/navigation";

import { FtLaunchSurface } from "@/components/ft-launch/FtLaunchSurface";
import { LegacyAircraftHome } from "@/components/legacy-aircraft-home";
import { resolveSelectedVariant } from "@/lib/aircraft-applicability";
import { getAircraftContentBundle } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import { isNewShellEnabled } from "@/lib/feature-flags";
import { loadLatestLaunchTrainingEvent } from "@/lib/launch/progress";
import { getTrainingProgressRepository } from "@/lib/progress-repository";
import { getTrainingSession } from "@/lib/training-session";

export default async function AircraftPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ aircraftId: string }>;
  searchParams: Promise<{ variant?: string }>;
}>) {
  const [{ aircraftId }, { variant }] = await Promise.all([params, searchParams]);
  const bundle = await getAircraftContentBundle(
    getTrainingContentRepository(),
    aircraftId,
  );
  if (!bundle) notFound();

  const { aircraft, capabilities } = bundle;
  const selectedVariant = resolveSelectedVariant(variant, aircraft.variants);

  if (!isNewShellEnabled()) {
    return (
      <LegacyAircraftHome
        aircraftId={aircraft.id}
        aircraftName={aircraft.displayName}
        variants={aircraft.variants}
        variantProfiles={aircraft.variantProfiles}
        selectedVariant={selectedVariant}
        capabilities={capabilities}
      />
    );
  }

  const session = await getTrainingSession();
  const latestTraining = session
    ? await loadLatestLaunchTrainingEvent(
        getTrainingProgressRepository(),
        session.subject,
        aircraft.id,
      )
    : undefined;

  return (
    <FtLaunchSurface
      aircraftId={aircraft.id}
      aircraftName={aircraft.displayName}
      selectedVariant={selectedVariant}
      latestTraining={latestTraining}
      recentItems={[]}
    />
  );
}
