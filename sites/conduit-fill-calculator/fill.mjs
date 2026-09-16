import {
  conduitArea,
  fillLimitForCount,
  thhnArea,
} from "./nec-tables.mjs";

export function calculateConduitFill({ type, tradeSize, conductors }) {
  if (!Array.isArray(conductors) || conductors.length === 0) {
    throw new RangeError("Add at least one conductor group");
  }
  let count = 0;
  let conductorArea = 0;
  const groups = conductors.map((row) => {
    const qty = Number(row.qty);
    if (!Number.isInteger(qty) || qty < 0) {
      throw new RangeError("Each quantity must be an integer ≥ 0");
    }
    const each = thhnArea(row.size);
    count += qty;
    conductorArea += each * qty;
    return { size: String(row.size), qty, each, subtotal: each * qty };
  });
  const raceway = conduitArea(type, tradeSize);
  const limit = fillLimitForCount(count);
  const allowed = raceway * limit;
  const fill = conductorArea / raceway;
  return {
    type,
    tradeSize,
    count,
    conductorArea,
    raceway,
    limit,
    allowed,
    fill,
    ok: conductorArea <= allowed + 1e-12,
    groups,
  };
}
