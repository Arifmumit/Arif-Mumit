import React, { useState, useEffect } from 'react';
import { Download, ArrowRight, RefreshCw, Layers } from 'lucide-react';
import { ImageItem, ProcessedResult, ConvertSettings } from '../../types/image';
import { processConvert, formatBytes, downloadFile } from '../../utils/imageProcessor';

interface ConvertToolProps {
  activeItem: ImageItem;
}

export const ConvertTool: React.FC<ConvertToolProps> = ({ activeItem }) => {
  const [targetFormat, setTargetFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp' | 'image/bmp'>(
    activeItem.type === 'image/jpeg' ? 'image/webp' : 'image/jpeg'
  );
  const [quality, setQuality] = useState<number>(90);
  const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff');
  const [processed, setProcessed] = useState<ProcessedResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    let isCurrent = true;
    const run = async () => {
      setIsProcessing(true);
      try {
        const settings: ConvertSettings = {
          targetFormat,
          quality,
          backgroundColor
        };
        const result = await processConvert(activeItem, settings);
        if (isCurrent) setProcessed(result);
      } catch (err) {
        console.error('Convert error:', err);
      } finally {
        if (isCurrent) setIsProcessing(false);
      }
    };

    const timer = setTimeout(run, 100);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [activeItem, targetFormat, quality, backgroundColor]);

  const getFormatExtension = (mime: string) => {
    switch (mime) {
      case 'image/jpeg': return 'jpg';
      case 'image/png': return 'png';
      case 'image/webp': return 'webp';
      case 'image/bmp': return 'bmp';
      default: return 'jpg';
    }
  };

  const handleDownload = () => {
    if (!processed) return;
    const ext = getFormatExtension(targetFormat);
    const baseName = activeItem.name.substring(0, activeItem.name.lastIndexOf('.')) || activeItem.name;
    downloadFile(processed.blob, `${baseName}-converted.${ext}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Output Preview */}
      <div className="lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700 dark:text-slate-300">Target Format</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono font-semibold uppercase text-indigo-600 dark:text-indigo-400">
              {getFormatExtension(targetFormat)}
            </span>
            <span aria-hidden="true">·</span>
            <span>{activeItem.width} × {activeItem.height} px</span>
          </div>
        </div>

        <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-checkerboard aspect-video md:aspect-auto max-h-[500px] flex items-center justify-center overflow-hidden p-2">
          {processed && (
            <img
              src={processed.url}
              alt="Converted preview"
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
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <div>
                Converted File Size: <span className="font-mono font-semibold text-slate-900 dark:text-white">{formatBytes(processed.size)}</span>
                <span className="ml-2 font-mono text-slate-400">(Original: {formatBytes(activeItem.size)})</span>
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download .{getFormatExtension(targetFormat).toUpperCase()}</span>
            </button>
          </div>
        )}
      </div>

      {/* Right Column: Settings */}
      <div className="lg:col-span-5 space-y-6">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Format Conversion</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Convert between standard web, print, and legacy image formats.
            </p>
          </div>

          {/* Formats Grid */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Select Destination Format</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'image/webp', label: 'WebP', desc: 'Modern, high-efficiency compression for fast web loading.' },
                { id: 'image/jpeg', label: 'JPEG / JPG', desc: 'Universal compatibility across all devices and printers.' },
                { id: 'image/png', label: 'PNG', desc: 'Lossless quality with transparent alpha channel support.' },
                { id: 'image/bmp', label: 'BMP', desc: 'Uncompressed Windows bitmap format for legacy software.' }
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setTargetFormat(fmt.id as any)}
                  className={`p-3.5 rounded-xl border text-left transition ${
                    targetFormat === fmt.id
                      ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 ring-1 ring-indigo-600'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <p className="text-sm font-bold">{fmt.label}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">{fmt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Quality Slider for lossy formats */}
          {(targetFormat === 'image/jpeg' || targetFormat === 'image/webp') && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <label htmlFor="convert-quality-slider" className="font-medium">Encoder Quality</label>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{quality}%</span>
              </div>
              <input
                id="convert-quality-slider"
                type="range"
                min="20"
                max="100"
                step="1"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>
          )}

          {/* Background color for transparent images converted to JPEG */}
          {targetFormat === 'image/jpeg' && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label htmlFor="bg-color-picker" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Background Fill (For Transparent Sources)
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="bg-color-picker"
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0"
                />
                <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{backgroundColor}</span>
                <div className="flex gap-1 ml-auto">
                  {['#ffffff', '#000000', '#f8fafc'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setBackgroundColor(color)}
                      className="w-6 h-6 rounded border border-slate-300"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
