import { recommendWireSize } from "./wire-size.mjs";

const form = document.querySelector("#calc");
const result = document.querySelector("#result");

function num(name) {
  const value = Number(form.elements.namedItem(name).value);
  if (!Number.isFinite(value)) throw new RangeError(`Enter a number for ${name}`);
  return value;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const data = recommendWireSize({
      phase: form.elements.namedItem("phase").value,
      material: form.elements.namedItem("material").value,
      amps: num("amps"),
      feet: num("feet"),
      volts: num("volts"),
      maxPercent: num("maxPercent"),
    });
    result.className = data.ok ? "ok" : "bad";
    result.innerHTML = `
      <dl>
        <dt>Smallest size in table</dt>
        <dd>${data.ok ? `${data.size} AWG` : "over 4/0"}</dd>
        <dt>Voltage drop</dt><dd>${data.voltsDropped.toFixed(2)} V</dd>
        <dt class="billable">Percent</dt>
        <dd class="billable">${data.percent.toFixed(2)}%</dd>
      </dl>
      <p>Drop only. Check ampacity before you pull the wire.</p>
    `;
    result.hidden = false;
  } catch (error) {
    result.className = "bad";
    result.hidden = false;
    result.innerHTML = `<p>${error instanceof Error ? error.message : "Could not calculate."}</p>`;
  }
});
