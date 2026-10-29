import React, { useState, useEffect, useRef } from 'react';
import { Download, RotateCw, RotateCcw, FlipHorizontal, FlipVertical, Crop as CropIcon, RefreshCw } from 'lucide-react';
import { ImageItem, ProcessedResult, CropSettings } from '../../types/image';
import { processCrop, formatBytes, downloadFile } from '../../utils/imageProcessor';

interface CropToolProps {
  activeItem: ImageItem;
}

export const CropTool: React.FC<CropToolProps> = ({ activeItem }) => {
  const [aspectRatioPreset, setAspectRatioPreset] = useState<'free' | '1:1' | '4:3' | '16:9' | '3:2' | '9:16'>('free');
  const [rotation, setRotation] = useState<number>(0);
  const [fineRotation, setFineRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);

  // Normalized crop coordinates relative to original image [0..1]
  const [cropBox, setCropBox] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 0.1,
    y: 0.1,
    w: 0.8,
    h: 0.8
  });

  const [processed, setProcessed] = useState<ProcessedResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Update crop aspect ratio when preset changes
  useEffect(() => {
    if (aspectRatioPreset === 'free') return;
    let targetRatio = 1;
    if (aspectRatioPreset === '1:1') targetRatio = 1;
    else if (aspectRatioPreset === '4:3') targetRatio = 4 / 3;
    else if (aspectRatioPreset === '16:9') targetRatio = 16 / 9;
    else if (aspectRatioPreset === '3:2') targetRatio = 3 / 2;
    else if (aspectRatioPreset === '9:16') targetRatio = 9 / 16;

    const imgRatio = activeItem.width / activeItem.height;
    let newW = 0.8;
    let newH = (newW * imgRatio) / targetRatio;
    if (newH > 0.9) {
      newH = 0.8;
      newW = (newH * targetRatio) / imgRatio;
    }
    setCropBox({
      x: (1 - newW) / 2,
      y: (1 - newH) / 2,
      w: Math.min(1, newW),
      h: Math.min(1, newH)
    });
  }, [aspectRatioPreset, activeItem]);

  // Execute crop & transform
  useEffect(() => {
    let isCurrent = true;
    const run = async () => {
      setIsProcessing(true);
      try {
        const cropPixelX = Math.round(cropBox.x * activeItem.width);
        const cropPixelY = Math.round(cropBox.y * activeItem.height);
        const cropPixelW = Math.round(cropBox.w * activeItem.width);
        const cropPixelH = Math.round(cropBox.h * activeItem.height);

        const settings: CropSettings = {
          x: cropPixelX,
          y: cropPixelY,
          width: cropPixelW,
          height: cropPixelH,
          aspectRatioPreset,
          rotation: rotation + fineRotation,
          flipHorizontal: flipH,
          flipVertical: flipV
        };

        const result = await processCrop(activeItem, settings);
        if (isCurrent) setProcessed(result);
      } catch (err) {
        console.error('Crop error:', err);
      } finally {
        if (isCurrent) setIsProcessing(false);
      }
    };

    const timer = setTimeout(run, 100);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [activeItem, cropBox, rotation, fineRotation, flipH, flipV, aspectRatioPreset]);

  const handleDownload = () => {
    if (!processed) return;
    const baseName = activeItem.name.substring(0, activeItem.name.lastIndexOf('.')) || activeItem.name;
    downloadFile(processed.blob, `${baseName}-cropped.jpg`);
  };

  const rotate90 = (dir: 1 | -1) => {
    setRotation((prev) => (prev + dir * 90) % 360);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Interactive Visual Crop Canvas */}
      <div className="lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700 dark:text-slate-300">Crop Result</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
              {processed ? `${processed.width} × ${processed.height} px` : ''}
            </span>
            <span aria-hidden="true">·</span>
            <span>Rotation: {rotation + fineRotation}°</span>
          </div>
        </div>

        {/* Visual Preview */}
        <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-checkerboard aspect-video md:aspect-auto max-h-[500px] flex items-center justify-center overflow-hidden p-2">
          {processed && (
            <img
              src={processed.url}
              alt="Cropped output"
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
              Output Dimensions: <span className="font-mono font-semibold text-slate-900 dark:text-white">{processed.width} × {processed.height} px</span>
              <span className="mx-2">·</span>
              File Size: <span className="font-mono text-slate-700 dark:text-slate-300">{formatBytes(processed.size)}</span>
            </div>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download Cropped Image</span>
            </button>
          </div>
        )}
      </div>

      {/* Right Column: Crop, Rotate & Flip Controls */}
      <div className="lg:col-span-5 space-y-6">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Crop & Transform</h3>
            <button
              onClick={() => {
                setRotation(0);
                setFineRotation(0);
                setFlipH(false);
                setFlipV(false);
                setCropBox({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });
                setAspectRatioPreset('free');
              }}
              className="text-xs text-slate-500 hover:text-indigo-600 transition"
            >
              Reset All
            </button>
          </div>

          {/* Aspect Ratio Presets */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Aspect Ratio</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'free', label: 'Freeform' },
                { id: '1:1', label: '1:1 Square' },
                { id: '16:9', label: '16:9 Landscape' },
                { id: '4:3', label: '4:3 Standard' },
                { id: '3:2', label: '3:2 Photo' },
                { id: '9:16', label: '9:16 Story' },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setAspectRatioPreset(r.id as any)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold text-center border transition ${
                    aspectRatioPreset === r.id
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Crop Area Sliders (X, Y, Width, Height) */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span className="font-medium">Crop Boundary Zoom</span>
              <span className="font-mono">{Math.round(cropBox.w * 100)}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={Math.round(cropBox.w * 100)}
              onChange={(e) => {
                const newW = Number(e.target.value) / 100;
                const newH = aspectRatioPreset === 'free' ? newW : cropBox.h;
                setCropBox({
                  x: Math.max(0, (1 - newW) / 2),
                  y: Math.max(0, (1 - newH) / 2),
                  w: newW,
                  h: newH
                });
              }}
              className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>

          {/* Rotate & Flip Controls */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Orientation & Flipping</span>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => rotate90(-1)}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-300"
                title="Rotate 90° Counter-Clockwise"
              >
                <RotateCcw className="w-4 h-4 mb-1" />
                <span className="text-[10px] font-medium">-90°</span>
              </button>

              <button
                onClick={() => rotate90(1)}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-300"
                title="Rotate 90° Clockwise"
              >
                <RotateCw className="w-4 h-4 mb-1" />
                <span className="text-[10px] font-medium">+90°</span>
              </button>

              <button
                onClick={() => setFlipH(!flipH)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition ${
                  flipH
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 text-slate-700 dark:text-slate-300'
                }`}
                title="Flip Horizontal"
              >
                <FlipHorizontal className="w-4 h-4 mb-1" />
                <span className="text-[10px] font-medium">Flip H</span>
              </button>

              <button
                onClick={() => setFlipV(!flipV)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition ${
                  flipV
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 text-slate-700 dark:text-slate-300'
                }`}
                title="Flip Vertical"
              >
                <FlipVertical className="w-4 h-4 mb-1" />
                <span className="text-[10px] font-medium">Flip V</span>
              </button>
            </div>
          </div>

          {/* Fine Angle Straightening */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <label htmlFor="fine-rotation" className="font-medium">Straighten / Fine Angle</label>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{fineRotation}°</span>
            </div>
            <input
              id="fine-rotation"
              type="range"
              min="-45"
              max="45"
              step="1"
              value={fineRotation}
              onChange={(e) => setFineRotation(Number(e.target.value))}
              className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
