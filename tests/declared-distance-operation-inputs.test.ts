import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) =>
  readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("DD.2 Takeoff operation owns optional manual TORA and ASDA inputs", () => {
  const controller = read("components/ft-performance/use-performance-operation.ts");
  const presentation = read("components/ft-performance/FtPerformancePresentation.tsx");

  assert.equal(controller.includes('const [toraFt, setToraFt] = useState("");'), true);
  assert.equal(controller.includes('const [asdaFt, setAsdaFt] = useState("");'), true);
  assert.match(controller, /resolveTakeoffDeclaredDistanceConstraint/);
  assert.match(presentation, /aria-label="Takeoff TORA"/);
  assert.match(presentation, /aria-label="Takeoff ASDA"/);
  assert.match(presentation, /Declared takeoff limit/);
});

test("DD.2 selecting a different runway clears manually entered declared distances", () => {
  const controller = read("components/ft-performance/use-performance-operation.ts");
  const setterBlock = controller.slice(
    controller.indexOf("setRunwayIdentifier: (value) =>"),
    controller.indexOf("setTakeoffWeight,", controller.indexOf("setRunwayIdentifier: (value) =>")),
  );

  assert.match(setterBlock, /setRunwayIdentifierState\(value\)/);
  assert.equal(setterBlock.includes('setToraFt("");'), true);
  assert.equal(setterBlock.includes('setAsdaFt("");'), true);
});

test("DD.2 full-rated Takeoff calculation does not require declared distances", () => {
  const controller = read("components/ft-performance/use-performance-operation.ts");
  const canCalculateBlock = controller.slice(
    controller.indexOf("const canCalculate = Boolean("),
    controller.indexOf("const newerWeatherAvailable"),
  );

  assert.match(canCalculateBlock, /currentContext/);
  assert.match(canCalculateBlock, /pressureAltitudeFt/);
  assert.doesNotMatch(canCalculateBlock, /toraFt|asdaFt|declaredDistanceConstraint/);
});

test("DD.2 current full-rated snapshot does not persist or depend on TORA/ASDA", () => {
  const controller = read("components/ft-performance/use-performance-operation.ts");
  const snapshotBlock = controller.slice(
    controller.indexOf("const snapshot = writeTakeoffPerformanceResultV2"),
    controller.indexOf("weatherLocked.current = true"),
  );

  assert.doesNotMatch(snapshotBlock, /tora|asda|declaredDistance/i);
  assert.match(
    controller,
    /Declared distances are not dependencies of the current full-rated[\s\S]*not restored from it/,
  );
});

test("DD.2 UI states that physical runway length is not the declared-distance source", () => {
  const presentation = read("components/ft-performance/FtPerformancePresentation.tsx");

  assert.match(
    presentation,
    /Manual declared distance\. Never inferred from physical runway length\./,
  );
  assert.match(
    presentation,
    /Required with TORA only for runway-limited \/ Partial Power calculations\./,
  );
});
