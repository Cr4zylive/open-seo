// UPS published dimensional-weight rules (US Daily vs Retail).
// Source: UPS "Shipping Dimensions and Weight" support page.
// Dimensions: nearest whole inch. DIM weight: any fraction goes up to the
// next whole pound. Billable weight is the greater of actual and DIM.

export const UPS_DIM_DIVISORS = {
  daily: 139,
  retail: 166,
};

export function roundDimensionInches(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new RangeError(
      "Each dimension must be a finite number of inches ≥ 0",
    );
  }
  return Math.round(value);
}

export function ceilPounds(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new RangeError("Weight must be a finite number of pounds ≥ 0");
  }
  if (value === 0) return 0;
  return Math.ceil(value - 1e-9);
}

export function cubicInches(lengthIn, widthIn, heightIn) {
  const length = roundDimensionInches(lengthIn);
  const width = roundDimensionInches(widthIn);
  const height = roundDimensionInches(heightIn);
  return {
    length,
    width,
    height,
    cubic: length * width * height,
  };
}

export function dimensionalWeightPounds(lengthIn, widthIn, heightIn, divisor) {
  if (!Number.isInteger(divisor) || divisor <= 0) {
    throw new RangeError("Divisor must be a positive integer");
  }
  const box = cubicInches(lengthIn, widthIn, heightIn);
  const raw = box.cubic / divisor;
  return {
    ...box,
    divisor,
    rawDimensionalWeight: raw,
    dimensionalWeight: ceilPounds(raw),
  };
}

export function billableWeightPounds(actualPounds, dimensionalPounds) {
  if (
    typeof actualPounds !== "number" ||
    !Number.isFinite(actualPounds) ||
    actualPounds < 0
  ) {
    throw new RangeError("Actual weight must be a finite number of pounds ≥ 0");
  }
  const actual = ceilPounds(actualPounds);
  const dimensional = ceilPounds(dimensionalPounds);
  const billable = Math.max(actual, dimensional);
  return {
    actual,
    dimensional,
    billable,
    chargedBy:
      billable === actual && billable === dimensional
        ? "tie"
        : billable === dimensional
          ? "dimensional"
          : "actual",
  };
}

export function calculateUpsDimWeight({
  lengthIn,
  widthIn,
  heightIn,
  actualPounds,
  rateType,
}) {
  const divisor = UPS_DIM_DIVISORS[rateType];
  if (!divisor) {
    throw new RangeError('rateType must be "daily" or "retail"');
  }
  const dim = dimensionalWeightPounds(lengthIn, widthIn, heightIn, divisor);
  const billed = billableWeightPounds(actualPounds, dim.dimensionalWeight);
  return { rateType, ...dim, ...billed };
}
