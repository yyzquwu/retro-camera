import { createRoom } from "./data.js";

const STORAGE_KEY = "retro-room-studio-state-v1";

function normalizeUi(ui = {}) {
  return {
    activeTab: ui.activeTab ?? "overview",
    selectedPhotoId: ui.selectedPhotoId ?? null,
    timerId: ui.timerId ?? "0",
    ratioId: ui.ratioId ?? "1:1",
    facingMode: ui.facingMode ?? "user",
  };
}

function normalizeRoom(room) {
  return {
    ...createRoom(room?.typeId ?? "event"),
    ...room,
    photos: Array.isArray(room?.photos) ? room.photos : [],
    addOns: Array.isArray(room?.addOns) ? room.addOns : [],
  };
}

export function createInitialState() {
  const starterRoom = createRoom("event");
  return {
    version: 1,
    rooms: [starterRoom],
    activeRoomId: starterRoom.id,
    ui: normalizeUi(),
  };
}

export function loadState() {
  try {
    const rawValue = localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return createInitialState();
    }

    const parsed = JSON.parse(rawValue);
    const rooms = Array.isArray(parsed?.rooms)
      ? parsed.rooms.map(normalizeRoom)
      : createInitialState().rooms;

    const activeRoomId =
      rooms.find((room) => room.id === parsed?.activeRoomId)?.id ?? rooms[0].id;

    return {
      version: 1,
      rooms,
      activeRoomId,
      ui: normalizeUi(parsed?.ui),
    };
  } catch (error) {
    console.error("Failed to load Retro Room Studio state", error);
    return createInitialState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function replaceRoom(state, room) {
  return {
    ...state,
    rooms: state.rooms.map((candidate) => (candidate.id === room.id ? room : candidate)),
  };
}

export function addRoom(state, room) {
  return {
    ...state,
    rooms: [room, ...state.rooms],
    activeRoomId: room.id,
  };
}

export function setActiveRoom(state, roomId) {
  return {
    ...state,
    activeRoomId: roomId,
  };
}

export function findRoomByCode(state, code) {
  return state.rooms.find((room) => room.code.toUpperCase() === code.toUpperCase()) ?? null;
}

export function cloneState(state) {
  return structuredClone(state);
}
