import { getPresetById } from "./data.js";

const sourceImageCache = new Map();
const processedImageCache = new Map();

function loadImage(src) {
  if (!src) {
    return Promise.reject(new Error("Missing image source"));
  }

  if (sourceImageCache.has(src)) {
    return sourceImageCache.get(src);
  }

  const promise = new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

  sourceImageCache.set(src, promise);
  return promise;
}

function getTargetSize(image, maxSize) {
  const longestSide = Math.max(image.width, image.height);
  const scale = Math.min(1, maxSize / longestSide);
  return {
    width: Math.max(1, Math.round(image.width * scale)),
    height: Math.max(1, Math.round(image.height * scale)),
  };
}

async function renderFilteredDataUrl(src, presetId, maxSize, quality = 0.88) {
  const cacheKey = `${presetId}::${maxSize}::${src}`;
  if (processedImageCache.has(cacheKey)) {
    return processedImageCache.get(cacheKey);
  }

  const promise = (async () => {
    const preset = getPresetById(presetId);
    const image = await loadImage(src);
    const targetSize = getTargetSize(image, maxSize);
    const canvas = document.createElement("canvas");
    canvas.width = targetSize.width;
    canvas.height = targetSize.height;
    const context = canvas.getContext("2d");
    context.filter = preset.canvasFilter;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    context.filter = "none";

    if (preset.wash) {
      context.fillStyle = preset.wash;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    return canvas.toDataURL("image/jpeg", quality);
  })();

  processedImageCache.set(cacheKey, promise);
  return promise;
}

export async function buildUiPhotoAssets(photo) {
  const source = photo.originalSrc || photo.src;
  if (!source) {
    throw new Error("Photo has no source image");
  }

  const [displaySrc, thumbnailSrc] = await Promise.all([
    renderFilteredDataUrl(source, photo.presetId, 1200, 0.9),
    renderFilteredDataUrl(source, photo.presetId, 240, 0.8),
  ]);

  return {
    originalSrc: source,
    displaySrc,
    thumbnailSrc,
    assetPresetId: photo.presetId,
  };
}
