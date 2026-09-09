import assert from "node:assert/strict";
import test from "node:test";

import { getTrainingAircraft, learjet3536 } from "../lib/aircraft-catalog.ts";

test("Learjet 35/36 is the first controlled training aircraft", () => {
  assert.equal(getTrainingAircraft("learjet-35-36"), learjet3536);
  assert.deepEqual(learjet3536.variants, ["35", "35A", "36", "36A"]);
});

test("Learjet source record preserves manual revision and provenance anchors", () => {
  const manual = learjet3536.manuals[0];

  assert.ok(manual);
  assert.equal(manual.publisher, "FlightSafety International");
  assert.equal(manual.revision, "1.1");
  assert.equal(manual.issueDate, "2020-01");
  assert.equal(manual.sourceKind, "TRAINING_MANUAL");
  assert.deepEqual(manual.sourceReferences, {
    identityPage: 1,
    authorityNoticePage: 2,
    revisionPage: 4,
    contentsPage: 5,
  });
});

test("Learjet curriculum follows all 21 manual chapters", () => {
  const chapters = learjet3536.manuals[0]?.chapters ?? [];

  assert.equal(chapters.length, 21);
  assert.equal(chapters[0]?.title, "Aircraft General");
  assert.equal(chapters[0]?.status, "READY_TO_DRAFT");
  assert.equal(chapters[20]?.title, "Crew Resource Management");
});
