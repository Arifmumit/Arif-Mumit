import React, { useState, useEffect } from 'react';
import { Download, Sliders, Wand2, RotateCcw, RefreshCw } from 'lucide-react';
import { ImageItem, ProcessedResult, FilterSettings } from '../../types/image';
import { processFilter, formatBytes, downloadFile } from '../../utils/imageProcessor';
import { CompareSlider } from '../CompareSlider';

interface FilterToolProps {
  activeItem: ImageItem;
}

const INITIAL_SETTINGS: FilterSettings = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  warmth: 0,
  blur: 0,
  sharpen: 0,
  grayscale: false,
  sepia: false,
  invert: false,
  preset: 'none'
};

export const FilterTool: React.FC<FilterToolProps> = ({ activeItem }) => {
  const [settings, setSettings] = useState<FilterSettings>(INITIAL_SETTINGS);
  const [processed, setProcessed] = useState<ProcessedResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showCompare, setShowCompare] = useState<boolean>(true);

  useEffect(() => {
    let isCurrent = true;
    const run = async () => {
      setIsProcessing(true);
      try {
        const result = await processFilter(activeItem, settings);
        if (isCurrent) setProcessed(result);
      } catch (err) {
        console.error('Filter processing error:', err);
      } finally {
        if (isCurrent) setIsProcessing(false);
      }
    };

    const timer = setTimeout(run, 120);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [activeItem, settings]);

  const applyPreset = (presetKey: FilterSettings['preset']) => {
    if (presetKey === 'none') {
      setSettings(INITIAL_SETTINGS);
      return;
    }
    setSettings({
      ...INITIAL_SETTINGS,
      preset: presetKey
    });
  };

  const handleDownload = () => {
    if (!processed) return;
    const baseName = activeItem.name.substring(0, activeItem.name.lastIndexOf('.')) || activeItem.name;
    downloadFile(processed.blob, `${baseName}-filtered.jpg`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Visual Preview with comparison slider */}
      <div className="lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700 dark:text-slate-300">Color Studio</span>
            <span aria-hidden="true">·</span>
            <span>{activeItem.width} × {activeItem.height} px</span>
          </div>

          <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setShowCompare(false)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                !showCompare
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Single
            </button>
            <button
              onClick={() => setShowCompare(true)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                showCompare
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Split View
            </button>
          </div>
        </div>

        {processed && showCompare ? (
          <CompareSlider
            originalUrl={activeItem.previewUrl}
            processedUrl={processed.url}
            originalLabel="Original Photo"
            processedLabel="Filtered Look"
          />
        ) : (
          <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 aspect-video md:aspect-auto max-h-[500px] flex items-center justify-center overflow-hidden p-2">
            <img
              src={processed ? processed.url : activeItem.previewUrl}
              alt="Filtered preview"
              referrerPolicy="no-referrer"
              className="max-h-[460px] w-auto max-w-full object-contain shadow-sm"
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>
        )}

        {processed && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Filtered Size: <span className="font-mono font-semibold text-slate-900 dark:text-white">{formatBytes(processed.size)}</span>
            </div>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download Filtered Image</span>
            </button>
          </div>
        )}
      </div>

      {/* Right Column: Controls */}
      <div className="lg:col-span-5 space-y-6">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Filter & Color Controls</h3>
            <button
              onClick={() => setSettings(INITIAL_SETTINGS)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Preset Styles */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Quick Aesthetic Looks</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'none', label: 'Original' },
                { id: 'auto', label: 'Auto Enhance' },
                { id: 'vivid', label: 'Vivid Summer' },
                { id: 'cinematic', label: 'Cinematic' },
                { id: 'vintage', label: 'Vintage 70s' },
                { id: 'bw', label: 'B&W Dramatic' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p.id as any)}
                  className={`py-2 px-2.5 rounded-lg text-xs font-semibold text-center border transition ${
                    settings.preset === p.id
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            {/* Brightness */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <label htmlFor="filter-brightness">Brightness</label>
                <span className="font-mono">{settings.brightness}</span>
              </div>
              <input
                id="filter-brightness"
                type="range"
                min="-100"
                max="100"
                value={settings.brightness}
                onChange={(e) => setSettings({ ...settings, brightness: Number(e.target.value), preset: 'none' })}
                className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Contrast */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <label htmlFor="filter-contrast">Contrast</label>
                <span className="font-mono">{settings.contrast}</span>
              </div>
              <input
                id="filter-contrast"
                type="range"
                min="-100"
                max="100"
                value={settings.contrast}
                onChange={(e) => setSettings({ ...settings, contrast: Number(e.target.value), preset: 'none' })}
                className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Saturation */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <label htmlFor="filter-saturation">Saturation</label>
                <span className="font-mono">{settings.saturation}</span>
              </div>
              <input
                id="filter-saturation"
                type="range"
                min="-100"
                max="100"
                value={settings.saturation}
                onChange={(e) => setSettings({ ...settings, saturation: Number(e.target.value), preset: 'none' })}
                className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Warmth / Color Temperature */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <label htmlFor="filter-warmth">Color Warmth</label>
                <span className="font-mono">{settings.warmth > 0 ? `+${settings.warmth} Warm` : settings.warmth < 0 ? `${settings.warmth} Cool` : 'Neutral'}</span>
              </div>
              <input
                id="filter-warmth"
                type="range"
                min="-100"
                max="100"
                value={settings.warmth}
                onChange={(e) => setSettings({ ...settings, warmth: Number(e.target.value), preset: 'none' })}
                className="w-full accent-amber-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Blur */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <label htmlFor="filter-blur">Soft Focus / Blur</label>
                <span className="font-mono">{settings.blur} px</span>
              </div>
              <input
                id="filter-blur"
                type="range"
                min="0"
                max="20"
                value={settings.blur}
                onChange={(e) => setSettings({ ...settings, blur: Number(e.target.value), preset: 'none' })}
                className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Quick toggles */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setSettings({ ...settings, grayscale: !settings.grayscale })}
              className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                settings.grayscale
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              Grayscale
            </button>
            <button
              onClick={() => setSettings({ ...settings, sepia: !settings.sepia })}
              className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                settings.sepia
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              Sepia
            </button>
            <button
              onClick={() => setSettings({ ...settings, invert: !settings.invert })}
              className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                settings.invert
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              Invert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
