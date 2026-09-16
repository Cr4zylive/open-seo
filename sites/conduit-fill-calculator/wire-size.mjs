import { WIRE_SIZE_ORDER } from "./nec-tables.mjs";
import { voltageDrop } from "./voltage-drop.mjs";

export function recommendWireSize({
  phase,
  material,
  amps,
  feet,
  volts,
  maxPercent,
}) {
  if (typeof maxPercent !== "number" || maxPercent <= 0) {
    throw new RangeError("maxPercent must be a number > 0");
  }
  for (const size of WIRE_SIZE_ORDER) {
    const row = voltageDrop({ phase, material, size, amps, feet, volts });
    if (row.percent <= maxPercent + 1e-9) {
      return { ...row, maxPercent, ok: true };
    }
  }
  const last = voltageDrop({
    phase,
    material,
    size: "4/0",
    amps,
    feet,
    volts,
  });
  return { ...last, maxPercent, ok: false };
}
