"use client";

import { useMemo, useState, type ReactNode } from "react";
import { validateContentPayload } from "@/lib/content-contracts";
import type { TrainingContentDomain } from "@/lib/content-admin-types";
import {
  createPerformanceAuthoringDataset,
  createPerformanceAuthoringStructure,
  performanceAuthoringModeFromDataset,
  performanceAuthoringModes,
  type PerformanceAuthoringMode,
} from "@/lib/performance-authoring-presets";
import { performancePhases } from "@/lib/universal-aircraft-content";
import styles from "./structured-content-builder.module.css";

type JsonScalar = string | number | boolean | null;
type JsonValue = JsonScalar | JsonValue[] | JsonObject;
type JsonObject = { [key: string]: JsonValue };
type PathPart = string | number;
type ManualOption = { readonly id: string; readonly label: string };
type ApplicabilityOption = { readonly id: string; readonly label: string };
type SourceOption = {
  readonly id: string;
  readonly label: string;
  readonly manualId: string;
  readonly pageLabel: string;
  readonly chapter?: string;
  readonly section?: string;
  readonly note?: string;
};

type Props = Readonly<{
  domain: TrainingContentDomain;
  aircraftId: string;
  initialPayload: unknown;
  manualOptions?: readonly ManualOption[];
  variantOptions?: readonly ApplicabilityOption[];
  equipmentOptions?: readonly string[];
  sourceOptions?: readonly SourceOption[];
}>;

const multilineKeys = new Set([
  "summary","description","explanation","rationale","sourceNote","disclaimer","condition","verification",
  "expectedResult","setup","why","note","mentalModel","configuration",
]);
const preserveOnBlank = new Set(["kind","interpolation","difficulty"]);
const applicabilityArrayKeys = new Set(["variants","equipmentAllOf","equipmentAnyOf","equipmentNoneOf"]);
const axisBindingKeys = new Set(["altitudeAxis","isaDeviationAxis","surfaceAxis","axisKey","lookupAxis"]);
const outputBindingKeys = new Set(["sourceTemperatureOutput","groundRunOutput","obstacleDistanceOutput","factorOutput","factorOutputKey"]);
const stringArrayKeys = new Set([
  "components","controls","indications","normalOperation","limitations","abnormalCues","remember","prerequisites",
  "completionCriteria","notes","choices","objectives","debrief","expectedResponse","procedures","variants",
  "equipmentAllOf","equipmentAnyOf","equipmentNoneOf","checklistItemIds","outputKeys","selectorValues",
]);

function asJson(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as JsonValue;
}
function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function clone<T extends JsonValue>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
function humanize(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g,"$1 $2").replace(/[-_]/g," ").replace(/^./,letter=>letter.toUpperCase());
}
function itemSummary(value: JsonValue,index:number): string {
  if(!isObject(value))return `Item ${index+1}`;
  for(const key of ["title","label","prompt","challenge","action","area","id","key"]){
    const candidate=value[key];
    if(typeof candidate==="string"&&candidate.trim())return candidate;
  }
  return `Item ${index+1}`;
}
function getAt(root: JsonValue,path: readonly PathPart[]): JsonValue | undefined {
  let current: JsonValue | undefined=root;
  for(const part of path){
    if(Array.isArray(current)&&typeof part==="number")current=current[part];
    else if(isObject(current)&&typeof part==="string")current=current[part];
    else return undefined;
  }
  return current;
}
function datasetAtPath(root:JsonValue,path:readonly PathPart[]):JsonObject|undefined{
  const datasetsIndex=path.findIndex(part=>part==="datasets");
  if(datasetsIndex<0)return undefined;
  const datasetIndex=path[datasetsIndex+1];
  if(typeof datasetIndex!=="number")return undefined;
  const candidate=getAt(root,["datasets",datasetIndex]);
  return isObject(candidate)?candidate:undefined;
}
function sourceSignature(value:Pick<SourceOption,"manualId"|"pageLabel"|"chapter"|"section">):string{
  return [value.manualId,value.chapter??"",value.section??"",value.pageLabel].join("\u001f");
}
function embeddedSourceReferenceIds(root:JsonValue,options:readonly SourceOption[]):readonly string[]{
  const signatures=new Set<string>();
  const visit=(value:JsonValue)=>{
    if(Array.isArray(value)){value.forEach(visit);return;}
    if(!isObject(value))return;
    if(typeof value.manualId==="string"&&typeof value.pageLabel==="string"&&value.manualId&&value.pageLabel){
      signatures.add(sourceSignature({
        manualId:value.manualId,
        pageLabel:value.pageLabel,
        chapter:typeof value.chapter==="string"&&value.chapter?value.chapter:undefined,
        section:typeof value.section==="string"&&value.section?value.section:undefined,
      }));
    }
    Object.values(value).forEach(visit);
  };
  visit(root);
  return options.filter(option=>signatures.has(sourceSignature(option))).map(option=>option.id);
}

function updateAt(root: JsonValue,path: readonly PathPart[],updater:(current:JsonValue)=>JsonValue): JsonValue {
  if(path.length===0)return updater(root);
  const [head,...tail]=path;
  if(Array.isArray(root)&&typeof head==="number"){
    const copy=[...root];
    const current=copy[head];
    if(current!==undefined)copy[head]=updateAt(current,tail,updater);
    return copy;
  }
  if(isObject(root)&&typeof head==="string"){
    const current=root[head];
    if(current===undefined)return root;
    return {...root,[head]:updateAt(current,tail,updater)};
  }
  return root;
}
function blankFromExample(value: JsonValue,key=""): JsonValue {
  if(typeof value==="string")return preserveOnBlank.has(key)?value:"";
  if(typeof value==="number")return 0;
  if(typeof value==="boolean")return false;
  if(value===null)return null;
  if(Array.isArray(value))return [];
  const result:JsonObject={};
  for(const [childKey,child] of Object.entries(value))result[childKey]=blankFromExample(child,childKey);
  return result;
}
function emptyArrayPrototype(key:string,path:readonly PathPart[],root:JsonValue):JsonValue{
  if(stringArrayKeys.has(key))return "";
  if(key==="sources")return {manualId:"",pageLabel:""};
  if(key==="notices")return {kind:"note",text:""};
  if(key==="phases")return {id:"",title:"",sequence:1,items:[]};
  if(key==="procedures")return {id:"",title:"",steps:[]};
  if(key==="datasets")return asJson(createPerformanceAuthoringDataset("metric-lookup"));
  if(key==="axes")return {key:"",label:"",values:[""]};
  if(key==="outputs")return {key:"",label:""};
  if(key==="rows"){
    const parent=getAt(root,path.slice(0,-1));
    if(isObject(parent)){
      const inputs:JsonObject={};const outputs:JsonObject={};
      const axes=parent.axes;const resultOutputs=parent.outputs;
      if(Array.isArray(axes))for(const axis of axes)if(isObject(axis)&&typeof axis.key==="string"&&axis.key)inputs[axis.key]="";
      if(Array.isArray(resultOutputs))for(const output of resultOutputs)if(isObject(output)&&typeof output.key==="string"&&output.key)outputs[output.key]="";
      return {inputs,outputs};
    }
    return {inputs:{},outputs:{}};
  }
  if(key==="groups")return {id:"",title:"",items:[]};
  if(key==="items")return path.some(part=>part==="groups")?{id:"",label:"",value:""}:{id:"",challenge:""};
  if(key==="systems")return {id:"",title:"",summary:""};
  if(key==="flows")return {id:"",title:"",steps:[]};
  if(key==="steps")return {id:"",action:""};
  if(key==="topics")return {id:"",title:"",summary:""};
  if(key==="questions")return {id:"",area:"",prompt:"",choices:["",""],correctIndex:0,explanation:""};
  if(key==="scenarios")return {id:"",title:"",category:"",phase:"",difficulty:"core",minutes:0,summary:"",setup:"",objectives:[],debrief:[],stages:[]};
  if(key==="stages")return {id:"",label:"",prompt:"",expectedResponse:[],explanation:"",sources:[]};
  if(key==="constraints")return {when:{selectorValues:[]},input:{key:"",label:"",unit:""},operator:"lte",value:0,message:""};
  if(key==="options")return {value:"",label:"",factorOutputKey:""};
  return "";
}

export function StructuredContentBuilder({domain,aircraftId,initialPayload,manualOptions=[],variantOptions=[],equipmentOptions=[],sourceOptions=[]}:Props){
  const [payload,setPayload]=useState<JsonValue>(()=>asJson(initialPayload));
  const [raw,setRaw]=useState(()=>JSON.stringify(asJson(initialPayload),null,2));
  const [rawError,setRawError]=useState("");
  const validationErrors=useMemo(()=>validateContentPayload(domain,payload,aircraftId),[domain,payload,aircraftId]);
  const embeddedReferenceIds=useMemo(()=>embeddedSourceReferenceIds(payload,sourceOptions),[payload,sourceOptions]);

  function commit(next:JsonValue){setPayload(next);setRaw(JSON.stringify(next,null,2));setRawError("");}
  function setValue(path:readonly PathPart[],next:JsonValue){commit(updateAt(payload,path,()=>next));}
  function setObjectProperty(path:readonly PathPart[],key:string,next:JsonValue|undefined){
    commit(updateAt(payload,path,current=>{
      if(!isObject(current))return current;
      const copy={...current};
      if(next===undefined)delete copy[key];else copy[key]=next;
      return copy;
    }));
  }
  function setPerformanceOperation(path:readonly PathPart[],operation:string){
    const datasetPath=path.slice(0,-2);
    let next=updateAt(payload,path,()=>operation);
    next=updateAt(next,datasetPath,current=>isObject(current)?{...current,phase:operation}:current);
    commit(next);
  }
  function datasetBindingOptions(path:readonly PathPart[],kind:"axis"|"output"):readonly string[]{
    const dataset=datasetAtPath(payload,path);
    if(!dataset)return [];
    const collection=kind==="axis"?dataset.axes:dataset.outputs;
    if(!Array.isArray(collection))return [];
    return collection.flatMap(item=>isObject(item)&&typeof item.key==="string"&&item.key?[item.key]:[]);
  }
  function switchPerformanceDatasetMode(datasetPath:readonly PathPart[],mode:PerformanceAuthoringMode){
    const dataset=getAt(payload,datasetPath);
    if(!isObject(dataset))return;
    const calculator=isObject(dataset.calculator)?dataset.calculator:undefined;
    const requestedOperation=typeof calculator?.operation==="string"?calculator.operation:typeof dataset.phase==="string"?dataset.phase:undefined;
    const structure=asJson(createPerformanceAuthoringStructure(mode,requestedOperation));
    if(!isObject(structure))return;
    const preserved:JsonObject={};
    for(const key of ["id","title","description","kind","notes","applicability","sources"]){
      const value=dataset[key];if(value!==undefined)preserved[key]=value;
    }
    setValue(datasetPath,{...preserved,...structure});
  }
  function switchDistanceFactorSelector(selectorPath:readonly PathPart[],kind:"output-options"|"axis"){
    const dataset=getAt(payload,selectorPath.slice(0,-2));
    const selector=getAt(payload,selectorPath);
    if(!isObject(dataset)||!isObject(selector))return;
    const firstAxis=Array.isArray(dataset.axes)&&isObject(dataset.axes[0])&&typeof dataset.axes[0].key==="string"?dataset.axes[0].key:"lookupValue";
    const firstOutput=Array.isArray(dataset.outputs)&&isObject(dataset.outputs[0])&&typeof dataset.outputs[0].key==="string"?dataset.outputs[0].key:"factor";
    const baseline=isObject(selector.baseline)?selector.baseline:{value:"baseline",label:"Published baseline",fixedFactor:1};
    if(kind==="axis"){
      setValue(selectorPath,{kind:"axis",label:typeof selector.label==="string"?selector.label:"Condition",axisKey:firstAxis,factorOutput:firstOutput,baseline});
    }else{
      setValue(selectorPath,{kind:"output-options",label:typeof selector.label==="string"?selector.label:"Condition",lookupAxis:firstAxis,baseline,options:[{value:"condition",label:"Condition",factorOutputKey:firstOutput}]});
    }
  }
  function setWeightBalanceStationInput(path:readonly PathPart[],kind:"mass-kg"|"fuel-litres"){
    const stationPath=path.slice(0,-1);
    const station=getAt(payload,stationPath);
    if(!isObject(station))return;
    const next:JsonObject={...station,input:kind};
    if(kind==="fuel-litres"){
      if(typeof next.densityKgPerL!=="number")next.densityKgPerL=0;
    }else{
      delete next.densityKgPerL;
      delete next.maxVolumeL;
    }
    setValue(stationPath,next);
  }
  function changeArray(path:readonly PathPart[],updater:(items:JsonValue[])=>JsonValue[]){
    commit(updateAt(payload,path,current=>Array.isArray(current)?updater(current):current));
  }
  function syncPerformanceRows(path:readonly PathPart[]){
    const dataset=getAt(payload,path.slice(0,-1));
    if(!isObject(dataset))return;
    const axisKeys=Array.isArray(dataset.axes)?dataset.axes.flatMap(axis=>isObject(axis)&&typeof axis.key==="string"&&axis.key?[axis.key]:[]):[];
    const outputKeys=Array.isArray(dataset.outputs)?dataset.outputs.flatMap(output=>isObject(output)&&typeof output.key==="string"&&output.key?[output.key]:[]):[];
    changeArray(path,rows=>rows.map(row=>{
      if(!isObject(row))return row;
      const previousInputs=isObject(row.inputs)?row.inputs:{};
      const previousOutputs=isObject(row.outputs)?row.outputs:{};
      const inputs:JsonObject={};const outputs:JsonObject={};
      for(const key of axisKeys)inputs[key]=previousInputs[key]??"";
      for(const key of outputKeys)outputs[key]=previousOutputs[key]??"";
      return {...row,inputs,outputs};
    }));
  }
  function applyRaw(){
    try{
      const parsed=JSON.parse(raw) as unknown;
      if(!isObject(parsed))throw new Error("Payload must be a JSON object.");
      commit(asJson(parsed));
    }catch(error){setRawError(error instanceof Error?error.message:"Invalid JSON payload.");}
  }

  function renderScalar(value:JsonScalar,path:readonly PathPart[],key:string){
    if(key==="aircraftId")return <div className={styles.field}><span>{humanize(key)}</span><div className={styles.readonly}>{String(value??"")}</div></div>;
    if(key==="manualId"&&typeof value==="string"&&manualOptions.length){
      const hasCurrent=manualOptions.some(option=>option.id===value);
      return <label className={styles.field}><span>{humanize(key)}</span><select value={value} onChange={event=>setValue(path,event.target.value)}>{!hasCurrent&&value?<option value={value}>{value}</option>:null}<option value="">Select source family</option>{manualOptions.map(option=><option key={option.id} value={option.id}>{option.label}</option>)}</select></label>;
    }
    if(key==="interpolation"&&typeof value==="string")return <label className={styles.field}><span>{humanize(key)}</span><select value={value} onChange={event=>setValue(path,event.target.value)}><option value="none">none</option><option value="linear-explicit">linear-explicit</option></select></label>;
    if(key==="phase"&&typeof value==="string"&&domain==="performance"){
      const dataset=getAt(payload,path.slice(0,-1));
      if(isObject(dataset)&&isObject(dataset.calculator))return <div className={styles.field}><span>Flight phase</span><div className={styles.readonly}>{humanize(value)} · managed by calculator operation</div></div>;
      return <label className={styles.field}><span>Flight phase</span><select value={value} onChange={event=>setValue(path,event.target.value)}>{performancePhases.map(phase=><option key={phase} value={phase}>{humanize(phase)}</option>)}</select></label>;
    }
    if(key==="operation"&&typeof value==="string"&&domain==="performance"){
      const parent=getAt(payload,path.slice(0,-1));
      const limited=isObject(parent)&&(parent.kind==="runway-distance-grid"||parent.kind==="distance-factor");
      const options=limited?performancePhases.filter(phase=>phase==="takeoff"||phase==="landing"):performancePhases;
      return <label className={styles.field}><span>Operation</span><select value={value} onChange={event=>setPerformanceOperation(path,event.target.value)}>{options.map(operation=><option key={operation} value={operation}>{humanize(operation)}</option>)}</select></label>;
    }
    if(key==="operator"&&typeof value==="string"&&["lte","gte"].includes(value))return <label className={styles.field}><span>Limit rule</span><select value={value} onChange={event=>setValue(path,event.target.value)}><option value="lte">At or below (≤)</option><option value="gte">At or above (≥)</option></select></label>;
    if(key==="input"&&typeof value==="string"&&["mass-kg","fuel-litres"].includes(value))return <label className={styles.field}><span>Station input</span><select value={value} onChange={event=>setWeightBalanceStationInput(path,event.target.value as "mass-kg"|"fuel-litres")}><option value="mass-kg">Mass</option><option value="fuel-litres">Fuel volume</option></select></label>;
    if(key==="kind"&&typeof value==="string"&&["metric-lookup","runway-distance-grid","distance-factor"].includes(value))return <div className={styles.field}><span>Calculator kind</span><div className={styles.readonly}>{humanize(value)} · managed by Dataset behavior</div></div>;
    if((axisBindingKeys.has(key)||outputBindingKeys.has(key))&&typeof value==="string"&&domain==="performance"){
      const options=datasetBindingOptions(path,axisBindingKeys.has(key)?"axis":"output");
      const optional=key==="lookupAxis";
      return <label className={styles.field}><span>{humanize(key)}</span><select value={value} onChange={event=>setValue(path,event.target.value)}>{optional?<option value="">Not used</option>:null}{!options.includes(value)&&value?<option value={value}>{value} (unmatched)</option>:null}{options.map(option=><option key={option} value={option}>{option}</option>)}</select></label>;
    }
    if(key==="kind"&&typeof value==="string"&&["lookup-table","reference-table"].includes(value))return <label className={styles.field}><span>{humanize(key)}</span><select value={value} onChange={event=>setValue(path,event.target.value)}><option value="lookup-table">lookup table</option><option value="reference-table">reference table</option></select></label>;
    if(key==="kind"&&typeof value==="string"&&["note","caution","warning"].includes(value))return <label className={styles.field}><span>{humanize(key)}</span><select value={value} onChange={event=>setValue(path,event.target.value)}><option value="note">note</option><option value="caution">caution</option><option value="warning">warning</option></select></label>;
    if(key==="difficulty"&&typeof value==="string"&&["core","advanced"].includes(value))return <label className={styles.field}><span>{humanize(key)}</span><select value={value} onChange={event=>setValue(path,event.target.value)}><option value="core">core</option><option value="advanced">advanced</option></select></label>;
    if(typeof value==="boolean")return <label className={styles.field}><span>{humanize(key)}</span><select value={String(value)} onChange={event=>setValue(path,event.target.value==="true")}><option value="true">true</option><option value="false">false</option></select></label>;
    if(typeof value==="number")return <label className={styles.field}><span>{humanize(key)}</span><input type="number" step="any" value={Number.isFinite(value)?value:0} onChange={event=>setValue(path,event.target.value===""?0:Number(event.target.value))}/></label>;
    if(value===null)return <label className={styles.field}><span>{humanize(key)}</span><input value="" placeholder="null" onChange={event=>setValue(path,event.target.value)}/></label>;
    if(multilineKeys.has(key)||(typeof value==="string"&&value.length>100))return <label className={styles.field}><span>{humanize(key)}</span><textarea value={value} onChange={event=>setValue(path,event.target.value)}/></label>;
    return <label className={styles.field}><span>{humanize(key)}</span><input value={value} onChange={event=>setValue(path,event.target.value)}/></label>;
  }

  function renderOutputBindingChoices(items:JsonValue[],path:readonly PathPart[]){
    const selected=items.filter((item):item is string=>typeof item==="string"&&Boolean(item.trim()));
    const options=datasetBindingOptions(path,"output");
    const known=new Set(options);
    const all=[...options,...selected.filter(value=>!known.has(value))];
    return <section className={styles.collection} key={path.join(".")}>
      <div className={styles.collectionHeader}><div><strong>Result outputs</strong><span> · {selected.length} selected</span></div></div>
      {all.length?<div className={styles.choiceGrid}>{all.map(option=><label className={styles.choice} key={option}><input type="checkbox" checked={selected.includes(option)} onChange={event=>setValue(path,event.target.checked?[...new Set([...selected,option])]:selected.filter(value=>value!==option))}/><span><strong>{option}</strong>{!known.has(option)?<small>Output key is no longer present in this dataset.</small>:null}</span></label>)}</div>:<p className={styles.empty}>Add at least one dataset output first.</p>}
    </section>;
  }

  function isBlankSource(value:JsonValue):boolean{
    return isObject(value)&&(!value.manualId||!value.pageLabel);
  }
  function registeredSourceValue(option:SourceOption):JsonObject{
    return {
      manualId:option.manualId,
      ...(option.chapter?{chapter:option.chapter}:{}),
      ...(option.section?{section:option.section}:{}),
      pageLabel:option.pageLabel,
      ...(option.note?{note:option.note}:{}),
    };
  }
  function renderSourceCollection(items:JsonValue[],path:readonly PathPart[]){
    const addRegistered=(id:string)=>{
      if(!id)return;
      const option=sourceOptions.find(candidate=>candidate.id===id);
      if(!option)return;
      changeArray(path,current=>{
        const next=registeredSourceValue(option);
        return current.length===1&&isBlankSource(current[0]!)?[next]:[...current,next];
      });
    };
    return <section className={styles.collection} key={path.join(".")}>
      <div className={styles.collectionHeader}><div><strong>Sources</strong><span> · {items.length} reference{items.length===1?"":"s"}</span></div><div className={styles.itemActions}>{sourceOptions.length?<select aria-label="Add registered source reference" value="" onChange={event=>addRegistered(event.target.value)}><option value="">+ Registered reference…</option>{sourceOptions.map(option=><option key={option.id} value={option.id}>{option.label}</option>)}</select>:null}<button type="button" onClick={()=>changeArray(path,current=>[...current,{manualId:"",pageLabel:""}])}>+ Blank source</button></div></div>
      {items.length?<div className={styles.collectionItems}>{items.map((item,index)=><div className={styles.itemBody} key={`${path.join(".")}-source-${index}`}><div className={styles.itemActions}><button type="button" onClick={()=>changeArray(path,current=>current.filter((_,itemIndex)=>itemIndex!==index))}>Remove</button></div>{renderValue(item,[...path,index],"source")}</div>)}</div>:<p className={styles.empty}>No embedded source references yet.</p>}
      {sourceOptions.length?<p className={styles.hint}>Choosing a registered reference copies its exact manual/page citation and automatically links that reference to the saved governed draft.</p>:null}
    </section>;
  }

  function renderApplicabilityChoices(items:JsonValue[],path:readonly PathPart[],key:string,objectPath:readonly PathPart[]=path.slice(0,-1)){
    const selected=items.filter((item):item is string=>typeof item==="string"&&Boolean(item.trim()));
    const registered=key==="variants"
      ? variantOptions
      : equipmentOptions.map(tag=>({id:tag,label:tag}));
    const known=new Set(registered.map(option=>option.id));
    const options=[...registered,...selected.filter(value=>!known.has(value)).map(value=>({id:value,label:`${value} (unregistered)`}))];
    const toggle=(id:string,checked:boolean)=>{
      const next=[...new Set(checked?[...selected,id]:selected.filter(value=>value!==id))];
      setObjectProperty(objectPath,key,next.length?next:undefined);
    };
    return <section className={styles.collection} key={path.join(".")}>
      <div className={styles.collectionHeader}><div><strong>{humanize(key)}</strong><span> · {selected.length} selected</span></div></div>
      {options.length?<div className={styles.choiceGrid}>{options.map(option=><label className={styles.choice} key={option.id}><input type="checkbox" checked={selected.includes(option.id)} onChange={event=>toggle(option.id,event.target.checked)}/><span><strong>{option.label}</strong>{!known.has(option.id)?<small>Remove or register this identifier before approval.</small>:null}</span></label>)}</div>:<p className={styles.empty}>{key==="variants"?"No aircraft variants are registered. Common content needs no variant restriction.":"No equipment tags are registered. Add equipment in Aircraft Settings before scoping content."}</p>}
      <p className={styles.hint}>No selection means this restriction is omitted from the payload and the content remains common for this rule.</p>
    </section>;
  }

  function renderApplicabilityObject(value:JsonObject,path:readonly PathPart[]){
    const note=value.note;
    return <section className={styles.object} key={path.join(".")}><p className={styles.objectTitle}>Applicability</p>
      {[...applicabilityArrayKeys].map(key=>renderApplicabilityChoices(Array.isArray(value[key])?value[key] as JsonValue[]:[],[...path,key],key,path))}
      {typeof note==="string"?renderValue(note,[...path,"note"],"note"):null}
    </section>;
  }

  function renderArray(items:JsonValue[],path:readonly PathPart[],key:string){
    if(key==="sources")return renderSourceCollection(items,path);
    if(key==="outputKeys"&&domain==="performance")return renderOutputBindingChoices(items,path);
    if(applicabilityArrayKeys.has(key))return renderApplicabilityChoices(items,path,key);
    const scalarOnly=items.length===0?stringArrayKeys.has(key):items.every(item=>item===null||typeof item!=="object");
    if(scalarOnly){
      return <section className={styles.collection} key={path.join(".")}><div className={styles.collectionHeader}><div><strong>{humanize(key)}</strong><span> · {items.length} item{items.length===1?"":"s"}</span></div><button type="button" onClick={()=>changeArray(path,current=>[...current,current.length?blankFromExample(current[current.length-1]!,key):emptyArrayPrototype(key,path,payload)])}>+ Add</button></div>{items.length?<div className={styles.scalarList}>{items.map((item,index)=><div className={styles.scalarRow} key={`${path.join(".")}-${index}`}><div>{renderScalar(item as JsonScalar,[...path,index],key)}</div><div className={styles.scalarActions}><button type="button" disabled={index===0} onClick={()=>changeArray(path,current=>{const next=[...current];const previous=next[index-1];const active=next[index];if(previous===undefined||active===undefined)return current;next[index-1]=active;next[index]=previous;return next;})}>↑</button><button type="button" disabled={index===items.length-1} onClick={()=>changeArray(path,current=>{const next=[...current];const active=next[index];const following=next[index+1];if(active===undefined||following===undefined)return current;next[index]=following;next[index+1]=active;return next;})}>↓</button><button type="button" onClick={()=>changeArray(path,current=>current.filter((_,itemIndex)=>itemIndex!==index))}>×</button></div></div>)}</div>:<p className={styles.empty}>No entries yet.</p>}</section>;
    }
    return <section className={styles.collection} key={path.join(".")}><div className={styles.collectionHeader}><div><strong>{humanize(key)}</strong><span> · {items.length} item{items.length===1?"":"s"}</span></div><div className={styles.itemActions}>{key==="rows"?<button type="button" onClick={()=>syncPerformanceRows(path)}>Sync row keys</button>:null}<button type="button" onClick={()=>changeArray(path,current=>[...current,current.length?blankFromExample(current[current.length-1]!,key):emptyArrayPrototype(key,path,payload)])}>+ Add blank item</button></div></div>{items.length?<div className={styles.collectionItems}>{items.map((item,index)=><details className={styles.item} key={`${path.join(".")}-${index}`} open={items.length<=3}><summary><span className={styles.itemSummary}><span className={styles.itemIndex}>{index+1}</span><span>{itemSummary(item,index)}</span></span><span>▾</span></summary><div className={styles.itemBody}>{key==="datasets"&&domain==="performance"&&isObject(item)?<div className={styles.composerPanel}><label className={styles.field}><span>Dataset behavior</span><select value={performanceAuthoringModeFromDataset(item)} onChange={event=>switchPerformanceDatasetMode([...path,index],event.target.value as PerformanceAuthoringMode)}>{performanceAuthoringModes.map(mode=><option key={mode} value={mode}>{mode==="reference-only"?"Reference only":humanize(mode)}</option>)}</select></label><p className={styles.hint}>Changing behavior replaces calculator bindings, axes, outputs and rows with a valid starter shape. Dataset identity, notes, sources and applicability are preserved.</p></div>:null}<div className={styles.itemActions}><button type="button" disabled={index===0} onClick={()=>changeArray(path,current=>{const next=[...current];const previous=next[index-1];const active=next[index];if(previous===undefined||active===undefined)return current;next[index-1]=active;next[index]=previous;return next;})}>Move up</button><button type="button" disabled={index===items.length-1} onClick={()=>changeArray(path,current=>{const next=[...current];const active=next[index];const following=next[index+1];if(active===undefined||following===undefined)return current;next[index]=following;next[index+1]=active;return next;})}>Move down</button><button type="button" onClick={()=>changeArray(path,current=>{const source=current[index];if(source===undefined)return current;const next=[...current];next.splice(index+1,0,clone(source));return next;})}>Duplicate</button><button type="button" onClick={()=>changeArray(path,current=>current.filter((_,itemIndex)=>itemIndex!==index))}>Remove</button></div>{renderValue(item,[...path,index],`${key} item`)}</div></details>)}</div>:<p className={styles.empty}>No entries yet. Add the first structured item above.</p>}</section>;
  }

  function renderObject(value:JsonObject,path:readonly PathPart[],label:string){
    if(label==="applicability")return renderApplicabilityObject(value,path);
    const entries=Object.entries(value);
    const selectorKind=label==="selector"&&domain==="performance"&&(value.kind==="output-options"||value.kind==="axis")?value.kind:undefined;
    return <section className={styles.object} key={path.join(".")}><p className={styles.objectTitle}>{humanize(label)}</p>
      {selectorKind?<div className={styles.composerPanel}><label className={styles.field}><span>Factor selector behavior</span><select value={selectorKind} onChange={event=>switchDistanceFactorSelector(path,event.target.value as "output-options"|"axis")}><option value="output-options">Named correction options</option><option value="axis">Dataset axis values</option></select></label><p className={styles.hint}>Switching selector behavior resets only the selector bindings; dataset rows remain unchanged.</p></div>:null}
      {entries.filter(([childKey])=>!(selectorKind&&childKey==="kind")).map(([childKey,child])=>renderValue(child,[...path,childKey],childKey))}
    </section>;
  }
  function renderValue(value:JsonValue,path:readonly PathPart[],key:string):ReactNode{
    if(Array.isArray(value))return renderArray(value,path,key);
    if(isObject(value))return renderObject(value,path,key);
    return <div key={path.join(".")}>{renderScalar(value,path,key)}</div>;
  }

  const weightBalanceSetup=domain==="weight-balance"&&isObject(payload)?(()=>{
    const stations=Array.isArray(payload.stations)?payload.stations.filter(isObject):[];
    const fuelStations=stations.filter(station=>station.input==="fuel-litres"&&typeof station.id==="string"&&station.id.trim());
    const limits=isObject(payload.limits)?payload.limits:undefined;
    const hasLandingLimit=Boolean(limits&&typeof limits.maxLandingMassKg==="number");
    const fuelBurnStation=typeof payload.fuelBurnStationId==="string"?payload.fuelBurnStationId:"";
    return <section className={styles.composerPanel}>
      <div><strong>Weight & Balance setup</strong><p className={styles.hint}>Optional operational fields can be configured here without editing raw JSON.</p></div>
      <div className={styles.setupGrid}>
        <label className={styles.choice}><input type="checkbox" checked={hasLandingLimit} onChange={event=>{
          if(!limits)return;
          if(event.target.checked){
            const fallback=typeof limits.maxTakeoffMassKg==="number"?limits.maxTakeoffMassKg:0;
            setObjectProperty(["limits"],"maxLandingMassKg",fallback);
          }else setObjectProperty(["limits"],"maxLandingMassKg",undefined);
        }}/><span><strong>Separate landing mass limit</strong><small>Enable when the approved source publishes one.</small></span></label>
        <label className={styles.field}><span>Fuel burn station</span><select value={fuelBurnStation} onChange={event=>setObjectProperty([],"fuelBurnStationId",event.target.value||undefined)}><option value="">Not configured</option>{fuelStations.map(station=><option key={String(station.id)} value={String(station.id)}>{typeof station.label==="string"&&station.label?station.label:String(station.id)}</option>)}</select></label>
      </div>
    </section>;
  })():null;

  return <div className={styles.builder}>
    <div className={styles.toolbar}><div className={styles.toolbarText}><strong>Structured {humanize(domain)} payload</strong><span>Edit fields and collections directly. The saved result still passes through the normal immutable draft workflow.</span></div><span className={validationErrors.length?styles.statusBad:styles.statusGood}>{validationErrors.length?`${validationErrors.length} contract issue${validationErrors.length===1?"":"s"}`:"Contract valid"}</span></div>
    {weightBalanceSetup}
    {validationErrors.length?<ul className={styles.errorList}>{validationErrors.slice(0,12).map(error=><li key={error}>{error}</li>)}{validationErrors.length>12?<li>+ {validationErrors.length-12} more issue(s)</li>:null}</ul>:null}
    <p className={styles.hint}>Collection controls change structure only in this draft. Duplicate is useful when two items share the same shape; review copied source/applicability fields before saving. Performance rows can be synchronized after changing axis/output keys.</p>
    <div className={styles.root}>{isObject(payload)?Object.entries(payload).map(([key,value])=>renderValue(value,[key],key)):renderValue(payload,[],"payload")}</div>
    <textarea hidden name="payload" readOnly value={JSON.stringify(payload)}/>
    {embeddedReferenceIds.map(id=><input key={id} type="hidden" name="sourceReferenceId" value={id}/>)} 
    <details className={styles.advanced}><summary>Advanced raw JSON escape hatch</summary><p className={styles.hint}>Use only for fields or structural changes the form cannot yet express. Apply JSON first; the structured form and contract validation will update before submit.</p><textarea className={styles.raw} value={raw} onChange={event=>{setRaw(event.target.value);setRawError("");}}/><div className={styles.rawActions}><button type="button" onClick={applyRaw}>Apply JSON to builder</button>{rawError?<span className={styles.rawError}>{rawError}</span>:null}</div></details>
  </div>;
}
