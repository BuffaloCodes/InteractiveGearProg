/**
 * Global storage for item and node data.
 * - itemsData: maps item names to their metadata
 * - nodegroups: array of columns, each column is an array of nodes
 */
let itemsData = {};
let nodegroups = [];

/** Bump when changing cache format */
const CACHE_VERSION = "2.0.0";

/** Resolve a cache key that is unique per active sequence file */
function cacheKey(name) {
  const seq = (typeof window !== "undefined" && window.SEQUENCE_FILE) || "data/sequence.json";
  return `${name}::${seq}::${CACHE_VERSION}`;
}

/** Sanitize a string for an element id */
function sanitizeId(name) {
  return name.replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").toLowerCase();
}

/** Build a DOM node for a normal item */
function handle_item(node) {
  const nodeDiv = document.createElement("div");
  nodeDiv.classList.add("node");

  const itemData = itemsData[node];
  if (!itemData) {
    console.warn(`Missing data for item: ${node}`);
    return null;
  }

  const basePath = window.location.hostname.includes("github.io") ? "/InteractiveGearProg/" : "/";

  const img = document.createElement("img");
  img.src = basePath + itemData.imgSrc;
  img.alt = node;

  nodeDiv.title = node;
  nodeDiv.id = sanitizeId(node);
  nodeDiv.appendChild(img);
  nodeDiv.dataset.wikiLink = itemData.wikiLink;

  return nodeDiv;
}

/** Build a DOM node for a skill milestone like '70 Agility' */
function handle_skill(node) {
  const nodeDiv = document.createElement("div");
  nodeDiv.classList.add("node");

  const parts = node.split(" ");
  const lvlNum = parts[0];
  const skillName = parts.slice(1).join(" ");
  const skillNameUppercase = skillName.charAt(0).toUpperCase() + skillName.slice(1);

  const basePath = window.location.hostname.includes("github.io") ? "/InteractiveGearProg/" : "/";

  const skillDiv = document.createElement("div");
  skillDiv.classList.add("skill");

  const img = document.createElement("img");
  img.src = basePath + `images/${skillNameUppercase}_icon.webp`;

  const span = document.createElement("span");
  span.textContent = lvlNum;

  skillDiv.appendChild(img);
  skillDiv.appendChild(span);

  nodeDiv.alt = `Get ${lvlNum} ${skillName}`;
  nodeDiv.title = `Get ${lvlNum} ${skillName}`;
  nodeDiv.id = "lvl-" + sanitizeId(node);
  nodeDiv.appendChild(skillDiv);

  // optional wiki link if provided
  const itemData = itemsData[node];
  if (itemData && itemData.wikiLink) nodeDiv.dataset.wikiLink = itemData.wikiLink;

  return nodeDiv;
}

/** Build a DOM node for a group header */
function handle_header(text) {
  const h = document.createElement("h2");
  h.textContent = text;
  h.classList.add("milestone-header");
  return h;
}

/** Render the columns with arrows between them */
function renderChart(chartContainer) {
  if (!chartContainer) {
    console.error("No valid chart container provided.");
    return;
  }

  chartContainer.innerHTML = "";

  nodegroups.forEach((nodegroup, idx) => {
    const nodeGroupDiv = document.createElement("div");
    nodeGroupDiv.classList.add("node-group");

    nodegroup.forEach(node => {
      // header marker
      if (node && typeof node === "object" && node.__header) {
        nodeGroupDiv.appendChild(handle_header(node.__header));
        return;
      }
      // skill or item
      const firstChar = String(node).charAt(0);
      const el = !isNaN(firstChar) ? handle_skill(node) : handle_item(node);
      if (el) nodeGroupDiv.appendChild(el);
    });

    chartContainer.appendChild(nodeGroupDiv);

    if (idx !== nodegroups.length - 1) {
      const arrowDiv = document.createElement("div");
      arrowDiv.classList.add("arrow");
      arrowDiv.textContent = "→";
      chartContainer.appendChild(arrowDiv);
    }
  });

  // cache per sequence file
  try {
    localStorage.setItem(cacheKey("cachedChart"), chartContainer.innerHTML);
  } catch (e) {
    // ignore
  }
}

/** Normalize different sequence shapes into columns */
function normalizeSequenceToGroups(sequenceJson) {
  // Case 1: grouped milestones with explicit groups array
  if (sequenceJson && Array.isArray(sequenceJson.groups)) {
    // each group becomes its own column, with a header marker at the top
    return sequenceJson.groups.map(g => {
      const col = [{ __header: g.name }];
      if (Array.isArray(g.items)) col.push(...g.items);
      return col;
    });
  }

  // Case 2: plain array is a single column
  if (Array.isArray(sequenceJson)) {
    return [sequenceJson];
  }

  // Case 3: object of arrays like original sequence.json
  if (sequenceJson && typeof sequenceJson === "object") {
    const vals = Object.values(sequenceJson);
    // ensure arrays
    return vals.map(v => (Array.isArray(v) ? v : []));
  }

  console.warn("Unknown sequence format. Falling back to empty.");
  return [[]];
}

/** Load items and sequence, then prepare nodegroups */
async function loadDataAndPrepare() {
  const items = await fetch("data/items.json").then(res => res.json());
  const sequence = await fetch("data/sequence.json").then(res => res.json());
  itemsData = items;
  nodegroups = normalizeSequenceToGroups(sequence);
}

/** Load from cache if compatible with current sequence selection */
function tryLoadFromCache(chartContainer) {
  try {
    const cached = localStorage.getItem(cacheKey("cachedChart"));
    if (cached) {
      chartContainer.innerHTML = cached;
      return true;
    }
  } catch (e) {
    // ignore
  }
  return false;
}

/** Save and restore node states in a shared store used by both tabs */
function saveNodeState(node) {
  const savedStates = JSON.parse(localStorage.getItem("sharedNodeStates")) || {};
  savedStates[node.id] = parseInt(node.dataset.state);
  localStorage.setItem("sharedNodeStates", JSON.stringify(savedStates));
}

function updateNodeVisualState(node) {
  node.classList.remove("state-0", "state-1", "state-2");
  const state = parseInt(node.dataset.state) || 0;
  node.classList.add(`state-${state}`);
}

function initializeNodeStates() {
  const chartContainer = document.getElementById("chart-container");
  if (!chartContainer) return;

  const savedStates = JSON.parse(localStorage.getItem("sharedNodeStates")) || {};

  chartContainer.addEventListener("click", event => {
    const node = event.target.closest(".node");
    if (!node) return;

    const currentState = parseInt(node.dataset.state) || 0;
    const nextState = currentState === 1 ? 0 : 1;
    node.dataset.state = nextState;

    updateNodeVisualState(node);
    saveNodeState(node);
  });

  // apply saved states to any nodes that exist now
  for (const nodeId in savedStates) {
    const node = document.getElementById(nodeId);
    if (node) {
      node.dataset.state = savedStates[nodeId];
      updateNodeVisualState(node);
    }
  }
}

/** Prevent dragging images within the chart */
function preventDragging() {
  const el = document.getElementById("chart-container");
  if (!el) return;
  el.addEventListener("dragstart", event => {
    if (event.target.tagName === "IMG") event.preventDefault();
  });
}

/** Entry point */
async function init() {
  const chartContainer = document.getElementById("chart-container");
  if (!chartContainer) {
    console.error("No element with ID 'chart-container' found.");
    return;
  }

  // use cache if present for the active sequence file
  if (tryLoadFromCache(chartContainer)) {
    initializeNodeStates();
    preventDragging();
    return;
  }

  try {
    await loadDataAndPrepare();
    renderChart(chartContainer);
    initializeNodeStates();
    preventDragging();
  } catch (err) {
    console.error("Failed to load data:", err);
  }
}

document.addEventListener("DOMContentLoaded", init);
