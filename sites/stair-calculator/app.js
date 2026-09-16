import { planStairs } from "./stairs.mjs";

const form = document.querySelector("#calc");
const result = document.querySelector("#result");

function num(name) {
  const value = Number(form.elements.namedItem(name).value);
  if (!Number.isFinite(value)) throw new RangeError(`Enter a number for ${name}`);
  return value;
}

function run() {
  try {
    const data = planStairs({
      totalRiseIn: num("totalRiseIn"),
      targetRiserIn: num("targetRiserIn"),
      treadIn: num("treadIn"),
    });
    const notes = [];
    if (!data.ircRiserOk) notes.push("Riser is taller than the common 7.75 in IRC cap.");
    if (!data.ircTreadOk) notes.push("Tread is shallower than the common 10 in IRC minimum.");
    result.className = data.ircRiserOk && data.ircTreadOk ? "ok" : "bad";
    result.innerHTML = `
      <dl>
        <dt>Risers</dt><dd>${data.risers}</dd>
        <dt>Actual riser</dt><dd>${data.riser.toFixed(3)} in</dd>
        <dt>Treads</dt><dd>${data.treads}</dd>
        <dt>Total run</dt><dd>${data.totalRun.toFixed(2)} in</dd>
        <dt class="billable">Stringer</dt>
        <dd class="billable">${data.stringer.toFixed(2)} in</dd>
      </dl>
      <p>${notes.join(" ") || "Within the common IRC residential notes. Confirm locally."}</p>
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
