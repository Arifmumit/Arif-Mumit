import React, { useState, useEffect } from 'react';
import { Download, Pipette, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import { ImageItem, ProcessedResult, BgRemoveSettings } from '../../types/image';
import { processBgRemove, formatBytes, downloadFile } from '../../utils/imageProcessor';

interface BgRemoveToolProps {
  activeItem: ImageItem;
}

export const BgRemoveTool: React.FC<BgRemoveToolProps> = ({ activeItem }) => {
  const [targetColor, setTargetColor] = useState<string>('#ffffff');
  const [tolerance, setTolerance] = useState<number>(30);
  const [feather, setFeather] = useState<number>(2);

  const [processed, setProcessed] = useState<ProcessedResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    let isCurrent = true;
    const run = async () => {
      setIsProcessing(true);
      try {
        const settings: BgRemoveSettings = {
          targetColor,
          tolerance,
          feather
        };
        const result = await processBgRemove(activeItem, settings);
        if (isCurrent) setProcessed(result);
      } catch (err) {
        console.error('Background remove error:', err);
      } finally {
        if (isCurrent) setIsProcessing(false);
      }
    };

    const timer = setTimeout(run, 150);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [activeItem, targetColor, tolerance, feather]);

  const handleDownload = () => {
    if (!processed) return;
    const baseName = activeItem.name.substring(0, activeItem.name.lastIndexOf('.')) || activeItem.name;
    downloadFile(processed.blob, `${baseName}-transparent.png`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Output Preview on Transparent Checkerboard */}
      <div className="lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700 dark:text-slate-300">Isolated Subject (Alpha PNG)</span>
            <span aria-hidden="true">·</span>
            <span>{activeItem.width} × {activeItem.height} px</span>
          </div>
        </div>

        <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-checkerboard aspect-video md:aspect-auto max-h-[500px] flex items-center justify-center overflow-hidden p-4">
          {processed && (
            <img
              src={processed.url}
              alt="Isolated Subject"
              referrerPolicy="no-referrer"
              className="max-h-[460px] w-auto max-w-full object-contain drop-shadow-md"
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
              Output: <span className="font-semibold text-slate-900 dark:text-white">Transparent PNG</span>
              <span className="mx-2">·</span>
              Size: <span className="font-mono text-slate-700 dark:text-slate-300">{formatBytes(processed.size)}</span>
            </div>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download Transparent PNG</span>
            </button>
          </div>
        )}
      </div>

      {/* Right Column: Settings */}
      <div className="lg:col-span-5 space-y-6">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Chroma Key & Solid Color Eraser</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Isolates foreground subjects from white studio backdrops, solid color walls, or green screens.
            </p>
          </div>

          {/* Color Key Selector */}
          <div className="space-y-3">
            <label htmlFor="bg-remove-color" className="text-xs font-medium text-slate-700 dark:text-slate-300">Target Background Color</label>
            <div className="flex items-center gap-3">
              <input
                id="bg-remove-color"
                type="color"
                value={targetColor}
                onChange={(e) => setTargetColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer p-0"
              />
              <span className="text-sm font-mono text-slate-700 dark:text-slate-300 font-medium">{targetColor}</span>

              {/* Quick color buttons */}
              <div className="flex gap-1.5 ml-auto">
                {[
                  { name: 'White', hex: '#ffffff' },
                  { name: 'Light Gray', hex: '#f3f4f6' },
                  { name: 'Black', hex: '#000000' },
                  { name: 'Green', hex: '#00ff00' },
                  { name: 'Blue', hex: '#0000ff' }
                ].map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => setTargetColor(c.hex)}
                    className="w-7 h-7 rounded-md border border-slate-300 dark:border-slate-700 hover:scale-110 transition"
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Tolerance Slider */}
          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <label htmlFor="bg-remove-tolerance" className="font-medium">Color Sensitivity (Tolerance)</label>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{tolerance}%</span>
            </div>
            <input
              id="bg-remove-tolerance"
              type="range"
              min="5"
              max="80"
              step="1"
              value={tolerance}
              onChange={(e) => setTolerance(Number(e.target.value))}
              className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Increase tolerance to remove shadows and variations around edges.
            </p>
          </div>

          {/* Feathering Slider */}
          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <label htmlFor="bg-remove-feather" className="font-medium">Edge Smoothness (Feather)</label>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{feather} px</span>
            </div>
            <input
              id="bg-remove-feather"
              type="range"
              min="0"
              max="10"
              step="1"
              value={feather}
              onChange={(e) => setFeather(Number(e.target.value))}
              className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Real-time Euclidean color distance processing in local memory</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Preserves original resolution with alpha transparency</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
