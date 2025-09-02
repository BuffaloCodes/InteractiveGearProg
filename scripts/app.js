const ACTIVE_TAB_KEY = "igp_active_tab";

function setActiveTab(name) {
  const panels = {
    milestones: document.getElementById("panel_milestones"),
    gear: document.getElementById("panel_gear")
  };
  const buttons = {
    milestones: document.getElementById("btn_milestones"),
    gear: document.getElementById("btn_gear")
  };
  Object.values(panels).forEach(p => p.classList.remove("active"));
  Object.values(buttons).forEach(b => b.classList.remove("active"));

  panels[name].classList.add("active");
  buttons[name].classList.add("active");

  try { localStorage.setItem(ACTIVE_TAB_KEY, name); } catch(e) {}
}

function getDefaultTab() {
  try {
    const s = localStorage.getItem(ACTIVE_TAB_KEY);
    if (s === "milestones" || s === "gear") return s;
  } catch(e) {}
  return "gear";
}

async function firstRender() {
  // render both once so switching is instant
  await renderChart({
    containerId: "chart_gear",
    itemsPath: "data/items.json",
    sequencePath: "data/sequence_gear.json"
  });

  await renderChart({
    containerId: "chart_milestones",
    itemsPath: "data/items.json",
    sequencePath: "data/sequence_milestones.json"
  });

  // show default tab
  setActiveTab(getDefaultTab());
}

document.addEventListener("DOMContentLoaded", () => {
  // wire clicks
  document.getElementById("btn_milestones").addEventListener("click", () => setActiveTab("milestones"));
  document.getElementById("btn_gear").addEventListener("click", () => setActiveTab("gear"));

  // initial render
  firstRender();
});
