import {
  ADD_ONS,
  FILM_PRESETS,
  FRAME_STYLES,
  MONETIZATION_PACKAGES,
  RATIO_OPTIONS,
  ROOM_TYPES,
  SURFACE_THEMES,
  TIMER_OPTIONS,
  createPhoto,
  createRoom,
  getDailyPrompt,
  getFrameById,
  getPresetById,
  getRoomTypeById,
  getThemeById,
} from "./data.js";
import { RetroCamera } from "./camera.js";
import {
  buildCollageCanvas,
  buildShareCardCanvas,
  buildSinglePolaroidCanvas,
  buildStripCanvas,
  downloadCanvas,
  openPrintGuestbook,
} from "./exporters.js";
import { buildUiPhotoAssets } from "./image-processor.js";
import {
  addRoom,
  cloneState,
  createInitialState,
  findRoomByCode,
  loadState,
  replaceRoom,
  saveState,
  setActiveRoom,
} from "./store.js";

const STORAGE_DEBOUNCE_MS = 140;

let cachedStageRect = null;
let stageRectDirty = true;

function getStageRect() {
  if (!cachedStageRect || stageRectDirty) {
    cachedStageRect = elements.polaroidLayer.getBoundingClientRect();
    stageRectDirty = false;
  }
  return cachedStageRect;
}

function invalidateStageRect() {
  stageRectDirty = true;
}

const resizeObserver = new ResizeObserver(() => {
  invalidateStageRect();
});

const elements = {
  body: document.body,
  modeGrid: document.getElementById("mode-grid"),
  roomList: document.getElementById("room-list"),
  joinCodeInput: document.getElementById("join-code-input"),
  joinRoomButton: document.getElementById("join-room-btn"),
  joinMessage: document.getElementById("join-message"),
  roomBadge: document.getElementById("room-badge"),
  roomTitle: document.getElementById("room-title"),
  roomSubtitle: document.getElementById("room-subtitle"),
  saveIndicator: document.getElementById("save-indicator"),
  inviteButton: document.getElementById("invite-btn"),
  seedDemoButton: document.getElementById("seed-demo-btn"),
  clearRoomButton: document.getElementById("clear-room-btn"),
  cameraFeed: document.getElementById("camera-feed"),
  cameraPlaceholder: document.getElementById("camera-placeholder"),
  cameraStatusPill: document.getElementById("camera-status-pill"),
  cameraCounter: document.getElementById("camera-counter"),
  cameraMeterLabel: document.getElementById("camera-meter-label"),
  previewPresetLabel: document.getElementById("preview-preset-label"),
  previewRatioLabel: document.getElementById("preview-ratio-label"),
  timerCountdown: document.getElementById("timer-countdown"),
  startCameraButton: document.getElementById("start-camera-btn"),
  switchCameraButton: document.getElementById("switch-camera-btn"),
  captureButton: document.getElementById("capture-btn"),
  photoUploadInput: document.getElementById("photo-upload-input"),
  timerSelect: document.getElementById("timer-select"),
  ratioSelect: document.getElementById("ratio-select"),
  presetSelect: document.getElementById("preset-select"),
  frameSelect: document.getElementById("frame-select"),
  themeSelect: document.getElementById("theme-select"),
  roomStory: document.getElementById("room-story"),
  stageSurface: document.getElementById("stage-surface"),
  stageEmpty: document.getElementById("stage-empty"),
  polaroidLayer: document.getElementById("polaroid-layer"),
  autoArrangeButton: document.getElementById("auto-arrange-btn"),
  downloadCollageButton: document.getElementById("download-collage-btn"),
  tabBar: document.getElementById("tab-bar"),
  overviewPanel: document.getElementById("overview-panel"),
  selectedPanel: document.getElementById("selected-panel"),
  galleryPanel: document.getElementById("gallery-panel"),
  monetizePanel: document.getElementById("monetize-panel"),
  inviteDialog: document.getElementById("invite-dialog"),
  closeInviteButton: document.getElementById("close-invite-btn"),
  inviteCard: document.getElementById("invite-card"),
  inviteQr: document.getElementById("invite-qr"),
  smokeStatus: document.getElementById("smoke-test-status"),
};

const camera = new RetroCamera(elements.cameraFeed);
let state = loadState();
let persistTimer = null;
let dragState = null;
let cameraMessage = "Standby";
let cameraCountdownHandle = null;
let renderQueued = false;
let lastModeGridType = "";
let lastRoomListSignature = "";
let lastStagePhotoSignature = "";
const runtimePhotoAssets = new Map();
const pendingPhotoAssetJobs = new Map();

bootstrap();

function bootstrap() {
  populateStaticControls();
  bindStaticEvents();
  resolveRoomFromUrl();
  ensureStarterRoomHasSamples();
  render();
  resizeObserver.observe(elements.polaroidLayer);
  scheduleActiveRoomAssetHydration();
  runSmokeTestIfNeeded();
}

function populateStaticControls() {
  elements.timerSelect.innerHTML = TIMER_OPTIONS.map(
    (option) => `<option value="${option.id}">${option.label}</option>`,
  ).join("");
  elements.ratioSelect.innerHTML = RATIO_OPTIONS.map(
    (option) => `<option value="${option.id}">${option.label}</option>`,
  ).join("");
  elements.presetSelect.innerHTML = FILM_PRESETS.map((preset) => {
    const premiumLabel = preset.premium ? " • premium" : "";
    return `<option value="${preset.id}">${preset.label}${premiumLabel}</option>`;
  }).join("");
  elements.frameSelect.innerHTML = FRAME_STYLES.map((frame) => {
    const premiumLabel = frame.premium ? " • premium" : "";
    return `<option value="${frame.id}">${frame.label}${premiumLabel}</option>`;
  }).join("");
  elements.themeSelect.innerHTML = SURFACE_THEMES.map(
    (theme) => `<option value="${theme.id}">${theme.label}</option>`,
  ).join("");
}

function bindStaticEvents() {
  elements.modeGrid.addEventListener("click", handleModeGridClick);
  elements.roomList.addEventListener("click", handleRoomListClick);
  elements.joinRoomButton.addEventListener("click", handleJoinRoom);
  elements.joinCodeInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handleJoinRoom();
    }
  });

  elements.inviteButton.addEventListener("click", openInviteDialog);
  elements.closeInviteButton.addEventListener("click", () => elements.inviteDialog.close());
  elements.seedDemoButton.addEventListener("click", () => addDemoShot());
  elements.clearRoomButton.addEventListener("click", () => {
    const room = getActiveRoom();
    if (!room) {
      return;
    }
    if (!window.confirm(`Clear all photos from "${room.name}"?`)) {
      return;
    }
    updateActiveRoom((draft) => {
      draft.photos = [];
    });
  });

  elements.startCameraButton.addEventListener("click", async () => {
    await startCamera();
  });

  elements.switchCameraButton.addEventListener("click", async () => {
    const nextFacingMode = state.ui.facingMode === "user" ? "environment" : "user";
    updateUi({ facingMode: nextFacingMode });
    await startCamera(nextFacingMode);
  });

  elements.captureButton.addEventListener("click", async () => {
    await captureFromCurrentSource();
  });

  elements.photoUploadInput.addEventListener("change", async (event) => {
    const [file] = Array.from(event.target.files ?? []);
    if (!file) {
      return;
    }
    const src = await camera.importFile(file);
    if (src) {
      createPhotoEntry(src, {
        caption: `${getActiveRoom().name} Upload`,
      });
      setTransientMessage("Imported photo added to the room.");
    }
    event.target.value = "";
  });

  elements.timerSelect.addEventListener("change", () => {
    updateUi({ timerId: elements.timerSelect.value });
    render();
  });
  elements.ratioSelect.addEventListener("change", () => {
    updateUi({ ratioId: elements.ratioSelect.value });
    render();
  });
  elements.presetSelect.addEventListener("change", () => {
    const room = getActiveRoom();
    if (!room) {
      return;
    }
    if (!isPresetAvailable(room, elements.presetSelect.value)) {
      elements.presetSelect.value = room.defaultPresetId;
      setTransientMessage("Enable Creator Pass to use premium film packs.");
      return;
    }
    updateActiveRoom((draft) => {
      draft.defaultPresetId = elements.presetSelect.value;
    });
  });
  elements.frameSelect.addEventListener("change", () => {
    const room = getActiveRoom();
    if (!room) {
      return;
    }
    if (!isFrameAvailable(room, elements.frameSelect.value)) {
      elements.frameSelect.value = room.defaultFrameId;
      setTransientMessage("Enable Creator Pass to use the brand ribbon frame.");
      return;
    }
    updateActiveRoom((draft) => {
      draft.defaultFrameId = elements.frameSelect.value;
    });
  });
  elements.themeSelect.addEventListener("change", () => {
    updateActiveRoom((draft) => {
      draft.themeId = elements.themeSelect.value;
    });
  });

  elements.autoArrangeButton.addEventListener("click", autoArrangePhotos);
  elements.downloadCollageButton.addEventListener("click", async () => {
    const room = getActiveRoom();
    if (!room?.photos.length) {
      setTransientMessage("Add a few photos before exporting a collage.");
      return;
    }
    const canvas = await buildCollageCanvas(room, getStageExportOptions());
    downloadCanvas(canvas, `${slugify(room.name)}-collage.png`);
  });

  elements.tabBar.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tab]");
    if (!button) {
      return;
    }
    updateUi({ activeTab: button.dataset.tab }, { persist: false });
    render();
  });

  elements.overviewPanel.addEventListener("input", handleOverviewInput);
  elements.overviewPanel.addEventListener("change", handleOverviewInput);
  elements.overviewPanel.addEventListener("click", handleOverviewPanelClick);

  elements.selectedPanel.addEventListener("input", handleSelectedPanelInput);
  elements.selectedPanel.addEventListener("change", handleSelectedPanelInput);
  elements.selectedPanel.addEventListener("click", handleSelectedPanelClick);

  elements.galleryPanel.addEventListener("click", handleGalleryClick);
  elements.monetizePanel.addEventListener("click", handleMonetizeClick);
  elements.monetizePanel.addEventListener("change", handleMonetizeChange);

  elements.polaroidLayer.addEventListener("click", handleStageClick);
  elements.polaroidLayer.addEventListener("pointerdown", beginDrag);
  elements.polaroidLayer.addEventListener("pointermove", moveDrag);
  elements.polaroidLayer.addEventListener("pointerup", endDrag);
  elements.polaroidLayer.addEventListener("pointercancel", endDrag);
  elements.polaroidLayer.addEventListener("lostpointercapture", endDrag);
}

function getActiveRoom() {
  return state.rooms.find((room) => room.id === state.activeRoomId) ?? state.rooms[0] ?? null;
}

function getSelectedPhoto(room = getActiveRoom()) {
  if (!room) {
    return null;
  }
  return room.photos.find((photo) => photo.id === state.ui.selectedPhotoId) ?? null;
}

function updateUi(partialUi, options = {}) {
  const { persist = true } = options;
  state = {
    ...state,
    ui: {
      ...state.ui,
      ...partialUi,
    },
  };
  if (persist) {
    queuePersist();
  }
}

function updateActiveRoom(mutator) {
  const room = getActiveRoom();
  if (!room) {
    return;
  }

  const draft = structuredClone(room);
  mutator(draft);
  draft.updatedAt = new Date().toISOString();
  state = replaceRoom(state, draft);
  queuePersist();
  render();
}

function scheduleRender() {
  if (renderQueued) {
    return;
  }

  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    render();
  });
}

function queuePersist() {
  setSaveIndicator(true);
  window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => {
    saveState(state);
    setSaveIndicator(false);
  }, STORAGE_DEBOUNCE_MS);
}

function setSaveIndicator(isDirty) {
  elements.saveIndicator.textContent = isDirty ? "Saving" : "Saved";
  elements.saveIndicator.classList.toggle("is-dirty", isDirty);
}

function setTransientMessage(message) {
  cameraMessage = message;
  renderCameraStatus();
}

function resolveRoomFromUrl() {
  const roomCode = new URL(window.location.href).searchParams.get("room");
  if (!roomCode) {
    return;
  }

  const existingRoom = findRoomByCode(state, roomCode);
  if (existingRoom) {
    state = setActiveRoom(state, existingRoom.id);
    return;
  }

  elements.joinMessage.textContent = `Room ${roomCode.toUpperCase()} is not on this device yet. A real backend can plug into the same room model later.`;
}

function ensureStarterRoomHasSamples() {
  if (!state.rooms.length) {
    state = createInitialState();
  }

  const room = getActiveRoom();
  if (!room || room.photos.length > 0) {
    return;
  }

  const seededState = cloneState(state);
  const targetRoom = seededState.rooms.find((entry) => entry.id === seededState.activeRoomId);
  if (!targetRoom) {
    return;
  }

  const sampleOne = camera.createDemoShot({
    title: "Doorway Glow",
    accentColor: targetRoom.accentColor,
    roomName: targetRoom.name,
    ratioId: "1:1",
  });
  const sampleTwo = camera.createDemoShot({
    title: "Table Talk",
    accentColor: "#7d9ea0",
    roomName: targetRoom.hostName,
    ratioId: "4:5",
  });

  targetRoom.photos.push(
    createPhoto({
      src: sampleOne,
      originalSrc: sampleOne,
      caption: "Doorway Glow",
      note: "First guests just arrived and the room finally feels alive.",
      presetId: targetRoom.defaultPresetId,
      frameId: targetRoom.defaultFrameId,
      x: 110,
      y: 150,
      rotation: "-6deg",
    }),
    createPhoto({
      src: sampleTwo,
      originalSrc: sampleTwo,
      caption: "Table Talk",
      note: "Keep the camera moving and capture the in-between moments.",
      presetId: targetRoom.defaultPresetId,
      frameId: targetRoom.defaultFrameId,
      x: 360,
      y: 260,
      rotation: "5deg",
    }),
  );

  state = seededState;
  state.ui.selectedPhotoId = targetRoom.photos[0].id;
  saveState(state);
}

function invalidateRenderCaches() {
  lastModeGridType = "";
  lastRoomListSignature = "";
  lastStagePhotoSignature = "";
  invalidateStageRect();
}

function render() {
  const room = getActiveRoom();
  if (!room) {
    return;
  }

  renderModeGrid(room);
  renderRoomList(room);
  renderHeader(room);
  renderCameraControls(room);
  renderRoomStory(room);
  renderStage(room);
  renderTabs();
  renderActiveInspectorPanel(room);
}

function renderActiveInspectorPanel(room) {
  const activeTab = state.ui.activeTab;

  if (activeTab === "overview") {
    renderOverviewPanel(room);
    elements.selectedPanel.innerHTML = "";
    elements.galleryPanel.innerHTML = "";
    elements.monetizePanel.innerHTML = "";
    return;
  }

  if (activeTab === "selected") {
    renderSelectedPanel(room);
    elements.overviewPanel.innerHTML = "";
    elements.galleryPanel.innerHTML = "";
    elements.monetizePanel.innerHTML = "";
    return;
  }

  if (activeTab === "gallery") {
    renderGalleryPanel(room);
    elements.overviewPanel.innerHTML = "";
    elements.selectedPanel.innerHTML = "";
    elements.monetizePanel.innerHTML = "";
    return;
  }

  renderMonetizePanel(room);
  elements.overviewPanel.innerHTML = "";
  elements.selectedPanel.innerHTML = "";
  elements.galleryPanel.innerHTML = "";
}

function renderModeGrid(room) {
  if (lastModeGridType === room.typeId) {
    return;
  }
  lastModeGridType = room.typeId;

  elements.modeGrid.innerHTML = ROOM_TYPES.map((roomType) => `
    <article class="mode-card ${room.typeId === roomType.id ? "active" : ""}">
      <h3>${roomType.label}</h3>
      <p>${roomType.description}</p>
      <div class="mode-meta">
        <span class="price-pill">${roomType.price}</span>
        <button class="pill-button" data-action="create-room" data-room-type="${roomType.id}" type="button">
          New ${roomType.shortLabel}
        </button>
      </div>
    </article>
  `).join("");
}

function renderRoomList(activeRoom) {
  const sig = state.rooms.map((r) => `${r.id}:${r.name}:${r.subtitle}:${r.photos.length}:${r.typeId}`).join("|") + `:${activeRoom.id}`;
  if (sig === lastRoomListSignature) {
    return;
  }
  lastRoomListSignature = sig;

  elements.roomList.innerHTML = state.rooms.map((room) => {
    const photoCount = room.photos.length;
    const type = getRoomTypeById(room.typeId);
    return `
      <article class="room-card ${room.id === activeRoom.id ? "active" : ""}">
        <h3>${room.name}</h3>
        <p>${room.subtitle}</p>
        <div class="room-meta">
          <span class="tier-pill">${type.shortLabel}</span>
          <span>${photoCount} shot${photoCount === 1 ? "" : "s"}</span>
        </div>
        <button
          class="ghost-button"
          data-action="switch-room"
          data-room-id="${room.id}"
          type="button"
        >
          Open Room
        </button>
      </article>
    `;
  }).join("");
}

function renderHeader(room) {
  const roomType = getRoomTypeById(room.typeId);
  elements.roomBadge.textContent = roomType.label;
  elements.roomTitle.textContent = room.name;
  elements.roomSubtitle.textContent = `${room.subtitle} ${room.photos.length ? `• ${room.photos.length} captured memories so far.` : "• Capture the first memory."}`;
}

function renderCameraControls(room) {
  elements.timerSelect.value = state.ui.timerId;
  elements.ratioSelect.value = state.ui.ratioId;
  elements.presetSelect.value = room.defaultPresetId;
  elements.frameSelect.value = room.defaultFrameId;
  elements.themeSelect.value = room.themeId;
  elements.previewPresetLabel.textContent = getPresetById(room.defaultPresetId).label;
  elements.previewRatioLabel.textContent = state.ui.ratioId;
  renderCameraStatus();
}

function renderCameraStatus() {
  const room = getActiveRoom();
  const photoCount = room?.photos.length ?? 0;
  elements.cameraCounter.textContent = `${String(photoCount).padStart(2, "0")} frames`;
  elements.cameraStatusPill.textContent = camera.mode === "camera" ? "Live Camera" : "Demo Ready";
  elements.cameraMeterLabel.textContent = cameraMessage;
  elements.cameraPlaceholder.classList.toggle("hidden", camera.mode === "camera");
}

function renderRoomStory(room) {
  const insights = getRoomInsights(room);
  const roomType = getRoomTypeById(room.typeId);
  elements.roomStory.innerHTML = `
    <article class="story-card">
      <h3>${roomType.packaging}</h3>
      <p>${room.callToAction}</p>
    </article>
    <article class="story-card">
      <h3>${room.typeId === "journal" ? "Daily prompt" : room.typeId === "brand" ? "Campaign cue" : "Host note"}</h3>
      <p>${room.prompt}</p>
    </article>
    <article class="story-card">
      <h3>${room.typeId === "journal" ? "Streak" : "Coverage"}</h3>
      <p>${room.typeId === "journal" ? `${insights.uniqueDays} active day${insights.uniqueDays === 1 ? "" : "s"}` : `${room.photos.length} guest ${room.photos.length === 1 ? "memory" : "memories"}`}</p>
    </article>
    <article class="story-card">
      <h3>${room.typeId === "brand" ? "CTA" : "Invite code"}</h3>
      <p>${room.typeId === "brand" ? room.code : room.code}</p>
    </article>
  `;
}

function renderStage(room) {
  const theme = getThemeById(room.themeId);
  elements.stageSurface.className = `stage-surface ${theme.className}`;
  elements.stageEmpty.classList.toggle("hidden", room.photos.length > 0);

  const signature = room.photos.map((p) =>
    `${p.id}:${p.x}:${p.y}:${p.rotation}:${p.frameId}:${p.presetId}:${p.flipped}:${p.favorite}:${p.caption}:${p.note}:${p.displayDate}:${getDisplaySrc(p)}`
  ).join("|") + `:${room.themeId}:${room.accentColor}:${room.typeId}:${room.code}:${room.hostLabel}:${room.hostName}:${state.ui.selectedPhotoId}`;

  if (signature === lastStagePhotoSignature) {
    return;
  }
  lastStagePhotoSignature = signature;

  const layerRect = getStageRect();
  const width = layerRect.width || elements.stageSurface.clientWidth || 640;
  const height = layerRect.height || elements.stageSurface.clientHeight || 720;
  elements.polaroidLayer.innerHTML = room.photos
    .map((photo) => renderPhotoCardMarkup(room, photo, width, height))
    .join("");
}

function renderPhotoCardMarkup(room, photo, layerWidth, layerHeight) {
  const selected = photo.id === state.ui.selectedPhotoId;
  const notePreview = photo.note ? photo.note.slice(0, 110) : room.prompt;
  const isFreshPrint = room.photos[room.photos.length - 1]?.id === photo.id;
  const tag = photo.favorite
    ? "Favorite"
    : isFreshPrint
      ? "Fresh print"
      : room.typeId === "brand"
        ? "Campaign cut"
        : room.typeId === "journal"
          ? "Journal page"
          : "Guestbook";
  const safeX = clamp(photo.x, 24, Math.max(24, layerWidth - (photo.width ?? 224) - 18));
  const safeY = clamp(photo.y, 24, Math.max(24, layerHeight - 300));
  const displaySrc = getDisplaySrc(photo);
  return `
    <article
      class="polaroid-card frame-${photo.frameId} ${photo.flipped ? "is-flipped" : ""} ${selected ? "selected" : ""} ${isFreshPrint ? "fresh-print" : ""}"
      data-photo-id="${photo.id}"
      style="--x:${safeX}px; --y:${safeY}px; --rotation:${photo.rotation}; --frame-accent:${room.accentColor};"
    >
      <div class="polaroid-actions">
        <button class="polaroid-chip" data-photo-action="flip" type="button">↻</button>
        <button class="polaroid-chip favorite" data-photo-action="favorite" type="button">${photo.favorite ? "★" : "☆"}</button>
      </div>
      <div class="polaroid-tagline">${tag.slice(0, 16)}</div>
      <div class="polaroid-inner">
        <div class="polaroid-face polaroid-front">
          <div class="polaroid-shell">
            <div class="photo-window">
              <img
                src="${displaySrc}"
                alt="${photo.caption}"
                loading="lazy"
                decoding="async"
              >
            </div>
            <div class="photo-caption">
              <strong>${escapeHtml(photo.caption)}</strong>
              <span>${photo.displayDate}</span>
            </div>
          </div>
        </div>
        <div class="polaroid-face polaroid-back">
          <div class="polaroid-shell">
            <div class="back-note-surface">
              <h4>${escapeHtml(photo.caption)}</h4>
              <p class="memory-note">${escapeHtml(notePreview || "Flip a polaroid and leave a note.")}</p>
              <div class="back-stamp">
                <span>${room.hostLabel} ${room.hostName}</span>
                <span>${room.typeId === "event" ? "Guestbook" : room.typeId === "journal" ? "Private" : "Campaign"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderTabs() {
  elements.tabBar.querySelectorAll("[data-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === state.ui.activeTab);
  });

  document.querySelectorAll("[data-panel]").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === state.ui.activeTab);
  });
}

function renderOverviewPanel(room) {
  const roomTypeOptions = ROOM_TYPES.map((roomType) => `
    <option value="${roomType.id}" ${room.typeId === roomType.id ? "selected" : ""}>${roomType.label}</option>
  `).join("");

  const shareLink = buildInviteLink(room);
  const addOnText = room.addOns.length
    ? room.addOns
      .map((addOnId) => ADD_ONS.find((item) => item.id === addOnId)?.label ?? addOnId)
      .join(", ")
    : "No add-ons enabled";

  elements.overviewPanel.innerHTML = `
    <label class="field">
      <span class="field-label">Room name</span>
      <input class="text-input" data-room-field="name" type="text" value="${escapeAttribute(room.name)}">
    </label>
    <label class="field">
      <span class="field-label">Offer type</span>
      <select class="text-input" data-room-field="typeId">${roomTypeOptions}</select>
    </label>
    <label class="field">
      <span class="field-label">${room.hostLabel}</span>
      <input class="text-input" data-room-field="hostName" type="text" value="${escapeAttribute(room.hostName)}">
    </label>
    <label class="field">
      <span class="field-label">Venue / location</span>
      <input class="text-input" data-room-field="venue" type="text" value="${escapeAttribute(room.venue)}">
    </label>
    <label class="field">
      <span class="field-label">Subtitle</span>
      <textarea class="text-area" data-room-field="subtitle">${escapeHtml(room.subtitle)}</textarea>
    </label>
    <label class="field">
      <span class="field-label">Call to action</span>
      <textarea class="text-area" data-room-field="callToAction">${escapeHtml(room.callToAction)}</textarea>
    </label>
    <label class="field">
      <span class="field-label">${room.typeId === "journal" ? "Daily prompt" : room.typeId === "brand" ? "Campaign prompt" : "Guest prompt"}</span>
      <textarea class="text-area" data-room-field="prompt">${escapeHtml(room.prompt)}</textarea>
    </label>
    <label class="field">
      <span class="field-label">Accent color</span>
      <input class="text-input" data-room-field="accentColor" type="color" value="${escapeAttribute(room.accentColor)}">
    </label>
    <div class="info-row">
      <article class="info-tile">
        <h3>Invite Code</h3>
        <p>${room.code}</p>
      </article>
      <article class="info-tile">
        <h3>Enabled Add-ons</h3>
        <p>${addOnText}</p>
      </article>
    </div>
    <article class="info-tile">
      <h3>Share link</h3>
      <div class="link-box">
        <code>${shareLink}</code>
        <button class="pill-button" data-action="copy-link" type="button">Copy</button>
      </div>
    </article>
  `;
}

function renderSelectedPanel(room) {
  const photo = getSelectedPhoto(room);
  if (!photo) {
    elements.selectedPanel.innerHTML = `
      <article class="empty-state-card">
        Select a polaroid from the surface to edit caption, note, filters, and export options.
      </article>
    `;
    return;
  }

  const presetOptions = FILM_PRESETS.map((preset) => {
    const disabled = !isPresetAvailable(room, preset.id);
    return `<option value="${preset.id}" ${preset.id === photo.presetId ? "selected" : ""} ${disabled ? "disabled" : ""}>${preset.label}${preset.premium ? " • premium" : ""}</option>`;
  }).join("");

  const frameOptions = FRAME_STYLES.map((frame) => {
    const disabled = !isFrameAvailable(room, frame.id);
    return `<option value="${frame.id}" ${frame.id === photo.frameId ? "selected" : ""} ${disabled ? "disabled" : ""}>${frame.label}${frame.premium ? " • premium" : ""}</option>`;
  }).join("");

  elements.selectedPanel.innerHTML = `
    <div class="selected-preview">
      <div class="selected-preview-shell frame-${photo.frameId}">
        <div class="selected-preview-window">
          <img src="${getDisplaySrc(photo)}" alt="${escapeAttribute(photo.caption)}" decoding="async">
        </div>
        <div class="selected-preview-caption">
          <strong>${escapeHtml(photo.caption)}</strong>
          <span>${photo.displayDate}</span>
        </div>
      </div>
    </div>
    <label class="field">
      <span class="field-label">Front caption</span>
      <input class="text-input" data-photo-field="caption" type="text" maxlength="32" value="${escapeAttribute(photo.caption)}">
    </label>
    <label class="field">
      <span class="field-label">Back note</span>
      <textarea class="text-area" data-photo-field="note" maxlength="280">${escapeHtml(photo.note)}</textarea>
    </label>
    <label class="field">
      <span class="field-label">Film pack</span>
      <select class="text-input" data-photo-field="presetId">${presetOptions}</select>
    </label>
    <label class="field">
      <span class="field-label">Frame</span>
      <select class="text-input" data-photo-field="frameId">${frameOptions}</select>
    </label>
    <div class="selected-actions">
      <button class="ghost-button" data-photo-action="flip" type="button">${photo.flipped ? "Show Front" : "Show Back"}</button>
      <button class="ghost-button" data-photo-action="duplicate" type="button">Duplicate</button>
      <button class="ghost-button" data-photo-action="favorite" type="button">${photo.favorite ? "Unfavorite" : "Favorite"}</button>
      <button class="pill-button" data-photo-action="export-single" type="button">Download Polaroid</button>
      <button class="ghost-button danger" data-photo-action="delete" type="button">Delete</button>
    </div>
  `;
}

function renderGalleryPanel(room) {
  const insights = getRoomInsights(room);
  const photos = [...room.photos].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));

  elements.galleryPanel.innerHTML = `
    <div class="stats-grid">
      <article class="stats-card">
        <p>Photos</p>
        <strong>${room.photos.length}</strong>
      </article>
      <article class="stats-card">
        <p>Favorites</p>
        <strong>${insights.favoriteCount}</strong>
      </article>
      <article class="stats-card">
        <p>${room.typeId === "journal" ? "Active Days" : "Unique Moments"}</p>
        <strong>${insights.uniqueDays}</strong>
      </article>
      <article class="stats-card">
        <p>Invite code</p>
        <strong>${room.code}</strong>
      </article>
    </div>
    <div class="export-grid">
      <article class="export-card">
        <h3>Output Pack</h3>
        <p class="gallery-card-meta">Export assets for sharing, print, and client review.</p>
        <div class="export-actions">
          <button class="pill-button" data-export-action="strip" type="button">4-up Strip</button>
          <button class="ghost-button" data-export-action="share-card" type="button">Share Card</button>
          <button class="ghost-button" data-export-action="guestbook" type="button">Print Guestbook</button>
          <button class="ghost-button" data-export-action="backup" type="button">Backup JSON</button>
        </div>
      </article>
    </div>
    <div class="gallery-grid">
      ${photos.length
        ? photos.map((photo) => `
          <article class="gallery-card">
            <img src="${getThumbnailSrc(photo)}" alt="${escapeAttribute(photo.caption)}" loading="lazy" decoding="async">
            <div class="gallery-card-meta">
              <h3>${escapeHtml(photo.caption)}</h3>
              <p>${photo.displayDate} • ${getPresetById(photo.presetId).label}</p>
              <div class="gallery-actions">
                <button class="ghost-button" data-gallery-action="select" data-photo-id="${photo.id}" type="button">Edit</button>
                <button class="ghost-button" data-gallery-action="export" data-photo-id="${photo.id}" type="button">Download</button>
              </div>
            </div>
          </article>
        `).join("")
        : `<article class="empty-state-card">No photos yet. Capture, import, or seed a demo shot to start the gallery.</article>`}
    </div>
  `;
}

function formatOfferRevenue(amount, billingLabel) {
  const lowerBillingLabel = billingLabel.toLowerCase();
  if (lowerBillingLabel.includes("month")) {
    return `$${amount} / month`;
  }
  if (lowerBillingLabel.includes("event")) {
    return `$${amount} / event`;
  }
  if (lowerBillingLabel.includes("campaign")) {
    return `$${amount} / campaign`;
  }
  return `$${amount}`;
}

function getMonetizationSnapshot(room) {
  const roomType = getRoomTypeById(room.typeId);
  const activePackage = MONETIZATION_PACKAGES.find((pkg) => pkg.id === room.packageId)
    ?? MONETIZATION_PACKAGES[0];
  const activeAddOns = ADD_ONS.filter((addOn) => room.addOns.includes(addOn.id));
  const projectedRevenue = activePackage.amount + activeAddOns.reduce((sum, addOn) => sum + (addOn.amount ?? 0), 0);
  const revenueText = formatOfferRevenue(projectedRevenue, activePackage.billingLabel);
  const nextUpsell = ADD_ONS.find((addOn) => !room.addOns.includes(addOn.id))?.label ?? "Offer stack is fully enabled";

  return {
    roomType,
    activePackage,
    activeAddOns,
    projectedRevenue,
    revenueText,
    nextUpsell,
  };
}

function renderMonetizePanel(room) {
  const {
    roomType,
    activePackage,
    activeAddOns,
    revenueText,
    nextUpsell,
  } = getMonetizationSnapshot(room);

  elements.monetizePanel.innerHTML = `
    <div class="info-tile monetize-summary-card">
      <p class="eyebrow">Offer Builder</p>
      <h3>${activePackage.label}</h3>
      <p>${activePackage.salesLead}</p>
      <div class="info-row monetize-kpis">
        <article class="info-tile">
          <h3>Starting ticket</h3>
          <p class="metric-note">${revenueText}</p>
        </article>
        <article class="info-tile">
          <h3>Buyer</h3>
          <p>${roomType.buyerLabel}</p>
        </article>
      </div>
      <div class="info-row monetize-kpis">
        <article class="info-tile">
          <h3>Billing model</h3>
          <p>${activePackage.billingLabel}</p>
        </article>
        <article class="info-tile">
          <h3>Delivery</h3>
          <p>${activePackage.timeline}</p>
        </article>
      </div>
    </div>
    <div class="info-row">
      <article class="info-tile">
        <h3>Positioning</h3>
        <p>${roomType.description}</p>
      </article>
      <article class="info-tile">
        <h3>How to sell it</h3>
        <p>${roomType.salesPitch}</p>
      </article>
    </div>
    <div class="monetize-grid">
      ${MONETIZATION_PACKAGES.map((pkg) => `
        <article class="pricing-card ${pkg.id === activePackage.id ? "active" : ""}">
          <div class="label-row">
            <h3>${pkg.label}</h3>
            <span class="price-pill">${pkg.price}</span>
          </div>
          <p class="metric-note">${pkg.billingLabel}</p>
          <p>${pkg.description}</p>
          <p class="metric-note">Best for: ${pkg.bestFor}</p>
          <ul class="offer-points">
            ${pkg.includes.map((point) => `<li>${point}</li>`).join("")}
          </ul>
          <button class="pill-button" data-package-id="${pkg.id}" type="button">${pkg.id === activePackage.id ? "Current Package" : "Switch to Package"}</button>
        </article>
      `).join("")}
    </div>
    <div class="info-tile">
      <h3>Launch checklist</h3>
      <ul class="offer-points">
        <li>Choose the package that matches the buyer you want to close first.</li>
        <li>Use add-ons to increase ticket size with print, premium looks, or brand deliverables.</li>
        <li>Rewrite the room CTA before launch so the hosted room sells the offer for you.</li>
      </ul>
    </div>
    <div class="addon-grid">
      ${ADD_ONS.map((addOn) => `
        <label class="addon-card ${room.addOns.includes(addOn.id) ? "active" : ""}">
          <div>
            <h3>${addOn.label}</h3>
            <p>${addOn.description}</p>
            <p class="metric-note">${addOn.impact}</p>
          </div>
          <div class="toggle-wrap">
            <span class="price-pill">${addOn.price}</span>
            <input type="checkbox" data-addon-id="${addOn.id}" ${room.addOns.includes(addOn.id) ? "checked" : ""}>
          </div>
        </label>
      `).join("")}
    </div>
    <div class="info-row">
      <article class="info-tile">
        <h3>Projected revenue</h3>
        <p>${revenueText}</p>
      </article>
      <article class="info-tile">
        <h3>Next upsell</h3>
        <p>${nextUpsell}</p>
      </article>
    </div>
    <div class="info-row">
      <article class="info-tile">
        <h3>Enabled add-ons</h3>
        <p>${activeAddOns.length ? activeAddOns.map((addOn) => addOn.label).join(", ") : "None yet"}</p>
      </article>
      <article class="info-tile">
        <h3>Premium access</h3>
        <p>${room.addOns.includes("creator-pass") ? "Unlocked" : "Locked to essentials only"}</p>
      </article>
    </div>
  `;
}

function handleModeGridClick(event) {
  const button = event.target.closest("[data-action='create-room']");
  if (!button) {
    return;
  }
  const room = createRoom(button.dataset.roomType);
  state = addRoom(state, room);
  state.ui.selectedPhotoId = null;
  queuePersist();
  invalidateRenderCaches();
  render();
  scheduleActiveRoomAssetHydration();
}

function handleRoomListClick(event) {
  const button = event.target.closest("[data-action='switch-room']");
  if (!button) {
    return;
  }
  state = setActiveRoom(state, button.dataset.roomId);
  state.ui.selectedPhotoId = getActiveRoom()?.photos[0]?.id ?? null;
  queuePersist();
  invalidateRenderCaches();
  render();
  scheduleActiveRoomAssetHydration();
}

function handleJoinRoom() {
  const code = elements.joinCodeInput.value.trim().toUpperCase();
  if (!code) {
    elements.joinMessage.textContent = "Enter an invite code first.";
    return;
  }

  const room = findRoomByCode(state, code);
  if (!room) {
    elements.joinMessage.textContent = `${code} is not stored on this device yet.`;
    return;
  }

  state = setActiveRoom(state, room.id);
  state.ui.selectedPhotoId = room.photos[0]?.id ?? null;
  queuePersist();
  elements.joinMessage.textContent = `Joined ${room.name}.`;
  invalidateRenderCaches();
  render();
  scheduleActiveRoomAssetHydration();
}

async function startCamera(facingMode = state.ui.facingMode) {
  const result = await camera.start(facingMode);
  setTransientMessage(result.message);
  render();
}

async function captureFromCurrentSource() {
  const room = getActiveRoom();
  if (!room) {
    return;
  }

  const timerSeconds = Number(state.ui.timerId);
  if (timerSeconds > 0) {
    await runCountdown(timerSeconds);
  }

  let src = await camera.captureFrame(state.ui.ratioId);
  if (!src) {
    src = camera.createDemoShot({
      title: room.typeId === "journal" ? "Prompt Check-in" : room.typeId === "brand" ? "Campaign Moment" : "Guestbook Shot",
      accentColor: room.accentColor,
      roomName: room.name,
      ratioId: state.ui.ratioId,
    });
  }

  createPhotoEntry(src, {
    caption: room.typeId === "journal" ? "Daily Check-in" : room.typeId === "brand" ? "Campaign Capture" : "Fresh Shot",
  });
  setTransientMessage(camera.mode === "camera" ? "Captured a live polaroid." : "Added a demo polaroid.");
}

function createPhotoEntry(src, overrides = {}) {
  const room = getActiveRoom();
  const stageRect = getStageRect();
  const nextIndex = room.photos.length;
  const photo = createPhoto({
    src,
    originalSrc: src,
    caption: overrides.caption ?? "Untitled Memory",
    note: overrides.note ?? (room.typeId === "journal" ? room.prompt : ""),
    presetId: room.defaultPresetId,
    frameId: room.defaultFrameId,
    x: 70 + (nextIndex % 4) * 150,
    y: 120 + (nextIndex % 3) * 110,
    rotation: `${(Math.random() * 12 - 6).toFixed(1)}deg`,
  });

  if (stageRect.width) {
    photo.x = Math.min(stageRect.width - 230, Math.max(30, photo.x));
  }

  updateActiveRoom((draft) => {
    draft.photos.push(photo);
  });

  updateUi({ selectedPhotoId: photo.id, activeTab: "selected" }, { persist: false });
  render();
  schedulePhotoAssetHydration(photo.id);
}

function addDemoShot() {
  const room = getActiveRoom();
  if (!room) {
    return;
  }

  const src = camera.createDemoShot({
    title: room.typeId === "brand" ? "Counter Mood" : room.typeId === "journal" ? "Quiet Detail" : "Guest Laugh",
    accentColor: room.accentColor,
    roomName: room.name,
    ratioId: state.ui.ratioId,
  });

  createPhotoEntry(src, {
    caption: room.typeId === "brand" ? "Counter Mood" : room.typeId === "journal" ? "Quiet Detail" : "Guest Laugh",
    note: room.prompt,
  });
}

function autoArrangePhotos() {
  const room = getActiveRoom();
  if (!room?.photos.length) {
    return;
  }

  invalidateStageRect();
  const stageRect = getStageRect();
  const columns = stageRect.width < 720 ? 2 : 3;
  const spacingX = Math.max(180, Math.floor(stageRect.width / (columns + 0.25)));
  const spacingY = 190;

  updateActiveRoom((draft) => {
    draft.photos = draft.photos.map((photo, index) => ({
      ...photo,
      x: 42 + (index % columns) * spacingX,
      y: 110 + Math.floor(index / columns) * spacingY,
      rotation: `${(index % 2 === 0 ? -4 : 4) + (Math.random() * 3 - 1.5)}deg`,
    }));
  });
}

function handleOverviewInput(event) {
  const field = event.target.dataset.roomField;
  if (!field) {
    return;
  }

  const value = event.target.value;
  updateActiveRoom((draft) => {
    draft[field] = value;
    if (field === "typeId") {
      applyRoomTemplate(draft, value);
    }
  });
}

function handleOverviewPanelClick(event) {
  const button = event.target.closest("[data-action='copy-link']");
  if (!button) {
    return;
  }

  copyText(buildInviteLink(getActiveRoom()), "Share link copied.");
}

function handleSelectedPanelInput(event) {
  const photoField = event.target.dataset.photoField;
  if (!photoField) {
    return;
  }

  const selectedPhotoId = state.ui.selectedPhotoId;
  const room = getActiveRoom();
  if (!room || !selectedPhotoId) {
    return;
  }

  const nextValue = event.target.value;
  const needsAssetRefresh = photoField === "presetId";
  if (photoField === "presetId" && !isPresetAvailable(room, nextValue)) {
    setTransientMessage("Enable Creator Pass to use premium film packs.");
    render();
    return;
  }
  if (photoField === "frameId" && !isFrameAvailable(room, nextValue)) {
    setTransientMessage("Enable Creator Pass to use the brand ribbon frame.");
    render();
    return;
  }

  updateActiveRoom((draft) => {
    draft.photos = draft.photos.map((photo) => (
      photo.id === selectedPhotoId ? { ...photo, [photoField]: nextValue } : photo
    ));
  });
  if (needsAssetRefresh) {
    schedulePhotoAssetHydration(selectedPhotoId);
  }
}

async function handleSelectedPanelClick(event) {
  const action = event.target.dataset.photoAction;
  if (!action) {
    return;
  }
  await runPhotoAction(action, state.ui.selectedPhotoId);
}

async function handleGalleryClick(event) {
  const exportAction = event.target.dataset.exportAction;
  if (exportAction) {
    await runGalleryExport(exportAction);
    return;
  }

  const galleryAction = event.target.dataset.galleryAction;
  const photoId = event.target.dataset.photoId;
  if (!galleryAction || !photoId) {
    return;
  }

  if (galleryAction === "select") {
    updateUi({ selectedPhotoId: photoId, activeTab: "selected" }, { persist: false });
    render();
    return;
  }

  if (galleryAction === "export") {
    const room = getActiveRoom();
    const photo = room.photos.find((entry) => entry.id === photoId);
    if (!photo) {
      return;
    }
    const canvas = await buildSinglePolaroidCanvas(room, photo);
    downloadCanvas(canvas, `${slugify(photo.caption)}.png`);
  }
}

function handleMonetizeClick(event) {
  const packageId = event.target.dataset.packageId;
  if (!packageId) {
    return;
  }

  const nextTypeId =
    packageId === "event-pro" ? "event" : packageId === "journal-club" ? "journal" : "brand";

  updateActiveRoom((draft) => {
    draft.packageId = packageId;
    applyRoomTemplate(draft, nextTypeId);
  });
}

function handleMonetizeChange(event) {
  const addOnId = event.target.dataset.addonId;
  if (!addOnId) {
    return;
  }

  updateActiveRoom((draft) => {
    const addOns = new Set(draft.addOns);
    if (event.target.checked) {
      addOns.add(addOnId);
    } else {
      addOns.delete(addOnId);
    }
    draft.addOns = [...addOns];
    if (!draft.addOns.includes("creator-pass")) {
      if (getPresetById(draft.defaultPresetId).premium) {
        draft.defaultPresetId = FILM_PRESETS.find((preset) => !preset.premium)?.id ?? draft.defaultPresetId;
      }
      if (getFrameById(draft.defaultFrameId).premium) {
        draft.defaultFrameId = FRAME_STYLES.find((frame) => !frame.premium)?.id ?? draft.defaultFrameId;
      }
      draft.photos = draft.photos.map((photo) => ({
        ...photo,
        presetId: getPresetById(photo.presetId).premium ? draft.defaultPresetId : photo.presetId,
        frameId: getFrameById(photo.frameId).premium ? draft.defaultFrameId : photo.frameId,
      }));
    }
  });
}

function applyRoomTemplate(room, typeId) {
  const roomType = getRoomTypeById(typeId);
  room.typeId = roomType.id;
  room.packageId = roomType.id === "event" ? "event-pro" : roomType.id === "journal" ? "journal-club" : "brand-campaign";
  room.hostLabel = roomType.defaultHostLabel;
  room.themeId = roomType.defaultThemeId;
  room.defaultPresetId = roomType.defaultPresetId;
  room.defaultFrameId = roomType.defaultFrameId;
  room.subtitle = room.subtitle || roomType.defaultSubtitle;
  room.callToAction = roomType.defaultCallToAction;
  room.prompt = roomType.id === "journal" ? getDailyPrompt() : roomType.defaultCallToAction;
  room.accentColor = roomType.id === "brand" ? "#3aa89d" : roomType.id === "journal" ? "#8d6852" : "#d06e4f";
  if (roomType.id === "brand") {
    room.addOns = Array.from(new Set([...room.addOns, "creator-pass", "campaign-kit"]));
  }
}

async function runPhotoAction(action, photoId) {
  const room = getActiveRoom();
  const photo = room?.photos.find((entry) => entry.id === photoId);
  if (!room || !photo) {
    return;
  }

  if (action === "flip") {
    updateActiveRoom((draft) => {
      draft.photos = draft.photos.map((entry) => (
        entry.id === photoId ? { ...entry, flipped: !entry.flipped } : entry
      ));
    });
    return;
  }

  if (action === "favorite") {
    updateActiveRoom((draft) => {
      draft.photos = draft.photos.map((entry) => (
        entry.id === photoId ? { ...entry, favorite: !entry.favorite } : entry
      ));
    });
    return;
  }

  if (action === "duplicate") {
    const clone = createPhoto({
      caption: `${photo.caption} Copy`,
      note: photo.note,
      presetId: photo.presetId,
      frameId: photo.frameId,
      favorite: false,
      flipped: false,
      src: photo.originalSrc || photo.src,
      originalSrc: photo.originalSrc || photo.src,
      displayDate: photo.displayDate,
      x: photo.x + 42,
      y: photo.y + 38,
      rotation: `${(parseFloat(String(photo.rotation)) || 0) + 4}deg`,
      createdAt: new Date().toISOString(),
    });
    updateActiveRoom((draft) => {
      draft.photos.push(clone);
    });
    updateUi({ selectedPhotoId: clone.id }, { persist: false });
    render();
    schedulePhotoAssetHydration(clone.id);
    return;
  }

  if (action === "delete") {
    updateActiveRoom((draft) => {
      draft.photos = draft.photos.filter((entry) => entry.id !== photoId);
    });
    updateUi({ selectedPhotoId: getActiveRoom()?.photos[0]?.id ?? null }, { persist: false });
    render();
    return;
  }

  if (action === "export-single") {
    const canvas = await buildSinglePolaroidCanvas(room, photo);
    downloadCanvas(canvas, `${slugify(photo.caption)}.png`);
  }
}

async function runGalleryExport(action) {
  const room = getActiveRoom();
  if (!room?.photos.length) {
    setTransientMessage("Capture a few photos before exporting.");
    return;
  }

  if (action === "strip") {
    const canvas = await buildStripCanvas(room, room.photos);
    downloadCanvas(canvas, `${slugify(room.name)}-strip.png`);
    return;
  }

  if (action === "share-card") {
    const selected = getSelectedPhoto(room) ?? room.photos[room.photos.length - 1];
    const canvas = await buildShareCardCanvas(room, selected);
    downloadCanvas(canvas, `${slugify(room.name)}-share-card.png`);
    return;
  }

  if (action === "guestbook") {
    openPrintGuestbook(room);
    return;
  }

  if (action === "backup") {
    const blob = new Blob([JSON.stringify(room, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slugify(room.name)}-backup.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

function handleStageClick(event) {
  const actionButton = event.target.closest("[data-photo-action]");
  if (actionButton) {
    runPhotoAction(actionButton.dataset.photoAction, actionButton.closest("[data-photo-id]")?.dataset.photoId);
    return;
  }

  const card = event.target.closest("[data-photo-id]");
  if (!card) {
    return;
  }

  updateUi({ selectedPhotoId: card.dataset.photoId }, { persist: false });
  render();
}

function beginDrag(event) {
  if (event.target.closest("[data-photo-action]")) {
    return;
  }

  const card = event.target.closest("[data-photo-id]");
  if (!card) {
    return;
  }

  const room = getActiveRoom();
  const photo = room.photos.find((entry) => entry.id === card.dataset.photoId);
  if (!photo) {
    return;
  }

  updateUi({ selectedPhotoId: photo.id }, { persist: false });
  invalidateStageRect();
  const layerRect = getStageRect();
  dragState = {
    photoId: photo.id,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    originX: photo.x,
    originY: photo.y,
    layerRect,
    element: card,
  };

  card.classList.add("dragging");
  card.setPointerCapture(event.pointerId);
}

function moveDrag(event) {
  if (!dragState || event.pointerId !== dragState.pointerId) {
    return;
  }

  const dx = event.clientX - dragState.startX;
  const dy = event.clientY - dragState.startY;
  const maxX = Math.max(24, dragState.layerRect.width - 230);
  const maxY = Math.max(24, dragState.layerRect.height - 280);
  const nextX = clamp(dragState.originX + dx, 24, maxX);
  const nextY = clamp(dragState.originY + dy, 24, maxY);

  dragState.element.style.setProperty("--x", `${nextX}px`);
  dragState.element.style.setProperty("--y", `${nextY}px`);
}

function endDrag(event) {
  if (!dragState) {
    return;
  }
  if (event.pointerId && dragState.pointerId && event.pointerId !== dragState.pointerId) {
    return;
  }

  const x = parseFloat(dragState.element.style.getPropertyValue("--x"));
  const y = parseFloat(dragState.element.style.getPropertyValue("--y"));
  dragState.element.classList.remove("dragging");

  const photoId = dragState.photoId;
  const finalX = Number.isFinite(x) ? x : null;
  const finalY = Number.isFinite(y) ? y : null;
  dragState = null;

  const room = getActiveRoom();
  if (!room) {
    return;
  }
  const draft = structuredClone(room);
  draft.updatedAt = new Date().toISOString();
  draft.photos = draft.photos.map((photo) => (
    photo.id === photoId
      ? { ...photo, x: finalX ?? photo.x, y: finalY ?? photo.y }
      : photo
  ));
  state = replaceRoom(state, draft);
  queuePersist();
  scheduleRender();
}

function openInviteDialog() {
  const room = getActiveRoom();
  if (!room) {
    return;
  }

  const shareLink = buildInviteLink(room);
  elements.inviteCard.innerHTML = `
    <div class="section-heading">
      <h2>${room.name}</h2>
      <p>${room.subtitle}</p>
    </div>
    <div class="badge-row">
      <span class="tier-pill">${room.code}</span>
      <span class="surface-pill">${getRoomTypeById(room.typeId).label}</span>
    </div>
    <p class="helper-text">${room.hostLabel} ${room.hostName}</p>
    <div class="link-box">
      <code>${shareLink}</code>
    </div>
    <div class="selected-actions">
      <button class="pill-button" id="copy-room-link-btn" type="button">Copy Link</button>
      <button class="ghost-button" id="copy-room-code-btn" type="button">Copy Code</button>
      <button class="ghost-button" id="native-share-btn" type="button">Share</button>
    </div>
  `;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(shareLink)}`;
  elements.inviteQr.src = qrUrl;
  elements.inviteDialog.showModal();

  document.getElementById("copy-room-code-btn").onclick = () => {
    copyText(room.code, "Invite code copied.");
  };
  document.getElementById("copy-room-link-btn").onclick = () => {
    copyText(shareLink, "Invite link copied.");
  };
  document.getElementById("native-share-btn").onclick = async () => {
    if (!navigator.share) {
      copyText(shareLink, "Native share is unavailable. Link copied instead.");
      return;
    }

    await navigator.share({
      title: room.name,
      text: room.callToAction,
      url: shareLink,
    });
  };
}

function buildInviteLink(room) {
  const url = new URL(window.location.href);
  url.searchParams.delete("autotest");
  url.searchParams.set("room", room.code);
  return url.toString();
}

function copyText(value, successMessage) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(value).then(
      () => setTransientMessage(successMessage),
      () => setTransientMessage("Copy failed. You can still copy it manually."),
    );
    return;
  }

  const tempInput = document.createElement("textarea");
  tempInput.value = value;
  document.body.append(tempInput);
  tempInput.select();
  try {
    document.execCommand("copy");
    setTransientMessage(successMessage);
  } catch (error) {
    setTransientMessage("Copy failed. You can still copy it manually.");
  } finally {
    tempInput.remove();
  }
}

function getDisplaySrc(photo) {
  const assets = runtimePhotoAssets.get(photo.id);
  if (assets && assets.assetPresetId === photo.presetId) {
    return assets.displaySrc;
  }
  return photo.originalSrc || photo.src;
}

function getThumbnailSrc(photo) {
  const assets = runtimePhotoAssets.get(photo.id);
  if (assets && assets.assetPresetId === photo.presetId) {
    return assets.thumbnailSrc || assets.displaySrc;
  }
  return photo.originalSrc || photo.src;
}

function scheduleActiveRoomAssetHydration() {
  const room = getActiveRoom();
  if (!room) {
    return;
  }

  for (const photo of room.photos) {
    schedulePhotoAssetHydration(photo.id);
  }
}

function schedulePhotoAssetHydration(photoId) {
  const room = getActiveRoom();
  const photo = room?.photos.find((entry) => entry.id === photoId);
  if (!photo) {
    return;
  }

  const currentAssets = runtimePhotoAssets.get(photo.id);
  if (currentAssets && currentAssets.assetPresetId === photo.presetId) {
    return;
  }

  const jobKey = `${photo.id}::${photo.presetId}`;
  if (pendingPhotoAssetJobs.has(jobKey)) {
    return;
  }

  const runJob = async () => {
    try {
      const assets = await buildUiPhotoAssets(photo);
      const latestPhoto = getActiveRoom()?.photos.find((entry) => entry.id === photo.id)
        ?? state.rooms.flatMap((entry) => entry.photos).find((entry) => entry.id === photo.id);
      if (!latestPhoto || latestPhoto.presetId !== photo.presetId) {
        return;
      }
      runtimePhotoAssets.set(photo.id, assets);
      if (getActiveRoom()?.photos.some((entry) => entry.id === photo.id)) {
        scheduleRender();
      }
    } catch (error) {
      console.error("Failed to build UI photo assets", error);
    } finally {
      pendingPhotoAssetJobs.delete(jobKey);
    }
  };

  pendingPhotoAssetJobs.set(jobKey, runJob);
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(() => runJob(), { timeout: 300 });
  } else {
    window.setTimeout(runJob, 0);
  }
}

async function runCountdown(seconds) {
  window.clearInterval(cameraCountdownHandle);
  elements.timerCountdown.classList.remove("hidden");
  elements.timerCountdown.textContent = String(seconds);

  await new Promise((resolve) => {
    let remaining = seconds;
    cameraCountdownHandle = window.setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        window.clearInterval(cameraCountdownHandle);
        elements.timerCountdown.classList.add("hidden");
        resolve();
        return;
      }
      elements.timerCountdown.textContent = String(remaining);
    }, 1000);
  });
}

function getStageExportOptions() {
  const stageRect = getStageRect();
  return {
    referenceWidth: stageRect.width || 960,
    referenceHeight: stageRect.height || 720,
  };
}

function getRoomInsights(room) {
  const favoriteCount = room.photos.filter((photo) => photo.favorite).length;
  const dateSet = new Set(
    room.photos.map((photo) => (photo.createdAt ? photo.createdAt.slice(0, 10) : photo.displayDate)),
  );

  return {
    favoriteCount,
    uniqueDays: dateSet.size || 0,
  };
}

function isPresetAvailable(room, presetId) {
  const preset = getPresetById(presetId);
  return !preset.premium || room.addOns.includes("creator-pass");
}

function isFrameAvailable(room, frameId) {
  const frame = getFrameById(frameId);
  return !frame.premium || room.addOns.includes("creator-pass");
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

async function runSmokeTestIfNeeded() {
  const shouldRun = new URL(window.location.href).searchParams.get("autotest");
  if (!shouldRun) {
    return;
  }

  try {
    elements.body.dataset.testStatus = "running";
    const room = getActiveRoom();
    if (!room.photos.length) {
      addDemoShot();
    }

    updateUi({ activeTab: "gallery", selectedPhotoId: getActiveRoom().photos[0]?.id ?? null }, { persist: false });
    render();
    await new Promise((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));

    const latestRoom = getActiveRoom();
    const selected = getSelectedPhoto(latestRoom) ?? latestRoom.photos[0];
    await buildCollageCanvas(latestRoom, getStageExportOptions());
    await buildStripCanvas(latestRoom, latestRoom.photos);
    await buildShareCardCanvas(latestRoom, selected);
    await buildSinglePolaroidCanvas(latestRoom, selected);

    elements.body.dataset.testStatus = "passed";
    elements.body.dataset.photoCount = String(latestRoom.photos.length);
    elements.smokeStatus.textContent = `Smoke test passed with ${latestRoom.photos.length} photo(s).`;
    elements.smokeStatus.classList.add("visible");
  } catch (error) {
    console.error(error);
    elements.body.dataset.testStatus = "failed";
    elements.smokeStatus.textContent = `Smoke test failed: ${error.message}`;
    elements.smokeStatus.classList.add("visible");
  }
}
