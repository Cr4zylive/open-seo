import { calculateUpsDimWeight } from "./dim-weight.mjs";

const form = document.querySelector("#calc");
const result = document.querySelector("#result");

function num(name) {
  const raw = form.elements.namedItem(name).value;
  const value = Number(raw);
  if (raw.trim() === "" || !Number.isFinite(value)) {
    throw new RangeError(`Enter a number for ${name}`);
  }
  return value;
}

function render(data) {
  const charged =
    data.chargedBy === "dimensional"
      ? "Dimensional weight (the carton is light for its size)"
      : data.chargedBy === "actual"
        ? "Actual weight (the carton is dense enough that DIM does not apply)"
        : "Actual and dimensional weight are the same";

  result.innerHTML = `
    <dl>
      <dt>Rounded size</dt>
      <dd>${data.length} × ${data.width} × ${data.height} in</dd>
      <dt>Cubic inches</dt>
      <dd>${data.cubic.toLocaleString("en-US")}</dd>
      <dt>Divisor</dt>
      <dd>${data.divisor} (${data.rateType} rates)</dd>
      <dt>Dimensional weight</dt>
      <dd>${data.dimensional} lb</dd>
      <dt>Actual weight (rounded up)</dt>
      <dd>${data.actual} lb</dd>
      <dt class="billable">Billable weight</dt>
      <dd class="billable">${data.billable} lb</dd>
    </dl>
    <p>${charged}. This is not a UPS quote — contracts and extra fees can change the invoice.</p>
  `;
  result.hidden = false;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const data = calculateUpsDimWeight({
      lengthIn: num("length"),
      widthIn: num("width"),
      heightIn: num("height"),
      actualPounds: num("actual"),
      rateType: form.elements.namedItem("rateType").value,
    });
    render(data);
  } catch (error) {
    result.hidden = false;
    result.innerHTML = `<p>${error instanceof Error ? error.message : "Could not calculate."}</p>`;
  }
});
