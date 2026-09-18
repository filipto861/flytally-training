"use client";

import Link from "next/link";
import { useEffect,useMemo,useState } from "react";

import { withVariantQuery } from "@/lib/aircraft-applicability";
import { loadTrainingProgress } from "@/lib/browser-progress";
import type { PersistedTrainingProgressEvent,TrainingActivityKind } from "@/lib/progress-events";

const destinations:Record<TrainingActivityKind,{path:string;label:string}>={
  "quick-start":{path:"quick-start",label:"Quick Start"},
  systems:{path:"systems",label:"Systems"},
  avionics:{path:"avionics",label:"Avionics"},
  orientation:{path:"orientation",label:"Cockpit orientation"},
  "normal-flight":{path:"checklists",label:"Checklist training"},
  "checklist-phase":{path:"checklists",label:"Checklist training"},
  procedure:{path:"procedures",label:"Procedures"},
  flow:{path:"flows",label:"Flows"},
  scenario:{path:"abnormal",label:"Abnormal practice"},
  knowledge:{path:"knowledge",label:"Knowledge"},
};

export function ContinueLearningCard({aircraftId,selectedVariant,startPath="training",hasQuickStart=false}:{aircraftId:string;selectedVariant?:string;startPath?:string;hasQuickStart?:boolean}){
  const[state,setState]=useState<{loading:boolean;event?:PersistedTrainingProgressEvent}>({loading:true});
  useEffect(()=>{let active=true;void loadTrainingProgress(aircraftId).then(result=>{if(active)setState({loading:false,event:result.events.at(-1)})});return()=>{active=false}},[aircraftId]);
  const next=useMemo(()=>{
    const event=state.event;
    if(!event){
      const path=hasQuickStart?"quick-start":startPath;
      return{href:withVariantQuery(`/aircraft/${aircraftId}/${path}`,selectedVariant),eyebrow:"START HERE",title:hasQuickStart?"Quick Start":"Start learning",text:hasQuickStart?"Build the minimum mental model before your first cockpit session.":"Open the learning workspace and pick one focused area.",cta:hasQuickStart?"Start Quick Start":"Open Learn"};
    }
    const destination=destinations[event.kind];
    const path=event.kind==="quick-start"&&event.completed?"checklists":destination.path;
    const label=event.kind==="quick-start"&&event.completed?"Checklist training":destination.label;
    return{href:withVariantQuery(`/aircraft/${aircraftId}/${path}`,selectedVariant),eyebrow:"CONTINUE",title:label,text:event.completed?"Pick up from your most recent training area.":"Continue the activity you last worked on.",cta:"Continue learning"};
  },[aircraftId,hasQuickStart,selectedVariant,startPath,state.event]);

  return <section className="training-continue-card" aria-label="Continue learning">
    <div><p className="eyebrow">{state.loading?"TRAINING":next.eyebrow}</p><h2>{state.loading?"Finding your last activity…":next.title}</h2><p>{state.loading?"Your recent aircraft progress will appear here.":next.text}</p></div>
    {state.loading?<span className="training-continue-loading" aria-hidden="true">•••</span>:<Link href={next.href}>{next.cta} →</Link>}
  </section>;
}
