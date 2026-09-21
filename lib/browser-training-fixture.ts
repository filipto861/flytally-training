import type { StaticTrainingContentSeed } from "./static-content-repository";
import type { AircraftChecklistContent,AircraftPerformanceContent } from "./universal-aircraft-content";

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
  ],
  learningContent:[],
  normalFlights:[],
  cockpitOrientations:[],
  abnormalTrainings:[],
  referenceKnowledge:[],
};
