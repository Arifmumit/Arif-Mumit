import React, { useState, useEffect } from 'react';
import { Download, Sliders, CheckCircle2, ArrowDownRight, RefreshCw, Sparkles } from 'lucide-react';
import { ImageItem, ProcessedResult, CompressSettings } from '../../types/image';
import { processCompress, formatBytes, downloadFile } from '../../utils/imageProcessor';
import { CompareSlider } from '../CompareSlider';

interface CompressToolProps {
  activeItem: ImageItem;
}

export const CompressTool: React.FC<CompressToolProps> = ({ activeItem }) => {
  const [quality, setQuality] = useState<number>(80);
  const [format, setFormat] = useState<'image/jpeg' | 'image/webp' | 'image/png'>(
    activeItem.type === 'image/webp' ? 'image/webp' : 'image/jpeg'
  );
  const [processed, setProcessed] = useState<ProcessedResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showComparison, setShowComparison] = useState<boolean>(true);

  // Run compression whenever activeItem, quality, or format changes
  useEffect(() => {
    let isCurrent = true;
    const run = async () => {
      setIsProcessing(true);
      try {
        const settings: CompressSettings = { quality, format };
        const result = await processCompress(activeItem, settings);
        if (isCurrent) {
          setProcessed(result);
        }
      } catch (err) {
        console.error('Compression error:', err);
      } finally {
        if (isCurrent) setIsProcessing(false);
      }
    };

    const timer = setTimeout(run, 100);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [activeItem, quality, format]);

  const handleDownload = () => {
    if (!processed) return;
    const ext = format === 'image/webp' ? 'webp' : format === 'image/png' ? 'png' : 'jpg';
    const baseName = activeItem.name.substring(0, activeItem.name.lastIndexOf('.')) || activeItem.name;
    downloadFile(processed.blob, `${baseName}-compressed.${ext}`);
  };

  const extensionLabel = format === 'image/webp' ? 'WebP' : format === 'image/png' ? 'PNG' : 'JPEG';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Visual Preview & Split Comparison */}
      <div className="lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700 dark:text-slate-300">{activeItem.name}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{activeItem.width} × {activeItem.height} px</span>
          </div>

          <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setShowComparison(false)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                !showComparison
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Single
            </button>
            <button
              onClick={() => setShowComparison(true)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                showComparison
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Split Compare
            </button>
          </div>
        </div>

        {processed && showComparison ? (
          <CompareSlider
            originalUrl={activeItem.previewUrl}
            processedUrl={processed.url}
            originalLabel={`Original (${formatBytes(activeItem.size)})`}
            processedLabel={`Compressed (${formatBytes(processed.size)})`}
          />
        ) : (
          <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 aspect-video md:aspect-auto max-h-[520px] flex items-center justify-center overflow-hidden">
            <img
              src={processed ? processed.url : activeItem.previewUrl}
              alt="Preview"
              referrerPolicy="no-referrer"
              className="max-h-[500px] w-auto max-w-full object-contain"
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>
        )}

        {/* Compression metrics summary bar */}
        {processed && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                    {processed.savedPercent >= 0 ? `-${processed.savedPercent}%` : `+${Math.abs(processed.savedPercent)}%`}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    ({formatBytes(processed.savedBytes)} reduced)
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {formatBytes(activeItem.size)} → {formatBytes(processed.size)}
                </div>
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download Compressed</span>
            </button>
          </div>
        )}
      </div>

      {/* Right Column: Compression Controls */}
      <div className="lg:col-span-5 space-y-6">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Compression Settings</h3>
            <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
              Quality {quality}%
            </span>
          </div>

          {/* Quality Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <label htmlFor="quality-slider" className="font-medium">Compression Level</label>
              <span>{quality < 60 ? 'Maximum Savings' : quality < 85 ? 'Balanced (Recommended)' : 'High Fidelity'}</span>
            </div>
            <input
              id="quality-slider"
              type="range"
              min="10"
              max="100"
              step="1"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Smaller Size (10%)</span>
              <span>80%</span>
              <span>Highest Quality (100%)</span>
            </div>
          </div>

          {/* Target Output Format */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Target Output Format</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'image/webp', label: 'WebP', hint: 'Best Compression' },
                { id: 'image/jpeg', label: 'JPEG', hint: 'Universal' },
                { id: 'image/png', label: 'PNG', hint: 'Lossless' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    format === f.id
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-600'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold">{f.label}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{f.hint}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Quality Presets */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Quick Presets</span>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Web Optimal (75%)', val: 75 },
                { label: 'Ultra Light (50%)', val: 50 },
                { label: 'Lossless Fidelity (92%)', val: 92 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setQuality(preset.val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    quality === preset.val
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Features note */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Processed locally in browser memory — zero uploads</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Smart chroma-subsampling reduces bytes with imperceptible visual loss</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
