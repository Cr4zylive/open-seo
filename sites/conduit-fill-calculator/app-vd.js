import { voltageDrop } from "./voltage-drop.mjs";

const form = document.querySelector("#calc");
const result = document.querySelector("#result");

function num(name) {
  const value = Number(form.elements.namedItem(name).value);
  if (!Number.isFinite(value)) throw new RangeError(`Enter a number for ${name}`);
  return value;
}

function run() {
  try {
    const data = voltageDrop({
      phase: form.elements.namedItem("phase").value,
      material: form.elements.namedItem("material").value,
      size: form.elements.namedItem("size").value,
      amps: num("amps"),
      feet: num("feet"),
      volts: num("volts"),
    });
    result.className = data.percent <= 3 ? "ok" : "bad";
    result.innerHTML = `
      <dl>
        <dt>Circular mils</dt><dd>${data.circularMils.toLocaleString("en-US")}</dd>
        <dt>Voltage drop</dt><dd>${data.voltsDropped.toFixed(2)} V</dd>
        <dt class="billable">Percent</dt>
        <dd class="billable">${data.percent.toFixed(2)}%</dd>
      </dl>
      <p>Highlighted against a 3% branch-circuit note only. Your spec may differ.</p>
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
