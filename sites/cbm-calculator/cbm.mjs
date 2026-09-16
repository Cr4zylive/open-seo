const TO_METERS = {
  m: 1,
  cm: 0.01,
  in: 0.0254,
};

export function calculateCbm({ length, width, height, qty = 1, unit = "cm" }) {
  const scale = TO_METERS[unit];
  if (!scale) throw new RangeError('unit must be "cm", "m", or "in"');
  const dims = [length, width, height, qty];
  if (dims.some((n) => typeof n !== "number" || !Number.isFinite(n) || n < 0)) {
    throw new RangeError("Dimensions and quantity must be finite numbers ≥ 0");
  }
  if (qty === 0) {
    return { length, width, height, qty, unit, meters: [0, 0, 0], each: 0, cbm: 0 };
  }
  const meters = [length * scale, width * scale, height * scale];
  const each = meters[0] * meters[1] * meters[2];
  return {
    length,
    width,
    height,
    qty,
    unit,
    meters,
    each,
    cbm: each * qty,
  };
}
