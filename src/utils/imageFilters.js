// Advanced Document Scanner Image Processing Filters (100% Client-side Canvas)

export function applyDocumentFilter(sourceCanvas, filterType = 'bw') {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = width;
  outputCanvas.height = height;
  const ctx = outputCanvas.getContext('2d', { willReadFrequently: true });
  
  // Draw initial image
  ctx.drawImage(sourceCanvas, 0, 0);

  if (filterType === 'original') {
    return outputCanvas;
  }

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const len = data.length;

  if (filterType === 'grayscale') {
    for (let i = 0; i < len; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Standard luminance formula
      const gray = (r * 0.299 + g * 0.587 + b * 0.114);
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
    ctx.putImageData(imgData, 0, 0);
    return outputCanvas;
  }

  if (filterType === 'bw') {
    // Intelligent Clean B&W Document Filter (Binarization & Shadow Removal)
    // 1. Calculate average luminance across image
    let sumGray = 0;
    const grayBuffer = new Uint8ClampedArray(len / 4);

    for (let i = 0, j = 0; i < len; i += 4, j++) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = (r * 0.299 + g * 0.587 + b * 0.114);
      grayBuffer[j] = gray;
      sumGray += gray;
    }

    const avgLuminance = sumGray / (len / 4);
    // Dynamic threshold slightly below average to cleanly separate background paper from ink
    const threshold = Math.max(115, Math.min(175, avgLuminance * 0.88));

    for (let i = 0, j = 0; i < len; i += 4, j++) {
      const g = grayBuffer[j];
      // Contrast stretch and binarize
      const val = g < threshold ? 0 : 255;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    }

    ctx.putImageData(imgData, 0, 0);
    return outputCanvas;
  }

  if (filterType === 'vivid') {
    // Magic Color / Contrast & Clarity Boost
    const contrast = 35; // Contrast boost
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    for (let i = 0; i < len; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Auto-brighten slightly to whiten paper
      r = Math.min(255, r * 1.08);
      g = Math.min(255, g * 1.08);
      b = Math.min(255, b * 1.08);

      // Contrast apply
      r = factor * (r - 128) + 128;
      g = factor * (g - 128) + 128;
      b = factor * (b - 128) + 128;

      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }

    ctx.putImageData(imgData, 0, 0);
    return outputCanvas;
  }

  return outputCanvas;
}

export function rotateCanvas(sourceCanvas, degrees) {
  const rad = (degrees * Math.PI) / 180;
  const is90or270 = Math.abs(degrees % 180) === 90;

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = is90or270 ? sourceCanvas.height : sourceCanvas.width;
  outputCanvas.height = is90or270 ? sourceCanvas.width : sourceCanvas.height;

  const ctx = outputCanvas.getContext('2d');
  ctx.translate(outputCanvas.width / 2, outputCanvas.height / 2);
  ctx.rotate(rad);
  ctx.drawImage(sourceCanvas, -sourceCanvas.width / 2, -sourceCanvas.height / 2);

  return outputCanvas;
}
