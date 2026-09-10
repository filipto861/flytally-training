import assert from "node:assert/strict";
import test from "node:test";

const acceptanceUrl = process.env.TRAINING_ACCEPTANCE_DATABASE_URL?.trim();

test("a second aircraft can be created, published and rendered through the generic PostgreSQL path without aircraft-specific application code", { skip: !acceptanceUrl }, async () => {
  process.env.TRAINING_DATABASE_URL = acceptanceUrl;
  const [{createAircraft,addAircraftVariant,registerManualRevision,createSourceReference,publishAircraft},{createGovernedDraftVersion,approveGovernedContentVersion,publishGovernedContentVersion},{PostgresTrainingContentRepository},{getAircraftContentBundle},{validateContentPayload},{sql}] = await Promise.all([
    import("../lib/content-admin-repository.ts"),
    import("../lib/content-governed-lifecycle.ts"),
    import("../lib/postgres-content-repository.ts"),
    import("../lib/content-repository.ts"),
    import("../lib/content-contracts.ts"),
    import("../lib/db.ts"),
  ]);

  const aircraftId = `acceptance-${Date.now()}-${Math.random().toString(16).slice(2,8)}`;
  const subject = "acceptance-harness";
  const source = { chapter:1, section:"Acceptance source", manualPage:"1" };
  const sourceArray = [source];
  const domains = {
    learning: { aircraftId, quickStartTitle:"Acceptance Quick Start", quickStartDescription:"Synthetic contract fixture.", quickStart:[{id:"intro",title:"Introduction",minutes:1,summary:"Synthetic acceptance content.",remember:["Runtime data, not aircraft-specific UI code."],source:sourceArray}], systems:[{id:"system",title:"System",minutes:1,mentalModel:"Synthetic mental model.",pilotControls:["Control"],pilotMonitors:["Monitor"],normalPicture:["Normal"],remember:["Remember"],source:sourceArray}] },
    "normal-flight": { aircraftId, title:"Acceptance flight", estimatedMinutes:1, sourceNote:"Synthetic acceptance content.", phases:[{id:"phase",title:"Phase",items:[{id:"item",action:"ACTION — CHECK",source}]}] },
    orientation: { aircraftId, title:"Acceptance orientation", sourceNote:"Synthetic acceptance content.", regions:[{id:"panel",label:"Panel",description:"Synthetic region."}], controls:[{id:"control",label:"Control",regionId:"panel",description:"Synthetic control.",checklistItemIds:["item"],source}] },
    abnormal: { aircraftId, sourceNote:"Synthetic acceptance content.", disclaimer:"Acceptance fixture only.", scenarios:[{id:"scenario",title:"Scenario",category:"Electrical",phase:"Any",difficulty:"core",minutes:1,summary:"Synthetic.",setup:"Synthetic setup.",objectives:["Recognize"],debrief:["Review"],stages:[
      {id:"recognition",prompt:"Recognize?",expectedResponse:["Recognize"],why:"Synthetic",source:sourceArray},
      {id:"control",prompt:"Fly?",expectedResponse:["Control"],why:"Synthetic",source:sourceArray},
      {id:"immediate",prompt:"Immediate?",expectedResponse:["Act"],why:"Synthetic",source:sourceArray},
      {id:"continue",prompt:"Continue?",expectedResponse:["Checklist"],why:"Synthetic",source:sourceArray},
    ]}] },
    "reference-knowledge": { aircraftId, referenceNote:"Synthetic acceptance reference.", groups:[{id:"group",title:"Reference",flyPriority:1,items:[{id:"value",label:"Value",value:"SET",source:sourceArray}]}], questions:[{id:"question",area:"General",prompt:"Which answer is correct?",choices:["A","B"],correctIndex:0,explanation:"A is the synthetic correct answer.",source:sourceArray}] },
  } as const;

  try {
    await createAircraft({id:aircraftId,manufacturer:"Acceptance",model:"Second Aircraft",displayName:"Acceptance Second Aircraft"},subject);
    await addAircraftVariant(aircraftId,"A");
    await registerManualRevision({aircraftId,manualId:`${aircraftId}-manual`,revisionId:`${aircraftId}-r1`,title:"Acceptance Manual",publisher:"FlyTally Acceptance",sourceKind:"TRAINING_MANUAL",revision:"1",issueDate:"2026-09",authorityNote:"Synthetic disposable acceptance source.",sourceUri:"acceptance://manual.pdf",checksumSha256:"a".repeat(64)},subject);
    const referenceId = await createSourceReference({revisionId:`${aircraftId}-r1`,chapter:"1",section:"Acceptance",pageLabel:"1"},subject);

    for (const [domain,payload] of Object.entries(domains)) {
      assert.deepEqual(validateContentPayload(domain as keyof typeof domains,payload,aircraftId),[]);
      const versionId = await createGovernedDraftVersion({aircraftId,domain,contentKey:"bundle",payload,origin:"human",sourceReferenceIds:[referenceId]},subject);
      await approveGovernedContentVersion(versionId,subject,"Disposable no-code acceptance fixture.");
      await publishGovernedContentVersion(versionId,subject);
    }
    await publishAircraft(aircraftId);

    const repository = new PostgresTrainingContentRepository();
    const bundle = await getAircraftContentBundle(repository,aircraftId);
    assert.ok(bundle);
    assert.equal(bundle.aircraft.id,aircraftId);
    assert.deepEqual(bundle.capabilities,{quickStart:true,systems:true,normalFlight:true,cockpitOrientation:true,abnormalEmergency:true,quickReference:true,knowledge:true,manual:true});
    assert.ok((await repository.listAircraft()).some(aircraft=>aircraft.id===aircraftId));
  } finally {
    await sql`DELETE FROM training_aircraft_types WHERE aircraft_id=${aircraftId}`;
  }
});
