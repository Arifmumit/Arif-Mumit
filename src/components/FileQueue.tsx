import React from 'react';
import { Plus, X, Layers, Archive, RefreshCw } from 'lucide-react';
import { ImageItem } from '../types/image';
import { formatBytes } from '../utils/imageProcessor';

interface FileQueueProps {
  items: ImageItem[];
  activeId: string;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onAddMore: () => void;
  onClearAll: () => void;
  onDownloadAllZip?: () => void;
  isProcessingBatch?: boolean;
}

export const FileQueue: React.FC<FileQueueProps> = ({
  items,
  activeId,
  onSelect,
  onRemove,
  onAddMore,
  onClearAll,
  onDownloadAllZip,
  isProcessingBatch
}) => {
  if (items.length === 0) return null;

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Thumbnails row */}
      <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto max-w-full pb-1 sm:pb-0">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0 mr-1">
          <Layers className="w-4 h-4" />
          <span>Queue ({items.length})</span>
        </div>

        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <div
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`group relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer border transition text-left shrink-0 ${
                isActive
                  ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
              }`}
            >
              <img
                src={item.previewUrl}
                alt={item.name}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded object-cover shrink-0 border border-slate-200 dark:border-slate-700"
              />
              <div className="flex flex-col min-w-0 pr-1">
                <span className="text-xs font-medium truncate max-w-[110px]">{item.name}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  {formatBytes(item.size)}
                </span>
              </div>

              {items.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item.id);
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-white/80 dark:hover:bg-slate-800 transition"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}

        <button
          onClick={onAddMore}
          className="flex items-center gap-1 px-3 py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add More</span>
        </button>
      </div>

      {/* Batch Actions */}
      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        {items.length > 1 && onDownloadAllZip && (
          <button
            onClick={onDownloadAllZip}
            disabled={isProcessingBatch}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition disabled:opacity-50"
          >
            {isProcessingBatch ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
            ) : (
              <Archive className="w-3.5 h-3.5" />
            )}
            <span>Export All (ZIP)</span>
          </button>
        )}

        <button
          onClick={onClearAll}
          className="text-xs text-slate-400 hover:text-rose-500 transition px-2 py-1"
        >
          Clear
        </button>
      </div>
    </div>
  );
};
