(async function () {
  const manifestPath = window.DESIGN_PREVIEWER_MANIFEST_PATH || "./design_previewer/manifest.json";

  const titleEl = document.getElementById("appTitle");
  const descriptionEl = document.getElementById("appDescription");
  const tabsEl = document.getElementById("tabs");
  const treeEl = document.getElementById("tree");
  const previewEl = document.getElementById("preview");
  const activeTitleEl = document.getElementById("activeTitle");
  const activePathEl = document.getElementById("activePath");
  const openDirectEl = document.getElementById("openDirect");

  if (!tabsEl || !treeEl || !previewEl || !activeTitleEl || !activePathEl || !openDirectEl) {
    return;
  }

  // Width the design is laid out at before being scaled to fit the pane.
  // Without this the frame is only as wide as the pane, so a desktop design
  // REFLOWS into a narrow layout instead of shrinking, and two designs cannot
  // be compared against each other.
  const logicalWidth = window.DESIGN_PREVIEWER_LOGICAL_WIDTH || 1600;

  const layoutEl = document.querySelector(".layout");
  const headerEl = document.querySelector(".preview-header, .preview-head");

  const stageEl = document.createElement("div");
  stageEl.className = "zoom-stage";
  previewEl.parentNode.insertBefore(stageEl, previewEl);
  stageEl.appendChild(previewEl);

  const zoomReadoutEl = document.createElement("span");
  zoomReadoutEl.className = "zoom-readout";

  // "fit" is recomputed whenever the pane resizes; a number is a fixed scale.
  let zoomMode = "fit";

  function applyZoom() {
    const scale = zoomMode === "fit"
      ? Math.min(1, stageEl.clientWidth / logicalWidth)
      : zoomMode;

    previewEl.style.width = `${logicalWidth}px`;
    // A scaled element keeps its unscaled height for layout, so the height has
    // to be divided back up or the bottom of the design is unreachable.
    previewEl.style.height = `${stageEl.clientHeight / scale}px`;
    previewEl.style.transform = `scale(${scale})`;
    zoomReadoutEl.textContent = `${Math.round(scale * 100)}%`;
  }

  function buildZoomControls() {
    if (!headerEl) {
      return;
    }

    const controlsEl = document.createElement("div");
    controlsEl.className = "zoom-controls";

    const zoomButtons = [];

    [["Fit", "fit"], ["50%", 0.5], ["75%", 0.75], ["100%", 1]].forEach(([label, mode]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.addEventListener("click", () => {
        zoomMode = mode;
        zoomButtons.forEach((other) => other.classList.toggle("is-active", other === button));
        applyZoom();
      });
      zoomButtons.push(button);
      controlsEl.appendChild(button);
    });

    zoomButtons[0].classList.add("is-active");
    controlsEl.appendChild(zoomReadoutEl);

    if (layoutEl) {
      const sidebarButton = document.createElement("button");
      sidebarButton.type = "button";
      sidebarButton.textContent = "Sidebar";
      sidebarButton.addEventListener("click", () => {
        sidebarButton.classList.toggle(
          "is-active",
          layoutEl.classList.toggle("sidebar-collapsed")
        );
        applyZoom();
      });
      controlsEl.appendChild(sidebarButton);
    }

    headerEl.appendChild(controlsEl);
  }

  buildZoomControls();
  window.addEventListener("resize", applyZoom);
  previewEl.addEventListener("load", applyZoom);
  applyZoom();

  function normalizePath(pathValue) {
    return String(pathValue || "").replace(/\\/g, "/");
  }

  let manifest;

  try {
    const response = await fetch(manifestPath, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load manifest: ${response.status}`);
    }
    manifest = await response.json();
  } catch (error) {
    tabsEl.innerHTML = "";
    treeEl.innerHTML = `<div class="group"><h2>Error</h2><div class="design-btn is-active">${String(error.message || error)}</div></div>`;
    return;
  }

  const versions = Array.isArray(manifest.versions) ? manifest.versions : [];
  if (!versions.length) {
    treeEl.innerHTML = "<div class=\"group\"><h2>No designs found</h2></div>";
    return;
  }

  if (titleEl) {
    titleEl.textContent = manifest.title || "Design Previewer";
  }

  if (descriptionEl) {
    descriptionEl.textContent = manifest.description || "Discover and preview designs without leaving this page.";
  }

  let activeVersionKey = versions[0].key;
  let activePath = "";

  function firstItemForVersion(versionKey) {
    const version = versions.find((entry) => entry.key === versionKey);
    if (!version || !Array.isArray(version.groups)) {
      return null;
    }

    for (const group of version.groups) {
      if (group && Array.isArray(group.items) && group.items.length) {
        return group.items[0];
      }
    }

    return null;
  }

  const IFRAME_SCROLLBAR_CSS = [
    "* { scrollbar-width: thin; scrollbar-color: #2a3547 transparent; }",
    "::-webkit-scrollbar { width: 8px; height: 8px; }",
    "::-webkit-scrollbar-track { background: transparent; }",
    "::-webkit-scrollbar-thumb { background: #2a3547; border-radius: 4px; }",
    "::-webkit-scrollbar-thumb:hover { background: #a6b3c8; }",
  ].join("\n");

  function injectScrollbarStyles() {
    try {
      const doc = previewEl.contentDocument;
      if (!doc || !doc.head) {
        return;
      }

      const style = doc.createElement("style");
      style.textContent = IFRAME_SCROLLBAR_CSS;
      doc.head.appendChild(style);
    } catch (_) {
      // Cross-origin iframe — skip silently.
    }
  }

  previewEl.addEventListener("load", injectScrollbarStyles);
  function setPreview(item) {
    if (!item || !item.path) {
      return;
    }

    const normalizedPath = normalizePath(item.path);
    activePath = normalizedPath;
    activeTitleEl.textContent = item.title || normalizedPath;
    activePathEl.textContent = normalizedPath;
    openDirectEl.href = normalizedPath;
    previewEl.src = normalizedPath;
    renderTree();
  }

  function renderTabs() {
    tabsEl.innerHTML = versions.map((version) => {
      const activeClass = version.key === activeVersionKey ? "is-active" : "";
      return `<button class="tab ${activeClass}" type="button" data-tab="${version.key}">${version.label || version.key}</button>`;
    }).join("");
  }

  function renderTree() {
    const activeVersion = versions.find((entry) => entry.key === activeVersionKey);
    if (!activeVersion || !Array.isArray(activeVersion.groups)) {
      treeEl.innerHTML = "";
      return;
    }

    treeEl.innerHTML = activeVersion.groups.map((group) => {
      const items = Array.isArray(group.items) ? group.items : [];
      const itemHtml = items.map((item) => {
        const normalizedPath = normalizePath(item.path);
        const activeClass = normalizedPath === activePath ? "is-active" : "";
        const title = item.title || normalizedPath;
        return `<button class="design-btn ${activeClass}" type="button" data-path="${normalizedPath}" data-title="${title.replace(/"/g, "&quot;")}">${title}</button>`;
      }).join("");

      return `<section class="group"><h2>${group.label || "Group"}</h2>${itemHtml}</section>`;
    }).join("");
  }

  tabsEl.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tab]");
    if (!button) {
      return;
    }

    activeVersionKey = button.dataset.tab;
    renderTabs();

    const first = firstItemForVersion(activeVersionKey);
    if (first) {
      setPreview(first);
      return;
    }

    renderTree();
  });

  treeEl.addEventListener("click", (event) => {
    const button = event.target.closest("[data-path]");
    if (!button) {
      return;
    }

    setPreview({
      title: button.dataset.title || button.dataset.path,
      path: button.dataset.path
    });
  });

  renderTabs();
  renderTree();

  const first = firstItemForVersion(activeVersionKey);
  if (first) {
    setPreview(first);
  }
})();
