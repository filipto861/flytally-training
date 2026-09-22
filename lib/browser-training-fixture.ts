import type { CockpitOrientation } from "./cockpit-orientation";
import type { StaticTrainingContentSeed } from "./static-content-repository";
import type { AircraftChecklistContent,AircraftLimitationsContent,AircraftPerformanceContent,AircraftProcedureContent,AircraftSystemsContent,TrainingSourceReference } from "./universal-aircraft-content";
import type { AircraftAbnormalEmergencyContent } from "./universal-abnormal-emergency";

export const browserTrainingAircraftId="browser-ci-aircraft";

export function browserTrainingFixtureEnabled(){
  return process.env.FLYTALLY_TRAINING_BROWSER_FIXTURE==="1"
    && process.env.CI==="true"
    && process.env.VERCEL!=="1";
}

const checklist:AircraftChecklistContent={
  aircraftId:browserTrainingAircraftId,
  title:"Browser CI Checklist",
  phases:[
    {
      id:"before-start",
      title:"Before Start",
      sequence:1,
      items:[
        {id:"battery",challenge:"Battery",response:"ON"},
        {id:"brakes",challenge:"Parking brake",response:"SET"},
      ],
    },
  ],
};

const performance:AircraftPerformanceContent={
  aircraftId:browserTrainingAircraftId,
  title:"Browser CI Performance",
  datasets:[
    {
      id:"browser-takeoff-grid",
      title:"Takeoff distance",
      kind:"lookup-table",
      phase:"takeoff",
      axes:[
        {key:"altitude_ft",label:"Airport altitude",unit:"ft",values:[0]},
        {key:"isa_dev_c",label:"ISA deviation",unit:"°C",values:[0]},
        {key:"surface",label:"Surface",values:["Dry"]},
      ],
      outputs:[
        {key:"source_temp_c",label:"Source temperature",unit:"°C"},
        {key:"ground_run_m",label:"Ground run",unit:"m"},
        {key:"distance_50ft_m",label:"50 ft distance",unit:"m"},
      ],
      rows:[
        {
          inputs:{altitude_ft:0,isa_dev_c:0,surface:"Dry"},
          outputs:{source_temp_c:15,ground_run_m:300,distance_50ft_m:500},
        },
      ],
      interpolation:"none",
      calculator:{
        kind:"runway-distance-grid",
        operation:"takeoff",
        bindings:{
          altitudeAxis:"altitude_ft",
          isaDeviationAxis:"isa_dev_c",
          surfaceAxis:"surface",
          sourceTemperatureOutput:"source_temp_c",
          groundRunOutput:"ground_run_m",
          obstacleDistanceOutput:"distance_50ft_m",
        },
        oatInput:{key:"oat_c",label:"OAT",unit:"°C"},
        runwayAvailableInput:{key:"runway_available_m",label:"Runway available",unit:"m"},
      },
    },
    {
      id:"browser-p2-takeoff-summary",
      title:"Takeoff summary",
      description:"Deterministic browser-only source grid for P2 presentation acceptance.",
      kind:"lookup-table",
      phase:"takeoff",
      axes:[
        {key:"takeoffWeight",label:"Takeoff weight",unit:"lb",values:[12000,13000]},
      ],
      outputs:[
        {key:"n1Percent",label:"N1",unit:"%"},
        {key:"v1",label:"V1",unit:"KIAS"},
        {key:"vr",label:"VR",unit:"KIAS"},
        {key:"v2",label:"V2",unit:"KIAS"},
        {key:"takeoffDistance",label:"Takeoff Distance",unit:"ft"},
      ],
      rows:[
        {
          inputs:{takeoffWeight:12000},
          outputs:{n1Percent:94,v1:110,vr:115,v2:125,takeoffDistance:3100},
        },
        {
          inputs:{takeoffWeight:13000},
          outputs:{n1Percent:95,v1:115,vr:120,v2:130,takeoffDistance:3500},
        },
      ],
      interpolation:"none",
      calculator:{
        kind:"multi-axis-metric-grid",
        operation:"takeoff",
        inputAxes:["takeoffWeight"],
        outputKeys:["n1Percent","v1","vr","v2","takeoffDistance"],
      },
    },
  ],
};



const limitationsSource={
  manualId:"browser-ci-limitations-source",
  section:"P7 deterministic fixture",
  pageLabel:"P7-1",
} satisfies TrainingSourceReference;

const limitations:AircraftLimitationsContent={
  aircraftId:browserTrainingAircraftId,
  title:"Browser CI Limitations",
  sourceNote:"Test-only deterministic limitations fixture.",
  disclaimer:"Training fixture only.",
  groups:[
    {
      id:"generic-speeds",
      title:"Generic Speeds",
      sources:[limitationsSource],
      items:[
        {
          id:"generic-max-speed",
          label:"Maximum generic speed",
          value:200,
          unit:"KIAS",
          condition:"Generic configuration",
          notices:[{kind:"caution",text:"Generic caution."}],
          sources:[limitationsSource],
        },
        {
          id:"generic-min-speed",
          label:"Minimum generic speed",
          value:80,
          unit:"KIAS",
          sources:[limitationsSource],
        },
      ],
    },
  ],
};

const systemsSource={
  manualId:"browser-ci-systems-source",
  section:"P3 deterministic fixture",
  pageLabel:"P3-1",
} satisfies TrainingSourceReference;

const proceduresSource={
  manualId:"browser-ci-procedure-source",
  section:"P4 deterministic fixture",
  pageLabel:"P4-1",
} satisfies TrainingSourceReference;

const procedures:AircraftProcedureContent={
  aircraftId:browserTrainingAircraftId,
  title:"Browser CI Procedures",
  sourcePolicy:"available-sources",
  procedures:[
    {
      id:"generic-linear-procedure",
      title:"Generic Linear Procedure",
      phase:"Preparation",
      summary:"Test-only linear procedure for P4 acceptance.",
      prerequisites:["Prerequisite A"],
      completionCriteria:["Completion criterion A"],
      steps:[
        {
          id:"step-a",
          action:"Action A",
          expectedResult:"Expected A",
          verification:"Verify A",
          rationale:"Reason A",
          sources:[proceduresSource],
        },
        {
          id:"step-b",
          action:"Action B",
          sources:[proceduresSource],
        },
      ],
      sources:[proceduresSource],
    },
    {
      id:"generic-branch-procedure",
      title:"Generic Branch Procedure",
      phase:"In flight",
      summary:"Test-only graph procedure for P4 acceptance.",
      graph:{
        version:1,
        entryNodeId:"decision-a",
        nodes:[
          {
            id:"decision-a",
            kind:"decision",
            prompt:"Select condition",
            options:[
              {id:"option-a",label:"Condition A",targetNodeId:"action-a"},
              {id:"option-b",label:"Condition B",targetNodeId:"note-b"},
            ],
            sources:[proceduresSource],
          },
          {
            id:"action-a",
            kind:"action",
            action:"Graph Action A",
            expectedResult:"Graph Expected A",
            rationale:"Graph Reason A",
            conditionText:"When Condition A applies.",
            memoryItem:true,
            nextNodeId:"end-a",
            sources:[proceduresSource],
          },
          {
            id:"end-a",
            kind:"end",
            label:"End A",
            sources:[proceduresSource],
          },
          {
            id:"note-b",
            kind:"note",
            text:"Graph Note B",
            nextNodeId:"end-b",
            sources:[proceduresSource],
          },
          {
            id:"end-b",
            kind:"end",
            label:"End B",
            sources:[proceduresSource],
          },
        ],
      },
      sources:[proceduresSource],
    },
  ],
};

const systems:AircraftSystemsContent={
  aircraftId:browserTrainingAircraftId,
  title:"Browser CI Systems",
  systems:[
    {
      id:"generic-source-system",
      title:"Generic Source System",
      summary:"Test-only system with a deterministic logical schematic.",
      schematic:{
        version:1,
        title:"Generic Source Schematic",
        description:"Test-only schematic. Not to scale.",
        sources:[systemsSource],
        nodes:[
          {id:"source-a",label:"Source A",role:"source",x:10,y:50},
          {id:"pump-a",label:"Pump A",role:"component",x:40,y:30},
          {id:"valve-a",label:"Valve A",role:"control",x:60,y:50},
          {id:"consumer-a",label:"Consumer A",role:"consumer",x:90,y:50},
        ],
        edges:[
          {id:"e-source-pump",from:"source-a",to:"pump-a",direction:"forward",label:"supply"},
          {id:"e-pump-valve",from:"pump-a",to:"valve-a",direction:"forward"},
          {id:"e-valve-cons",from:"valve-a",to:"consumer-a",direction:"forward",label:"delivery"},
        ],
      },
    },
    {
      id:"generic-text-system",
      title:"Generic Text System",
      summary:"Test-only text-only system for the sparse P3 case.",
      components:["Text component A","Text component B"],
      controls:["Text control A"],
      indications:["Text indication A"],
    },
  ],
};



const abnormalSource={
  manualId:"browser-ci-abnormal-source",
  section:"P5 deterministic fixture",
  pageLabel:"P5-1",
} satisfies TrainingSourceReference;

const abnormal:AircraftAbnormalEmergencyContent={
  aircraftId:browserTrainingAircraftId,
  title:"Browser CI Abnormal & Emergency",
  scenarios:[
    {
      id:"generic-condition-a",
      title:"Generic Condition A",
      category:"Generic",
      phase:"In flight",
      difficulty:"core",
      minutes:2,
      summary:"Test-only training summary for P5 acceptance.",
      setup:"Test-only training setup for P5 acceptance.",
      objectives:["Recognize the generic condition."],
      debrief:["Review the generic response."],
      boundaryNote:"Test-only source authority boundary.",
      stages:[
        {
          id:"memory-a",
          label:"Immediate action",
          prompt:"Training prompt A",
          expectedResponse:["Action A","Action B"],
          explanation:"Training explanation A",
          sources:[abnormalSource],
        },
      ],
    },
    {
      id:"generic-condition-b",
      title:"Generic Condition B",
      category:"Alternate",
      phase:"Ground",
      difficulty:"core",
      minutes:1,
      summary:"Second test-only training summary.",
      setup:"Second test-only training setup.",
      objectives:["Recognize the alternate condition."],
      debrief:["Review the alternate response."],
      stages:[
        {
          id:"action-b",
          label:"Action",
          prompt:"Training prompt B",
          expectedResponse:["Action C"],
          explanation:"Training explanation B",
          sources:[abnormalSource],
        },
      ],
    },
  ],
};

const cockpitOrientation:CockpitOrientation={
  aircraftId:browserTrainingAircraftId,
  title:"Browser CI Cockpit Orientation",
  sourceNote:"Test-only deterministic cockpit orientation fixture.",
  regions:[
    {
      id:"region-a",
      label:"Region A",
      description:"Test-only deterministic cockpit region.",
    },
  ],
  controls:[
    {
      id:"control-a",
      label:"Control A",
      regionId:"region-a",
      description:"Test-only deterministic cockpit control.",
      checklistItemIds:[],
      source:{
        chapter:1,
        section:"P3 deterministic fixture",
        manualPage:"P3-O1",
      },
    },
  ],
};

export const browserTrainingContentSeed:StaticTrainingContentSeed={
  aircraft:[
    {
      id:browserTrainingAircraftId,
      manufacturer:"FlyTally",
      model:"CI-1",
      variants:["Standard"],
      displayName:"Browser CI Aircraft",
      manuals:[],
    },
  ],
  nativeModules:[
    {aircraftId:browserTrainingAircraftId,domain:"checklists",payload:checklist},
    {aircraftId:browserTrainingAircraftId,domain:"performance",payload:performance},
    {aircraftId:browserTrainingAircraftId,domain:"limitations",payload:limitations},
    {aircraftId:browserTrainingAircraftId,domain:"procedures",payload:procedures},
    {aircraftId:browserTrainingAircraftId,domain:"systems",payload:systems},
    {aircraftId:browserTrainingAircraftId,domain:"abnormal",payload:abnormal},
  ],
  learningContent:[],
  normalFlights:[],
  cockpitOrientations:[cockpitOrientation],
  abnormalTrainings:[],
  referenceKnowledge:[],
};
