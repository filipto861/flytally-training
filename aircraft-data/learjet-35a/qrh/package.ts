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
import { learjet35aQrhSourceInventory } from "./source-inventory.ts";

export const learjet35aQrhSourceBatches: readonly AircraftAbnormalEmergencyV2Content[] = [
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
];

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


function indexedEntryCount(procedureClass: "emergency" | "abnormal"): number {
  const section = learjet35aQrhSourceInventory.sections.find(
    (candidate) => candidate.kind === procedureClass,
  );
  if (!section) {
    throw new Error(`Learjet QRH source inventory is missing the ${procedureClass} section.`);
  }
  return section.categories.reduce(
    (count, category) => count + category.procedures.length,
    0,
  );
}

/**
 * Package-specific completeness gate for the reviewed CL-102B QRH.
 *
 * The universal v2 validator proves schema integrity. This gate additionally
 * proves that the Learjet aggregate still accounts for every indexed source
 * entry and that source-review batches cannot be accidentally omitted or
 * duplicated before governed publication.
 */
export function assertLearjet35aQrhPackageComplete(): void {
  if (learjet35aQrhSourceBatches.length !== 19) {
    throw new Error("Learjet QRH package must contain all 19 reviewed source batches.");
  }

  const scenarioIds = learjet35aQrhPackage.scenarios.map((scenario) => scenario.id);
  if (new Set(scenarioIds).size !== scenarioIds.length) {
    throw new Error("Learjet QRH package contains duplicate scenario ids.");
  }

  const figureList = learjet35aQrhPackage.figures ?? [];
  const figureIds = figureList.map((figure) => figure.id);
  if (new Set(figureIds).size !== figureIds.length) {
    throw new Error("Learjet QRH package contains duplicate figure ids.");
  }

  const introductionClasses = (learjet35aQrhPackage.sectionIntroductions ?? [])
    .map((introduction) => introduction.procedureClass);
  if (
    introductionClasses.length !== 2
    || introductionClasses[0] !== "emergency"
    || introductionClasses[1] !== "abnormal"
  ) {
    throw new Error(
      "Learjet QRH package must contain exactly the reviewed Emergency and Abnormal section introductions.",
    );
  }

  for (const procedureClass of ["emergency", "abnormal"] as const) {
    const scenarioCount = learjet35aQrhPackage.scenarios.filter(
      (scenario) => scenario.procedureClass === procedureClass,
    ).length;
    const chapter =
      procedureClass === "emergency"
        ? "Emergency Procedures"
        : "Abnormal Procedures";
    const figureCount = figureList.filter((figure) =>
      figure.sources.some((source) => source.chapter === chapter),
    ).length;
    const indexedCount = indexedEntryCount(procedureClass);

    if (scenarioCount + figureCount !== indexedCount) {
      throw new Error(
        `Learjet QRH ${procedureClass} package accounts for ${scenarioCount + figureCount} of ${indexedCount} indexed source entries.`,
      );
    }
  }

  if (
    figureIds.length !== 2
    || figureIds[0] !== "airstart-envelope"
    || figureIds[1] !== "thrust-reverser-restow-envelope"
  ) {
    throw new Error(
      "Learjet QRH package must contain exactly the reviewed E-13 and A-35.2 graphical envelopes.",
    );
  }

  if (
    figureList.some(
      (figure) => figure.geometryPolicy !== "source-digitized-visual-reference",
    )
  ) {
    throw new Error(
      "Learjet QRH graphical envelopes must remain source-digitized visual references.",
    );
  }
}
