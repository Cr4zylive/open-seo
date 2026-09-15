import assert from "node:assert/strict";
import { test } from "node:test";
import {
  UPS_DIM_DIVISORS,
  billableWeightPounds,
  calculateUpsDimWeight,
  ceilPounds,
  cubicInches,
  dimensionalWeightPounds,
  roundDimensionInches,
} from "./dim-weight.mjs";

test("rounds each side to the nearest inch", () => {
  assert.equal(roundDimensionInches(15.4), 15);
  assert.equal(roundDimensionInches(15.5), 16);
  assert.deepEqual(cubicInches(15.4, 12.2, 12.49), {
    length: 15,
    width: 12,
    height: 12,
    cubic: 2160,
  });
});

test("16×12×12 in is 17 lb at Daily 139 and 14 lb at Retail 166", () => {
  // 16*12*12 = 2304. 2304/139 ≈ 16.58 → 17. 2304/166 ≈ 13.88 → 14.
  assert.equal(dimensionalWeightPounds(16, 12, 12, 139).dimensionalWeight, 17);
  assert.equal(dimensionalWeightPounds(16, 12, 12, 166).dimensionalWeight, 14);
});

test("exact division does not bump an extra pound", () => {
  // 139*10 = 1390 cubic inches → 10.0 lb
  assert.equal(ceilPounds(10), 10);
  assert.equal(dimensionalWeightPounds(139, 10, 1, 139).dimensionalWeight, 10);
});

test("billable weight is the greater of actual and DIM", () => {
  assert.equal(billableWeightPounds(10, 17).billable, 17);
  assert.equal(billableWeightPounds(10, 17).chargedBy, "dimensional");
  assert.equal(billableWeightPounds(20, 17).chargedBy, "actual");
  assert.equal(billableWeightPounds(17, 17).chargedBy, "tie");
});

test("UPS Daily vs Retail on the same carton", () => {
  const daily = calculateUpsDimWeight({
    lengthIn: 16,
    widthIn: 12,
    heightIn: 12,
    actualPounds: 10,
    rateType: "daily",
  });
  const retail = calculateUpsDimWeight({
    lengthIn: 16,
    widthIn: 12,
    heightIn: 12,
    actualPounds: 10,
    rateType: "retail",
  });
  assert.equal(daily.divisor, UPS_DIM_DIVISORS.daily);
  assert.equal(daily.billable, 17);
  assert.equal(retail.divisor, UPS_DIM_DIVISORS.retail);
  assert.equal(retail.billable, 14);
});

test("rejects junk input", () => {
  assert.throws(() => roundDimensionInches(-1), RangeError);
  assert.throws(
    () =>
      calculateUpsDimWeight({
        lengthIn: 1,
        widthIn: 1,
        heightIn: 1,
        actualPounds: 1,
        rateType: "ground",
      }),
    RangeError,
  );
});
