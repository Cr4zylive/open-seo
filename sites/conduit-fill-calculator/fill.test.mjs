import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateConduitFill } from "./fill.mjs";
import { recommendWireSize } from "./wire-size.mjs";
import { voltageDrop } from "./voltage-drop.mjs";

test("9 × 12 AWG THHN fits 1/2 EMT; 10 does not", () => {
  const nine = calculateConduitFill({
    type: "emt",
    tradeSize: "1/2",
    conductors: [{ size: "12", qty: 9 }],
  });
  const ten = calculateConduitFill({
    type: "emt",
    tradeSize: "1/2",
    conductors: [{ size: "12", qty: 10 }],
  });
  assert.equal(nine.count, 9);
  assert.ok(Math.abs(nine.conductorArea - 0.1197) < 1e-9);
  assert.equal(nine.limit, 0.4);
  assert.equal(nine.ok, true);
  assert.equal(ten.ok, false);
});

test("16 × 12 AWG THHN fits 3/4 EMT at 40%", () => {
  const row = calculateConduitFill({
    type: "emt",
    tradeSize: "3/4",
    conductors: [{ size: "12", qty: 16 }],
  });
  assert.ok(Math.abs(row.conductorArea - 0.2128) < 1e-9);
  assert.equal(row.ok, true);
});

test("one conductor uses 53% fill", () => {
  const row = calculateConduitFill({
    type: "emt",
    tradeSize: "1/2",
    conductors: [{ size: "2", qty: 1 }],
  });
  assert.equal(row.limit, 0.53);
  assert.equal(row.ok, true);
});

test("120 V 20 A 100 ft #12 copper is about 7.90 V", () => {
  const row = voltageDrop({
    phase: "1",
    material: "copper",
    size: "12",
    amps: 20,
    feet: 100,
    volts: 120,
  });
  assert.ok(Math.abs(row.voltsDropped - 7.90199) < 0.01);
});

test("same circuit needs 8 AWG to stay under 3%", () => {
  const row = recommendWireSize({
    phase: "1",
    material: "copper",
    amps: 20,
    feet: 100,
    volts: 120,
    maxPercent: 3,
  });
  assert.equal(row.size, "8");
  assert.equal(row.ok, true);
  assert.ok(row.percent <= 3);
});
