import takeoffN1Json from "./takeoff-n1.json";
import v2Flaps20Json from "./v2-flaps20.json";
import v2Flaps8Json from "./v2-flaps8.json";
import vrFlaps20Json from "./vr-flaps20.json";
import vrFlaps8Json from "./vr-flaps8.json";
import vrefJson from "./vref.json";

import type { BundledPerformancePackage } from "../../../lib/performance-package.ts";
import type { PerformanceDataset } from "../../../lib/universal-aircraft-content.ts";

const takeoffN1 = takeoffN1Json as unknown as PerformanceDataset;
const vrFlaps8 = vrFlaps8Json as unknown as PerformanceDataset;
const vrFlaps20 = vrFlaps20Json as unknown as PerformanceDataset;
const v2Flaps8 = v2Flaps8Json as unknown as PerformanceDataset;
const v2Flaps20 = v2Flaps20Json as unknown as PerformanceDataset;
const vref = vrefJson as unknown as PerformanceDataset;

export const learjet35aPerformancePackage: BundledPerformancePackage = {
  aircraftId: "learjet-35a",
  content: {
    aircraftId: "learjet-35a",
    title: "Learjet 35A Performance",
    sourcePolicy: "available-sources",
    sourceNote: "Source-backed performance package assembled from the available AFM, Bombardier checklist/QRH and FlightSafety training material.",
    disclaimer: "Sources: available training material. Not FAA-approved.",
    datasets: [
      takeoffN1,
      vrFlaps8,
      vrFlaps20,
      v2Flaps8,
      v2Flaps20,
      vref,
    ],
  },
  takeoffCalculator: {
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
      { key: "v1", label: "V1", unit: "KIAS", milestone: "B7" },
      { key: "takeoffDistance", label: "Takeoff Distance", milestone: "B8" },
    ],
    disclaimer: "Sources: available training material. Not FAA-approved.",
  },
};
