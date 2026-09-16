// NEC Chapter 9 Tables 1, 4, and 5 (THHN/THWN areas; common raceways).
// Internal areas are the Table 4 "Total Area 100%" column in square inches.
// Editions 2017–2023 keep these table numbers; local adoptions can differ.

export const FILL_LIMITS = {
  one: 0.53,
  two: 0.31,
  overTwo: 0.4,
};

export const CONDUIT_AREA_IN2 = {
  emt: {
    "1/2": 0.304,
    "3/4": 0.533,
    "1": 0.864,
    "1-1/4": 1.496,
    "1-1/2": 2.036,
    "2": 3.356,
    "2-1/2": 5.858,
    "3": 8.846,
    "3-1/2": 11.545,
    "4": 14.753,
  },
  imc: {
    "1/2": 0.342,
    "3/4": 0.586,
    "1": 0.959,
    "1-1/4": 1.647,
    "1-1/2": 2.225,
    "2": 3.63,
    "2-1/2": 5.135,
    "3": 7.922,
    "3-1/2": 10.584,
    "4": 13.631,
  },
  rmc: {
    "1/2": 0.314,
    "3/4": 0.549,
    "1": 0.887,
    "1-1/4": 1.526,
    "1-1/2": 2.071,
    "2": 3.408,
    "2-1/2": 4.866,
    "3": 7.499,
    "3-1/2": 10.01,
    "4": 12.882,
  },
  pvc40: {
    "1/2": 0.285,
    "3/4": 0.508,
    "1": 0.832,
    "1-1/4": 1.453,
    "1-1/2": 1.986,
    "2": 3.291,
    "2-1/2": 4.695,
    "3": 7.268,
    "3-1/2": 9.737,
    "4": 12.554,
  },
  pvc80: {
    "1/2": 0.217,
    "3/4": 0.409,
    "1": 0.688,
    "1-1/4": 1.237,
    "1-1/2": 1.711,
    "2": 2.874,
    "2-1/2": 4.119,
    "3": 6.442,
    "3-1/2": 8.688,
    "4": 11.258,
  },
};

export const THHN_AREA_IN2 = {
  14: 0.0097,
  12: 0.0133,
  10: 0.0211,
  8: 0.0366,
  6: 0.0507,
  4: 0.0824,
  3: 0.0973,
  2: 0.1158,
  1: 0.1562,
  "1/0": 0.1855,
  "2/0": 0.2223,
  "3/0": 0.2679,
  "4/0": 0.3237,
};

export const CIRCULAR_MILS = {
  14: 4110,
  12: 6530,
  10: 10380,
  8: 16510,
  6: 26240,
  4: 41740,
  3: 52620,
  2: 66360,
  1: 83690,
  "1/0": 105600,
  "2/0": 133100,
  "3/0": 167800,
  "4/0": 211600,
};

export const VD_K = {
  copper: 12.9,
  aluminum: 21.2,
};

export const WIRE_SIZE_ORDER = [
  "14",
  "12",
  "10",
  "8",
  "6",
  "4",
  "3",
  "2",
  "1",
  "1/0",
  "2/0",
  "3/0",
  "4/0",
];

export function fillLimitForCount(count) {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError("Conductor count must be an integer ≥ 0");
  }
  if (count === 0) return FILL_LIMITS.overTwo;
  if (count === 1) return FILL_LIMITS.one;
  if (count === 2) return FILL_LIMITS.two;
  return FILL_LIMITS.overTwo;
}

export function conduitArea(type, tradeSize) {
  const table = CONDUIT_AREA_IN2[type];
  if (!table) throw new RangeError(`Unknown conduit type: ${type}`);
  const area = table[tradeSize];
  if (area == null) throw new RangeError(`Unknown trade size: ${tradeSize}`);
  return area;
}

export function thhnArea(size) {
  const area = THHN_AREA_IN2[size];
  if (area == null) throw new RangeError(`Unknown THHN size: ${size}`);
  return area;
}

export function circularMils(size) {
  const cm = CIRCULAR_MILS[size];
  if (cm == null) throw new RangeError(`Unknown wire size: ${size}`);
  return cm;
}
