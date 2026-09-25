import type {
  AircraftAbnormalEmergencyV2Content,
  AircraftQrhStage,
} from "../../../lib/universal-abnormal-emergency.ts";
import type { AircraftApplicability } from "../../../lib/universal-aircraft-content.ts";
import { learjet35aChecklistSourceManifest } from "../checklists/source-manifest.ts";

const source = (pageLabel: string, section: string) => ({
  manualId: learjet35aChecklistSourceManifest.manualId,
  chapter: "Abnormal Procedures",
  section,
  pageLabel,
});

export const learjet35aQrhFuelConfigurationKeys = {
  fuselageValveSwitch: "fuselage-valve-switch",
} as const;

const withFuselageValveSwitch: AircraftApplicability = {
  configurationEquipmentAllOf: [
    learjet35aQrhFuelConfigurationKeys.fuselageValveSwitch,
  ],
};

const withoutFuselageValveSwitch: AircraftApplicability = {
  configurationEquipmentNoneOf: [
    learjet35aQrhFuelConfigurationKeys.fuselageValveSwitch,
  ],
};

const allStage = (
  id: string,
  label: string,
  pageLabel: string,
  section: string,
  steps: AircraftQrhStage["steps"],
): AircraftQrhStage => ({
  id,
  label,
  effectivity: { kind: "all-aircraft", sourceText: "ALL" },
  sources: [source(pageLabel, section)],
  steps,
});

const mappedStage = (
  id: string,
  label: string,
  pageLabel: string,
  section: string,
  sourceText: string,
  applicability: AircraftApplicability,
  steps: AircraftQrhStage["steps"],
): AircraftQrhStage => ({
  id,
  label,
  effectivity: { kind: "mapped", sourceText },
  applicability,
  sources: [source(pageLabel, section)],
  steps,
});

export const learjet35aQrhAbnormalBatch6ReleaseStatus =
  "staged-source-review" as const;

/**
 * QRH.3M Fuel Abnormal Procedures source batch.
 *
 * Covers the complete ten-procedure Fuel index family on CL-102B A-19
 * through A-23. Visual source review found no boxed memory items. Source paths
 * explicitly distinguished by FUS VALVE Switch installation are represented by
 * generic configured-equipment applicability and fail closed when that
 * installation fact is unknown.
 */
export const learjet35aQrhAbnormalBatch6 = {
  schemaVersion: 2,
  aircraftId: "learjet-35a",
  title: "Learjet 35/36 Abnormal Procedures — staged source batch 6",
  sourcePolicy: "available-sources",
  sourceNote:
    "QRH.3M digitizes the complete Fuel abnormal family from CL-102B A-19 through A-23. FUS VALVE Switch source branches require explicit generic configuration state. Visual review found no boxed memory items.",
  disclaimer:
    "CL-102B states that its procedures do not supersede the current FAA Approved Airplane Flight Manual; the AFM takes precedence in a conflict.",
  scenarios: [
    {
      id: "crossflow-valve-fails-to-open",
      title: "CROSSFLOW VALVE FAILS TO OPEN",
      procedureClass: "abnormal",
      category: "Fuel",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-19", "CROSSFLOW VALVE FAILS TO OPEN")],
      stages: [
        mappedStage(
          "crossflow-no-fus-valve-a19",
          "Aircraft without FUS VALVE switch",
          "A-19",
          "CROSSFLOW VALVE FAILS TO OPEN",
          "ALL — Aircraft without FUS VALVE switch",
          withoutFuselageValveSwitch,
          [
            { id: "crossflow-no-fus-1", kind: "action", label: "1", text: "Maintain wing fuel balance by adjusting power setting." },
            { id: "crossflow-no-fus-2", kind: "information", label: "2", text: "Transferring fuselage fuel will result in a right wing heavy condition." },
          ],
        ),
        mappedStage(
          "crossflow-with-fus-valve-a19",
          "Aircraft with FUS VALVE switch",
          "A-19",
          "CROSSFLOW VALVE FAILS TO OPEN",
          "ALL — Aircraft with FUS VALVE switch",
          withFuselageValveSwitch,
          [
            { id: "crossflow-with-fus-1", kind: "action", label: "1", text: "Maintain wing fuel balance by adjusting power setting." },
            { id: "crossflow-with-fus-2", kind: "information", label: "2", text: "Transfer fuselage fuel using the following procedure:" },
            { id: "crossflow-with-fus-2a", kind: "action", label: "a", text: "Transfer-Fill — XFER" },
            { id: "crossflow-with-fus-2b", kind: "action", label: "b", text: "Fuselage Valve — OPEN" },
            { id: "crossflow-with-fus-2c", kind: "action", label: "c", text: "Monitor wing fuel indications to ensure fuel balance." },
            {
              id: "crossflow-fus-imbalance",
              kind: "condition",
              branches: [
                {
                  id: "crossflow-right-heavy",
                  label: "d. If right wing becomes heavy during fuselage fuel transfer",
                  steps: [
                    { id: "crossflow-right-heavy-1", kind: "action", label: "(1)", text: "Fuselage Valve — CLOSE" },
                    { id: "crossflow-right-heavy-2", kind: "action", label: "(2)", text: "When wings are balanced, Fuselage Valve — OPEN" },
                  ],
                },
                {
                  id: "crossflow-left-heavy",
                  label: "If left wing becomes heavy during fuselage fuel transfer",
                  steps: [
                    { id: "crossflow-left-heavy-1", kind: "action", label: "(1)", text: "Transfer-Fill — OFF" },
                    { id: "crossflow-left-heavy-2", kind: "action", label: "(2)", text: "When wings are balanced, Transfer-Fill — XFER" },
                  ],
                },
              ],
            },
          ],
        ),
      ],
    },
    {
      id: "fuel-filter-light",
      title: "FUEL FILTER LIGHT",
      procedureClass: "abnormal",
      category: "Fuel",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-20", "FUEL FILTER LIGHT")],
      stages: [
        allStage("fuel-filter-a20", "FUEL FILTER LIGHT", "A-20", "FUEL FILTER LIGHT", [
          { id: "fuel-filter-1", kind: "action", label: "1", text: "Standby Pumps — ON (when possible)" },
        ]),
      ],
    },
    {
      id: "fuel-imbalance-during-fuel-transfer",
      title: "FUEL IMBALANCE DURING FUEL TRANSFER",
      procedureClass: "abnormal",
      category: "Fuel",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-20", "FUEL IMBALANCE DURING FUEL TRANSFER")],
      stages: [
        allStage(
          "fuel-imbalance-a20",
          "FUEL IMBALANCE DURING FUEL TRANSFER",
          "A-20",
          "FUEL IMBALANCE DURING FUEL TRANSFER",
          [
            { id: "fuel-imbalance-1", kind: "action", label: "1", text: "Transfer-Fill — OFF" },
            { id: "fuel-imbalance-2", kind: "action", label: "2", text: "Fuselage Valve (if installed) — CLOSE" },
            { id: "fuel-imbalance-3", kind: "action", label: "3", text: "Standby Pump (heavy wing) — ON" },
            { id: "fuel-imbalance-4", kind: "action", label: "4", text: "Standby Pump (light wing) — OFF" },
            { id: "fuel-imbalance-5", kind: "action", label: "5", text: "Crossflow Valve — OPEN" },
            { id: "fuel-imbalance-6", kind: "action", label: "6", text: "Fuel Balance — MONITOR" },
            {
              id: "fuel-imbalance-result",
              kind: "condition",
              branches: [
                {
                  id: "fuel-imbalance-balances",
                  label: "7. If Fuel Load Balances",
                  steps: [
                    { id: "fuel-imbalance-balances-a", kind: "action", label: "a", text: "Crossflow Valve — CLOSE" },
                    { id: "fuel-imbalance-balances-b", kind: "action", label: "b", text: "Both Standby Pump Switches — OFF" },
                    { id: "fuel-imbalance-balances-c", kind: "action", label: "c", text: "Monitor fuel balance when transferring fuselage fuel." },
                  ],
                },
                {
                  id: "fuel-imbalance-does-not-balance",
                  label: "If Fuel Load Does Not Balance",
                  steps: [
                    { id: "fuel-imbalance-no-a", kind: "action", label: "a", text: "STBY PMP CB (light wing) (ess bus) — PULL" },
                    { id: "fuel-imbalance-no-b", kind: "action", label: "b", text: "Standby Pump (heavy wing) — ON" },
                    { id: "fuel-imbalance-no-c", kind: "action", label: "c", text: "Crossflow Valve — OPEN" },
                    { id: "fuel-imbalance-no-d", kind: "action", label: "d", text: "Fuel Balance — MONITOR" },
                    {
                      id: "fuel-imbalance-second-result",
                      kind: "condition",
                      branches: [
                        {
                          id: "fuel-imbalance-second-balances",
                          label: "e. If Fuel Load Balances",
                          steps: [
                            { id: "fuel-imbalance-second-balances-1", kind: "action", label: "(1)", text: "Crossflow Valve — CLOSE" },
                            { id: "fuel-imbalance-second-balances-2", kind: "action", label: "(2)", text: "Both Standby Pump Switches — OFF" },
                            { id: "fuel-imbalance-second-balances-afm", kind: "information", text: "Refer to AFM for conditions that will exist." },
                          ],
                        },
                        {
                          id: "fuel-imbalance-still-no",
                          label: "If Fuel Load Still Does Not Balance",
                          steps: [
                            { id: "fuel-imbalance-still-no-1", kind: "action", label: "(1)", text: "Crossflow Valve — CLOSE" },
                            { id: "fuel-imbalance-still-no-2", kind: "action", label: "(2)", text: "Both Standby Pump Switches — OFF" },
                            { id: "fuel-imbalance-still-no-afm", kind: "information", text: "Refer to AFM for conditions that will exist." },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        ),
      ],
    },
    {
      id: "fuel-jettison",
      title: "FUEL JETTISON",
      procedureClass: "abnormal",
      category: "Fuel",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-21", "FUEL JETTISON")],
      stages: [
        allStage("fuel-jettison-a21", "FUEL JETTISON", "A-21", "FUEL JETTISON", [
          { id: "fuel-jettison-1", kind: "action", label: "1", text: "Fuel Jettison Switch — ON" },
          { id: "fuel-jettison-2", kind: "action", label: "2", text: "L and R FUEL JTSN Lights — BOTH ON" },
          {
            id: "fuel-jettison-one-light",
            kind: "condition",
            branches: [{
              id: "fuel-jettison-one-light-branch",
              label: "If only one light illuminates",
              steps: [
                { id: "fuel-jettison-one-light-off", kind: "action", text: "Fuel Jettison Switch — OFF" },
              ],
            }],
          },
          { id: "fuel-jettison-3", kind: "action", label: "3", text: "Ensure that fuel is flowing from both tip tanks." },
          { id: "fuel-jettison-4", kind: "action", label: "4", text: "When jettison is complete, Fuel Jettison Switch — OFF (both lights out)" },
        ]),
      ],
    },
    {
      id: "fuel-transfer-valve-fails-to-close",
      title: "FUEL TRANSFER VALVE FAILS TO CLOSE",
      procedureClass: "abnormal",
      category: "Fuel",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-21", "FUEL TRANSFER VALVE FAILS TO CLOSE")],
      stages: [
        allStage(
          "fuel-transfer-valve-a21",
          "FUEL TRANSFER VALVE FAILS TO CLOSE",
          "A-21",
          "FUEL TRANSFER VALVE FAILS TO CLOSE",
          [
            { id: "fuel-transfer-valve-1", kind: "action", label: "1", text: "Conduct crossflow operations with caution as standby pump operation will transfer some fuel back into the fuselage tank." },
            { id: "fuel-transfer-valve-2", kind: "action", label: "2", text: "Periodically transfer fuel back into wings." },
          ],
        ),
      ],
    },
    {
      id: "fuel-valve-lights",
      title: "FUEL VALVE LIGHT(S)",
      procedureClass: "abnormal",
      category: "Fuel",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-21", "FUEL VALVE LIGHT(S)")],
      stages: [
        allStage(
          "fuel-valve-lights-a21",
          "FUEL VALVE LIGHT(S)",
          "A-21",
          "FUEL VALVE LIGHT(S)",
          [
            {
              id: "fuel-valve-lights-info",
              kind: "information",
              text: "Steady illumination of any of the amber fuel valve lights (except FUEL JTSN) on the fuel control panel indicates the corresponding valve is not in the position selected.",
            },
          ],
        ),
      ],
    },
    {
      id: "low-fuel-light",
      title: "LOW FUEL LIGHT",
      procedureClass: "abnormal",
      category: "Fuel",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-21", "LOW FUEL LIGHT")],
      stages: [
        allStage("low-fuel-light-a21", "LOW FUEL LIGHT", "A-21", "LOW FUEL LIGHT", [
          { id: "low-fuel-1", kind: "action", label: "1", text: "Fuel Quantities — CHECK" },
          {
            id: "low-fuel-correction",
            kind: "condition",
            branches: [{
              id: "low-fuel-correction-branch",
              label: "If fuel distribution correction is required",
              steps: [
                { id: "low-fuel-a", kind: "action", label: "a", text: "Balance wing fuel. Refer to FUEL CROSSFLOW, AFM, Section II." },
                { id: "low-fuel-b", kind: "action", label: "b", text: "Transfer fuselage fuel to the wings. Refer to NORMAL FUSELAGE FUEL TRANSFER, AFM, Section II." },
              ],
            }],
          },
          { id: "low-fuel-2", kind: "action", label: "2", text: "Replan flight if necessary." },
        ]),
      ],
    },
    {
      id: "normal-fuel-transfer-system-failure",
      title: "NORMAL FUEL TRANSFER SYSTEM FAILURE",
      procedureClass: "abnormal",
      category: "Fuel",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-22", "NORMAL FUEL TRANSFER SYSTEM FAILURE")],
      stages: [
        mappedStage(
          "normal-fuel-transfer-with-fus-a22",
          "Aircraft with FUS VALVE Switch",
          "A-22",
          "NORMAL FUEL TRANSFER SYSTEM FAILURE",
          "ALL — Aircraft with FUS VALVE Switch",
          withFuselageValveSwitch,
          [
            {
              id: "normal-transfer-with-fus-limit",
              kind: "information",
              text: "If fuselage fuel load in excess of maximum zero wing and tip fuel weight cannot be transferred prior to reaching a total wing fuel quantity of 2250 pounds, do not exceed 325 KIAS.",
            },
            { id: "normal-transfer-with-fus-1", kind: "action", label: "1", text: "Fuselage Valve — OPEN" },
            { id: "normal-transfer-with-fus-2", kind: "action", label: "2", text: "Prior to approach or gravity transfer complete, Fuselage Valve — CLOSE" },
          ],
        ),
        mappedStage(
          "normal-fuel-transfer-without-fus-a22",
          "Aircraft without FUS VALVE Switch",
          "A-22",
          "NORMAL FUEL TRANSFER SYSTEM FAILURE",
          "ALL — Aircraft without FUS VALVE Switch",
          withoutFuselageValveSwitch,
          [
            {
              id: "normal-transfer-without-fus-limit",
              kind: "information",
              text: "If fuselage fuel load in excess of maximum zero wing and tip fuel weight cannot be transferred prior to reaching a total wing fuel quantity of 2250 pounds, do not exceed 325 KIAS.",
            },
            {
              id: "normal-transfer-light-state",
              kind: "condition",
              branches: [
                {
                  id: "normal-transfer-light-remains",
                  label: "Transfer valve light remains illuminated",
                  steps: [
                    { id: "normal-transfer-light-remains-1", kind: "action", label: "1", text: "Transfer-Fill — OFF" },
                    { id: "normal-transfer-light-remains-2", kind: "action", label: "2", text: "Replan flight." },
                  ],
                },
                {
                  id: "normal-transfer-light-out",
                  label: "Transfer valve light goes out",
                  steps: [
                    { id: "normal-transfer-light-out-1", kind: "action", label: "1", text: "FUSLG PMP CB (Copilot’s Main Bus) — PULL" },
                    { id: "normal-transfer-light-out-2", kind: "action", label: "2", text: "Transfer-Fill — XFER" },
                    { id: "normal-transfer-light-out-3", kind: "action", label: "3", text: "Prior to approach or gravity transfer complete, Transfer-Fill — OFF" },
                  ],
                },
              ],
            },
          ],
        ),
      ],
    },
    {
      id: "standby-pump-fails-to-shut-off",
      title: "STANDBY PUMP FAILS TO SHUT OFF",
      procedureClass: "abnormal",
      category: "Fuel",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-22", "STANDBY PUMP FAILS TO SHUT OFF")],
      stages: [
        allStage(
          "standby-pump-a22",
          "STANDBY PUMP FAILS TO SHUT OFF",
          "A-22",
          "STANDBY PUMP FAILS TO SHUT OFF",
          [
            {
              id: "standby-pump-initial",
              kind: "condition",
              branches: [{
                id: "standby-pump-initial-branch",
                label: "If standby pump light does not extinguish when pump is selected off",
                steps: [
                  { id: "standby-pump-1", kind: "action", label: "1", text: "Corresponding STANDBY PUMP Switch — CYCLE" },
                  {
                    id: "standby-pump-still-on",
                    kind: "condition",
                    branches: [{
                      id: "standby-pump-still-on-branch",
                      label: "If standby pump light does not extinguish",
                      steps: [
                        { id: "standby-pump-2", kind: "action", label: "2", text: "Corresponding STBY PMP CB (ess bus) — PULL" },
                      ],
                    }],
                  },
                ],
              }],
            },
          ],
        ),
      ],
    },
    {
      id: "tip-tank-fails-to-transfer-fuel",
      title: "TIP TANK FAILS TO TRANSFER FUEL",
      procedureClass: "abnormal",
      category: "Fuel",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-23", "TIP TANK FAILS TO TRANSFER FUEL")],
      stages: [
        allStage(
          "tip-tank-transfer-a23",
          "TIP TANK FAILS TO TRANSFER FUEL",
          "A-23",
          "TIP TANK FAILS TO TRANSFER FUEL",
          [
            {
              id: "tip-tank-transfer-info",
              kind: "information",
              text: "Maximum demonstrated fuel imbalance for landing was approximately 600 pounds (one tip tank half full and the other tip tank empty). However, for best lateral control it is recommended that the tip fuel be jettisoned to balance. This is particularly important if landing is to be made in strong gusty crosswinds or with spoilerons inoperative.",
            },
            {
              id: "tip-tank-transfer-decision",
              kind: "condition",
              branches: [
                {
                  id: "tip-tank-jettison",
                  label: "If it is decided to jettison fuel",
                  steps: [
                    { id: "tip-tank-jettison-1", kind: "action", label: "1", text: "Jettison tip tank fuel. Refer to FUEL JETTISON procedure, Tab 9, this section." },
                    { id: "tip-tank-jettison-2", kind: "action", label: "2", text: "Prior to landing, Fuel Jettison Switch — OFF" },
                    { id: "tip-tank-jettison-3", kind: "action", label: "3", text: "Execute normal landing." },
                  ],
                },
                {
                  id: "tip-tank-no-jettison",
                  label: "If it is decided not to jettison fuel",
                  steps: [
                    { id: "tip-tank-no-jettison-1", kind: "action", label: "1", text: "Configuration — GEAR DN, FLAPS DN" },
                    { id: "tip-tank-no-jettison-2", kind: "action", label: "2", text: "Final Approach Speed — VREF + 10" },
                    { id: "tip-tank-no-jettison-3", kind: "action", label: "3", text: "Landing Distance — MULTIPLY BY 1.1" },
                  ],
                },
              ],
            },
          ],
        ),
      ],
    },
  ],
} as const satisfies AircraftAbnormalEmergencyV2Content;
