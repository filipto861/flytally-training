import { writeFileSync } from "node:fs";

import { learjet3536ExpandedAbnormal } from "../lib/learjet-native-abnormal-expanded.ts";
import { learjet3536OperationalLimitations, learjet3536OperationalPerformance } from "../lib/learjet-pilot-takeoff-data.ts";

const payloads = {
  aircraftId: "learjet-35-36",
  generatedFrom: process.env.GITHUB_SHA ?? "local",
  modules: {
    performance: learjet3536OperationalPerformance,
    limitations: learjet3536OperationalLimitations,
    abnormal: learjet3536ExpandedAbnormal,
  },
};

writeFileSync("m27-payloads.json", JSON.stringify(payloads));
console.log("Exported M27 performance, limitations and abnormal payloads.");
