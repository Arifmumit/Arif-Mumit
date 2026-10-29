import React from 'react';
import { Sparkles, Shield, Github, Heart } from 'lucide-react';
import { ToolType } from '../types/image';

interface FooterProps {
  onSelectTool: (tool: ToolType) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTool }) => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-100 dark:border-slate-900">
          <div className="space-y-2 max-w-md">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold tracking-tight text-base">
              <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span>PixelForge</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Fast, privacy-first image editing tools running 100% locally in your browser. No server uploads, no cookies, zero data retention.
            </p>
          </div>

          {/* Quick tool links */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
            <button onClick={() => onSelectTool('compress')} className="hover:text-indigo-600 transition">
              Compress Image
            </button>
            <button onClick={() => onSelectTool('resize')} className="hover:text-indigo-600 transition">
              Resize & Scale
            </button>
            <button onClick={() => onSelectTool('crop')} className="hover:text-indigo-600 transition">
              Crop & Rotate
            </button>
            <button onClick={() => onSelectTool('convert')} className="hover:text-indigo-600 transition">
              Convert WebP / JPG
            </button>
            <button onClick={() => onSelectTool('filters')} className="hover:text-indigo-600 transition">
              Photo Filter Studio
            </button>
            <button onClick={() => onSelectTool('watermark')} className="hover:text-indigo-600 transition">
              Watermark Stamp
            </button>
            <button onClick={() => onSelectTool('bgremove')} className="hover:text-indigo-600 transition">
              Background Key
            </button>
            <button onClick={() => onSelectTool('metadata')} className="hover:text-indigo-600 transition">
              EXIF & Base64
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>© 2026 PixelForge. MIT License.</span>
            <span aria-hidden="true">·</span>
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Shield className="w-3.5 h-3.5" />
              <span>Local Browser Sandbox Privacy Guaranteed</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span>Built with HTML5 Canvas & WebAssembly</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
