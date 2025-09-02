// Shared progress, one save for all tabs
const SAVE_KEY = "sharedNodeStatesV1";

// Utility
function sanitizeId(name) {
  return name.replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").toLowerCase();
}
function isSkillToken(s) {
  const first = String(s).charAt(0);
  return !isNaN(first);
}

// Build nodes
function buildItemNode(name, itemData, basePath) {
  const div = document.createElement("div");
  div.className = "node";
  div.id = sanitizeId(name);
  div.title = name;

  const data = itemData[name];
  if (!data) {
    console.warn("Missing item data for", name);
    div.textContent = name;
    return div;
  }

  const img = document.createElement("img");
  img.src = basePath + data.imgSrc;
  img.alt = name;
  div.appendChild(img);

  if (data.wikiLink) div.dataset.wikiLink = data.wikiLink;
  return div;
}
function buildSkillNode(token, basePath) {
  const parts = token.split(" ");
  const lvl = parts[0];
  const skillName = parts.slice(1).join(" ");
  const pretty = skillName.charAt(0).toUpperCase() + skillName.slice(1);

  const node = document.createElement("div");
  node.className = "node";
  node.id = "lvl-" + sanitizeId(token);
  node.title = `Get ${lvl} ${skillName}`;

  const wrap = document.createElement("div");
  wrap.className = "skill";

  const img = document.createElement("img");
  img.src = basePath + `images/${pretty}_icon.webp`;

  const span = document.createElement("span");
  span.textContent = lvl;

  wrap.appendChild(img);
  wrap.appendChild(span);
  node.appendChild(wrap);
  return node;
}
function buildHeader(text) {
  const h = document.createElement("h2");
  h.textContent = text;
  h.className = "milestone-header";
  return h;
}

// State
function loadSavedStates() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; }
  catch(e) { return {}; }
}
function saveStates(map) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(map)); } catch(e) {}
}
function applyStateToNodes(container, saved) {
  const nodes = container.querySelectorAll(".node");
  nodes.forEach(node => {
    const id = node.id;
    const st = saved[id] || 0;
    node.dataset.state = st;
    node.classList.remove("state-0","state-1","state-2");
    node.classList.add(`state-${st}`);
  });
}
function attachClickToggle(container, saved) {
  container.addEventListener("click", ev => {
    const node = ev.target.closest(".node");
    if (!node) return;
    const cur = parseInt(node.dataset.state) || 0;
    const next = cur === 1 ? 0 : 1;
    node.dataset.state = next;
    node.classList.remove("state-0","state-1","state-2");
    node.classList.add(`state-${next}`);
    saved[node.id] = next;
    saveStates(saved);
  });
  container.addEventListener("dragstart", ev => {
    if (ev.target.tagName === "IMG") ev.preventDefault();
  });
}

// Sequence normalization
function normalizeSequence(seqJson) {
  // grouped milestones
  if (seqJson && Array.isArray(seqJson.groups)) {
    return seqJson.groups.map(g => {
      const col = [{ __header: g.name }];
      if (Array.isArray(g.items)) col.push(...g.items);
      return col;
    });
  }
  // flat array becomes a single column
  if (Array.isArray(seqJson)) return [seqJson];

  // object of arrays becomes multiple columns
  if (seqJson && typeof seqJson === "object") {
    return Object.values(seqJson).map(v => Array.isArray(v) ? v : []);
  }
  return [[]];
}

// Main render
async function renderChart({ containerId, itemsPath, sequencePath }) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error("renderChart could not find container", containerId);
    return;
  }
  container.innerHTML = "";

  const basePath = window.location.hostname.includes("github.io")
    ? "/InteractiveGearProg/"
    : "/";

  const [itemsJson, seqJson] = await Promise.all([
    fetch(itemsPath).then(r => r.json()),
    fetch(sequencePath).then(r => r.json())
  ]);

  const groups = normalizeSequence(seqJson);
  const saved = loadSavedStates();

  groups.forEach((col, colIndex) => {
    const colDiv = document.createElement("div");
    colDiv.className = "node-group";

    col.forEach(entry => {
      if (entry && typeof entry === "object" && entry.__header) {
        colDiv.appendChild(buildHeader(entry.__header));
        return;
      }
      const node = isSkillToken(entry)
        ? buildSkillNode(entry, basePath)
        : buildItemNode(entry, itemsJson, basePath);
      colDiv.appendChild(node);
    });

    container.appendChild(colDiv);

    if (colIndex !== groups.length - 1) {
      const arrowDiv = document.createElement("div");
      arrowDiv.className = "arrow";
      arrowDiv.textContent = "→";
      container.appendChild(arrowDiv);
    }
  });

  applyStateToNodes(container, saved);
  attachClickToggle(container, saved);
}

// export for app.js
window.renderChart = renderChart;
