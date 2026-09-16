import { calculateCbm } from "./cbm.mjs";

const form = document.querySelector("#calc");
const result = document.querySelector("#result");

function num(name) {
  const value = Number(form.elements.namedItem(name).value);
  if (!Number.isFinite(value)) throw new RangeError(`Enter a number for ${name}`);
  return value;
}

function run() {
  try {
    const data = calculateCbm({
      length: num("length"),
      width: num("width"),
      height: num("height"),
      qty: num("qty"),
      unit: form.elements.namedItem("unit").value,
    });
    result.className = "";
    result.innerHTML = `
      <dl>
        <dt>One carton</dt><dd>${data.each.toFixed(4)} m³</dd>
        <dt>Quantity</dt><dd>${data.qty}</dd>
        <dt class="billable">Total CBM</dt>
        <dd class="billable">${data.cbm.toFixed(4)} m³</dd>
      </dl>
      <p>Not a freight quote. Carriers may still apply a different chargeable rule.</p>
    `;
    result.hidden = false;
  } catch (error) {
    result.className = "bad";
    result.hidden = false;
    result.innerHTML = `<p>${error instanceof Error ? error.message : "Could not calculate."}</p>`;
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  run();
});
form.addEventListener("input", run);
run();
