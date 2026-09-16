import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateCbm } from "./cbm.mjs";

test("100 × 50 × 40 cm × 2 is 0.4 m³", () => {
  const row = calculateCbm({
    length: 100,
    width: 50,
    height: 40,
    qty: 2,
    unit: "cm",
  });
  assert.equal(row.cbm, 0.4);
});

test("1 × 1 × 1 m is 1 CBM", () => {
  assert.equal(
    calculateCbm({ length: 1, width: 1, height: 1, qty: 1, unit: "m" }).cbm,
    1,
  );
});
