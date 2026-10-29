/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Minimize2,
  Maximize2,
  Crop as CropIcon,
  RefreshCw,
  Sliders,
  Type,
  Sparkles,
  Info,
  Smile,
} from 'lucide-react';
import { ToolType, ImageItem, ToolMeta } from './types/image';
import { fileToImageItem, downloadZip, processCompress } from './utils/imageProcessor';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { FileQueue } from './components/FileQueue';
import { CompressTool } from './components/tools/CompressTool';
import { ResizeTool } from './components/tools/ResizeTool';
import { CropTool } from './components/tools/CropTool';
import { ConvertTool } from './components/tools/ConvertTool';
import { FilterTool } from './components/tools/FilterTool';
import { WatermarkTool } from './components/tools/WatermarkTool';
import { BgRemoveTool } from './components/tools/BgRemoveTool';
import { MemeTool } from './components/tools/MemeTool';
import { MetadataTool } from './components/tools/MetadataTool';
import { SeoContent } from './components/SeoContent';
import { Footer } from './components/Footer';
import { AuthModal } from './components/auth/AuthModal';
import { AdminConsole } from './components/admin/AdminConsole';

const TOOLS: ToolMeta[] = [
  { id: 'compress', title: 'Compress', shortDesc: 'Shrink file size with live split preview', iconName: 'Minimize2' },
  { id: 'resize', title: 'Resize', shortDesc: 'Scale by pixels, % or social presets', iconName: 'Maximize2' },
  { id: 'crop', title: 'Crop & Rotate', shortDesc: 'Trim, rotate 90°, and straighten tilt', iconName: 'CropIcon' },
  { id: 'convert', title: 'Convert', shortDesc: 'Switch to WebP, JPG, PNG or BMP', iconName: 'RefreshCw' },
  { id: 'filters', title: 'Filter Studio', shortDesc: 'Color grading, warmth, contrast presets', iconName: 'Sliders' },
  { id: 'watermark', title: 'Watermark', shortDesc: 'Add copyright text or logo stamps', iconName: 'Type' },
  { id: 'bgremove', title: 'Background Key', shortDesc: 'Chroma key & solid color eraser', iconName: 'Sparkles' },
  { id: 'meme', title: 'Meme Maker', shortDesc: 'Impact typography captions', iconName: 'Smile' },
  { id: 'metadata', title: 'EXIF & Base64', shortDesc: 'Privacy scrub and developer data URI', iconName: 'Info' },
];

function MainAppContent() {
  const [activeTool, setActiveTool] = useState<ToolType>('compress');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [activeImageId, setActiveImageId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auth and Admin Modals
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync hash with active tool
  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as ToolType;
    if (hash && TOOLS.some((t) => t.id === hash)) {
      setActiveTool(hash);
    }
  }, []);

  const handleSelectTool = (tool: ToolType) => {
    setActiveTool(tool);
    window.location.hash = tool;

    // Dynamic Title for SEO
    const toolMeta = TOOLS.find((t) => t.id === tool);
    if (toolMeta) {
      document.title = `${toolMeta.title} Image Online Free – PixelForge`;
    }
  };

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Global Clipboard Paste Listener
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!e.clipboardData || !e.clipboardData.items) return;
      const items = Array.from(e.clipboardData.items);
      const imageFiles: File[] = [];

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        showToast(`Pasted ${imageFiles.length} image from clipboard`);
        handleFilesSelected(imageFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleFilesSelected = async (files: File[]) => {
    setIsLoading(true);
    try {
      const newItems: ImageItem[] = [];
      for (const file of files) {
        const item = await fileToImageItem(file);
        newItems.push(item);
      }
      setImages((prev) => [...prev, ...newItems]);
      if (!activeImageId && newItems.length > 0) {
        setActiveImageId(newItems[0].id);
      } else if (newItems.length > 0) {
        setActiveImageId(newItems[newItems.length - 1].id);
      }
      showToast(`Loaded ${newItems.length} image${newItems.length > 1 ? 's' : ''}`);
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      if (activeImageId === id) {
        setActiveImageId(filtered.length > 0 ? filtered[0].id : '');
      }
      return filtered;
    });
  };

  const handleClearAll = () => {
    setImages([]);
    setActiveImageId('');
  };

  const handleBatchZip = async () => {
    if (images.length === 0) return;
    setIsProcessingBatch(true);
    showToast('Compressing and bundling files into ZIP...');
    try {
      const outputFiles: { name: string; blob: Blob }[] = [];
      for (const item of images) {
        const res = await processCompress(item, { quality: 80, format: 'image/jpeg' });
        const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
        outputFiles.push({
          name: `${baseName}-optimized.jpg`,
          blob: res.blob
        });
      }
      await downloadZip(outputFiles, 'pixelforge_batch_optimized.zip');
      showToast('ZIP archive downloaded successfully!');
    } catch (err) {
      console.error('Batch ZIP error:', err);
      showToast('Batch processing failed.');
    } finally {
      setIsProcessingBatch(false);
    }
  };

  const activeImage = images.find((img) => img.id === activeImageId) || images[0];

  const renderIcon = (name: string) => {
    switch (name) {
      case 'Minimize2': return <Minimize2 className="w-4 h-4" />;
      case 'Maximize2': return <Maximize2 className="w-4 h-4" />;
      case 'CropIcon': return <CropIcon className="w-4 h-4" />;
      case 'RefreshCw': return <RefreshCw className="w-4 h-4" />;
      case 'Sliders': return <Sliders className="w-4 h-4" />;
      case 'Type': return <Type className="w-4 h-4" />;
      case 'Sparkles': return <Sparkles className="w-4 h-4" />;
      case 'Smile': return <Smile className="w-4 h-4" />;
      case 'Info': return <Info className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const renderActiveToolComponent = () => {
    if (!activeImage) return null;
    switch (activeTool) {
      case 'compress': return <CompressTool activeItem={activeImage} />;
      case 'resize': return <ResizeTool activeItem={activeImage} />;
      case 'crop': return <CropTool activeItem={activeImage} />;
      case 'convert': return <ConvertTool activeItem={activeImage} />;
      case 'filters': return <FilterTool activeItem={activeImage} />;
      case 'watermark': return <WatermarkTool activeItem={activeImage} />;
      case 'bgremove': return <BgRemoveTool activeItem={activeImage} />;
      case 'meme': return <MemeTool activeItem={activeImage} />;
      case 'metadata': return <MetadataTool activeItem={activeImage} />;
      default: return <CompressTool activeItem={activeImage} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Hidden Global File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.webp,.avif,.png,.jpg,.jpeg,.gif,.bmp,.svg"
        onChange={(e) => {
          if (e.target.files) {
            handleFilesSelected(Array.from(e.target.files));
            e.target.value = '';
          }
        }}
        className="hidden"
      />

      {/* Strict 3-zone Top Bar Contract with Auth & Admin triggers */}
      <Header
        activeTool={activeTool}
        onSelectTool={handleSelectTool}
        onOpenUpload={() => fileInputRef.current?.click()}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode(!darkMode)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        {/* Toast alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-bounce">
            <Sparkles className="w-4 h-4 text-amber-400 dark:text-amber-600" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Hero Banner when no images uploaded */}
        {images.length === 0 && (
          <div className="text-center space-y-4 max-w-3xl mx-auto pt-4 pb-2">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight" style={{ textWrap: 'balance' }}>
              Every Image Tool You Need, <span className="text-indigo-600 dark:text-indigo-400">100% Private</span> in Browser
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Compress, resize, crop, convert, filter, and watermark your photos with zero server uploads, zero quality loss, and zero file size caps.
            </p>
          </div>
        )}

        {/* Interactive Tool Selector Tabs */}
        <section aria-label="Tool selection" className="w-full">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 p-1.5 bg-slate-200/70 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            {TOOLS.map((tool) => {
              const isActive = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => handleSelectTool(tool.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-900/5'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {renderIcon(tool.iconName)}
                  <span>{tool.title}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* File Queue Strip when images are loaded */}
        {images.length > 0 && (
          <FileQueue
            items={images}
            activeId={activeImageId}
            onSelect={setActiveImageId}
            onRemove={handleRemoveImage}
            onAddMore={() => fileInputRef.current?.click()}
            onClearAll={handleClearAll}
            onDownloadAllZip={handleBatchZip}
            isProcessingBatch={isProcessingBatch}
          />
        )}

        {/* Active Tool Workspace or DropZone */}
        {images.length === 0 ? (
          <DropZone onFilesSelected={handleFilesSelected} isLoading={isLoading} />
        ) : (
          <div className="space-y-6">
            {renderActiveToolComponent()}
          </div>
        )}

        {/* In-depth SEO Content, Step Guides, Format Matrix, and FAQs */}
        <SeoContent activeTool={activeTool} />
      </main>

      {/* Anti-Slop Compliant Footer */}
      <Footer onSelectTool={handleSelectTool} />

      {/* Authentication Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* Super Admin & Admin Access Control Modal */}
      {isAdminOpen && <AdminConsole onClose={() => setIsAdminOpen(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
