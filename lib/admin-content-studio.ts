import type { AdminAircraftDetail,AdminContentVersion,AdminManualRevision,AdminSourceReference,TrainingContentDomain } from "./content-admin-types.ts";

export type ContentStudioManualFamily = {
  readonly manualId: string;
  readonly title: string;
  readonly publisher: string;
  readonly sourceKind: string;
  readonly revisions: readonly AdminManualRevision[];
};

export type ContentStudioSourceReference = AdminSourceReference & {
  readonly label: string;
  readonly manualTitle: string;
  readonly revision: string;
};

export type ContentStudioModule = {
  readonly key: string;
  readonly domain: TrainingContentDomain;
  readonly contentKey: string;
  readonly latest: AdminContentVersion;
  readonly live?: AdminContentVersion;
  readonly pending?: AdminContentVersion;
  readonly historyCount: number;
};

export type ContentStudioModel = {
  readonly sourceFamilies: readonly ContentStudioManualFamily[];
  readonly references: readonly ContentStudioSourceReference[];
  readonly modules: readonly ContentStudioModule[];
  readonly liveModuleCount: number;
  readonly pendingModuleCount: number;
};

const byRevisionNewest=(a:AdminManualRevision,b:AdminManualRevision)=>b.issueDate.localeCompare(a.issueDate)||b.revision.localeCompare(a.revision);
const byVersionNewest=(a:AdminContentVersion,b:AdminContentVersion)=>b.versionNo-a.versionNo||b.createdAt.localeCompare(a.createdAt);

export function sourceReferenceLabel(reference:AdminSourceReference,manuals:readonly AdminManualRevision[]):string{
  const manual=manuals.find(item=>item.revisionId===reference.revisionId);
  const source=manual?`${manual.title} · rev ${manual.revision}`:"Unknown source revision";
  const location=[reference.chapter?`Ch. ${reference.chapter}`:undefined,reference.section,`p. ${reference.pageLabel}`].filter(Boolean).join(" · ");
  return `${source} · ${location}`;
}

export function deriveContentStudio(aircraft:AdminAircraftDetail):ContentStudioModel{
  const familyMap=new Map<string,AdminManualRevision[]>();
  for(const manual of aircraft.manuals){
    const family=familyMap.get(manual.manualId)??[];
    family.push(manual);
    familyMap.set(manual.manualId,family);
  }
  const sourceFamilies=[...familyMap.entries()].map(([manualId,revisions]):ContentStudioManualFamily=>{
    const sorted=[...revisions].sort(byRevisionNewest);
    const first=sorted[0];
    return {manualId,title:first.title,publisher:first.publisher,sourceKind:first.sourceKind,revisions:sorted};
  }).sort((a,b)=>a.title.localeCompare(b.title));

  const references=aircraft.sourceReferences.map((reference):ContentStudioSourceReference=>{
    const manual=aircraft.manuals.find(item=>item.revisionId===reference.revisionId);
    return {...reference,label:sourceReferenceLabel(reference,aircraft.manuals),manualTitle:manual?.title??"Unknown source",revision:manual?.revision??"?"};
  });

  const itemMap=new Map<string,AdminContentVersion[]>();
  for(const version of aircraft.contentVersions){
    const key=`${version.domain}/${version.contentKey}`;
    const versions=itemMap.get(key)??[];
    versions.push(version);
    itemMap.set(key,versions);
  }

  const modules=[...itemMap.entries()].map(([key,versions]):ContentStudioModule=>{
    const ordered=[...versions].sort(byVersionNewest);
    const current=ordered.filter(version=>version.state!=="archived");
    const latest=current[0]??ordered[0];
    const live=current.find(version=>version.state==="published"||version.state==="stale");
    const pending=current.find(version=>version.state==="draft"||version.state==="approved");
    return {key,domain:latest.domain,contentKey:latest.contentKey,latest,live,pending,historyCount:ordered.length};
  }).sort((a,b)=>a.domain.localeCompare(b.domain)||a.contentKey.localeCompare(b.contentKey));

  return {
    sourceFamilies,
    references,
    modules,
    liveModuleCount:modules.filter(module=>Boolean(module.live)).length,
    pendingModuleCount:modules.filter(module=>Boolean(module.pending)).length,
  };
}
