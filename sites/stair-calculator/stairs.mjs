// Straight-run stair geometry. IRC R311.7 typical limits are notes only:
// residential max riser 7.75 in, min tread 10 in. Local code wins.

export function planStairs({
  totalRiseIn,
  targetRiserIn = 7.5,
  treadIn = 10,
}) {
  const values = [totalRiseIn, targetRiserIn, treadIn];
  if (values.some((n) => typeof n !== "number" || !Number.isFinite(n) || n <= 0)) {
    throw new RangeError("Rise, target riser, and tread must be numbers > 0");
  }
  const risers = Math.max(2, Math.round(totalRiseIn / targetRiserIn));
  const riser = totalRiseIn / risers;
  const treads = risers - 1;
  const totalRun = treads * treadIn;
  const stringer = Math.hypot(totalRiseIn, totalRun);
  return {
    totalRiseIn,
    targetRiserIn,
    treadIn,
    risers,
    treads,
    riser,
    totalRun,
    stringer,
    ircRiserOk: riser <= 7.75 + 1e-9,
    ircTreadOk: treadIn >= 10 - 1e-9,
  };
}
