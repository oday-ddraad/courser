export interface CompressionOptions {
  maxWidthOrHeight?: number;
  quality?: number;
  maxSizeKB?: number;
  outputType?: 'image/jpeg' | 'image/png' | 'image/webp';
  minQuality?: number;
  qualityStep?: number;
}

export interface CompressedImageResult {
  base64: string;
  width: number;
  height: number;
  sizeKB: number;
  outputType: string;
  qualityUsed: number;
}

export const COMPRESSION_PRESETS = {
  receipt: {
    maxWidthOrHeight: 1200,
    quality: 0.75,
    maxSizeKB: 500,
    outputType: 'image/jpeg' as const,
    minQuality: 0.35,
    qualityStep: 0.05,
  },
  logo: {
    maxWidthOrHeight: 200,
    quality: 0.85,
    maxSizeKB: 50,
    outputType: 'image/png' as const,
    minQuality: 0.6,
    qualityStep: 0.05,
  },
  qrCode: {
    maxWidthOrHeight: 600,
    quality: 0.9,
    maxSizeKB: 200,
    outputType: 'image/png' as const,
    minQuality: 0.75,
    qualityStep: 0.03,
  },
};

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidthOrHeight: 1200,
  quality: 0.75,
  maxSizeKB: 500,
  outputType: 'image/jpeg',
  minQuality: 0.35,
  qualityStep: 0.05,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function estimateBase64SizeKB(base64: string): number {
  const payload = base64.includes(',') ? base64.split(',')[1] : base64;
  const bytes = Math.ceil((payload.length * 3) / 4);
  return bytes / 1024;
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}

function calculateDimensions(
  width: number,
  height: number,
  maxWidthOrHeight: number
): { width: number; height: number } {
  if (width <= maxWidthOrHeight && height <= maxWidthOrHeight) {
    return { width, height };
  }

  if (width > height) {
    return {
      width: maxWidthOrHeight,
      height: Math.round((height / width) * maxWidthOrHeight),
    };
  }

  return {
    width: Math.round((width / height) * maxWidthOrHeight),
    height: maxWidthOrHeight,
  };
}

function drawToCanvas(
  img: HTMLImageElement,
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas 2D context');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  return canvas;
}

export async function compressImageToBase64(
  file: File,
  options: CompressionOptions = {}
): Promise<string> {
  const result = await compressImage(file, options);
  return result.base64;
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressedImageResult> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Image compression utility can only run in the browser');
  }

  if (!file || !(file instanceof File)) {
    throw new Error('Invalid file provided');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  const merged = { ...DEFAULT_OPTIONS, ...options };
  merged.quality = clamp(merged.quality, 0.1, 1);
  merged.minQuality = clamp(merged.minQuality, 0.1, merged.quality);
  merged.qualityStep = clamp(merged.qualityStep, 0.01, 0.2);

  const img = await loadImageFromFile(file);
  const dims = calculateDimensions(
    img.naturalWidth || img.width,
    img.naturalHeight || img.height,
    merged.maxWidthOrHeight
  );

  const canvas = drawToCanvas(img, dims.width, dims.height);

  let currentQuality = merged.quality;
  let base64 = canvas.toDataURL(merged.outputType, currentQuality);
  let sizeKB = estimateBase64SizeKB(base64);

  while (sizeKB > merged.maxSizeKB && currentQuality > merged.minQuality) {
    currentQuality = clamp(currentQuality - merged.qualityStep, merged.minQuality, 1);
    base64 = canvas.toDataURL(merged.outputType, currentQuality);
    sizeKB = estimateBase64SizeKB(base64);

    if (currentQuality <= merged.minQuality) {
      break;
    }
  }

  return {
    base64,
    width: dims.width,
    height: dims.height,
    sizeKB: Number(sizeKB.toFixed(2)),
    outputType: merged.outputType,
    qualityUsed: Number(currentQuality.toFixed(2)),
  };
}

export async function compressImagesToBase64(
  files: File[],
  options: CompressionOptions = {}
): Promise<string[]> {
  const results = await Promise.all(files.map((file) => compressImageToBase64(file, options)));
  return results;
}
