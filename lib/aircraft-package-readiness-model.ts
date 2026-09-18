export type AircraftPackageReadinessCheckId =
  | "sources"
  | "references"
  | "published-content"
  | "content-contracts"
  | "applicability"
  | "source-provenance"
  | "freshness";

export type AircraftPackageReadinessStatus = "pass" | "block" | "waiting";

export type AircraftPackageReadinessCheck = {
  readonly id: AircraftPackageReadinessCheckId;
  readonly label: string;
  readonly status: AircraftPackageReadinessStatus;
  readonly detail: string;
};

export type AircraftPackageReadinessFacts = {
  readonly sourceRevisionCount: number;
  readonly sourceReferenceCount: number;
  readonly publishedModuleCount: number;
  readonly pendingVersionCount: number;
  readonly publishedContractsValid: boolean;
  readonly applicabilityCurrent: boolean;
  readonly sourceProvenanceComplete: boolean;
  readonly fresh: boolean;
};

export type AircraftPackageReadiness = {
  readonly ready: boolean;
  readonly completionPercent: number;
  readonly checks: readonly AircraftPackageReadinessCheck[];
  readonly blockers: readonly AircraftPackageReadinessCheck[];
  readonly warnings: readonly string[];
  readonly nextAction: string;
};

export function deriveAircraftPackageReadiness(facts: AircraftPackageReadinessFacts): AircraftPackageReadiness {
  const hasPublished=facts.publishedModuleCount>0;
  const checks:AircraftPackageReadinessCheck[]=[
    {
      id:"sources",
      label:"Controlled source revision",
      status:facts.sourceRevisionCount>0?"pass":"block",
      detail:facts.sourceRevisionCount>0
        ? `${facts.sourceRevisionCount} immutable source revision${facts.sourceRevisionCount===1?"":"s"} registered.`
        : "Register at least one immutable source revision.",
    },
    {
      id:"references",
      label:"Exact source reference",
      status:facts.sourceReferenceCount>0?"pass":"block",
      detail:facts.sourceReferenceCount>0
        ? `${facts.sourceReferenceCount} exact source reference${facts.sourceReferenceCount===1?"":"s"} available.`
        : "Create at least one chapter/section/page reference.",
    },
    {
      id:"published-content",
      label:"Published learner module",
      status:hasPublished?"pass":"block",
      detail:hasPublished
        ? `${facts.publishedModuleCount} learner module${facts.publishedModuleCount===1?"":"s"} published.`
        : "Review, approve and publish at least one genuine learner module.",
    },
    {
      id:"content-contracts",
      label:"Published contract validity",
      status:hasPublished?(facts.publishedContractsValid?"pass":"block"):"waiting",
      detail:hasPublished
        ? facts.publishedContractsValid?"Published payloads still match their current contracts.":"At least one published payload no longer matches the current content contract."
        : "Waiting for the first published learner module.",
    },
    {
      id:"applicability",
      label:"Current configuration applicability",
      status:hasPublished?(facts.applicabilityCurrent?"pass":"block"):"waiting",
      detail:hasPublished
        ? facts.applicabilityCurrent?"Every published applicability identifier exists in the current aircraft configuration.":"Published content references a variant or equipment tag that is no longer registered."
        : "Waiting for the first published learner module.",
    },
    {
      id:"source-provenance",
      label:"Published source authority",
      status:hasPublished?(facts.sourceProvenanceComplete?"pass":"block"):"waiting",
      detail:hasPublished
        ? facts.sourceProvenanceComplete?"Every effective learner module has classified governed provenance; operational domains use operational authority.":"Published source provenance is incomplete or insufficient for at least one effective module."
        : "Waiting for the first published learner module.",
    },
    {
      id:"freshness",
      label:"Revision freshness",
      status:hasPublished?(facts.fresh?"pass":"block"):"waiting",
      detail:hasPublished
        ? facts.fresh?"No unresolved stale-source review affects the effective package.":"Resolve stale-source review before catalogue release."
        : "Waiting for the first published learner module.",
    },
  ];

  const blockers=checks.filter(check=>check.status==="block");
  const completed=checks.filter(check=>check.status==="pass").length;
  const completionPercent=Math.round((completed/checks.length)*100);
  const warnings=facts.pendingVersionCount>0
    ? [`${facts.pendingVersionCount} draft/approved version${facts.pendingVersionCount===1?" is":"s are"} pending. Pending work does not block a valid current release, but review it deliberately.`]
    : [];
  return {
    ready:blockers.length===0&&checks.every(check=>check.status==="pass"),
    completionPercent,
    checks,
    blockers,
    warnings,
    nextAction:blockers[0]?.detail??(checks.some(check=>check.status==="waiting")?"Publish the first governed learner module.":"Package is ready for catalogue release."),
  };
}
