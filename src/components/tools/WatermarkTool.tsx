import React, { useState, useEffect, useRef } from 'react';
import { Download, Type, Image as ImageIcon, Grid, RefreshCw } from 'lucide-react';
import { ImageItem, ProcessedResult, WatermarkSettings } from '../../types/image';
import { processWatermark, formatBytes, downloadFile } from '../../utils/imageProcessor';

interface WatermarkToolProps {
  activeItem: ImageItem;
}

export const WatermarkTool: React.FC<WatermarkToolProps> = ({ activeItem }) => {
  const [type, setType] = useState<'text' | 'image'>('text');
  const [text, setText] = useState<string>('© PixelForge Photo');
  const [fontFamily, setFontFamily] = useState<string>('Plus Jakarta Sans');
  const [fontSize, setFontSize] = useState<number>(36);
  const [color, setColor] = useState<string>('#ffffff');
  const [opacity, setOpacity] = useState<number>(0.75);
  const [rotation, setRotation] = useState<number>(-25);
  const [position, setPosition] = useState<WatermarkSettings['position']>('bottom-right');
  const [imageWatermarkUrl, setImageWatermarkUrl] = useState<string>('');
  const [imageScale, setImageScale] = useState<number>(0.25);

  const [processed, setProcessed] = useState<ProcessedResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isCurrent = true;
    const run = async () => {
      setIsProcessing(true);
      try {
        const settings: WatermarkSettings = {
          type,
          text,
          fontFamily,
          fontSize,
          color,
          opacity,
          rotation,
          position,
          imageWatermarkUrl,
          imageScale
        };
        const result = await processWatermark(activeItem, settings);
        if (isCurrent) setProcessed(result);
      } catch (err) {
        console.error('Watermark error:', err);
      } finally {
        if (isCurrent) setIsProcessing(false);
      }
    };

    const timer = setTimeout(run, 120);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [activeItem, type, text, fontFamily, fontSize, color, opacity, rotation, position, imageWatermarkUrl, imageScale]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setImageWatermarkUrl(url);
    }
  };

  const handleDownload = () => {
    if (!processed) return;
    const baseName = activeItem.name.substring(0, activeItem.name.lastIndexOf('.')) || activeItem.name;
    downloadFile(processed.blob, `${baseName}-watermarked.jpg`);
  };

  const POSITIONS: { id: WatermarkSettings['position']; label: string }[] = [
    { id: 'top-left', label: 'TL' },
    { id: 'top-center', label: 'TC' },
    { id: 'top-right', label: 'TR' },
    { id: 'center-left', label: 'CL' },
    { id: 'center', label: 'Center' },
    { id: 'center-right', label: 'CR' },
    { id: 'bottom-left', label: 'BL' },
    { id: 'bottom-center', label: 'BC' },
    { id: 'bottom-right', label: 'BR' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Output Preview */}
      <div className="lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700 dark:text-slate-300">Watermark Stamp Preview</span>
            <span aria-hidden="true">·</span>
            <span>{activeItem.width} × {activeItem.height} px</span>
          </div>
        </div>

        <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 aspect-video md:aspect-auto max-h-[500px] flex items-center justify-center overflow-hidden p-2">
          {processed && (
            <img
              src={processed.url}
              alt="Watermarked preview"
              referrerPolicy="no-referrer"
              className="max-h-[460px] w-auto max-w-full object-contain shadow-sm"
            />
          )}
          {isProcessing && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
        </div>

        {processed && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Format: <span className="font-mono text-slate-700 dark:text-slate-300">{processed.format}</span>
              <span className="mx-2">·</span>
              File Size: <span className="font-mono font-semibold text-slate-900 dark:text-white">{formatBytes(processed.size)}</span>
            </div>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download Watermarked Image</span>
            </button>
          </div>
        )}
      </div>

      {/* Right Column: Controls */}
      <div className="lg:col-span-5 space-y-6">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Watermark Configuration</h3>
            {/* Type selector */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                onClick={() => setType('text')}
                className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition ${
                  type === 'text'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>Text</span>
              </button>
              <button
                onClick={() => setType('image')}
                className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition ${
                  type === 'image'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Logo</span>
              </button>
            </div>
          </div>

          {/* Text Watermark Controls */}
          {type === 'text' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="watermark-text" className="text-xs font-medium text-slate-700 dark:text-slate-300">Watermark Text</label>
                <input
                  id="watermark-text"
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="e.g. Confidential or © Your Name"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Font and Color */}
              <div className="grid grid-cols-2 gap-3 items-center">
                <div className="space-y-1.5">
                  <label htmlFor="font-family" className="text-xs font-medium text-slate-700 dark:text-slate-300">Font</label>
                  <select
                    id="font-family"
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                    <option value="JetBrains Mono">JetBrains Mono</option>
                    <option value="Georgia">Georgia Serif</option>
                    <option value="Impact">Impact Bold</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="watermark-color" className="text-xs font-medium text-slate-700 dark:text-slate-300">Text Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      id="watermark-color"
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0"
                    />
                    <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{color}</span>
                  </div>
                </div>
              </div>

              {/* Font Size */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <label htmlFor="font-size">Font Size Scale</label>
                  <span className="font-mono">{fontSize} pt</span>
                </div>
                <input
                  id="font-size"
                  type="range"
                  min="16"
                  max="80"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>

              {/* Rotation Angle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <label htmlFor="watermark-rotation">Rotation Angle</label>
                  <span className="font-mono">{rotation}°</span>
                </div>
                <input
                  id="watermark-rotation"
                  type="range"
                  min="-90"
                  max="90"
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Logo Watermark Controls */}
          {type === 'image' && (
            <div className="space-y-4">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="w-full p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 flex flex-col items-center justify-center text-xs text-slate-600 dark:text-slate-400 transition"
              >
                {imageWatermarkUrl ? (
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold">
                    <img src={imageWatermarkUrl} alt="Logo" className="w-8 h-8 object-contain" />
                    <span>Change Custom Logo</span>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="w-6 h-6 mb-1 text-slate-400" />
                    <span>Upload Logo PNG (Transparent recommended)</span>
                  </>
                )}
              </button>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <label htmlFor="image-scale">Logo Scale</label>
                  <span className="font-mono">{Math.round(imageScale * 100)}%</span>
                </div>
                <input
                  id="image-scale"
                  type="range"
                  min="5"
                  max="60"
                  value={Math.round(imageScale * 100)}
                  onChange={(e) => setImageScale(Number(e.target.value) / 100)}
                  className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Opacity Slider */}
          <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <label htmlFor="watermark-opacity">Transparency / Opacity</label>
              <span className="font-mono">{Math.round(opacity * 100)}%</span>
            </div>
            <input
              id="watermark-opacity"
              type="range"
              min="10"
              max="100"
              value={Math.round(opacity * 100)}
              onChange={(e) => setOpacity(Number(e.target.value) / 100)}
              className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>

          {/* Position Anchor 9-Grid */}
          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
              <span className="font-medium">Position Placement</span>
              <button
                onClick={() => setPosition('tiled')}
                className={`text-xs px-2.5 py-1 rounded transition ${
                  position === 'tiled'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-500 hover:text-indigo-600'
                }`}
              >
                Tile / Repeat Grid
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
              {POSITIONS.map((pos) => (
                <button
                  key={pos.id}
                  onClick={() => setPosition(pos.id)}
                  className={`h-9 rounded-lg text-xs font-semibold font-mono flex items-center justify-center transition ${
                    position === pos.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
