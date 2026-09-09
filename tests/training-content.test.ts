import assert from "node:assert/strict";
import test from "node:test";

import { canPublishTrainingContent } from "../lib/training-content.ts";

test("approved sourced training content can be published", () => {
  assert.equal(
    canPublishTrainingContent({
      approvalState: "APPROVED",
      sources: [{ manualId: "aircraft-afm", revisionId: "rev-1", section: "4.2", page: 73 }],
    }),
    true,
  );
});

test("AI or editor draft cannot be published before approval", () => {
  assert.equal(
    canPublishTrainingContent({
      approvalState: "DRAFT",
      sources: [{ manualId: "aircraft-afm", revisionId: "rev-1" }],
    }),
    false,
  );
});

test("approved but unsourced technical content cannot be published", () => {
  assert.equal(
    canPublishTrainingContent({ approvalState: "APPROVED", sources: [] }),
    false,
  );
});
