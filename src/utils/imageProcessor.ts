import JSZip from 'jszip';
import {
  ImageItem,
  ProcessedResult,
  CompressSettings,
  ResizeSettings,
  CropSettings,
  ConvertSettings,
  FilterSettings,
  WatermarkSettings,
  BgRemoveSettings,
  MemeSettings
} from '../types/image';

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image: ' + e));
    img.src = src;
  });
}

export async function fileToImageItem(file: File): Promise<ImageItem> {
  const previewUrl = URL.createObjectURL(file);
  const img = await loadImage(previewUrl);
  
  // calculate aspect ratio gcd
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(img.naturalWidth, img.naturalHeight);
  const aspectW = Math.round(img.naturalWidth / divisor);
  const aspectH = Math.round(img.naturalHeight / divisor);
  
  // Common aspect ratio label if close
  let aspectLabel = `${aspectW}:${aspectH}`;
  const ratio = img.naturalWidth / img.naturalHeight;
  if (Math.abs(ratio - 1) < 0.02) aspectLabel = '1:1';
  else if (Math.abs(ratio - 16 / 9) < 0.03) aspectLabel = '16:9';
  else if (Math.abs(ratio - 4 / 3) < 0.03) aspectLabel = '4:3';
  else if (Math.abs(ratio - 3 / 2) < 0.03) aspectLabel = '3:2';
  else if (Math.abs(ratio - 9 / 16) < 0.03) aspectLabel = '9:16';

  return {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name: file.name,
    file,
    previewUrl,
    size: file.size,
    width: img.naturalWidth,
    height: img.naturalHeight,
    type: file.type || 'image/png',
    aspectRatio: aspectLabel
  };
}

/**
 * Compress an image using HTML5 Canvas lossy/lossless encoder
 */
export async function processCompress(
  item: ImageItem,
  settings: CompressSettings
): Promise<ProcessedResult> {
  const img = await loadImage(item.previewUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d canvas context');

  // Fill white for JPEG conversion to prevent black transparent areas
  if (settings.format === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(img, 0, 0);

  const qualityRatio = settings.quality / 100;
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Canvas export failed'));
      },
      settings.format,
      qualityRatio
    );
  });

  const savedBytes = Math.max(0, item.size - blob.size);
  const savedPercent = item.size > 0 ? Math.round(((item.size - blob.size) / item.size) * 100) : 0;

  return {
    blob,
    url: URL.createObjectURL(blob),
    size: blob.size,
    width: canvas.width,
    height: canvas.height,
    format: settings.format,
    savedBytes,
    savedPercent
  };
}

/**
 * Resize an image with exact dimensions, percentage, or aspect ratio fit
 */
export async function processResize(
  item: ImageItem,
  settings: ResizeSettings
): Promise<ProcessedResult> {
  const img = await loadImage(item.previewUrl);
  let targetW = settings.width;
  let targetH = settings.height;

  if (settings.mode === 'percentage') {
    const factor = settings.percentage / 100;
    targetW = Math.max(1, Math.round(img.naturalWidth * factor));
    targetH = Math.max(1, Math.round(img.naturalHeight * factor));
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context');

  // High quality smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (settings.backgroundColor) {
    ctx.fillStyle = settings.backgroundColor;
    ctx.fillRect(0, 0, targetW, targetH);
  }

  if (settings.fit === 'stretch') {
    ctx.drawImage(img, 0, 0, targetW, targetH);
  } else if (settings.fit === 'cover') {
    // Fill the frame and crop excess
    const srcRatio = img.naturalWidth / img.naturalHeight;
    const dstRatio = targetW / targetH;
    let sw = img.naturalWidth;
    let sh = img.naturalHeight;
    let sx = 0;
    let sy = 0;

    if (srcRatio > dstRatio) {
      sw = img.naturalHeight * dstRatio;
      sx = (img.naturalWidth - sw) / 2;
    } else {
      sh = img.naturalWidth / dstRatio;
      sy = (img.naturalHeight - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
  } else {
    // 'contain' - maintain aspect ratio within canvas
    const scale = Math.min(targetW / img.naturalWidth, targetH / img.naturalHeight);
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const dx = (targetW - drawW) / 2;
    const dy = (targetH - drawH) / 2;
    ctx.drawImage(img, dx, dy, drawW, drawH);
  }

  const outputFormat = item.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b || new Blob()), outputFormat, 0.92)
  );

  return {
    blob,
    url: URL.createObjectURL(blob),
    size: blob.size,
    width: targetW,
    height: targetH,
    format: outputFormat,
    savedBytes: item.size - blob.size,
    savedPercent: Math.round(((item.size - blob.size) / item.size) * 100)
  };
}

/**
 * Crop, rotate, and flip image
 */
export async function processCrop(
  item: ImageItem,
  settings: CropSettings
): Promise<ProcessedResult> {
  const img = await loadImage(item.previewUrl);

  // 1. Create canvas for the cropped area
  const cropW = Math.max(1, Math.round(settings.width));
  const cropH = Math.max(1, Math.round(settings.height));

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = cropW;
  cropCanvas.height = cropH;
  const cropCtx = cropCanvas.getContext('2d');
  if (!cropCtx) throw new Error('Canvas context error');

  // Draw crop box from source
  cropCtx.drawImage(
    img,
    Math.max(0, settings.x),
    Math.max(0, settings.y),
    cropW,
    cropH,
    0,
    0,
    cropW,
    cropH
  );

  // 2. Handle Rotation and Flip if set
  const rotationRad = (settings.rotation * Math.PI) / 180;
  const isRightAngle = Math.abs(settings.rotation % 180) === 90;
  
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = isRightAngle ? cropH : cropW;
  finalCanvas.height = isRightAngle ? cropW : cropH;
  const finalCtx = finalCanvas.getContext('2d');
  if (!finalCtx) throw new Error('Canvas context error');

  finalCtx.imageSmoothingEnabled = true;
  finalCtx.imageSmoothingQuality = 'high';

  finalCtx.save();
  finalCtx.translate(finalCanvas.width / 2, finalCanvas.height / 2);
  finalCtx.rotate(rotationRad);
  finalCtx.scale(settings.flipHorizontal ? -1 : 1, settings.flipVertical ? -1 : 1);
  finalCtx.drawImage(cropCanvas, -cropW / 2, -cropH / 2);
  finalCtx.restore();

  const outputFormat = item.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
  const blob = await new Promise<Blob>((resolve) =>
    finalCanvas.toBlob((b) => resolve(b || new Blob()), outputFormat, 0.95)
  );

  return {
    blob,
    url: URL.createObjectURL(blob),
    size: blob.size,
    width: finalCanvas.width,
    height: finalCanvas.height,
    format: outputFormat,
    savedBytes: item.size - blob.size,
    savedPercent: Math.round(((item.size - blob.size) / item.size) * 100)
  };
}

/**
 * Convert Image Format (JPG, PNG, WebP, BMP)
 */
export async function processConvert(
  item: ImageItem,
  settings: ConvertSettings
): Promise<ProcessedResult> {
  const img = await loadImage(item.previewUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context error');

  if (settings.targetFormat === 'image/jpeg' || settings.backgroundColor !== 'transparent') {
    ctx.fillStyle = settings.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(img, 0, 0);

  const qualityRatio = settings.quality / 100;
  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b || new Blob()), settings.targetFormat, qualityRatio)
  );

  return {
    blob,
    url: URL.createObjectURL(blob),
    size: blob.size,
    width: canvas.width,
    height: canvas.height,
    format: settings.targetFormat,
    savedBytes: item.size - blob.size,
    savedPercent: Math.round(((item.size - blob.size) / item.size) * 100)
  };
}

/**
 * Filter Studio & Color Enhancer
 */
export async function processFilter(
  item: ImageItem,
  settings: FilterSettings
): Promise<ProcessedResult> {
  const img = await loadImage(item.previewUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context error');

  // Build CSS filter string for high-performance GPU blending
  let b = 100 + settings.brightness;
  let c = 100 + settings.contrast;
  let s = 100 + settings.saturation;
  let blurPx = settings.blur;
  let sepiaVal = settings.sepia ? 80 : 0;
  let invertVal = settings.invert ? 100 : 0;
  let grayVal = settings.grayscale ? 100 : 0;

  // Preset overrides
  if (settings.preset === 'vintage') {
    sepiaVal = 50;
    c = 115;
    b = 95;
    s = 85;
  } else if (settings.preset === 'vivid') {
    s = 150;
    c = 120;
    b = 105;
  } else if (settings.preset === 'bw') {
    grayVal = 100;
    c = 130;
    b = 100;
  } else if (settings.preset === 'warm') {
    sepiaVal = 25;
    s = 120;
    b = 105;
  } else if (settings.preset === 'cool') {
    s = 90;
    c = 110;
  } else if (settings.preset === 'cinematic') {
    c = 135;
    s = 110;
    b = 95;
  } else if (settings.preset === 'auto') {
    // Smart auto enhance
    c = 115;
    s = 110;
    b = 105;
  }

  const filterParts = [
    `brightness(${b}%)`,
    `contrast(${c}%)`,
    `saturate(${s}%)`,
    sepiaVal > 0 ? `sepia(${sepiaVal}%)` : '',
    invertVal > 0 ? `invert(${invertVal}%)` : '',
    grayVal > 0 ? `grayscale(${grayVal}%)` : '',
    blurPx > 0 ? `blur(${blurPx}px)` : ''
  ].filter(Boolean);

  ctx.filter = filterParts.join(' ');
  ctx.drawImage(img, 0, 0);

  // Apply subtle warmth/cool tint overlay if warmth is non-zero
  if (settings.warmth !== 0) {
    ctx.save();
    ctx.filter = 'none';
    if (settings.warmth > 0) {
      // Warm amber tint
      ctx.fillStyle = `rgba(255, 140, 0, ${Math.abs(settings.warmth) * 0.002})`;
    } else {
      // Cool cyan tint
      ctx.fillStyle = `rgba(0, 150, 255, ${Math.abs(settings.warmth) * 0.002})`;
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  const outputFormat = item.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b || new Blob()), outputFormat, 0.95)
  );

  return {
    blob,
    url: URL.createObjectURL(blob),
    size: blob.size,
    width: canvas.width,
    height: canvas.height,
    format: outputFormat,
    savedBytes: item.size - blob.size,
    savedPercent: Math.round(((item.size - blob.size) / item.size) * 100)
  };
}

/**
 * Apply Text or Image Watermark
 */
export async function processWatermark(
  item: ImageItem,
  settings: WatermarkSettings
): Promise<ProcessedResult> {
  const img = await loadImage(item.previewUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context error');

  ctx.drawImage(img, 0, 0);

  ctx.save();
  ctx.globalAlpha = settings.opacity;

  if (settings.type === 'text' && settings.text.trim()) {
    const fontSize = Math.max(12, Math.round((canvas.width / 1000) * settings.fontSize));
    ctx.font = `600 ${fontSize}px ${settings.fontFamily || 'Plus Jakarta Sans'}, sans-serif`;
    ctx.fillStyle = settings.color || '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Shadow for legibility against any background
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = Math.round(fontSize * 0.15);
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    if (settings.position === 'tiled') {
      const stepX = fontSize * 8;
      const stepY = fontSize * 5;
      const rot = (settings.rotation * Math.PI) / 180;
      for (let x = -canvas.width; x < canvas.width * 2; x += stepX) {
        for (let y = -canvas.height; y < canvas.height * 2; y += stepY) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(rot);
          ctx.fillText(settings.text, 0, 0);
          ctx.restore();
        }
      }
    } else {
      // 9-point grid placement
      let tx = canvas.width / 2;
      let ty = canvas.height / 2;
      const pad = Math.round(fontSize * 1.5);

      if (settings.position.includes('left')) tx = pad;
      else if (settings.position.includes('right')) tx = canvas.width - pad;

      if (settings.position.includes('top')) ty = pad;
      else if (settings.position.includes('bottom')) ty = canvas.height - pad;

      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate((settings.rotation * Math.PI) / 180);
      ctx.fillText(settings.text, 0, 0);
      ctx.restore();
    }
  } else if (settings.type === 'image' && settings.imageWatermarkUrl) {
    try {
      const watermarkImg = await loadImage(settings.imageWatermarkUrl);
      const targetW = canvas.width * settings.imageScale;
      const targetH = (watermarkImg.naturalHeight / watermarkImg.naturalWidth) * targetW;
      const pad = canvas.width * 0.04;

      let x = (canvas.width - targetW) / 2;
      let y = (canvas.height - targetH) / 2;

      if (settings.position.includes('left')) x = pad;
      else if (settings.position.includes('right')) x = canvas.width - targetW - pad;

      if (settings.position.includes('top')) y = pad;
      else if (settings.position.includes('bottom')) y = canvas.height - targetH - pad;

      ctx.drawImage(watermarkImg, x, y, targetW, targetH);
    } catch (e) {
      console.warn('Failed to draw watermark image', e);
    }
  }

  ctx.restore();

  const outputFormat = item.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b || new Blob()), outputFormat, 0.95)
  );

  return {
    blob,
    url: URL.createObjectURL(blob),
    size: blob.size,
    width: canvas.width,
    height: canvas.height,
    format: outputFormat,
    savedBytes: item.size - blob.size,
    savedPercent: Math.round(((item.size - blob.size) / item.size) * 100)
  };
}

/**
 * Remove Background Color (Chroma Key / Solid Color Masking)
 */
export async function processBgRemove(
  item: ImageItem,
  settings: BgRemoveSettings
): Promise<ProcessedResult> {
  const img = await loadImage(item.previewUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context error');

  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Hex to RGB
  const hex = settings.targetColor.replace('#', '');
  const tr = parseInt(hex.substring(0, 2), 16) || 255;
  const tg = parseInt(hex.substring(2, 4), 16) || 255;
  const tb = parseInt(hex.substring(4, 6), 16) || 255;

  const thresholdSq = Math.pow((settings.tolerance / 100) * 441.67, 2);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const distSq = (r - tr) * (r - tr) + (g - tg) * (g - tg) + (b - tb) * (b - tb);
    if (distSq <= thresholdSq) {
      if (settings.feather > 0) {
        const factor = Math.sqrt(distSq) / Math.sqrt(thresholdSq);
        data[i + 3] = Math.round(data[i + 3] * factor);
      } else {
        data[i + 3] = 0;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b || new Blob()), 'image/png')
  );

  return {
    blob,
    url: URL.createObjectURL(blob),
    size: blob.size,
    width: canvas.width,
    height: canvas.height,
    format: 'image/png',
    savedBytes: item.size - blob.size,
    savedPercent: Math.round(((item.size - blob.size) / item.size) * 100)
  };
}

/**
 * Meme Generator
 */
export async function processMeme(
  item: ImageItem,
  settings: MemeSettings
): Promise<ProcessedResult> {
  const img = await loadImage(item.previewUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context error');

  ctx.drawImage(img, 0, 0);

  const fontSize = Math.max(16, Math.round((canvas.width / 800) * settings.fontSize));
  ctx.font = `900 ${fontSize}px Impact, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = settings.textColor || '#ffffff';
  ctx.strokeStyle = settings.strokeColor || '#000000';
  ctx.lineWidth = Math.max(2, Math.round(fontSize * (settings.strokeWidth / 100)));
  ctx.lineJoin = 'round';

  const top = settings.uppercase ? settings.topText.toUpperCase() : settings.topText;
  const bottom = settings.uppercase ? settings.bottomText.toUpperCase() : settings.bottomText;

  if (top.trim()) {
    ctx.textBaseline = 'top';
    const y = canvas.height * 0.04;
    ctx.strokeText(top, canvas.width / 2, y);
    ctx.fillText(top, canvas.width / 2, y);
  }

  if (bottom.trim()) {
    ctx.textBaseline = 'bottom';
    const y = canvas.height * 0.96;
    ctx.strokeText(bottom, canvas.width / 2, y);
    ctx.fillText(bottom, canvas.width / 2, y);
  }

  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b || new Blob()), 'image/jpeg', 0.92)
  );

  return {
    blob,
    url: URL.createObjectURL(blob),
    size: blob.size,
    width: canvas.width,
    height: canvas.height,
    format: 'image/jpeg',
    savedBytes: item.size - blob.size,
    savedPercent: Math.round(((item.size - blob.size) / item.size) * 100)
  };
}

/**
 * EXIF & Metadata Stripper (Re-encoding image to a clean canvas cleans any GPS, Camera serial, EXIF tags)
 */
export async function stripExifAndMetadata(item: ImageItem): Promise<ProcessedResult> {
  const img = await loadImage(item.previewUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context error');

  ctx.drawImage(img, 0, 0);

  const format = item.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b || new Blob()), format, 0.98)
  );

  return {
    blob,
    url: URL.createObjectURL(blob),
    size: blob.size,
    width: canvas.width,
    height: canvas.height,
    format,
    savedBytes: item.size - blob.size,
    savedPercent: Math.round(((item.size - blob.size) / item.size) * 100)
  };
}

/**
 * Convert file to Base64 data string
 */
export function fileToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Trigger browser file download
 */
export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Bundle multiple files into a zip file and trigger download
 */
export async function downloadZip(
  files: { name: string; blob: Blob }[],
  zipName = 'pixelforge_images.zip'
) {
  const zip = new JSZip();
  files.forEach((f) => {
    zip.file(f.name, f.blob);
  });
  const content = await zip.generateAsync({ type: 'blob' });
  downloadFile(content, zipName);
}
