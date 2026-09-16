import { calculateConduitFill } from "./fill.mjs";

const form = document.querySelector("#calc");
const result = document.querySelector("#result");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const qty = Number(form.elements.namedItem("qty").value);
    const data = calculateConduitFill({
      type: form.elements.namedItem("type").value,
      tradeSize: form.elements.namedItem("tradeSize").value,
      conductors: [{ size: form.elements.namedItem("size").value, qty }],
    });
    const pct = (data.fill * 100).toFixed(1);
    const allowedPct = (data.limit * 100).toFixed(0);
    result.className = data.ok ? "ok" : "bad";
    result.innerHTML = `
      <dl>
        <dt>Conductors</dt><dd>${data.count}</dd>
        <dt>Conductor area</dt><dd>${data.conductorArea.toFixed(4)} in²</dd>
        <dt>Raceway area</dt><dd>${data.raceway.toFixed(3)} in²</dd>
        <dt>Allowed</dt><dd>${allowedPct}% = ${data.allowed.toFixed(4)} in²</dd>
        <dt class="billable">Fill</dt>
        <dd class="billable">${pct}% ${data.ok ? "OK" : "over fill"}</dd>
      </dl>
      <p>Not a code check for your job. Confirm against the NEC edition on site.</p>
    `;
    result.hidden = false;
  } catch (error) {
    result.className = "bad";
    result.hidden = false;
    result.innerHTML = `<p>${error instanceof Error ? error.message : "Could not calculate."}</p>`;
  }
});
