import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) =>
  readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("DD.4 Takeoff operation owns TORA suggestion/manual state and separate ASDA input", () => {
  const controller = read("components/ft-performance/use-performance-operation.ts");
  const presentation = read("components/ft-performance/FtPerformancePresentation.tsx");

  assert.equal(controller.includes('const [toraFt, setToraFtState] = useState("");'), true);
  assert.match(controller, /toraInputSource/);
  assert.equal(controller.includes('const [asdaFt, setAsdaFt] = useState("");'), true);
  assert.match(controller, /resolveTakeoffDeclaredDistanceConstraint/);
  assert.match(presentation, /aria-label="Takeoff TORA"/);
  assert.match(presentation, /aria-label="Takeoff ASDA"/);
  assert.match(presentation, /Declared takeoff limit/);
});

test("DD.4 selecting a different runway clears prior declared-distance confirmation", () => {
  const controller = read("components/ft-performance/use-performance-operation.ts");
  const setterBlock = controller.slice(
    controller.indexOf("setRunwayIdentifier: (value) =>"),
    controller.indexOf("setTakeoffWeight,", controller.indexOf("setRunwayIdentifier: (value) =>")),
  );

  assert.match(setterBlock, /setRunwayIdentifierState\(value\)/);
  assert.equal(setterBlock.includes('setToraFtState("");'), true);
  assert.equal(setterBlock.includes('setToraInputSource("empty");'), true);
  assert.equal(setterBlock.includes('setAsdaFt("");'), true);
});

test("DD.4 full-rated Takeoff calculation does not require declared distances", () => {
  const controller = read("components/ft-performance/use-performance-operation.ts");
  const fullRatedGate = controller.slice(
    controller.indexOf("const canCalculateFullRated = Boolean("),
    controller.indexOf("const partialPowerInputsReady"),
  );

  assert.match(fullRatedGate, /currentContext/);
  assert.match(fullRatedGate, /performancePressureAltitudeFt/);
  assert.match(fullRatedGate, /calculationWeather/);
  assert.doesNotMatch(fullRatedGate, /toraFt|asdaFt|declaredDistanceConstraint/);
  assert.match(
    controller,
    /const canCalculate = thrustMode === "partial-power"[\s\S]*: canCalculateFullRated;/,
  );
});

test("DD.4 current full-rated snapshot does not persist or depend on TORA/ASDA", () => {
  const controller = read("components/ft-performance/use-performance-operation.ts");
  const snapshotBlock = controller.slice(
    controller.indexOf("const snapshot = writeTakeoffPerformanceResultV2"),
    controller.indexOf("weatherLocked.current = true"),
  );

  assert.equal(snapshotBlock.includes("toraFt"), false);
  assert.equal(snapshotBlock.includes("asdaFt"), false);
  assert.equal(snapshotBlock.includes("declaredDistance"), false);
  assert.match(
    controller,
    /Declared distances are not dependencies of the current full-rated[\s\S]*not restored from it/,
  );
});

test("DD.4 airport surface length is only a visible TORA suggestion until explicitly confirmed", () => {
  const controller = read("components/ft-performance/use-performance-operation.ts");
  const presentation = read("components/ft-performance/FtPerformancePresentation.tsx");

  assert.match(controller, /airport-surface-suggestion/);
  assert.match(controller, /runwayContext\.surfaceLengthFt/);
  assert.match(
    controller,
    /toraInputSource === "manual"[\s\S]*manualDeclaredDistanceFt/,
  );
  assert.match(
    presentation,
    /This is not an authoritative declared TORA\./,
  );
  assert.match(presentation, /Confirm verified TORA/);
});

test("DD.4 ASDA is de-emphasized in UI but never silently assumed equal to TORA", () => {
  const presentation = read("components/ft-performance/FtPerformancePresentation.tsx");

  assert.match(presentation, /Declared-distance details/);
  assert.match(presentation, /aria-label="Takeoff ASDA"/);
  assert.match(
    presentation,
    /ASDA can differ from TORA[\s\S]*does not silently assume they are equal/,
  );
});
