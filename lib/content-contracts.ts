import type { TrainingContentDomain } from "./content-admin-types.ts";
import {
  isUniversalTrainingContentDomain,
  validateUniversalTrainingContentPayload,
} from "./universal-aircraft-content.ts";
import { validateUniversalAbnormalEmergencyPayload } from "./universal-abnormal-emergency.ts";

type RecordValue = Record<string, unknown>;
const object=(value:unknown):value is RecordValue=>Boolean(value)&&typeof value==="object"&&!Array.isArray(value);
const text=(value:unknown):value is string=>typeof value==="string"&&value.trim().length>0;
const number=(value:unknown):value is number=>typeof value==="number"&&Number.isFinite(value);
const strings=(value:unknown):value is string[]=>Array.isArray(value)&&value.every(text);
const objects=(value:unknown):value is RecordValue[]=>Array.isArray(value)&&value.every(object);

function source(value:unknown):boolean{return object(value)&&number(value.chapter)&&text(value.section)&&text(value.manualPage);}
function sources(value:unknown):boolean{return Array.isArray(value)&&value.length>0&&value.every(source);}
function idTitle(value:RecordValue):boolean{return text(value.id)&&text(value.title);}

function validateLearning(payload:RecordValue,errors:string[]){
  if(!text(payload.quickStartTitle))errors.push("quickStartTitle is required");
  if(!text(payload.quickStartDescription))errors.push("quickStartDescription is required");
  if(!objects(payload.quickStart)||payload.quickStart.length===0)errors.push("quickStart must contain topics");
  else payload.quickStart.forEach((item,index)=>{if(!idTitle(item)||!number(item.minutes)||!text(item.summary)||!strings(item.remember)||!sources(item.source))errors.push(`quickStart[${index}] does not match the learning topic contract`);});
  if(!objects(payload.systems)||payload.systems.length===0)errors.push("systems must contain lessons");
  else payload.systems.forEach((item,index)=>{if(!idTitle(item)||!number(item.minutes)||!text(item.mentalModel)||!strings(item.pilotControls)||!strings(item.pilotMonitors)||!strings(item.normalPicture)||!strings(item.remember)||!sources(item.source))errors.push(`systems[${index}] does not match the system lesson contract`);});
}

function validateNormalFlight(payload:RecordValue,errors:string[]){
  if(!text(payload.title)||!number(payload.estimatedMinutes)||!text(payload.sourceNote))errors.push("normal-flight title, estimatedMinutes and sourceNote are required");
  if(!objects(payload.phases)||payload.phases.length===0)errors.push("normal-flight phases are required");
  else payload.phases.forEach((phase,index)=>{if(!idTitle(phase)||!objects(phase.items)||phase.items.length===0){errors.push(`phases[${index}] does not match the phase contract`);return;}phase.items.forEach((item,itemIndex)=>{if(!text(item.id)||!text(item.action)||!source(item.source))errors.push(`phases[${index}].items[${itemIndex}] does not match the checklist item contract`);});});
}

function validateOrientation(payload:RecordValue,errors:string[]){
  if(!text(payload.title)||!text(payload.sourceNote))errors.push("orientation title and sourceNote are required");
  if(!objects(payload.regions)||payload.regions.length===0)errors.push("orientation regions are required");
  const regionIds=new Set<string>();
  if(objects(payload.regions))payload.regions.forEach((region,index)=>{if(!text(region.id)||!text(region.label)||!text(region.description))errors.push(`regions[${index}] does not match the region contract`);else regionIds.add(region.id);});
  if(!objects(payload.controls))errors.push("orientation controls must be an array");
  else payload.controls.forEach((control,index)=>{if(!text(control.id)||!text(control.label)||!text(control.regionId)||!text(control.description)||!strings(control.checklistItemIds)||!source(control.source))errors.push(`controls[${index}] does not match the control contract`);else if(!regionIds.has(control.regionId))errors.push(`controls[${index}] references an unknown regionId`);});
}

const scenarioStageIds=["recognition","control","immediate","continue"];
function validateLegacyAbnormal(payload:RecordValue,errors:string[]){
  if(!text(payload.sourceNote)||!text(payload.disclaimer))errors.push("abnormal sourceNote and disclaimer are required");
  if(!objects(payload.scenarios)||payload.scenarios.length===0)errors.push("abnormal scenarios are required");
  else payload.scenarios.forEach((scenario,index)=>{
    if(!idTitle(scenario)||!text(scenario.category)||!text(scenario.phase)||!(scenario.difficulty==="core"||scenario.difficulty==="advanced")||!number(scenario.minutes)||!text(scenario.summary)||!text(scenario.setup)||!strings(scenario.objectives)||!strings(scenario.debrief)||!objects(scenario.stages)){errors.push(`scenarios[${index}] does not match the scenario contract`);return;}
    const ids=scenario.stages.map(stage=>stage.id);
    if(ids.length!==4||ids.some((id,i)=>id!==scenarioStageIds[i]))errors.push(`scenarios[${index}] must use Recognize → Fly → Immediate → Continue stages`);
    scenario.stages.forEach((stage,stageIndex)=>{const expectedResponse=stage.expectedResponse;if(!text(stage.prompt)||!strings(expectedResponse)||expectedResponse.length===0||!text(stage.why)||!sources(stage.source))errors.push(`scenarios[${index}].stages[${stageIndex}] does not match the stage contract`);});
  });
}

function validateReferenceKnowledge(payload:RecordValue,errors:string[]){
  if(!text(payload.referenceNote))errors.push("referenceNote is required");
  if(!objects(payload.groups)||payload.groups.length===0)errors.push("Quick Reference groups are required");
  else payload.groups.forEach((group,index)=>{if(!idTitle(group)||!number(group.flyPriority)||!objects(group.items)||group.items.length===0){errors.push(`groups[${index}] does not match the reference group contract`);return;}group.items.forEach((item,itemIndex)=>{if(!text(item.id)||!text(item.label)||!text(item.value)||!sources(item.source))errors.push(`groups[${index}].items[${itemIndex}] does not match the reference item contract`);});});
  if(!objects(payload.questions)||payload.questions.length===0)errors.push("knowledge questions are required");
  else payload.questions.forEach((question,index)=>{const choices=question.choices;if(!text(question.id)||!text(question.area)||!text(question.prompt)||!strings(choices)||choices.length<2||!Number.isInteger(question.correctIndex)||Number(question.correctIndex)<0||Number(question.correctIndex)>=choices.length||!text(question.explanation)||!sources(question.source))errors.push(`questions[${index}] does not match the knowledge question contract`);});
}

const applicabilityArrayKeys=["variants","equipmentAllOf","equipmentAnyOf","equipmentNoneOf"] as const;
function validateApplicability(value:unknown,path:string,errors:string[]):void{
  if(!object(value)){errors.push(`${path} must be an applicability object`);return;}
  for(const key of applicabilityArrayKeys){
    const candidate=value[key];
    if(candidate!==undefined&&(!strings(candidate)||candidate.length===0))errors.push(`${path}.${key} must be a non-empty array of text when supplied`);
  }
  if(value.note!==undefined&&!text(value.note))errors.push(`${path}.note must be non-empty text when supplied`);
}

function validateEmbeddedApplicability(value:unknown,path:string,errors:string[]):void{
  if(Array.isArray(value)){
    value.forEach((item,index)=>validateEmbeddedApplicability(item,`${path}[${index}]`,errors));
    return;
  }
  if(!object(value))return;
  if(value.applicability!==undefined)validateApplicability(value.applicability,`${path}.applicability`,errors);
  for(const [key,child] of Object.entries(value)){
    if(key!=="applicability")validateEmbeddedApplicability(child,`${path}.${key}`,errors);
  }
}

function looksLikeUniversalAbnormal(payload: RecordValue): boolean {
  if ("title" in payload) return true;
  if (!objects(payload.scenarios)) return false;
  return payload.scenarios.some((scenario) =>
    objects(scenario.stages) && scenario.stages.some((stage) => "label" in stage || "explanation" in stage || "sources" in stage)
  );
}

export function validateContentPayload(domain:TrainingContentDomain,payload:unknown,expectedAircraftId?:string):string[]{
  const errors:string[]=[];
  if(!object(payload))return ["Published content payload must be a JSON object"];
  if(!text(payload.aircraftId))errors.push("aircraftId is required");
  else if(expectedAircraftId&&payload.aircraftId!==expectedAircraftId)errors.push(`aircraftId must equal ${expectedAircraftId}`);

  if(domain==="abnormal"){
    if(looksLikeUniversalAbnormal(payload)){
      errors.push(...validateUniversalAbnormalEmergencyPayload(payload));
      validateEmbeddedApplicability(payload,"payload",errors);
    } else validateLegacyAbnormal(payload,errors);
  }
  else if(isUniversalTrainingContentDomain(domain)){
    errors.push(...validateUniversalTrainingContentPayload(domain,payload));
    validateEmbeddedApplicability(payload,"payload",errors);
  }
  else if(domain==="learning")validateLearning(payload,errors);
  else if(domain==="normal-flight")validateNormalFlight(payload,errors);
  else if(domain==="orientation")validateOrientation(payload,errors);
  else if(domain==="reference-knowledge")validateReferenceKnowledge(payload,errors);
  return errors;
}

export function assertValidContentPayload(domain:TrainingContentDomain,payload:unknown,expectedAircraftId?:string):void{
  const errors=validateContentPayload(domain,payload,expectedAircraftId);
  if(errors.length)throw new Error(`Content contract validation failed: ${errors.join("; ")}`);
}
