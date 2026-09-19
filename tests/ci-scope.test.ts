import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root=path.resolve(import.meta.dirname,"..");
const script=path.join(root,"tooling/ci-scope.mjs");

function classify(files:string[],title=""){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"flytally-training-ci-"));
  const file=path.join(dir,"changed.txt");
  fs.writeFileSync(file,`${files.join("\n")}\n`);
  const result=spawnSync(process.execPath,[script,"--files",file,"--title",title],{encoding:"utf8"});
  fs.rmSync(dir,{recursive:true,force:true});
  assert.equal(result.status,0,result.stderr||result.stdout);
  return Object.fromEntries(result.stdout.trim().split(/\r?\n/).map(line=>line.split("=")));
}

test("presentation-only Training changes use the targeted suite",()=>{
  assert.equal(classify(["app/ui-system.css","tests/v320-ui-consistency.test.ts"]).full_tests,"false");
});

test("Training application code remains conservative",()=>{
  assert.equal(classify(["components/checklist-runner.tsx"]).full_tests,"true");
});

test("full-ci overrides the presentation fast path",()=>{
  assert.equal(classify(["app/ui-system.css"],"[full-ci] release verification").full_tests,"true");
});
