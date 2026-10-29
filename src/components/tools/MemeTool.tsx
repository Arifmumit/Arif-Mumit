import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, Smile } from 'lucide-react';
import { ImageItem, ProcessedResult, MemeSettings } from '../../types/image';
import { processMeme, formatBytes, downloadFile } from '../../utils/imageProcessor';

interface MemeToolProps {
  activeItem: ImageItem;
}

export const MemeTool: React.FC<MemeToolProps> = ({ activeItem }) => {
  const [topText, setTopText] = useState<string>('WHEN THE CODE COMPILES');
  const [bottomText, setBottomText] = useState<string>('ON THE FIRST TRY');
  const [fontSize, setFontSize] = useState<number>(48);
  const [textColor, setTextColor] = useState<string>('#ffffff');
  const [strokeColor, setStrokeColor] = useState<string>('#000000');
  const [strokeWidth, setStrokeWidth] = useState<number>(8);
  const [uppercase, setUppercase] = useState<boolean>(true);

  const [processed, setProcessed] = useState<ProcessedResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    let isCurrent = true;
    const run = async () => {
      setIsProcessing(true);
      try {
        const settings: MemeSettings = {
          topText,
          bottomText,
          fontSize,
          textColor,
          strokeColor,
          strokeWidth,
          uppercase
        };
        const result = await processMeme(activeItem, settings);
        if (isCurrent) setProcessed(result);
      } catch (err) {
        console.error('Meme generation error:', err);
      } finally {
        if (isCurrent) setIsProcessing(false);
      }
    };

    const timer = setTimeout(run, 120);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [activeItem, topText, bottomText, fontSize, textColor, strokeColor, strokeWidth, uppercase]);

  const handleDownload = () => {
    if (!processed) return;
    const baseName = activeItem.name.substring(0, activeItem.name.lastIndexOf('.')) || activeItem.name;
    downloadFile(processed.blob, `${baseName}-meme.jpg`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Preview */}
      <div className="lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700 dark:text-slate-300">Meme Canvas</span>
            <span aria-hidden="true">·</span>
            <span>{activeItem.width} × {activeItem.height} px</span>
          </div>
        </div>

        <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 aspect-video md:aspect-auto max-h-[500px] flex items-center justify-center overflow-hidden p-2">
          {processed && (
            <img
              src={processed.url}
              alt="Meme output"
              referrerPolicy="no-referrer"
              className="max-h-[460px] w-auto max-w-full object-contain shadow-md rounded"
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
              Output: <span className="font-semibold text-slate-900 dark:text-white">JPG High Quality</span>
              <span className="mx-2">·</span>
              Size: <span className="font-mono text-slate-700 dark:text-slate-300">{formatBytes(processed.size)}</span>
            </div>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download Meme Image</span>
            </button>
          </div>
        )}
      </div>

      {/* Right Column: Controls */}
      <div className="lg:col-span-5 space-y-6">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Meme Text & Typography</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="top-text" className="text-xs font-medium text-slate-700 dark:text-slate-300">Top Caption</label>
              <input
                id="top-text"
                type="text"
                value={topText}
                onChange={(e) => setTopText(e.target.value)}
                placeholder="TOP TEXT"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="bottom-text" className="text-xs font-medium text-slate-700 dark:text-slate-300">Bottom Caption</label>
              <input
                id="bottom-text"
                type="text"
                value={bottomText}
                onChange={(e) => setBottomText(e.target.value)}
                placeholder="BOTTOM TEXT"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <label htmlFor="meme-font-size">Font Size</label>
                <span className="font-mono">{fontSize} pt</span>
              </div>
              <input
                id="meme-font-size"
                type="range"
                min="20"
                max="90"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <label htmlFor="text-color" className="text-xs font-medium text-slate-700 dark:text-slate-300">Text Fill</label>
                <div className="flex items-center gap-2">
                  <input
                    id="text-color"
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0"
                  />
                  <span className="text-xs font-mono text-slate-500">{textColor}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="outline-color" className="text-xs font-medium text-slate-700 dark:text-slate-300">Outline Stroke</label>
                <div className="flex items-center gap-2">
                  <input
                    id="outline-color"
                    type="color"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0"
                  />
                  <span className="text-xs font-mono text-slate-500">{strokeColor}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Force Uppercase Text</span>
              <input
                type="checkbox"
                checked={uppercase}
                onChange={(e) => setUppercase(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
