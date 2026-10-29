export type ToolType = 
  | 'compress' 
  | 'resize' 
  | 'crop' 
  | 'convert' 
  | 'filters' 
  | 'watermark' 
  | 'bgremove' 
  | 'meme' 
  | 'metadata';

export interface ImageItem {
  id: string;
  name: string;
  file: File;
  previewUrl: string;
  size: number;
  width: number;
  height: number;
  type: string;
  aspectRatio: string;
}

export interface ProcessedResult {
  blob: Blob;
  url: string;
  size: number;
  width: number;
  height: number;
  format: string;
  savedBytes: number;
  savedPercent: number;
}

export interface CompressSettings {
  quality: number; // 1 - 100
  format: 'image/jpeg' | 'image/webp' | 'image/png';
  maxTargetSizeKb?: number;
}

export interface ResizeSettings {
  mode: 'exact' | 'percentage' | 'preset';
  width: number;
  height: number;
  percentage: number;
  maintainAspectRatio: boolean;
  fit: 'contain' | 'cover' | 'stretch';
  backgroundColor: string;
}

export interface CropSettings {
  x: number;
  y: number;
  width: number;
  height: number;
  aspectRatioPreset: 'free' | '1:1' | '4:3' | '16:9' | '3:2' | '9:16';
  rotation: number; // 0, 90, 180, 270 or fine
  flipHorizontal: boolean;
  flipVertical: boolean;
}

export interface ConvertSettings {
  targetFormat: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/bmp';
  quality: number;
  backgroundColor: string; // for transparent to jpg
}

export interface FilterSettings {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  exposure: number; // -100 to 100
  warmth: number; // -100 to 100
  blur: number; // 0 to 20
  sharpen: number; // 0 to 100
  grayscale: boolean;
  sepia: boolean;
  invert: boolean;
  preset: 'none' | 'auto' | 'vintage' | 'vivid' | 'bw' | 'warm' | 'cool' | 'cinematic';
}

export interface WatermarkSettings {
  type: 'text' | 'image';
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  opacity: number; // 0.1 to 1
  rotation: number; // -180 to 180
  position: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'tiled';
  imageWatermarkUrl?: string;
  imageScale: number; // 0.1 to 1
}

export interface BgRemoveSettings {
  targetColor: string; // hex color e.g. '#ffffff'
  tolerance: number; // 1 - 100
  feather: number; // 0 - 10
}

export interface MemeSettings {
  topText: string;
  bottomText: string;
  fontSize: number;
  textColor: string;
  strokeColor: string;
  strokeWidth: number;
  uppercase: boolean;
}

export interface ToolMeta {
  id: ToolType;
  title: string;
  shortDesc: string;
  iconName: string;
  badge?: string;
}
