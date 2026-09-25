import type { AircraftAbnormalEmergencyV2Content } from "../../../lib/universal-abnormal-emergency.ts";
import { learjet35aQrhEmergencyBatch1 } from "./emergency-batch-1.ts";
import { learjet35aQrhEmergencyBatch2 } from "./emergency-batch-2.ts";
import { learjet35aQrhEmergencyBatch3 } from "./emergency-batch-3.ts";
import { learjet35aQrhEmergencyBatch4 } from "./emergency-batch-4.ts";
import { learjet35aQrhEmergencyBatch5 } from "./emergency-batch-5.ts";
import { learjet35aQrhEmergencyBatch6 } from "./emergency-batch-6.ts";
import { learjet35aQrhEmergencyBatch7 } from "./emergency-batch-7.ts";
import { learjet35aQrhAbnormalBatch1 } from "./abnormal-batch-1.ts";
import { learjet35aQrhAbnormalBatch2 } from "./abnormal-batch-2.ts";
import { learjet35aQrhAbnormalBatch3 } from "./abnormal-batch-3.ts";
import { learjet35aQrhAbnormalBatch4 } from "./abnormal-batch-4.ts";
import { learjet35aQrhAbnormalBatch5 } from "./abnormal-batch-5.ts";
import { learjet35aQrhAbnormalBatch6 } from "./abnormal-batch-6.ts";
import { learjet35aQrhAbnormalBatch7 } from "./abnormal-batch-7.ts";
import { learjet35aQrhAbnormalBatch8 } from "./abnormal-batch-8.ts";
import { learjet35aQrhAbnormalBatch9 } from "./abnormal-batch-9.ts";
import { learjet35aQrhAbnormalBatch10 } from "./abnormal-batch-10.ts";
import { learjet35aQrhAbnormalBatch11 } from "./abnormal-batch-11.ts";
import { learjet35aQrhAbnormalBatch12 } from "./abnormal-batch-12.ts";

export const learjet35aQrhSourceBatches = [
  learjet35aQrhEmergencyBatch1,
  learjet35aQrhEmergencyBatch2,
  learjet35aQrhEmergencyBatch3,
  learjet35aQrhEmergencyBatch4,
  learjet35aQrhEmergencyBatch5,
  learjet35aQrhEmergencyBatch6,
  learjet35aQrhEmergencyBatch7,
  learjet35aQrhAbnormalBatch1,
  learjet35aQrhAbnormalBatch2,
  learjet35aQrhAbnormalBatch3,
  learjet35aQrhAbnormalBatch4,
  learjet35aQrhAbnormalBatch5,
  learjet35aQrhAbnormalBatch6,
  learjet35aQrhAbnormalBatch7,
  learjet35aQrhAbnormalBatch8,
  learjet35aQrhAbnormalBatch9,
  learjet35aQrhAbnormalBatch10,
  learjet35aQrhAbnormalBatch11,
  learjet35aQrhAbnormalBatch12,
] as const satisfies readonly AircraftAbnormalEmergencyV2Content[];

const sectionIntroductions = learjet35aQrhSourceBatches.flatMap(
  (batch) => batch.sectionIntroductions ?? [],
);
const figures = learjet35aQrhSourceBatches.flatMap(
  (batch) => batch.figures ?? [],
);
const scenarios = learjet35aQrhSourceBatches.flatMap(
  (batch) => batch.scenarios,
);

/**
 * QRH.3U complete governed Learjet QRH package.
 *
 * Earlier QRH.3 batches remain immutable source-review units for traceability.
 * This aggregate is the only publishable Emergency + Abnormal payload and is
 * intentionally assembled from those reviewed aircraft-owned source batches.
 */
export const learjet35aQrhPackage = {
  schemaVersion: 2,
  aircraftId: "learjet-35a",
  title: "Learjet 35/36 Emergency & Abnormal Procedures",
  sourcePolicy: "available-sources",
  sourceNote:
    "Complete CL-102B Change 2 Emergency + Abnormal QRH package assembled from the reviewed QRH.3 source batches. Graphical operating envelopes are source-digitized visual references only and are not computational lookup surfaces.",
  disclaimer:
    "CL-102B states that its procedures do not supersede the current FAA Approved Airplane Flight Manual; the AFM takes precedence in a conflict.",
  sectionIntroductions,
  figures,
  scenarios,
} satisfies AircraftAbnormalEmergencyV2Content;
