export const ROOM_TYPES = [
  {
    id: "event",
    label: "Event Guestbook",
    shortLabel: "Event",
    description: "Weddings, birthdays, dinners, and popups with a private live guestbook.",
    price: "$49 / event",
    packaging: "One-time package",
    defaultName: "Golden Hour Guestbook",
    defaultSubtitle: "Guests leave photos and notes for the host.",
    defaultHostLabel: "Hosted by",
    defaultVenue: "Loft 9",
    defaultCallToAction: "Scan in, take a shot, leave a note.",
    defaultThemeId: "walnut",
    defaultPresetId: "warm-70s",
    defaultFrameId: "classic",
  },
  {
    id: "journal",
    label: "Private Journal",
    shortLabel: "Journal",
    description: "A couple or friend journal with a daily prompt, private notes, and recap exports.",
    price: "$9 / month",
    packaging: "Recurring subscription",
    defaultName: "Late Night Journal",
    defaultSubtitle: "One room, one ongoing memory habit.",
    defaultHostLabel: "Shared by",
    defaultVenue: "Home",
    defaultCallToAction: "Answer today’s prompt and keep the streak alive.",
    defaultThemeId: "linen",
    defaultPresetId: "sun-faded",
    defaultFrameId: "sunwashed",
  },
  {
    id: "brand",
    label: "Brand Campaign",
    shortLabel: "Brand",
    description: "Cafe, creator, and retail activations with custom accents, CTAs, and export packs.",
    price: "$299 / campaign",
    packaging: "B2B activation",
    defaultName: "Cafe Film Drop",
    defaultSubtitle: "Branded room skin with share-ready assets.",
    defaultHostLabel: "Presented by",
    defaultVenue: "Downtown Cafe",
    defaultCallToAction: "Make something worth posting.",
    defaultThemeId: "neon",
    defaultPresetId: "drugstore-flash",
    defaultFrameId: "brand",
  },
];

export const TIMER_OPTIONS = [
  { id: "0", label: "Instant" },
  { id: "3", label: "3 seconds" },
  { id: "10", label: "10 seconds" },
];

export const RATIO_OPTIONS = [
  { id: "1:1", label: "Square 1:1", value: 1 },
  { id: "4:5", label: "Portrait 4:5", value: 4 / 5 },
  { id: "3:4", label: "Classic 3:4", value: 3 / 4 },
  { id: "16:9", label: "Wide 16:9", value: 16 / 9 },
];

export const FILM_PRESETS = [
  {
    id: "warm-70s",
    label: "Warm 70s",
    description: "Warm instant film with soft shadows and rich reds.",
    cssFilter: "sepia(0.35) saturate(1.18) contrast(1.07) brightness(0.96)",
    canvasFilter: "sepia(0.35) saturate(1.18) contrast(1.07) brightness(0.96)",
    premium: false,
    grain: 0.11,
    wash: "rgba(243, 176, 106, 0.12)",
  },
  {
    id: "drugstore-flash",
    label: "Drugstore Flash",
    description: "Glossy flash look for nightlife, parties, and branded popups.",
    cssFilter: "contrast(1.18) saturate(1.16) brightness(1.02)",
    canvasFilter: "contrast(1.18) saturate(1.16) brightness(1.02)",
    premium: false,
    grain: 0.08,
    wash: "rgba(255, 246, 230, 0.1)",
  },
  {
    id: "sun-faded",
    label: "Sun Faded",
    description: "Soft cream highlights with aged paper warmth.",
    cssFilter: "sepia(0.25) saturate(0.85) contrast(0.96) brightness(1.04)",
    canvasFilter: "sepia(0.25) saturate(0.85) contrast(0.96) brightness(1.04)",
    premium: false,
    grain: 0.15,
    wash: "rgba(255, 235, 204, 0.18)",
  },
  {
    id: "dusty-mono",
    label: "Dusty Mono",
    description: "High-emotion monochrome with analog dust.",
    cssFilter: "grayscale(1) contrast(1.1) brightness(0.98)",
    canvasFilter: "grayscale(1) contrast(1.1) brightness(0.98)",
    premium: false,
    grain: 0.2,
    wash: "rgba(245, 242, 235, 0.12)",
  },
  {
    id: "golden-hour",
    label: "Golden Hour",
    description: "Premium warm glow with honey highlights.",
    cssFilter: "sepia(0.28) saturate(1.22) contrast(1.04) brightness(1.05)",
    canvasFilter: "sepia(0.28) saturate(1.22) contrast(1.04) brightness(1.05)",
    premium: true,
    grain: 0.12,
    wash: "rgba(255, 203, 109, 0.18)",
  },
  {
    id: "blue-motel",
    label: "Blue Motel",
    description: "Premium cool tint for moody date nights and campaigns.",
    cssFilter: "hue-rotate(192deg) saturate(1.1) contrast(1.08) brightness(0.95)",
    canvasFilter: "hue-rotate(192deg) saturate(1.1) contrast(1.08) brightness(0.95)",
    premium: true,
    grain: 0.1,
    wash: "rgba(80, 142, 210, 0.14)",
  },
];

export const FRAME_STYLES = [
  {
    id: "classic",
    label: "Classic White",
    description: "Traditional white instant frame.",
    premium: false,
  },
  {
    id: "noir",
    label: "Noir Stamp",
    description: "Dark frame for monochrome edits and night scenes.",
    premium: false,
  },
  {
    id: "sunwashed",
    label: "Cream Ledger",
    description: "Warm cream paper with a soft aged look.",
    premium: false,
  },
  {
    id: "brand",
    label: "Brand Ribbon",
    description: "Accent stripe and sponsor-ready footer.",
    premium: true,
  },
];

export const SURFACE_THEMES = [
  {
    id: "walnut",
    label: "Walnut Desk",
    className: "theme-walnut",
    swatch: "linear-gradient(135deg, #714624, #3d2719)",
  },
  {
    id: "cork",
    label: "Cork Board",
    className: "theme-cork",
    swatch: "linear-gradient(135deg, #c39561, #8d6139)",
  },
  {
    id: "linen",
    label: "Linen Page",
    className: "theme-linen",
    swatch: "linear-gradient(135deg, #f6f2ea, #ddd2c2)",
  },
  {
    id: "neon",
    label: "Neon Counter",
    className: "theme-neon",
    swatch: "linear-gradient(135deg, #253a4f, #12151d)",
  },
  {
    id: "midnight",
    label: "Midnight Table",
    className: "theme-midnight",
    swatch: "linear-gradient(135deg, #32455b, #0d1118)",
  },
];

export const MONETIZATION_PACKAGES = [
  {
    id: "event-pro",
    label: "Event Guestbook Package",
    price: "$49 / event",
    description: "Private room, host cover page, QR invite, and guestbook print view.",
    bestFor: "Weddings, birthdays, launch parties",
    includes: [
      "Private room code and invite share card",
      "Downloadable collage, 4-up strip, and print guestbook",
      "Premium film packs and branded welcome screen",
    ],
  },
  {
    id: "journal-club",
    label: "Journal Club Subscription",
    price: "$9 / month",
    description: "Shared room with prompts, streak tracking, and monthly recap exports.",
    bestFor: "Couples, roommates, long-distance friends",
    includes: [
      "Daily prompt support and local streak metrics",
      "Private back notes on every shot",
      "Monthly recap and single-polaroid exports",
    ],
  },
  {
    id: "brand-campaign",
    label: "Brand Campaign Suite",
    price: "$299 / campaign",
    description: "Accent colors, CTA text, brand footer, and social-share deliverables.",
    bestFor: "Cafes, creators, retail popups",
    includes: [
      "Brand accents and sponsor footer frame",
      "Share-card export for social posts",
      "Campaign room styling and call-to-action copy",
    ],
  },
];

export const ADD_ONS = [
  {
    id: "creator-pass",
    label: "Creator Pass",
    price: "$12",
    description: "Unlock premium film packs and the brand ribbon frame.",
  },
  {
    id: "print-pack",
    label: "Print Pack",
    price: "$18",
    description: "Guestbook print layout and premium collage sizing.",
  },
  {
    id: "campaign-kit",
    label: "Campaign Kit",
    price: "$39",
    description: "Brand CTA copy, sponsor footer, and share-card export.",
  },
];

export const JOURNAL_PROMPTS = [
  "What did today feel like in one sentence?",
  "What do you want to remember about tonight?",
  "What tiny detail would future-you miss without a photo?",
  "Which part of today surprised you most?",
  "What looked better in real life than in your camera roll?",
];

export function generateId(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}

export function generateRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let index = 0; index < 4; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `ROOM-${code}`;
}

export function getRoomTypeById(roomTypeId) {
  return ROOM_TYPES.find((roomType) => roomType.id === roomTypeId) ?? ROOM_TYPES[0];
}

export function getPresetById(presetId) {
  return FILM_PRESETS.find((preset) => preset.id === presetId) ?? FILM_PRESETS[0];
}

export function getFrameById(frameId) {
  return FRAME_STYLES.find((frame) => frame.id === frameId) ?? FRAME_STYLES[0];
}

export function getThemeById(themeId) {
  return SURFACE_THEMES.find((theme) => theme.id === themeId) ?? SURFACE_THEMES[0];
}

export function getDailyPrompt() {
  const dayIndex = new Date().getDate() % JOURNAL_PROMPTS.length;
  return JOURNAL_PROMPTS[dayIndex];
}

export function createRoom(typeId = "event") {
  const roomType = getRoomTypeById(typeId);
  const now = new Date().toISOString();
  return {
    id: generateId("room"),
    code: generateRoomCode(),
    typeId: roomType.id,
    packageId: roomType.id === "event" ? "event-pro" : roomType.id === "journal" ? "journal-club" : "brand-campaign",
    name: roomType.defaultName,
    subtitle: roomType.defaultSubtitle,
    hostLabel: roomType.defaultHostLabel,
    hostName: roomType.id === "brand" ? "Northside Roasters" : "Avery & Jules",
    venue: roomType.defaultVenue,
    callToAction: roomType.defaultCallToAction,
    accentColor: roomType.id === "brand" ? "#3aa89d" : roomType.id === "journal" ? "#8d6852" : "#d06e4f",
    themeId: roomType.defaultThemeId,
    defaultPresetId: roomType.defaultPresetId,
    defaultFrameId: roomType.defaultFrameId,
    prompt: roomType.id === "journal" ? getDailyPrompt() : roomType.defaultCallToAction,
    allowPremium: roomType.id === "brand",
    addOns: roomType.id === "brand" ? ["creator-pass", "campaign-kit"] : roomType.id === "event" ? ["print-pack"] : ["creator-pass"],
    createdAt: now,
    updatedAt: now,
    photos: [],
  };
}

export function createPhoto(overrides = {}) {
  const timestamp = new Date();
  return {
    id: generateId("photo"),
    caption: "Untitled Memory",
    note: "",
    presetId: "warm-70s",
    frameId: "classic",
    favorite: false,
    flipped: false,
    rotation: `${(Math.random() * 10 - 5).toFixed(1)}deg`,
    x: 90 + Math.random() * 260,
    y: 120 + Math.random() * 220,
    width: 224,
    createdAt: timestamp.toISOString(),
    displayDate: timestamp.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    src: "",
    originalSrc: "",
    displaySrc: "",
    thumbnailSrc: "",
    assetPresetId: "",
    ...overrides,
  };
}
