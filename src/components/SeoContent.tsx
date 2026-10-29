import React, { useState } from 'react';
import { ChevronDown, ShieldCheck, Zap, Lock, Cpu, FileCheck, Layers } from 'lucide-react';
import { ToolType } from '../types/image';

interface SeoContentProps {
  activeTool: ToolType;
}

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'Are my images uploaded to any remote server or stored in the cloud?',
    answer: 'Never. PixelForge operates 100% client-side inside your browser sandbox using HTML5 Canvas, WebAssembly, and modern web APIs. Your images, personal photos, and sensitive documents never touch any external server or third-party database, guaranteeing absolute privacy and zero compliance risk.'
  },
  {
    question: 'What is the maximum file size or number of images I can process?',
    answer: 'Because processing is executed directly by your computer hardware rather than bounded cloud servers, there are no artificial file size caps, queue limits, or subscription paywalls. You can process high-resolution multi-megapixel images and batch queues limited only by your local browser memory.'
  },
  {
    question: 'Which image format offers the best compression for modern websites?',
    answer: 'WebP offers between 25% to 35% superior compression compared to traditional JPEG at equivalent visual quality, while supporting alpha transparency. For universal compatibility across legacy software and printers, standard JPEG is best. For graphic diagrams, sharp text, and logos, PNG is recommended.'
  },
  {
    question: 'How does client-side metadata and EXIF stripping protect my privacy?',
    answer: 'Digital cameras and smartphones embed rich exchangeable image file format (EXIF) tags into photos, frequently containing exact GPS coordinates, camera serial numbers, and capture timestamps. PixelForge completely cleans these metadata tags upon export by re-rendering pixel data onto a pristine canvas buffer.'
  },
  {
    question: 'Can I batch download multiple optimized images at once?',
    answer: 'Yes. When you load multiple images into the queue, you can use the "Export All (ZIP)" button to download all processed files in a single organized archive archive.'
  }
];

export const SeoContent: React.FC<SeoContentProps> = ({ activeTool }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toolDetails: Record<ToolType, { title: string; subtitle: string; steps: string[] }> = {
    compress: {
      title: 'Lossless & High-Efficiency Online Image Compression',
      subtitle: 'Reduce image file sizes up to 80% without noticeable quality loss using advanced browser-based quantization.',
      steps: [
        'Select or drag-and-drop your JPEG, PNG, or WebP files into the editor.',
        'Adjust the interactive Quality slider or select a recommended preset.',
        'Inspect the real-time Split View comparison slider to evaluate sharpness.',
        'Download the optimized lightweight image ready for fast web delivery.'
      ]
    },
    resize: {
      title: 'Precision Dimension & Social Media Image Resizing',
      subtitle: 'Scale photos by exact pixels, percentage, or social media presets with aspect ratio locking.',
      steps: [
        'Choose your desired resizing method: exact pixels, percentage multiplier, or platform preset.',
        'Select from pre-configured dimensions for Instagram, YouTube, X, and LinkedIn.',
        'Pick your fitting strategy: Contain with clean margins, Cover with smart center-cropping, or Stretch.',
        'Export your resized graphics with crisp bicubic pixel resampling.'
      ]
    },
    crop: {
      title: 'Interactive Image Cropping, Rotation & Straightening',
      subtitle: 'Frame your subjects with rule-of-thirds grids, aspect ratio locks, and fine rotation angle alignment.',
      steps: [
        'Select an aspect ratio preset such as 1:1 Square, 16:9 Landscape, or 4:3 Standard.',
        'Adjust the framing box using the zoom and position sliders.',
        'Rotate 90 degrees or fine-tune horizon tilt using the degree straightening slider.',
        'Export the cropped area directly in original high resolution.'
      ]
    },
    convert: {
      title: 'Universal Image Format Converter (WebP, JPG, PNG, BMP)',
      subtitle: 'Transform files across next-gen web formats and universal raster graphics instantly in your browser.',
      steps: [
        'Drop your source image into the converter workspace.',
        'Pick the target format: WebP for maximum web performance, JPEG for compatibility, or PNG for transparency.',
        'For transparent PNGs converting to JPEG, choose a clean background fill color.',
        'Save the converted file directly to your downloads.'
      ]
    },
    filters: {
      title: 'Photo Filter Studio & Color Grading Suite',
      subtitle: 'Fine-tune brightness, contrast, saturation, and temperature with GPU-accelerated CSS filters.',
      steps: [
        'Browse curated aesthetic presets including Cinematic, Vivid Summer, and Dramatic B&W.',
        'Fine-tune color exposure, saturation, and warmth sliders.',
        'Toggle split view to compare your color grade directly against the original.',
        'Download your color-enhanced photograph.'
      ]
    },
    watermark: {
      title: 'Text & Logo Watermark Protection',
      subtitle: 'Protect your creative intellectual property with customized copyright stamps and logo overlays.',
      steps: [
        'Choose between text watermark or uploading a transparent custom PNG logo.',
        'Customize font family, font size, color, opacity, and rotation angle.',
        'Place the watermark using the 9-point anchor grid or create a repeating security tile grid.',
        'Export the stamped image with crisp antialiased rendering.'
      ]
    },
    bgremove: {
      title: 'Chroma Key & Solid Background Color Keying',
      subtitle: 'Isolate foreground products and subjects from studio backdrops and solid backgrounds.',
      steps: [
        'Sample the background color using the color picker or choose from common backdrop presets.',
        'Adjust the color tolerance threshold slider to isolate edges cleanly.',
        'Apply edge feathering for smooth gradient transitions.',
        'Download an alpha transparent PNG ready for e-commerce and compositing.'
      ]
    },
    meme: {
      title: 'Viral Meme & Text Caption Generator',
      subtitle: 'Create classic meme images with Impact font, bold outlines, and centered typographic hierarchy.',
      steps: [
        'Enter top and bottom caption text in the editor fields.',
        'Adjust font size scale and stroke outline thickness.',
        'Choose text fill and outline colors.',
        'Save your viral meme image in high quality.'
      ]
    },
    metadata: {
      title: 'EXIF Privacy Inspector & Base64 Data URI Generator',
      subtitle: 'Inspect image geometry, strip sensitive EXIF location data, and extract Base64 data URIs.',
      steps: [
        'Review dimensions, megapixels, exact byte count, and color space.',
        'Click "Sanitize & Strip EXIF" to remove GPS tags and camera metadata.',
        'Copy the Base64 Data URI or CSS code snippet directly for web development.',
        'Download the cleaned privacy-safe image.'
      ]
    }
  };

  const currentToolInfo = toolDetails[activeTool] || toolDetails.compress;

  return (
    <section className="w-full max-w-5xl mx-auto space-y-16 pt-8 pb-12">
      {/* Active Tool In-Depth Overview */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {currentToolInfo.title}
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300 max-w-3xl">
            {currentToolInfo.subtitle}
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {currentToolInfo.steps.map((step, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2"
            >
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                0{idx + 1}. Step
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {step}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Pillar Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Zero Server Uploads</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            All transformations run entirely inside your browser's V8 engine. Your confidential documents, identity cards, and personal family photos never upload to remote cloud storage.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Zero Latency Performance</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Eliminates slow network upload and download bottlenecks. Compress, crop, and convert multi-megabyte files in milliseconds leveraging hardware-accelerated HTML5 Canvas.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Batch Multi-File Ready</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Process multiple files concurrently without arbitrary rate limits or subscription tiers. Export individual files or download all results bundled into a single ZIP archive.
          </p>
        </div>
      </div>

      {/* Format Comparison Matrix */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Image Format Specification Comparison</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Understand the performance, transparency, and compression trade-offs between modern raster formats.
          </p>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Format</th>
                <th className="px-4 py-3">Compression Type</th>
                <th className="px-4 py-3">Transparency</th>
                <th className="px-4 py-3">Typical Size</th>
                <th className="px-4 py-3">Ideal Use Case</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3 font-bold font-mono text-indigo-600 dark:text-indigo-400">WebP</td>
                <td className="px-4 py-3">Lossy & Lossless</td>
                <td className="px-4 py-3 text-emerald-600 font-semibold">Yes (Alpha)</td>
                <td className="px-4 py-3 font-mono">Smallest (~30% &lt; JPG)</td>
                <td className="px-4 py-3">High-speed web publishing and modern responsive apps</td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3 font-bold font-mono">JPEG / JPG</td>
                <td className="px-4 py-3">Lossy (DCT)</td>
                <td className="px-4 py-3 text-slate-400">No</td>
                <td className="px-4 py-3 font-mono">Moderate</td>
                <td className="px-4 py-3">Universal hardware compatibility, photography, email</td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3 font-bold font-mono">PNG</td>
                <td className="px-4 py-3">Lossless (DEFLATE)</td>
                <td className="px-4 py-3 text-emerald-600 font-semibold">Yes (8-bit / 24-bit)</td>
                <td className="px-4 py-3 font-mono">Larger</td>
                <td className="px-4 py-3">Icons, UI elements, logos, illustrations with sharp edges</td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3 font-bold font-mono">BMP</td>
                <td className="px-4 py-3">Uncompressed</td>
                <td className="px-4 py-3 text-slate-400">No</td>
                <td className="px-4 py-3 font-mono">Very Large</td>
                <td className="px-4 py-3">Legacy Windows desktop software and raw framebuffer input</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Frequently Asked Questions</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Common questions regarding privacy, performance, and supported standards.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                >
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-indigo-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
