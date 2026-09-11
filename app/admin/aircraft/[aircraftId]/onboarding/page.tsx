import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTrainingAdmin } from "@/lib/admin-auth";
import { deriveAircraftOnboarding } from "@/lib/admin-aircraft-onboarding";
import { getAdminAircraft } from "@/lib/content-admin-repository";

export const dynamic="force-dynamic";

const moduleLabel=(domain:string)=>domain.split("-").map(word=>word.charAt(0).toUpperCase()+word.slice(1)).join(" ");

export default async function AircraftOnboardingPage({params}:Readonly<{params:Promise<{aircraftId:string}>}>){
  await requireTrainingAdmin();
  const {aircraftId}=await params;
  const aircraft=await getAdminAircraft(aircraftId);
  if(!aircraft)notFound();
  const onboarding=deriveAircraftOnboarding(aircraft);

  return <main className="shell aircraft-detail">
    <Link className="back-link" href={`/admin/aircraft/${aircraftId}`}>← Content studio</Link>
    <section className="workspace-section-hero">
      <p className="eyebrow">M28 onboarding · {onboarding.phase}</p>
      <h1>{aircraft.displayName}</h1>
      <p className="lede">{onboarding.completionPercent}% governance readiness · {onboarding.completedSteps}/{onboarding.totalSteps} workflow gates complete</p>
      <p><strong>Next:</strong> {onboarding.nextAction}</p>
      <p><small>This score measures the governed onboarding workflow, not curriculum size. A sparse aircraft can be fully ready with one genuine module; FlyTally never requires Learjet-specific domains.</small></p>
    </section>

    <section className="reference-library">
      <div className="section-heading"><div><p className="eyebrow">Release path</p><h2>Aircraft onboarding workflow</h2></div></div>
      <ol className="chapter-list">
        {onboarding.steps.map((step,index)=><li key={step.id}>
          <span className="chapter-number">{step.attention?"!":step.complete?"✓":String(index+1)}</span>
          <div><strong>{step.label}</strong><span>{step.detail}</span></div>
        </li>)}
      </ol>
      <p><Link href={`/admin/aircraft/${aircraftId}`}>Open content studio to continue →</Link></p>
    </section>

    <section className="reference-library">
      <div className="section-heading"><div><p className="eyebrow">Aircraft-native modules</p><h2>Module release state</h2></div></div>
      <p>Only domains that have real source-backed content need to exist. Missing domains remain absent rather than being synthesized or inferred.</p>
      <div className="workspace-section-grid">
        {onboarding.modules.map(module=>{
          const liveSuffix=module.released && module.state!=="published"?" · live":"";
          const statusText=module.state==="absent"
            ? "Optional until genuinely needed"
            : module.state==="draft"
              ? module.released?"Live version exists; newer draft is under review":"Authoring / review in progress"
              : module.state==="approved"
                ? module.released?"Live version exists; approved update is ready to publish":"Approved; ready to publish"
                : module.state==="stale"
                  ? "Published content needs revision review"
                  : "Published to learners";
          return <article className="workspace-card" key={module.domain}>
            <div className="workspace-card-topline"><span>{moduleLabel(module.domain)}</span><small>{module.state}{liveSuffix}</small></div>
            <p>{module.contentKey?`${module.contentKey}${module.versionNo?` · v${module.versionNo}`:""}`:"No governed content yet"}</p>
            <strong>{statusText}</strong>
          </article>;
        })}
      </div>
    </section>

    <section className="reference-library">
      <div className="section-heading"><div><p className="eyebrow">Architecture boundary</p><h2>No source-code aircraft registration</h2></div></div>
      <p>New aircraft are created in the governed catalogue, source revisions and references are registered as data, and learner modules are published through immutable versioning. Runtime navigation derives from the domains that are actually published for that aircraft.</p>
      <p><strong>Variants are optional.</strong> If an aircraft needs variants or equipment-specific applicability, configure them explicitly. If it does not, common content remains valid without creating artificial variants.</p>
    </section>
  </main>;
}
