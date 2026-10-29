import React, { useState, useEffect } from 'react';
import { Download, Lock, Unlock, Maximize2, RefreshCw } from 'lucide-react';
import { ImageItem, ProcessedResult, ResizeSettings } from '../../types/image';
import { processResize, formatBytes, downloadFile } from '../../utils/imageProcessor';

interface ResizeToolProps {
  activeItem: ImageItem;
}

interface PresetOption {
  label: string;
  width: number;
  height: number;
  category: string;
}

const PRESETS: PresetOption[] = [
  { label: 'Instagram Post', width: 1080, height: 1080, category: 'Social Media' },
  { label: 'Instagram Story / Reel', width: 1080, height: 1920, category: 'Social Media' },
  { label: 'YouTube Thumbnail', width: 1280, height: 720, category: 'Video' },
  { label: 'Twitter / X Post', width: 1200, height: 675, category: 'Social Media' },
  { label: 'LinkedIn Cover Banner', width: 1584, height: 396, category: 'Social Media' },
  { label: 'Facebook Cover', width: 820, height: 312, category: 'Social Media' },
  { label: 'Passport / Avatar', width: 600, height: 600, category: 'Print & ID' },
  { label: 'Full HD Standard', width: 1920, height: 1080, category: 'Display' },
];

export const ResizeTool: React.FC<ResizeToolProps> = ({ activeItem }) => {
  const [mode, setMode] = useState<'exact' | 'percentage' | 'preset'>('exact');
  const [width, setWidth] = useState<number>(activeItem.width);
  const [height, setHeight] = useState<number>(activeItem.height);
  const [percentage, setPercentage] = useState<number>(50);
  const [lockRatio, setLockRatio] = useState<boolean>(true);
  const [fit, setFit] = useState<'contain' | 'cover' | 'stretch'>('contain');
  const [bgColor, setBgColor] = useState<string>('#ffffff');

  const [processed, setProcessed] = useState<ProcessedResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Maintain aspect ratio calculation helper
  const handleWidthChange = (newWidth: number) => {
    setWidth(newWidth);
    if (lockRatio && activeItem.width > 0) {
      const ratio = activeItem.height / activeItem.width;
      setHeight(Math.round(newWidth * ratio));
    }
  };

  const handleHeightChange = (newHeight: number) => {
    setHeight(newHeight);
    if (lockRatio && activeItem.height > 0) {
      const ratio = activeItem.width / activeItem.height;
      setWidth(Math.round(newHeight * ratio));
    }
  };

  const applyPreset = (preset: PresetOption) => {
    setWidth(preset.width);
    setHeight(preset.height);
    setFit('cover');
  };

  // Re-run resize on setting changes
  useEffect(() => {
    let isCurrent = true;
    const run = async () => {
      setIsProcessing(true);
      try {
        const settings: ResizeSettings = {
          mode,
          width: Math.max(1, width),
          height: Math.max(1, height),
          percentage,
          maintainAspectRatio: lockRatio,
          fit,
          backgroundColor: bgColor
        };
        const result = await processResize(activeItem, settings);
        if (isCurrent) setProcessed(result);
      } catch (err) {
        console.error('Resize error:', err);
      } finally {
        if (isCurrent) setIsProcessing(false);
      }
    };

    const timer = setTimeout(run, 150);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [activeItem, mode, width, height, percentage, lockRatio, fit, bgColor]);

  const handleDownload = () => {
    if (!processed) return;
    const baseName = activeItem.name.substring(0, activeItem.name.lastIndexOf('.')) || activeItem.name;
    downloadFile(processed.blob, `${baseName}-resized-${processed.width}x${processed.height}.jpg`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Preview */}
      <div className="lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700 dark:text-slate-300">Target Resolution</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
              {processed ? `${processed.width} × ${processed.height} px` : `${width} × ${height} px`}
            </span>
            <span aria-hidden="true">·</span>
            <span>Original: {activeItem.width} × {activeItem.height} px</span>
          </div>
        </div>

        <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-checkerboard aspect-video md:aspect-auto max-h-[520px] flex items-center justify-center overflow-hidden p-2">
          {processed && (
            <img
              src={processed.url}
              alt="Resized preview"
              referrerPolicy="no-referrer"
              className="max-h-[480px] w-auto max-w-full object-contain shadow-sm"
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
                Final Size: <span className="font-mono font-semibold text-slate-900 dark:text-white">{formatBytes(processed.size)}</span>
              </div>
              <div>
                Dimensions: <span className="font-mono text-slate-700 dark:text-slate-300">{processed.width} × {processed.height} px</span>
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download Resized Image</span>
            </button>
          </div>
        )}
      </div>

      {/* Right Column: Controls */}
      <div className="lg:col-span-5 space-y-6">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Resize Dimension Controls</h3>
            {/* Mode Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                onClick={() => setMode('exact')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  mode === 'exact'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                Pixels
              </button>
              <button
                onClick={() => setMode('percentage')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  mode === 'percentage'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                % Scale
              </button>
              <button
                onClick={() => setMode('preset')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  mode === 'preset'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                Presets
              </button>
            </div>
          </div>

          {/* Mode 1: Exact Pixels */}
          {mode === 'exact' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 items-center">
                <div className="space-y-1.5">
                  <label htmlFor="resize-width" className="text-xs font-medium text-slate-600 dark:text-slate-400">Width (px)</label>
                  <input
                    id="resize-width"
                    type="number"
                    min="1"
                    max="10000"
                    value={width}
                    onChange={(e) => handleWidthChange(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="resize-height" className="text-xs font-medium text-slate-600 dark:text-slate-400">Height (px)</label>
                  <input
                    id="resize-height"
                    type="number"
                    min="1"
                    max="10000"
                    value={height}
                    onChange={(e) => handleHeightChange(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Lock Aspect Ratio Toggle */}
              <button
                type="button"
                onClick={() => setLockRatio(!lockRatio)}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition ${
                  lockRatio
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {lockRatio ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                <span>{lockRatio ? 'Aspect Ratio Locked' : 'Freeform Ratio (Unlocked)'}</span>
              </button>
            </div>
          )}

          {/* Mode 2: Percentage Scale */}
          {mode === 'percentage' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <label htmlFor="percentage-slider" className="font-medium">Scale Multiplier</label>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{percentage}%</span>
              </div>
              <input
                id="percentage-slider"
                type="range"
                min="5"
                max="200"
                step="5"
                value={percentage}
                onChange={(e) => setPercentage(Number(e.target.value))}
                className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setPercentage(pct)}
                    className={`py-1.5 rounded-lg text-xs font-mono font-semibold transition ${
                      percentage === pct
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mode 3: Social & Print Presets */}
          {mode === 'preset' && (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Select Platform Preset</span>
              <div className="grid grid-cols-1 gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => applyPreset(preset)}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">{preset.label}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{preset.category}</p>
                    </div>
                    <span className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      {preset.width} × {preset.height}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fitting Mode */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Fit Strategy</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'contain', label: 'Contain', desc: 'Preserve full image' },
                { id: 'cover', label: 'Cover / Crop', desc: 'Fill entire frame' },
                { id: 'stretch', label: 'Stretch', desc: 'Exact fit' },
              ].map((strategy) => (
                <button
                  key={strategy.id}
                  onClick={() => setFit(strategy.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    fit === strategy.id
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold">{strategy.label}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{strategy.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
