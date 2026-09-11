import type { AdminAircraftDetail,AdminContentVersion,TrainingContentDomain } from "./content-admin-types";
import { universalTrainingContentDomains } from "./universal-aircraft-content";

export const onboardingModuleDomains = [...universalTrainingContentDomains,"abnormal"] as const;
export type OnboardingModuleDomain = typeof onboardingModuleDomains[number];
export type OnboardingModuleState = "absent" | "draft" | "approved" | "published" | "stale";
export type AircraftOnboardingPhase = "sources" | "authoring" | "review" | "release" | "maintenance" | "ready";

export type AircraftOnboardingStep = {
  readonly id: "profile" | "sources" | "references" | "content" | "publication" | "catalogue" | "freshness";
  readonly label: string;
  readonly complete: boolean;
  readonly attention?: boolean;
  readonly detail: string;
};

export type AircraftOnboardingModule = {
  readonly domain: OnboardingModuleDomain;
  readonly state: OnboardingModuleState;
  readonly versionNo?: number;
  readonly contentKey?: string;
};

export type AircraftOnboarding = {
  readonly phase: AircraftOnboardingPhase;
  readonly completionPercent: number;
  readonly completedSteps: number;
  readonly totalSteps: number;
  readonly nextAction: string;
  readonly steps: readonly AircraftOnboardingStep[];
  readonly modules: readonly AircraftOnboardingModule[];
  readonly publishedModuleCount: number;
};

function moduleState(versions: readonly AdminContentVersion[]): OnboardingModuleState {
  if (!versions.length) return "absent";
  if (versions.some(version=>version.state==="stale")) return "stale";
  if (versions.some(version=>version.state==="draft")) return "draft";
  if (versions.some(version=>version.state==="approved")) return "approved";
  if (versions.some(version=>version.state==="published")) return "published";
  return "absent";
}

function representativeVersion(versions: readonly AdminContentVersion[]): AdminContentVersion | undefined {
  return [...versions]
    .filter(version=>version.state!=="archived")
    .sort((a,b)=>b.versionNo-a.versionNo || b.createdAt.localeCompare(a.createdAt))[0];
}

function versionsForDomain(aircraft: AdminAircraftDetail, domain: TrainingContentDomain): readonly AdminContentVersion[] {
  return aircraft.contentVersions.filter(version=>version.domain===domain);
}

export function deriveAircraftOnboarding(aircraft: AdminAircraftDetail): AircraftOnboarding {
  const modules=onboardingModuleDomains.map((domain):AircraftOnboardingModule=>{
    const versions=versionsForDomain(aircraft,domain);
    const representative=representativeVersion(versions);
    return {
      domain,
      state:moduleState(versions),
      versionNo:representative?.versionNo,
      contentKey:representative?.contentKey,
    };
  });

  const hasSources=aircraft.manuals.length>0;
  const hasReferences=aircraft.sourceReferences.length>0;
  const hasContent=aircraft.contentVersions.some(version=>version.state!=="archived");
  const publishedModuleCount=modules.filter(module=>module.state==="published" || module.state==="stale").length;
  const hasPublishedContent=publishedModuleCount>0;
  const cataloguePublished=aircraft.status==="published";
  const fresh=aircraft.staleCount===0 && !modules.some(module=>module.state==="stale");

  const steps:AircraftOnboardingStep[]=[
    {
      id:"profile",
      label:"Aircraft profile",
      complete:true,
      detail:aircraft.variants.length
        ? `${aircraft.manufacturer} ${aircraft.model} · ${aircraft.variants.length} configured variant${aircraft.variants.length===1?"":"s"}`
        : `${aircraft.manufacturer} ${aircraft.model} · common-content aircraft; variants are optional`,
    },
    {
      id:"sources",
      label:"Controlled sources",
      complete:hasSources,
      detail:hasSources?`${aircraft.manuals.length} immutable source revision${aircraft.manuals.length===1?"":"s"} registered`:"Register at least one immutable source revision before authoring governed content.",
    },
    {
      id:"references",
      label:"Source references",
      complete:hasReferences,
      detail:hasReferences?`${aircraft.sourceReferences.length} exact source reference${aircraft.sourceReferences.length===1?"":"s"} available`:"Create chapter/section/page references that drafts can cite.",
    },
    {
      id:"content",
      label:"Module authoring",
      complete:hasContent,
      detail:hasContent?`${modules.filter(module=>module.state!=="absent").length} current module domain${modules.filter(module=>module.state!=="absent").length===1?"":"s"} represented`:"Create the first source-backed module draft. Sparse aircraft are valid; only publish domains the aircraft genuinely needs.",
    },
    {
      id:"publication",
      label:"Governed publication",
      complete:hasPublishedContent,
      detail:hasPublishedContent?`${publishedModuleCount} learner module${publishedModuleCount===1?"":"s"} released`:"Review, approve and publish at least one module before releasing the aircraft to learners.",
    },
    {
      id:"catalogue",
      label:"Aircraft catalogue",
      complete:cataloguePublished,
      detail:cataloguePublished?"Aircraft catalogue entry is published.":"Publish the aircraft catalogue entry after its first learner module is ready.",
    },
    {
      id:"freshness",
      label:"Revision freshness",
      complete:fresh,
      attention:!fresh,
      detail:fresh?"No unresolved stale-content review is open.":`${aircraft.staleCount} stale-content review${aircraft.staleCount===1?"":"s"} require resolution.`,
    },
  ];

  const completedSteps=steps.filter(step=>step.complete).length;
  const totalSteps=steps.length;
  const completionPercent=Math.round((completedSteps/totalSteps)*100);

  let phase:AircraftOnboardingPhase;
  let nextAction:string;
  if (!hasSources) {
    phase="sources";
    nextAction="Register the first controlled source revision.";
  } else if (!hasReferences) {
    phase="sources";
    nextAction="Create exact chapter/section/page references for the registered source.";
  } else if (!hasContent) {
    phase="authoring";
    nextAction="Create the first governed module draft from the selected source references.";
  } else if (!hasPublishedContent) {
    phase="review";
    nextAction="Review, approve and publish the first learner module.";
  } else if (!cataloguePublished) {
    phase="release";
    nextAction="Publish the aircraft catalogue entry.";
  } else if (!fresh) {
    phase="maintenance";
    nextAction="Resolve stale-content reviews against the newer manual revision before the next release.";
  } else {
    phase="ready";
    nextAction="Aircraft is live and current. Add only source-backed modules that materially improve this aircraft.";
  }

  return {phase,completionPercent,completedSteps,totalSteps,nextAction,steps,modules,publishedModuleCount};
}
