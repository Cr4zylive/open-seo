import assert from "node:assert/strict";
import { test } from "node:test";
import { planStairs } from "./stairs.mjs";

test("105 in rise at 7.5 in target is 14 risers of 7.5 in", () => {
  const row = planStairs({
    totalRiseIn: 105,
    targetRiserIn: 7.5,
    treadIn: 10,
  });
  assert.equal(row.risers, 14);
  assert.equal(row.treads, 13);
  assert.equal(row.riser, 7.5);
  assert.equal(row.totalRun, 130);
  assert.equal(row.ircRiserOk, true);
  assert.equal(row.ircTreadOk, true);
});

test("rejects junk", () => {
  assert.throws(() => planStairs({ totalRiseIn: 0, treadIn: 10 }), RangeError);
});
