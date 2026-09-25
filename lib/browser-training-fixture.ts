import type { CockpitOrientation } from "./cockpit-orientation";
import type { StaticTrainingContentSeed } from "./static-content-repository";
import type { AircraftChecklistContent,AircraftLimitationsContent,AircraftPerformanceContent,AircraftProcedureContent,AircraftSystemsContent,TrainingSourceReference } from "./universal-aircraft-content";
import type { AircraftAbnormalEmergencyContent } from "./universal-abnormal-emergency";
import type { BundledPerformancePackage } from "./performance-package";
import type { PilotLandingCalculatorDefinition } from "./pilot-landing-calculator";
import type { PilotTakeoffCalculatorDefinition } from "./pilot-takeoff-calculator";

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
      id:"browser-b5-vref",
      title:"Landing VREF",
      kind:"lookup-table",
      phase:"landing",
      axes:[{key:"grossWeight",label:"Gross weight",unit:"lb",values:[12000,13000]}],
      outputs:[{key:"vref",label:"VREF",unit:"KIAS"}],
      rows:[
        {inputs:{grossWeight:12000},outputs:{vref:118}},
        {inputs:{grossWeight:13000},outputs:{vref:122}},
      ],
      interpolation:"linear-explicit",
      calculator:{
        kind:"multi-axis-metric-grid",
        operation:"landing",
        inputAxes:["grossWeight"],
        outputKeys:["vref"],
      },
    },
    {
      id:"browser-b5-landing-climb",
      title:"Landing climb speed",
      kind:"lookup-table",
      phase:"landing",
      axes:[{key:"grossWeight",label:"Gross weight",unit:"lb",values:[12000,13000]}],
      outputs:[{key:"landingClimb",label:"Landing Climb",unit:"KIAS"}],
      rows:[
        {inputs:{grossWeight:12000},outputs:{landingClimb:118}},
        {inputs:{grossWeight:13000},outputs:{landingClimb:122}},
      ],
      interpolation:"linear-explicit",
      calculator:{
        kind:"multi-axis-metric-grid",
        operation:"landing",
        inputAxes:["grossWeight"],
        outputKeys:["landingClimb"],
      },
    },
    {
      id:"browser-b5-approach-climb",
      title:"Approach climb speed",
      kind:"lookup-table",
      phase:"landing",
      axes:[{key:"grossWeight",label:"Gross weight",unit:"lb",values:[12000,13000]}],
      outputs:[{key:"approachClimb",label:"Approach Climb",unit:"KIAS"}],
      rows:[
        {inputs:{grossWeight:12000},outputs:{approachClimb:124}},
        {inputs:{grossWeight:13000},outputs:{approachClimb:128}},
      ],
      interpolation:"linear-explicit",
      calculator:{
        kind:"multi-axis-metric-grid",
        operation:"landing",
        inputAxes:["grossWeight"],
        outputKeys:["approachClimb"],
      },
    },
    {
      id:"browser-b5-landing-distance",
      title:"Landing distance",
      kind:"lookup-table",
      phase:"landing",
      axes:[{key:"grossWeight",label:"Gross weight",unit:"lb",values:[12000,13000]}],
      outputs:[{key:"landingDistance",label:"Landing Distance",unit:"FT"}],
      rows:[
        {inputs:{grossWeight:12000},outputs:{landingDistance:2800}},
        {inputs:{grossWeight:13000},outputs:{landingDistance:3000}},
      ],
      interpolation:"linear-explicit",
      calculator:{
        kind:"multi-axis-metric-grid",
        operation:"landing",
        inputAxes:["grossWeight"],
        outputKeys:["landingDistance"],
      },
    },
    {
      id:"browser-b6-v1-wind",
      title:"B6 deterministic V1 wind correction",
      description:"Browser-only post-baseline transform for B6 acceptance.",
      kind:"lookup-table",
      phase:"takeoff",
      axes:[
        {key:"zeroWindV1Kias",label:"Zero-wind V1",unit:"KIAS",values:[110,115]},
        {key:"runwayWindComponentKt",label:"Runway wind component",unit:"kt",values:[-10,0,10,20,30]},
      ],
      outputs:[
        {key:"correctedV1Kias",label:"Wind-corrected V1",unit:"KIAS"},
      ],
      rows:[
        {inputs:{zeroWindV1Kias:110,runwayWindComponentKt:-10},outputs:{correctedV1Kias:108}},
        {inputs:{zeroWindV1Kias:110,runwayWindComponentKt:0},outputs:{correctedV1Kias:110}},
        {inputs:{zeroWindV1Kias:110,runwayWindComponentKt:10},outputs:{correctedV1Kias:111}},
        {inputs:{zeroWindV1Kias:110,runwayWindComponentKt:20},outputs:{correctedV1Kias:113}},
        {inputs:{zeroWindV1Kias:110,runwayWindComponentKt:30},outputs:{correctedV1Kias:114}},
        {inputs:{zeroWindV1Kias:115,runwayWindComponentKt:-10},outputs:{correctedV1Kias:113}},
        {inputs:{zeroWindV1Kias:115,runwayWindComponentKt:0},outputs:{correctedV1Kias:115}},
        {inputs:{zeroWindV1Kias:115,runwayWindComponentKt:10},outputs:{correctedV1Kias:116}},
        {inputs:{zeroWindV1Kias:115,runwayWindComponentKt:20},outputs:{correctedV1Kias:118}},
        {inputs:{zeroWindV1Kias:115,runwayWindComponentKt:30},outputs:{correctedV1Kias:119}},
      ],
      interpolation:"linear-explicit",
      calculator:{
        kind:"post-baseline-transform",
        operation:"takeoff",
        baselineAxisKey:"zeroWindV1Kias",
        modifierAxisKey:"runwayWindComponentKt",
        outputKey:"correctedV1Kias",
      },
    },
    {
      id:"browser-b6-takeoff-distance-wind",
      title:"B6 deterministic takeoff-distance wind correction",
      description:"Browser-only post-baseline transform for B6 acceptance.",
      kind:"lookup-table",
      phase:"takeoff",
      axes:[
        {key:"zeroWindDistanceFt",label:"Zero-wind takeoff distance",unit:"ft",values:[3100,3500]},
        {key:"runwayWindComponentKt",label:"Runway wind component",unit:"kt",values:[-10,0,10,20,30]},
      ],
      outputs:[
        {key:"correctedDistanceFt",label:"Wind-corrected takeoff distance",unit:"ft"},
      ],
      rows:[
        {inputs:{zeroWindDistanceFt:3100,runwayWindComponentKt:-10},outputs:{correctedDistanceFt:3500}},
        {inputs:{zeroWindDistanceFt:3100,runwayWindComponentKt:0},outputs:{correctedDistanceFt:3100}},
        {inputs:{zeroWindDistanceFt:3100,runwayWindComponentKt:10},outputs:{correctedDistanceFt:2900}},
        {inputs:{zeroWindDistanceFt:3100,runwayWindComponentKt:20},outputs:{correctedDistanceFt:2700}},
        {inputs:{zeroWindDistanceFt:3100,runwayWindComponentKt:30},outputs:{correctedDistanceFt:2500}},
        {inputs:{zeroWindDistanceFt:3500,runwayWindComponentKt:-10},outputs:{correctedDistanceFt:4000}},
        {inputs:{zeroWindDistanceFt:3500,runwayWindComponentKt:0},outputs:{correctedDistanceFt:3500}},
        {inputs:{zeroWindDistanceFt:3500,runwayWindComponentKt:10},outputs:{correctedDistanceFt:3300}},
        {inputs:{zeroWindDistanceFt:3500,runwayWindComponentKt:20},outputs:{correctedDistanceFt:3100}},
        {inputs:{zeroWindDistanceFt:3500,runwayWindComponentKt:30},outputs:{correctedDistanceFt:2900}},
      ],
      interpolation:"linear-explicit",
      calculator:{
        kind:"post-baseline-transform",
        operation:"takeoff",
        baselineAxisKey:"zeroWindDistanceFt",
        modifierAxisKey:"runwayWindComponentKt",
        outputKey:"correctedDistanceFt",
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

const browserTakeoffCalculator:PilotTakeoffCalculatorDefinition={
  id:"browser-takeoff-summary",
  title:"Browser CI Takeoff Calculator",
  inputs:{
    pressureAltitude:{label:"Pressure Altitude",unit:"ft"},
    oat:{label:"OAT",unit:"°C"},
    takeoffWeight:{label:"Takeoff Weight",unit:"lb"},
    flaps:{label:"Flaps"},
    antiIce:{label:"Anti-ice"},
  },
  n1:{
    antiIceOff:{
      datasetId:"browser-p2-takeoff-summary",
      outputKey:"n1Percent",
      inputs:[{input:"takeoffWeight",axisKey:"takeoffWeight"}],
    },
  },
  flapOptions:[
    {
      value:"8",
      label:"8°",
      v1:{
        antiIceOff:{
          datasetId:"browser-p2-takeoff-summary",
          outputKey:"v1",
          inputs:[{input:"takeoffWeight",axisKey:"takeoffWeight"}],
        },
      },
      takeoffDistance:{
        antiIceOff:{
          datasetId:"browser-p2-takeoff-summary",
          outputKey:"takeoffDistance",
          inputs:[{input:"takeoffWeight",axisKey:"takeoffWeight"}],
        },
      },
      vr:{
        datasetId:"browser-p2-takeoff-summary",
        outputKey:"vr",
        inputs:[{input:"takeoffWeight",axisKey:"takeoffWeight"}],
      },
      v2:{
        datasetId:"browser-p2-takeoff-summary",
        outputKey:"v2",
        inputs:[{input:"takeoffWeight",axisKey:"takeoffWeight"}],
      },
    },
    {
      value:"8-wind",
      label:"8° · B6 wind fixture",
      v1:{
        antiIceOff:{
          datasetId:"browser-p2-takeoff-summary",
          outputKey:"v1",
          inputs:[{input:"takeoffWeight",axisKey:"takeoffWeight"}],
        },
      },
      takeoffDistance:{
        antiIceOff:{
          datasetId:"browser-p2-takeoff-summary",
          outputKey:"takeoffDistance",
          inputs:[{input:"takeoffWeight",axisKey:"takeoffWeight"}],
        },
      },
      windCorrection:{
        v1:{datasetId:"browser-b6-v1-wind"},
        takeoffDistance:{datasetId:"browser-b6-takeoff-distance-wind"},
      },
      vr:{
        datasetId:"browser-p2-takeoff-summary",
        outputKey:"vr",
        inputs:[{input:"takeoffWeight",axisKey:"takeoffWeight"}],
      },
      v2:{
        datasetId:"browser-p2-takeoff-summary",
        outputKey:"v2",
        inputs:[{input:"takeoffWeight",axisKey:"takeoffWeight"}],
      },
    },
  ],
  placeholders:[],
  disclaimer:"Deterministic browser test fixture only.",
};

const browserLandingCalculator:PilotLandingCalculatorDefinition={
  flapOptions:[{value:"40",label:"40°"}],
  vrefDatasetId:"browser-b5-vref",
  landingClimbDatasetId:"browser-b5-landing-climb",
  approachClimbDatasetId:"browser-b5-approach-climb",
  landingDistanceDatasetId:"browser-b5-landing-distance",
};

export const browserTrainingPerformancePackage:BundledPerformancePackage={
  aircraftId:browserTrainingAircraftId,
  content:performance,
  takeoffCalculator:browserTakeoffCalculator,
  landingCalculator:browserLandingCalculator,
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
  schemaVersion:2,
  aircraftId:browserTrainingAircraftId,
  title:"Browser CI Abnormal & Emergency",
  sectionIntroductions:[
    {
      procedureClass:"emergency",
      paragraphs:["Emergency source guidance."],
      sources:[abnormalSource],
    },
    {
      procedureClass:"abnormal",
      paragraphs:["Abnormal source guidance."],
      sources:[abnormalSource],
    },
  ],
  scenarios:[
    {
      id:"generic-condition-a",
      title:"Generic Condition A",
      procedureClass:"emergency",
      category:"Generic",
      phase:"In flight",
      boundaryNote:"Test-only source authority boundary.",
      effectivity:{kind:"all-aircraft",sourceText:"ALL"},
      stages:[
        {
          id:"memory-a",
          label:"Immediate action",
          memoryItem:true,
          steps:[
            {id:"action-a",kind:"action",label:"1",text:"Action A",memoryItem:true},
            {id:"action-b",kind:"action",label:"2",text:"Action B"},
          ],
          sources:[abnormalSource],
        },
      ],
      training:{
        difficulty:"core",
        minutes:2,
        summary:"Test-only training summary for P5/P6 acceptance.",
        setup:"Test-only training setup for P5/P6 acceptance.",
        objectives:["Recognize the generic condition."],
        debrief:["Review the generic response."],
        stages:[
          {
            stageId:"memory-a",
            prompt:"Training prompt A",
            explanation:"Training explanation A",
          },
        ],
      },
    },
    {
      id:"generic-condition-b",
      title:"Generic Condition B",
      procedureClass:"abnormal",
      category:"Alternate",
      phase:"Ground",
      effectivity:{kind:"all-aircraft",sourceText:"ALL"},
      stages:[
        {
          id:"response-b",
          label:"Response",
          steps:[
            {
              id:"condition-b",
              kind:"condition",
              branches:[
                {
                  id:"persists",
                  label:"If generic condition persists",
                  steps:[{id:"action-c",kind:"action",label:"1",text:"Action C"}],
                },
                {
                  id:"clears",
                  label:"If generic condition clears",
                  steps:[{id:"action-d",kind:"action",label:"1",text:"Action D"}],
                },
              ],
            },
          ],
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
