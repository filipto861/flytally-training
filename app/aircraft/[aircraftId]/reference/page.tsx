import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { resolveSelectedVariant, withVariantQuery } from "@/lib/aircraft-applicability";
import { getAircraftContentBundle } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";

export default async function ReferenceHubPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ aircraftId: string }>;
  searchParams: Promise<{ variant?: string }>;
}>) {
  const [{ aircraftId }, { variant }] = await Promise.all([params, searchParams]);
  const bundle = await getAircraftContentBundle(getTrainingContentRepository(), aircraftId);
  if (!bundle) notFound();
  const { aircraft, capabilities } = bundle;
  const selectedVariant = resolveSelectedVariant(variant, aircraft.variants);
  const href = (section: string) => withVariantQuery(`/aircraft/${aircraft.id}/${section}`, selectedVariant);

  const hasQuickReference = capabilities.performance && capabilities.limitations;
  const modules = [
    capabilities.performance ? { key: "performance", kicker: "Plan", title: "Performance", text: "Published performance data and calculator." } : undefined,
    capabilities.weightBalance ? { key: "weight-balance", kicker: "Load", title: "Weight & Balance", text: "Mass, CG and configuration-specific loading limits." } : undefined,
    capabilities.limitations ? { key: "limitations", kicker: "Limits", title: "Limitations", text: "Speeds, weights and operating boundaries." } : undefined,
    capabilities.abnormalEmergency ? { key: "abnormal", kicker: "Emergency", title: "Abnormal & Emergency", text: "Source-backed abnormal and emergency procedures.", critical: true } : undefined,
  ].filter((item): item is { key: string; kicker: string; title: string; text: string; critical?: boolean } => Boolean(item));

  if (!modules.length && !hasQuickReference) notFound();

  return (
    <main className="shell aircraft-detail">
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="reference" variants={aircraft.variants} variantProfiles={aircraft.variantProfiles} selectedVariant={selectedVariant} />
      <section className="pilot-area">
        <header className="pilot-area-header">
          <p className="eyebrow">Reference</p>
          <h1>Reference</h1>
          <p className="lede">Numbers and procedures you may need quickly, separate from study content.</p>
        </header>
        <div className="pilot-area-grid" aria-label="Reference tools">
          {hasQuickReference ? <Link className="pilot-area-card pilot-area-card-featured" href={href("quick-reference")}>
            <small>At a glance</small>
            <strong>Quick Reference</strong>
            <p>Performance and limitations together for rapid review.</p>
            <span>Open →</span>
          </Link> : null}
          {modules.map((module) => <Link className={`pilot-area-card${module.critical ? " pilot-area-card-critical" : ""}`} href={href(module.key)} key={module.key}>
            <small>{module.kicker}</small>
            <strong>{module.title}</strong>
            <p>{module.text}</p>
            <span>Open →</span>
          </Link>)}
        </div>
      </section>
    </main>
  );
}
