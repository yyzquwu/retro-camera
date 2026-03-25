import { RATIO_OPTIONS } from "./data.js";

function waitForImageLoad(image) {
  return new Promise((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = reject;
  });
}

function getRatioValue(ratioId) {
  return RATIO_OPTIONS.find((ratio) => ratio.id === ratioId)?.value ?? 1;
}

export class RetroCamera {
  constructor(videoElement) {
    this.videoElement = videoElement;
    this.stream = null;
    this.mode = "demo";
  }

  async start(facingMode = "user") {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.mode = "demo";
      return {
        ok: false,
        mode: "demo",
        message: "Camera APIs are unavailable. Demo mode is active.",
      };
    }

    try {
      await this.stop();
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode,
          width: { ideal: 1440 },
          height: { ideal: 1440 },
        },
      });
      this.videoElement.srcObject = this.stream;
      await this.videoElement.play();
      this.mode = "camera";
      return {
        ok: true,
        mode: "camera",
        message: facingMode === "environment" ? "Rear lens ready." : "Front lens ready.",
      };
    } catch (error) {
      console.error("Unable to start camera", error);
      this.mode = "demo";
      return {
        ok: false,
        mode: "demo",
        message: "Camera access failed. Import a photo or use demo shots instead.",
      };
    }
  }

  async stop() {
    if (!this.stream) {
      return;
    }

    this.stream.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.videoElement.srcObject = null;
    this.mode = "demo";
  }

  async captureFrame(ratioId = "1:1") {
    if (!this.stream || this.mode !== "camera") {
      return null;
    }

    const sourceWidth = this.videoElement.videoWidth;
    const sourceHeight = this.videoElement.videoHeight;
    if (!sourceWidth || !sourceHeight) {
      return null;
    }

    const ratioValue = getRatioValue(ratioId);
    let cropWidth = sourceWidth;
    let cropHeight = cropWidth / ratioValue;

    if (cropHeight > sourceHeight) {
      cropHeight = sourceHeight;
      cropWidth = cropHeight * ratioValue;
    }

    const sourceX = Math.max(0, (sourceWidth - cropWidth) / 2);
    const sourceY = Math.max(0, (sourceHeight - cropHeight) / 2);

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(1080 * ratioValue);
    canvas.height = 1080;

    if (ratioValue < 1) {
      canvas.width = 1080;
      canvas.height = Math.round(1080 / ratioValue);
    }

    const context = canvas.getContext("2d");
    context.save();
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(
      this.videoElement,
      sourceX,
      sourceY,
      cropWidth,
      cropHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    context.restore();

    return canvas.toDataURL("image/jpeg", 0.92);
  }

  async importFile(file) {
    if (!file) {
      return null;
    }

    const objectUrl = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = objectUrl;
      await waitForImageLoad(image);

      const maxDimension = 1600;
      const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.92);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  createDemoShot({
    title = "Retro Memory",
    accentColor = "#d06e4f",
    roomName = "Retro Room",
    ratioId = "1:1",
  } = {}) {
    const ratioValue = getRatioValue(ratioId);
    const canvas = document.createElement("canvas");
    canvas.width = ratioValue >= 1 ? Math.round(1200 * ratioValue) : 1200;
    canvas.height = ratioValue >= 1 ? 1200 : Math.round(1200 / ratioValue);

    const context = canvas.getContext("2d");
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, accentColor);
    gradient.addColorStop(0.45, "#1f3940");
    gradient.addColorStop(1, "#f2c268");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "rgba(255,255,255,0.16)";
    for (let index = 0; index < 11; index += 1) {
      context.beginPath();
      context.arc(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        18 + Math.random() * 70,
        0,
        Math.PI * 2,
      );
      context.fill();
    }

    context.fillStyle = "rgba(255, 247, 234, 0.92)";
    context.font = '700 56px "Fraunces"';
    context.fillText(title.slice(0, 24), 82, canvas.height - 160);
    context.font = '400 30px "Space Grotesk"';
    context.fillText(roomName.slice(0, 32), 82, canvas.height - 108);
    context.font = '400 24px "Special Elite"';
    context.fillText("demo capture", 82, canvas.height - 64);

    context.strokeStyle = "rgba(255,255,255,0.32)";
    context.lineWidth = 6;
    context.strokeRect(26, 26, canvas.width - 52, canvas.height - 52);

    return canvas.toDataURL("image/jpeg", 0.92);
  }
}
