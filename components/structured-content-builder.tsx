"use client";

import { useMemo, useState, type ReactNode } from "react";
import { validateContentPayload } from "@/lib/content-contracts";
import type { TrainingContentDomain } from "@/lib/content-admin-types";
import styles from "./structured-content-builder.module.css";

type JsonScalar = string | number | boolean | null;
type JsonValue = JsonScalar | JsonValue[] | JsonObject;
type JsonObject = { [key: string]: JsonValue };
type PathPart = string | number;
type ManualOption = { readonly id: string; readonly label: string };
type ApplicabilityOption = { readonly id: string; readonly label: string };

type Props = Readonly<{
  domain: TrainingContentDomain;
  aircraftId: string;
  initialPayload: unknown;
  manualOptions?: readonly ManualOption[];
  variantOptions?: readonly ApplicabilityOption[];
  equipmentOptions?: readonly string[];
}>;

const multilineKeys = new Set([
  "summary","description","explanation","rationale","sourceNote","disclaimer","condition","verification",
  "expectedResult","setup","why","note","mentalModel","configuration",
]);
const preserveOnBlank = new Set(["kind","interpolation","difficulty"]);
const applicabilityArrayKeys = new Set(["variants","equipmentAllOf","equipmentAnyOf","equipmentNoneOf"]);
const stringArrayKeys = new Set([
  "components","controls","indications","normalOperation","limitations","abnormalCues","remember","prerequisites",
  "completionCriteria","notes","choices","objectives","debrief","expectedResponse","procedures","variants",
  "equipmentAllOf","equipmentAnyOf","equipmentNoneOf","checklistItemIds",
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
  if(key==="datasets")return {id:"",title:"",kind:"reference-table",axes:[],outputs:[],rows:[],interpolation:"none"};
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
  return "";
}

export function StructuredContentBuilder({domain,aircraftId,initialPayload,manualOptions=[],variantOptions=[],equipmentOptions=[]}:Props){
  const [payload,setPayload]=useState<JsonValue>(()=>asJson(initialPayload));
  const [raw,setRaw]=useState(()=>JSON.stringify(asJson(initialPayload),null,2));
  const [rawError,setRawError]=useState("");
  const validationErrors=useMemo(()=>validateContentPayload(domain,payload,aircraftId),[domain,payload,aircraftId]);

  function commit(next:JsonValue){setPayload(next);setRaw(JSON.stringify(next,null,2));setRawError("");}
  function setValue(path:readonly PathPart[],next:JsonValue){commit(updateAt(payload,path,()=>next));}
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
    if(key==="kind"&&typeof value==="string"&&["lookup-table","reference-table"].includes(value))return <label className={styles.field}><span>{humanize(key)}</span><select value={value} onChange={event=>setValue(path,event.target.value)}><option value="lookup-table">lookup table</option><option value="reference-table">reference table</option></select></label>;
    if(key==="kind"&&typeof value==="string"&&["note","caution","warning"].includes(value))return <label className={styles.field}><span>{humanize(key)}</span><select value={value} onChange={event=>setValue(path,event.target.value)}><option value="note">note</option><option value="caution">caution</option><option value="warning">warning</option></select></label>;
    if(key==="difficulty"&&typeof value==="string"&&["core","advanced"].includes(value))return <label className={styles.field}><span>{humanize(key)}</span><select value={value} onChange={event=>setValue(path,event.target.value)}><option value="core">core</option><option value="advanced">advanced</option></select></label>;
    if(typeof value==="boolean")return <label className={styles.field}><span>{humanize(key)}</span><select value={String(value)} onChange={event=>setValue(path,event.target.value==="true")}><option value="true">true</option><option value="false">false</option></select></label>;
    if(typeof value==="number")return <label className={styles.field}><span>{humanize(key)}</span><input type="number" step="any" value={Number.isFinite(value)?value:0} onChange={event=>setValue(path,event.target.value===""?0:Number(event.target.value))}/></label>;
    if(value===null)return <label className={styles.field}><span>{humanize(key)}</span><input value="" placeholder="null" onChange={event=>setValue(path,event.target.value)}/></label>;
    if(multilineKeys.has(key)||(typeof value==="string"&&value.length>100))return <label className={styles.field}><span>{humanize(key)}</span><textarea value={value} onChange={event=>setValue(path,event.target.value)}/></label>;
    return <label className={styles.field}><span>{humanize(key)}</span><input value={value} onChange={event=>setValue(path,event.target.value)}/></label>;
  }

  function renderApplicabilityChoices(items:JsonValue[],path:readonly PathPart[],key:string){
    const selected=items.filter((item):item is string=>typeof item==="string"&&Boolean(item.trim()));
    const registered=key==="variants"
      ? variantOptions
      : equipmentOptions.map(tag=>({id:tag,label:tag}));
    const known=new Set(registered.map(option=>option.id));
    const options=[...registered,...selected.filter(value=>!known.has(value)).map(value=>({id:value,label:`${value} (unregistered)`}))];
    const toggle=(id:string,checked:boolean)=>{
      const next=checked?[...selected,id]:selected.filter(value=>value!==id);
      setValue(path,[...new Set(next)]);
    };
    return <section className={styles.collection} key={path.join(".")}>
      <div className={styles.collectionHeader}><div><strong>{humanize(key)}</strong><span> · {selected.length} selected</span></div></div>
      {options.length?<div className={styles.choiceGrid}>{options.map(option=><label className={styles.choice} key={option.id}><input type="checkbox" checked={selected.includes(option.id)} onChange={event=>toggle(option.id,event.target.checked)}/><span><strong>{option.label}</strong>{!known.has(option.id)?<small>Remove or register this identifier before approval.</small>:null}</span></label>)}</div>:<p className={styles.empty}>{key==="variants"?"No aircraft variants are registered. Leave empty for common content.":"No equipment tags are registered. Add equipment in Aircraft Settings before scoping content."}</p>}
      <p className={styles.hint}>Empty means this block is not restricted by {key==="variants"?"variant":"this equipment rule"}.</p>
    </section>;
  }

  function renderArray(items:JsonValue[],path:readonly PathPart[],key:string){
    if(applicabilityArrayKeys.has(key))return renderApplicabilityChoices(items,path,key);
    const scalarOnly=items.length===0?stringArrayKeys.has(key):items.every(item=>item===null||typeof item!=="object");
    if(scalarOnly){
      return <section className={styles.collection} key={path.join(".")}><div className={styles.collectionHeader}><div><strong>{humanize(key)}</strong><span> · {items.length} item{items.length===1?"":"s"}</span></div><button type="button" onClick={()=>changeArray(path,current=>[...current,current.length?blankFromExample(current[current.length-1]!,key):emptyArrayPrototype(key,path,payload)])}>+ Add</button></div>{items.length?<div className={styles.scalarList}>{items.map((item,index)=><div className={styles.scalarRow} key={`${path.join(".")}-${index}`}><div>{renderScalar(item as JsonScalar,[...path,index],key)}</div><div className={styles.scalarActions}><button type="button" disabled={index===0} onClick={()=>changeArray(path,current=>{const next=[...current];const previous=next[index-1];const active=next[index];if(previous===undefined||active===undefined)return current;next[index-1]=active;next[index]=previous;return next;})}>↑</button><button type="button" disabled={index===items.length-1} onClick={()=>changeArray(path,current=>{const next=[...current];const active=next[index];const following=next[index+1];if(active===undefined||following===undefined)return current;next[index]=following;next[index+1]=active;return next;})}>↓</button><button type="button" onClick={()=>changeArray(path,current=>current.filter((_,itemIndex)=>itemIndex!==index))}>×</button></div></div>)}</div>:<p className={styles.empty}>No entries yet.</p>}</section>;
    }
    return <section className={styles.collection} key={path.join(".")}><div className={styles.collectionHeader}><div><strong>{humanize(key)}</strong><span> · {items.length} item{items.length===1?"":"s"}</span></div><div className={styles.itemActions}>{key==="rows"?<button type="button" onClick={()=>syncPerformanceRows(path)}>Sync row keys</button>:null}<button type="button" onClick={()=>changeArray(path,current=>[...current,current.length?blankFromExample(current[current.length-1]!,key):emptyArrayPrototype(key,path,payload)])}>+ Add blank item</button></div></div>{items.length?<div className={styles.collectionItems}>{items.map((item,index)=><details className={styles.item} key={`${path.join(".")}-${index}`} open={items.length<=3}><summary><span className={styles.itemSummary}><span className={styles.itemIndex}>{index+1}</span><span>{itemSummary(item,index)}</span></span><span>▾</span></summary><div className={styles.itemBody}><div className={styles.itemActions}><button type="button" disabled={index===0} onClick={()=>changeArray(path,current=>{const next=[...current];const previous=next[index-1];const active=next[index];if(previous===undefined||active===undefined)return current;next[index-1]=active;next[index]=previous;return next;})}>Move up</button><button type="button" disabled={index===items.length-1} onClick={()=>changeArray(path,current=>{const next=[...current];const active=next[index];const following=next[index+1];if(active===undefined||following===undefined)return current;next[index]=following;next[index+1]=active;return next;})}>Move down</button><button type="button" onClick={()=>changeArray(path,current=>{const source=current[index];if(source===undefined)return current;const next=[...current];next.splice(index+1,0,clone(source));return next;})}>Duplicate</button><button type="button" onClick={()=>changeArray(path,current=>current.filter((_,itemIndex)=>itemIndex!==index))}>Remove</button></div>{renderValue(item,[...path,index],`${key} item`)}</div></details>)}</div>:<p className={styles.empty}>No entries yet. Add the first structured item above.</p>}</section>;
  }

  function renderObject(value:JsonObject,path:readonly PathPart[],label:string){
    const entries=Object.entries(value);
    return <section className={styles.object} key={path.join(".")}><p className={styles.objectTitle}>{humanize(label)}</p>{entries.map(([childKey,child])=>renderValue(child,[...path,childKey],childKey))}</section>;
  }
  function renderValue(value:JsonValue,path:readonly PathPart[],key:string):ReactNode{
    if(Array.isArray(value))return renderArray(value,path,key);
    if(isObject(value))return renderObject(value,path,key);
    return <div key={path.join(".")}>{renderScalar(value,path,key)}</div>;
  }

  return <div className={styles.builder}>
    <div className={styles.toolbar}><div className={styles.toolbarText}><strong>Structured {humanize(domain)} payload</strong><span>Edit fields and collections directly. The saved result still passes through the normal immutable draft workflow.</span></div><span className={validationErrors.length?styles.statusBad:styles.statusGood}>{validationErrors.length?`${validationErrors.length} contract issue${validationErrors.length===1?"":"s"}`:"Contract valid"}</span></div>
    {validationErrors.length?<ul className={styles.errorList}>{validationErrors.slice(0,12).map(error=><li key={error}>{error}</li>)}{validationErrors.length>12?<li>+ {validationErrors.length-12} more issue(s)</li>:null}</ul>:null}
    <p className={styles.hint}>Collection controls change structure only in this draft. Duplicate is useful when two items share the same shape; review copied source/applicability fields before saving. Performance rows can be synchronized after changing axis/output keys.</p>
    <div className={styles.root}>{isObject(payload)?Object.entries(payload).map(([key,value])=>renderValue(value,[key],key)):renderValue(payload,[],"payload")}</div>
    <textarea hidden name="payload" readOnly value={JSON.stringify(payload)}/>
    <details className={styles.advanced}><summary>Advanced raw JSON escape hatch</summary><p className={styles.hint}>Use only for fields or structural changes the form cannot yet express. Apply JSON first; the structured form and contract validation will update before submit.</p><textarea className={styles.raw} value={raw} onChange={event=>{setRaw(event.target.value);setRawError("");}}/><div className={styles.rawActions}><button type="button" onClick={applyRaw}>Apply JSON to builder</button>{rawError?<span className={styles.rawError}>{rawError}</span>:null}</div></details>
  </div>;
}
