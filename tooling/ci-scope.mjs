import { readFileSync } from "node:fs";

const normalize=value=>String(value??"").replaceAll("\\","/").replace(/^\.\/+/, "");
const fastUiTests=new Set([
  "tests/m47-pilot-usability-audit.test.ts",
  "tests/m56-mobile-app-ui.test.ts",
  "tests/v300-u6-acceptance.test.ts",
  "tests/v300-ux-hierarchy.test.ts",
  "tests/v320-ui-consistency.test.ts",
  "tests/v321-route-ui-audit.test.ts",
  "tests/v322-browser-smoke.test.ts",
]);

const presentationOnly=file=>{
  const path=normalize(file);
  return path.endsWith(".css")||
    path.endsWith(".md")||
    path.startsWith("docs/")||
    fastUiTests.has(path);
};

export function classifyCiScope(files,title=""){
  const normalized=files.map(normalize).filter(Boolean);
  const forceFull=title.includes("[full-ci]");
  return {fullTests:forceFull||normalized.some(file=>!presentationOnly(file))};
}

function readArguments(argv){
  let filesPath="",title="";
  for(let index=0;index<argv.length;index+=1){
    if(argv[index]==="--files"){filesPath=argv[index+1]??"";index+=1;continue}
    if(argv[index]==="--title"){title=argv[index+1]??"";index+=1}
  }
  const files=filesPath?readFileSync(filesPath,"utf8").split(/\r?\n/):[];
  return{files:files.filter(Boolean),title};
}

if(process.argv[1]?.endsWith("ci-scope.mjs")){
  const{files,title}=readArguments(process.argv.slice(2));
  if(!files.length){console.error("No changed files supplied.");process.exit(2)}
  const result=classifyCiScope(files,title);
  process.stdout.write(`full_tests=${result.fullTests}\n`);
}
