import type { PilotTakeoffCalculatorDefinition } from "../../../lib/pilot-takeoff-calculator.ts";

export const learjet35aTakeoffCalculatorDefinition: PilotTakeoffCalculatorDefinition = {
  id: "takeoff-summary",
  title: "Takeoff Calculator",
  inputs: {
    pressureAltitude: { label: "Pressure Altitude", unit: "ft" },
    oat: { label: "OAT", unit: "°C" },
    takeoffWeight: { label: "Takeoff Weight", unit: "lb" },
    flaps: { label: "Flaps" },
    antiIce: { label: "Anti-ice" },
  },
  n1: {
    antiIceOff: {
      datasetId: "learjet-35a-takeoff-n1-standard-nozzle-anti-ice-off",
      outputKey: "n1Percent",
      precision: 1,
      inputs: [
        { input: "oat", axisKey: "oatC" },
        { input: "pressureAltitude", axisKey: "pressureAltitudeFt" },
      ],
    },
  },
  flapOptions: [
    {
      value: "8",
      label: "8°",
      v1: {
        antiIceOff: {
          datasetId: "learjet-35a-v1-flaps8",
          outputKey: "v1",
          inputs: [
            { input: "pressureAltitude", axisKey: "pressureAltitude" },
            { input: "oat", axisKey: "oat" },
            { input: "takeoffWeight", axisKey: "grossWeight" },
          ],
        },
      },
      vr: {
        datasetId: "learjet-35a-vr-flaps8",
        outputKey: "vr",
        inputs: [{ input: "takeoffWeight", axisKey: "grossWeight" }],
      },
      v2: {
        datasetId: "learjet-35a-v2-flaps8",
        outputKey: "v2",
        inputs: [{ input: "takeoffWeight", axisKey: "grossWeight" }],
      },
    },
    {
      value: "20",
      label: "20°",
      v1: {
        antiIceOff: {
          datasetId: "learjet-35a-v1-flaps20",
          outputKey: "v1",
          inputs: [
            { input: "pressureAltitude", axisKey: "pressureAltitude" },
            { input: "oat", axisKey: "oat" },
            { input: "takeoffWeight", axisKey: "grossWeight" },
          ],
        },
      },
      vr: {
        datasetId: "learjet-35a-vr-flaps20",
        outputKey: "vr",
        inputs: [{ input: "takeoffWeight", axisKey: "grossWeight" }],
      },
      v2: {
        datasetId: "learjet-35a-v2-flaps20",
        outputKey: "v2",
        inputs: [{ input: "takeoffWeight", axisKey: "grossWeight" }],
      },
    },
  ],
  vref: {
    datasetId: "learjet-35a-vref",
    outputKey: "vref",
    inputs: [{ input: "takeoffWeight", axisKey: "grossWeight" }],
  },
  placeholders: [
    { key: "takeoffDistance", label: "Takeoff Distance", milestone: "B8" },
  ],
  disclaimer: "Sources: available training material. Not FAA-approved.",
};
