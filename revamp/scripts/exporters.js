import { getFrameById, getPresetById, getThemeById } from "./data.js";

const imageCache = new Map();

function loadImage(src) {
  if (!src) {
    return Promise.reject(new Error("Missing image source"));
  }

  if (imageCache.has(src)) {
    return imageCache.get(src);
  }

  const promise = new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

  imageCache.set(src, promise);
  return promise;
}

function fillThemeBackground(context, themeId, width, height) {
  const theme = getThemeById(themeId);
  let gradient;

  if (theme.id === "linen") {
    gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#f7f2e6");
    gradient.addColorStop(1, "#ddd2c2");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    context.strokeStyle = "rgba(96, 82, 68, 0.09)";
    context.lineWidth = 1;
    for (let y = 0; y < height; y += 26) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
    for (let x = 0; x < width; x += 28) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    return;
  }

  if (theme.id === "cork") {
    gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#b98f57");
    gradient.addColorStop(1, "#6d4729");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    context.fillStyle = "rgba(255, 245, 220, 0.1)";
    for (let index = 0; index < 180; index += 1) {
      context.beginPath();
      context.arc(
        Math.random() * width,
        Math.random() * height,
        Math.random() * 4,
        0,
        Math.PI * 2,
      );
      context.fill();
    }
    return;
  }

  if (theme.id === "neon") {
    gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#253a4f");
    gradient.addColorStop(0.55, "#12151d");
    gradient.addColorStop(1, "#1e2835");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    context.fillStyle = "rgba(237, 125, 64, 0.18)";
    context.beginPath();
    context.arc(width * 0.18, height * 0.18, width * 0.12, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "rgba(73, 170, 166, 0.18)";
    context.beginPath();
    context.arc(width * 0.82, height * 0.18, width * 0.14, 0, Math.PI * 2);
    context.fill();
    return;
  }

  if (theme.id === "midnight") {
    gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#32455b");
    gradient.addColorStop(0.5, "#141d2a");
    gradient.addColorStop(1, "#0d1118");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    return;
  }

  gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#714624");
  gradient.addColorStop(1, "#3d2719");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.fillStyle = "rgba(255,255,255,0.04)";
  for (let index = 0; index < width; index += 26) {
    context.fillRect(index, 0, 4, height);
  }
}

function drawGrain(context, x, y, width, height, alpha = 0.12) {
  context.save();
  context.fillStyle = `rgba(255,255,255,${alpha})`;
  for (let index = 0; index < 320; index += 1) {
    const size = Math.random() * 2.4 + 0.5;
    context.fillRect(
      x + Math.random() * width,
      y + Math.random() * height,
      size,
      size,
    );
  }
  context.restore();
}

function drawWash(context, x, y, width, height, color) {
  context.save();
  context.fillStyle = color;
  context.fillRect(x, y, width, height);
  context.restore();
}

async function drawPhotoWindow(context, imageSource, photo, x, y, size) {
  const preset = getPresetById(photo.presetId);
  const image = await loadImage(imageSource);
  const cropSize = Math.min(image.width, image.height);
  const sourceX = Math.max(0, (image.width - cropSize) / 2);
  const sourceY = Math.max(0, (image.height - cropSize) / 2);

  context.save();
  context.beginPath();
  context.rect(x, y, size, size);
  context.clip();
  context.filter = preset.canvasFilter;
  context.drawImage(image, sourceX, sourceY, cropSize, cropSize, x, y, size, size);
  context.filter = "none";
  drawWash(context, x, y, size, size, preset.wash);
  context.restore();
  drawGrain(context, x, y, size, size, preset.grain);
}

async function renderPolaroidCard(context, room, photo, options = {}) {
  const size = options.size ?? photo.width ?? 224;
  const x = options.x ?? photo.x ?? 90;
  const y = options.y ?? photo.y ?? 90;
  const rotation = parseFloat(String(photo.rotation).replace("deg", "")) || 0;
  const frame = getFrameById(photo.frameId);
  const paperColor =
    frame.id === "noir"
      ? "#16181d"
      : frame.id === "sunwashed"
        ? "#f0dfc4"
        : frame.id === "brand"
          ? "#f6eedb"
          : "#fffdf9";
  const ink = frame.id === "noir" ? "#f7efe0" : "#271f1a";
  const accent = room.accentColor ?? "#d06e4f";

  context.save();
  context.translate(x + size / 2, y + size / 2);
  context.rotate((rotation * Math.PI) / 180);
  context.translate(-size / 2, -size / 2);

  context.shadowColor = "rgba(0,0,0,0.22)";
  context.shadowBlur = 32;
  context.shadowOffsetY = 16;
  context.fillStyle = paperColor;
  context.fillRect(0, 0, size, size + size * 0.32);
  context.shadowColor = "transparent";

  if (frame.id === "brand") {
    context.fillStyle = accent;
    context.fillRect(0, size + size * 0.26, size, size * 0.06);
  }

  const imageInset = size * 0.065;
  const imageSize = size - imageInset * 2;
  await drawPhotoWindow(context, photo.originalSrc || photo.src, photo, imageInset, imageInset, imageSize);

  context.strokeStyle = "rgba(0, 0, 0, 0.08)";
  context.lineWidth = 1;
  context.strokeRect(imageInset, imageInset, imageSize, imageSize);

  if (room.typeId === "brand") {
    context.fillStyle = "rgba(20, 20, 20, 0.66)";
    context.fillRect(imageInset + 10, imageInset + 10, size * 0.34, size * 0.12);
    context.fillStyle = "#fff7eb";
    context.font = '700 14px "Space Grotesk"';
    context.fillText((room.hostName || "Brand").slice(0, 16), imageInset + 18, imageInset + 34);
  }

  context.fillStyle = ink;
  context.textAlign = "center";
  context.font = '24px "Special Elite"';
  context.fillText(photo.caption.slice(0, 26), size / 2, size + 38);
  context.fillStyle = frame.id === "noir" ? "rgba(247,239,224,0.68)" : "rgba(39,31,26,0.58)";
  context.font = '13px "Space Grotesk"';
  context.fillText(photo.displayDate, size / 2, size + 62);

  context.restore();
}

export async function buildCollageCanvas(room, options = {}) {
  const width = options.width ?? 1800;
  const height = options.height ?? 1200;
  const referenceWidth = options.referenceWidth ?? 960;
  const referenceHeight = options.referenceHeight ?? 720;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  fillThemeBackground(context, room.themeId, width, height);

  const xScale = width / referenceWidth;
  const yScale = height / referenceHeight;
  const sizeScale = Math.min(xScale, yScale);

  const photos = [...room.photos].sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt));
  for (const photo of photos) {
    await renderPolaroidCard(context, room, photo, {
      x: photo.x * xScale,
      y: photo.y * yScale,
      size: (photo.width ?? 224) * sizeScale,
    });
  }

  context.fillStyle = "rgba(255, 255, 255, 0.75)";
  context.fillRect(36, 36, 420, 112);
  context.fillStyle = "#211913";
  context.font = '700 40px "Fraunces"';
  context.fillText(room.name.slice(0, 26), 64, 84);
  context.font = '18px "Space Grotesk"';
  context.fillStyle = "rgba(33, 25, 19, 0.7)";
  context.fillText(`${room.hostLabel} ${room.hostName}`.slice(0, 46), 64, 116);

  return canvas;
}

export async function buildSinglePolaroidCanvas(room, photo, size = 1400) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = Math.round(size * 1.45);
  const context = canvas.getContext("2d");
  fillThemeBackground(context, room.themeId, canvas.width, canvas.height);
  await renderPolaroidCard(context, room, photo, {
    x: (canvas.width - size * 0.74) / 2,
    y: 120,
    size: size * 0.74,
  });

  context.fillStyle = "rgba(255, 250, 241, 0.92)";
  context.fillRect(80, canvas.height - 210, canvas.width - 160, 130);
  context.fillStyle = "#211913";
  context.font = '700 36px "Fraunces"';
  context.fillText(room.name.slice(0, 24), 120, canvas.height - 156);
  context.font = '20px "Space Grotesk"';
  context.fillText(photo.note.slice(0, 70) || room.callToAction.slice(0, 70), 120, canvas.height - 118);
  return canvas;
}

export async function buildStripCanvas(room, photos = []) {
  const targetPhotos = [...photos]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, 4)
    .reverse();

  const canvas = document.createElement("canvas");
  canvas.width = 1040;
  canvas.height = 2480;
  const context = canvas.getContext("2d");
  fillThemeBackground(context, room.themeId, canvas.width, canvas.height);

  context.fillStyle = "rgba(255, 249, 240, 0.9)";
  context.fillRect(70, 52, canvas.width - 140, canvas.height - 104);
  context.fillStyle = "#251d17";
  context.font = '700 44px "Fraunces"';
  context.fillText(room.name.slice(0, 28), 118, 124);
  context.font = '18px "Space Grotesk"';
  context.fillText(`${room.hostLabel} ${room.hostName}`.slice(0, 40), 118, 156);

  let y = 220;
  for (const photo of targetPhotos) {
    await renderPolaroidCard(context, room, photo, {
      x: 148,
      y,
      size: 740,
    });
    y += 530;
  }

  return canvas;
}

export async function buildShareCardCanvas(room, photo) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext("2d");
  fillThemeBackground(context, room.themeId, canvas.width, canvas.height);

  context.fillStyle = "rgba(255, 249, 240, 0.14)";
  context.fillRect(42, 42, canvas.width - 84, canvas.height - 84);
  context.fillStyle = "rgba(255, 249, 240, 0.92)";
  context.fillRect(72, 72, canvas.width - 144, 250);

  context.fillStyle = "#221a13";
  context.font = '700 64px "Fraunces"';
  context.fillText(room.name.slice(0, 20), 112, 150);
  context.font = '28px "Space Grotesk"';
  context.fillText(room.subtitle.slice(0, 48), 112, 196);
  context.fillText(room.callToAction.slice(0, 48), 112, 238);

  await renderPolaroidCard(context, room, photo, {
    x: 198,
    y: 340,
    size: 684,
  });

  context.fillStyle = "rgba(255, 249, 240, 0.92)";
  context.fillRect(72, canvas.height - 152, canvas.width - 144, 82);
  context.fillStyle = "#221a13";
  context.font = '700 26px "Space Grotesk"';
  context.fillText(`${room.hostLabel} ${room.hostName}`.slice(0, 40), 112, canvas.height - 104);
  context.textAlign = "right";
  context.fillText(room.code, canvas.width - 112, canvas.height - 104);
  return canvas;
}

export function downloadCanvas(canvas, filename) {
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = filename;
  link.click();
}

export function openPrintGuestbook(room) {
  const printablePhotos = [...room.photos].sort(
    (left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt),
  );

  const popup = window.open("", "_blank", "noopener,noreferrer,width=1100,height=900");
  if (!popup) {
    return false;
  }

  const pages = printablePhotos
    .map(
      (photo, index) => `
        <article class="page">
          <div class="sheet">
            <header>
              <p>${room.name}</p>
              <h1>${photo.caption}</h1>
            </header>
            <section class="print-photo">
              <img src="${photo.displaySrc || photo.originalSrc || photo.src}" alt="${photo.caption}">
            </section>
            <footer>
              <div>
                <strong>${photo.displayDate}</strong>
                <p>${photo.note || room.prompt || room.callToAction}</p>
              </div>
              <span>${String(index + 1).padStart(2, "0")}</span>
            </footer>
          </div>
        </article>
      `,
    )
    .join("");

  popup.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${room.name} Guestbook</title>
      <style>
        body {
          margin: 0;
          font-family: Arial, sans-serif;
          background: #f3ede2;
        }
        .page {
          page-break-after: always;
          padding: 32px;
        }
        .sheet {
          background: #fffaf1;
          border-radius: 24px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
          padding: 32px;
        }
        header p {
          margin: 0 0 8px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-size: 12px;
          color: #8c6c56;
        }
        header h1 {
          margin: 0 0 18px;
          font-size: 34px;
        }
        .print-photo img {
          width: 100%;
          border-radius: 18px;
          display: block;
          aspect-ratio: 1;
          object-fit: cover;
        }
        footer {
          margin-top: 24px;
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: flex-end;
        }
        footer p {
          margin: 8px 0 0;
          color: #5d5248;
          line-height: 1.5;
        }
        footer span {
          font-size: 24px;
          color: #b28b5f;
        }
        @media print {
          body {
            background: #fff;
          }
          .sheet {
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      ${pages || `<p style="padding: 32px;">No photos yet.</p>`}
      <script>window.onload = () => window.print();</script>
    </body>
    </html>
  `);
  popup.document.close();
  return true;
}
