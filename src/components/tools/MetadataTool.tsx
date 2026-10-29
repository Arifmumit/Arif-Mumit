import React, { useState, useEffect } from 'react';
import { ShieldCheck, Copy, Check, Code, FileText, Download, Info } from 'lucide-react';
import { ImageItem, ProcessedResult } from '../../types/image';
import { formatBytes, fileToBase64, stripExifAndMetadata, downloadFile } from '../../utils/imageProcessor';

interface MetadataToolProps {
  activeItem: ImageItem;
}

export const MetadataTool: React.FC<MetadataToolProps> = ({ activeItem }) => {
  const [base64, setBase64] = useState<string>('');
  const [copiedBase64, setCopiedBase64] = useState<boolean>(false);
  const [copiedCss, setCopiedCss] = useState<boolean>(false);
  const [strippedResult, setStrippedResult] = useState<ProcessedResult | null>(null);
  const [isStripping, setIsStripping] = useState<boolean>(false);

  useEffect(() => {
    let isCurrent = true;
    fileToBase64(activeItem.file).then((b64) => {
      if (isCurrent) setBase64(b64);
    });
    return () => {
      isCurrent = false;
    };
  }, [activeItem]);

  const megapixels = ((activeItem.width * activeItem.height) / 1000000).toFixed(2);

  const handleCopyBase64 = () => {
    navigator.clipboard.writeText(base64);
    setCopiedBase64(true);
    setTimeout(() => setCopiedBase64(false), 2000);
  };

  const handleCopyCss = () => {
    const cssSnippet = `background-image: url('${base64.substring(0, 500)}...'); /* truncated for preview */`;
    const fullCss = `background-image: url('${base64}');`;
    navigator.clipboard.writeText(fullCss);
    setCopiedCss(true);
    setTimeout(() => setCopiedCss(false), 2000);
  };

  const handleStripMetadata = async () => {
    setIsStripping(true);
    try {
      const result = await stripExifAndMetadata(activeItem);
      setStrippedResult(result);
      const baseName = activeItem.name.substring(0, activeItem.name.lastIndexOf('.')) || activeItem.name;
      downloadFile(result.blob, `${baseName}-privacy-clean.jpg`);
    } catch (err) {
      console.error('Error stripping metadata:', err);
    } finally {
      setIsStripping(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Technical Inspector Grid */}
      <div className="lg:col-span-7 space-y-6">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">File & Sensor Metadata</h3>
            </div>
            <span className="text-xs font-mono text-slate-500">{activeItem.type}</span>
          </div>

          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Dimensions</span>
              <p className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-1">
                {activeItem.width} × {activeItem.height}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Resolution</span>
              <p className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-1">
                {megapixels} MP
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">File Size</span>
              <p className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-1">
                {formatBytes(activeItem.size)}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Aspect Ratio</span>
              <p className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-1">
                {activeItem.aspectRatio}
              </p>
            </div>
          </div>

          {/* Full Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2.5 font-medium text-slate-500 w-1/3">Filename</td>
                  <td className="px-4 py-2.5 font-mono text-slate-900 dark:text-white truncate max-w-[200px]">{activeItem.name}</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2.5 font-medium text-slate-500">MIME Media Type</td>
                  <td className="px-4 py-2.5 font-mono text-slate-900 dark:text-white">{activeItem.type}</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2.5 font-medium text-slate-500">Exact Byte Count</td>
                  <td className="px-4 py-2.5 font-mono text-slate-900 dark:text-white">{activeItem.size.toLocaleString()} bytes</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2.5 font-medium text-slate-500">Total Pixels</td>
                  <td className="px-4 py-2.5 font-mono text-slate-900 dark:text-white">{(activeItem.width * activeItem.height).toLocaleString()} px</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2.5 font-medium text-slate-500">Color Profile Space</td>
                  <td className="px-4 py-2.5 font-mono text-slate-900 dark:text-white">sRGB Display P3 Ready</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Privacy EXIF Stripper Action */}
          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Sanitize & Strip EXIF Privacy Data</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Removes GPS coordinates, camera serial numbers, timestamp, and device metadata before posting online.
                </p>
              </div>
            </div>

            <button
              onClick={handleStripMetadata}
              disabled={isStripping}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold whitespace-nowrap shadow-sm shrink-0 transition"
            >
              {isStripping ? 'Sanitizing...' : 'Download Clean File'}
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Base64 & Developer Code */}
      <div className="lg:col-span-5 space-y-6">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Base64 Data URI</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {base64 ? `${Math.round(base64.length / 1024)} KB` : ''}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Inline your image directly into HTML, CSS, or JSON payloads without external asset requests.
          </p>

          <div className="relative">
            <textarea
              readOnly
              value={base64}
              rows={6}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-mono text-slate-700 dark:text-slate-300 select-all resize-none focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopyBase64}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition active:scale-95"
            >
              {copiedBase64 ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedBase64 ? 'Copied Data URI!' : 'Copy Base64'}</span>
            </button>

            <button
              onClick={handleCopyCss}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
            >
              {copiedCss ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Code className="w-3.5 h-3.5" />}
              <span>{copiedCss ? 'Copied CSS!' : 'CSS Snippet'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
