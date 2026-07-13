const form = document.getElementById("prdForm");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");
const generateBtn = document.getElementById("generateBtn");
const downloadBtn = document.getElementById("downloadBtn");

let lastResult = null;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const problemStatement = document.getElementById("problemStatement").value;
  const features = document.getElementById("features").value;

  generateBtn.disabled = true;
  generateBtn.textContent = "Generating\u2026";
  statusEl.textContent = "Calling Claude \u2014 usually takes 10\u201320 seconds.";
  statusEl.className = "status";
  resultsEl.classList.add("hidden");

  try {
    const res = await fetch("/api/generate-prd", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problemStatement, features }),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Something went wrong.");
    }

    lastResult = data;
    renderResults(data);
    statusEl.textContent = "";
    resultsEl.classList.remove("hidden");
  } catch (err) {
    statusEl.textContent = err.message;
    statusEl.className = "status error";
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "Generate PRD";
  }
});

function renderResults(data) {
  document.getElementById("goalOut").textContent = data.goal || "\u2014";

  const metricsOut = document.getElementById("metricsOut");
  metricsOut.innerHTML = "";
  (data.successMetrics || []).forEach((m) => {
    const li = document.createElement("li");
    li.textContent = m;
    metricsOut.appendChild(li);
  });

  const storiesOut = document.getElementById("storiesOut");
  storiesOut.innerHTML = "";
  (data.userStories || []).forEach((s) => {
    const li = document.createElement("li");
    li.textContent = s;
    storiesOut.appendChild(li);
  });

  const riceOut = document.getElementById("riceOut");
  riceOut.innerHTML = "";
  (data.prioritization || []).forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(row.feature)}</td>
      <td class="num">${row.reach}</td>
      <td class="num">${row.impact}</td>
      <td class="num">${row.confidence}</td>
      <td class="num">${row.effort}</td>
      <td class="num rice-score">${row.riceScore}</td>
      <td>${escapeHtml(row.rationale)}</td>
    `;
    riceOut.appendChild(tr);
  });

  const risksOut = document.getElementById("risksOut");
  risksOut.innerHTML = "";
  (data.risks || []).forEach((r) => {
    const li = document.createElement("li");
    li.textContent = r;
    risksOut.appendChild(li);
  });

  const roadmapOut = document.getElementById("roadmapOut");
  roadmapOut.innerHTML = "";
  (data.roadmap || []).forEach((phase) => {
    const div = document.createElement("div");
    div.className = "roadmap-phase";
    div.innerHTML = `<span class="phase-label">${escapeHtml(phase.phase)}</span>${escapeHtml(phase.focus)}`;
    roadmapOut.appendChild(div);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

downloadBtn.addEventListener("click", () => {
  if (!lastResult) return;
  const md = toMarkdown(lastResult);
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "prd.md";
  a.click();
  URL.revokeObjectURL(url);
});

function toMarkdown(data) {
  const lines = [];
  lines.push(`# Product Brief\n`);
  lines.push(`## Goal\n${data.goal}\n`);
  lines.push(`## Success Metrics`);
  (data.successMetrics || []).forEach((m) => lines.push(`- ${m}`));
  lines.push("");
  lines.push(`## User Stories`);
  (data.userStories || []).forEach((s) => lines.push(`- ${s}`));
  lines.push("");
  lines.push(`## Prioritization (RICE)`);
  lines.push(`| Feature | Reach | Impact | Confidence | Effort | RICE | Rationale |`);
  lines.push(`|---|---|---|---|---|---|---|`);
  (data.prioritization || []).forEach((r) => {
    lines.push(`| ${r.feature} | ${r.reach} | ${r.impact} | ${r.confidence} | ${r.effort} | ${r.riceScore} | ${r.rationale} |`);
  });
  lines.push("");
  lines.push(`## Risks & Assumptions`);
  (data.risks || []).forEach((r) => lines.push(`- ${r}`));
  lines.push("");
  lines.push(`## Roadmap`);
  (data.roadmap || []).forEach((p) => lines.push(`- **${p.phase}**: ${p.focus}`));
  return lines.join("\n");
}
