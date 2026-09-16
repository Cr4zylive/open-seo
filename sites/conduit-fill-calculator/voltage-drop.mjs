import { VD_K, circularMils } from "./nec-tables.mjs";

export function voltageDrop({
  phase,
  material,
  size,
  amps,
  feet,
  volts,
}) {
  if (phase !== "1" && phase !== "3") {
    throw new RangeError('phase must be "1" or "3"');
  }
  const k = VD_K[material];
  if (!k) throw new RangeError('material must be "copper" or "aluminum"');
  if (![amps, feet, volts].every((n) => typeof n === "number" && n > 0)) {
    throw new RangeError("amps, feet, and volts must be finite numbers > 0");
  }
  const cm = circularMils(size);
  const multiplier = phase === "3" ? Math.sqrt(3) : 2;
  const voltsDropped = (multiplier * k * amps * feet) / cm;
  return {
    phase,
    material,
    size: String(size),
    amps,
    feet,
    volts,
    circularMils: cm,
    k,
    voltsDropped,
    percent: (voltsDropped / volts) * 100,
  };
}
