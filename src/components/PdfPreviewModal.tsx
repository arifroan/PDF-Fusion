import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Eye, ArrowUp, ArrowDown, Trash2, Check, CheckSquare, 
  Square, FileText, Sparkles, RefreshCw, Layers, Image as ImageIcon,
  ChevronRight, AlertCircle, Info, FileImage
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { PDFFileItem } from '../types';

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
const PDFJS_WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'merge' | 'pdf-to-jpg';
  
  // Merge mode props
  mergeFiles?: PDFFileItem[];
  onUpdateMergeFiles?: (files: PDFFileItem[]) => void;
  onConfirmMerge?: () => void;

  // PDF to JPG mode props
  pdfFile?: File | null;
  onConfirmConversion?: (selectedPages: number[]) => void;
}

// Sub-component to load PDF.js and render a specific page to a canvas
function PdfThumbnail({ 
  file, 
  pageNumber, 
  className = "" 
}: { 
  file: File; 
  pageNumber: number; 
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    let renderTask: any = null;

    const renderPage = async () => {
      const anyWin = window as any;
      if (!anyWin.pdfjsLib) {
        // Try to load PDF.js if not globally available
        try {
          if (!document.getElementById('pdfjs-lib-script')) {
            const script = document.createElement('script');
            script.id = 'pdfjs-lib-script';
            script.src = PDFJS_CDN;
            script.async = true;
            script.onload = () => {
              anyWin.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
            };
            document.head.appendChild(script);
          }
        } catch (e) {
          console.error(e);
        }
        
        // Wait briefly for library
        for (let i = 0; i < 20; i++) {
          if (anyWin.pdfjsLib) break;
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (!anyWin.pdfjsLib && active) {
          setError(true);
          setLoading(false);
          return;
        }
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = anyWin.pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(pageNumber);
        
        if (!active) return;

        const viewport = page.getViewport({ scale: 0.3 }); // Small preview scale
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        
        renderTask = page.render(renderContext);
        await renderTask.promise;
        if (active) {
          setLoading(false);
        }
      } catch (err) {
        console.error("Error rendering page thumbnail:", err);
        if (active) {
          setError(true);
          setLoading(false);
        }
      }
    };

    renderPage();

    return () => {
      active = false;
      if (renderTask && renderTask.cancel) {
        renderTask.cancel();
      }
    };
  }, [file, pageNumber]);

  return (
    <div className={`relative aspect-[3/4] bg-slate-950 rounded-xl overflow-hidden border border-white/5 flex items-center justify-center ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/80">
          <RefreshCw className="h-4 w-4 animate-spin text-quantum" />
          <span className="text-[10px] font-mono text-slate-400">Loading...</span>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-3 text-center bg-slate-900/90">
          <AlertCircle className="h-4 w-4 text-rose-400" />
          <span className="text-[9px] font-mono text-slate-400">Preview Unavailable</span>
        </div>
      )}
      <canvas ref={canvasRef} className="w-full h-full object-contain" />
    </div>
  );
}

export default function PdfPreviewModal({
  isOpen,
  onClose,
  mode,
  mergeFiles = [],
  onUpdateMergeFiles,
  onConfirmMerge,
  pdfFile,
  onConfirmConversion
}: PdfPreviewModalProps) {
  
  // Mode: pdf-to-jpg selection set
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [pdfPageCount, setPdfPageCount] = useState<number>(0);
  const [allPagesLoading, setAllPagesLoading] = useState(false);

  // Read page count for pdf-to-jpg on file load
  useEffect(() => {
    if (mode === 'pdf-to-jpg' && pdfFile) {
      setAllPagesLoading(true);
      const loadPageCount = async () => {
        const anyWin = window as any;
        try {
          // Verify/load script is done via PdfThumbnail or parent, but let's parse safely
          let lib = anyWin.pdfjsLib;
          if (!lib) {
            await new Promise(r => setTimeout(r, 600));
            lib = anyWin.pdfjsLib;
          }
          if (lib) {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const loadingTask = lib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            setPdfPageCount(pdf.numPages);
            
            // Default select all pages first
            const allPages = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
            setSelectedPages(allPages);
          }
        } catch (e) {
          console.error("Failed to parse pages:", e);
        } finally {
          setAllPagesLoading(false);
        }
      };
      loadPageCount();
    }
  }, [pdfFile, mode, isOpen]);

  if (!isOpen) return null;

  // Handles moving files up inside Merge Preview list
  const handleMoveUp = (idx: number) => {
    if (idx === 0 || !onUpdateMergeFiles) return;
    const nextArr = [...mergeFiles];
    const temp = nextArr[idx];
    nextArr[idx] = nextArr[idx - 1];
    nextArr[idx - 1] = temp;
    onUpdateMergeFiles(nextArr);
  };

  // Handles moving files down inside Merge Preview list
  const handleMoveDown = (idx: number) => {
    if (!onUpdateMergeFiles || idx >= mergeFiles.length - 1) return;
    const nextArr = [...mergeFiles];
    const temp = nextArr[idx];
    nextArr[idx] = nextArr[idx + 1];
    nextArr[idx + 1] = temp;
    onUpdateMergeFiles(nextArr);
  };

  // Handles removing a file entirely from the Merge array
  const handleRemoveFile = (id: string) => {
    if (!onUpdateMergeFiles) return;
    onUpdateMergeFiles(mergeFiles.filter(item => item.id !== id));
  };

  // Toggle page select in PDF-to-JPG mode
  const handleTogglePage = (pageNum: number) => {
    setSelectedPages(prev => {
      if (prev.includes(pageNum)) {
        return prev.filter(p => p !== pageNum);
      } else {
        return [...prev, pageNum].sort((a, b) => a - b);
      }
    });
  };

  const handleSelectAll = () => {
    const all = Array.from({ length: pdfPageCount }, (_, i) => i + 1);
    setSelectedPages(all);
  };

  const handleClearSelection = () => {
    setSelectedPages([]);
  };

  // Calculate total pages in the Merge flow
  const computedTotalMergePages = mergeFiles
    .filter(f => f.status === 'success')
    .reduce((sum, f) => sum + (f.pageCount || 0), 0);

  const handleExecuteMergeAction = () => {
    if (onConfirmMerge) {
      onConfirmMerge();
      onClose();
    }
  };

  const handleExecuteConversionAction = () => {
    if (onConfirmConversion && selectedPages.length > 0) {
      onConfirmConversion(selectedPages);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#04060A]/90 backdrop-blur-md"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative w-full max-w-4xl max-h-[82vh] rounded-3xl border border-white/10 bg-[#0A0D16] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden text-white"
        >
          {/* Accent glow line */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-quantum to-transparent" />

          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/[0.01] shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-quantum/10 border border-quantum/20 text-quantum">
                {mode === 'merge' ? <Layers className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
              </div>
              <div>
                <h4 className="text-lg font-black tracking-tight family-sans">
                  {mode === 'merge' ? 'Verify Stream Order Sequence' : 'Interactive Page Selector'}
                </h4>
                <p className="text-[11px] font-mono text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-quantum animate-ping" />
                  Quantum Sandboxed Sandbox Verification
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 active:bg-white/10 rounded-xl transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Contents: Dynamic scroll-grid */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
            {mode === 'merge' ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-quantum-10 border border-quantum-20 p-4.5 rounded-2xl">
                  <div className="flex gap-2.5 items-start">
                    <Info className="h-5 w-5 text-quantum shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-white">Ensure Sequence Perfect Compatibility</p>
                      <p className="text-xs text-slate-300 mt-1">
                        Arrange documents sequentially. The stream binds them into a single file in the exact order specified below.
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-center sm:text-right bg-black/40 border border-white/5 rounded-xl px-4 py-2 font-mono">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Total Output Pages</p>
                    <p className="text-lg font-black text-quantum-highlight">{computedTotalMergePages} Pages</p>
                  </div>
                </div>

                {/* Stream order items queue list */}
                <div className="space-y-3">
                  {mergeFiles.map((item, index) => (
                    <div 
                      key={item.id}
                      className="group/item flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-white/15 rounded-2xl p-4 transition-all duration-200"
                    >
                      {/* Left thumbnail */}
                      <div className="w-24 shrink-0 self-center md:self-auto">
                        <PdfThumbnail file={item.file} pageNumber={1} className="w-24 shadow-md" />
                      </div>

                      {/* Info details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[10px] font-mono bg-white/5 text-slate-400 px-2 py-0.5 rounded border border-white/15">
                            SEQ #{index + 1}
                          </span>
                          <span className="text-xs font-mono font-bold text-quantum-highlight bg-quantum/10 border border-quantum-20 px-2 py-0.5 rounded">
                            {item.pageCount || '?'} Pages
                          </span>
                        </div>
                        <p className="text-sm font-bold text-white truncate pr-4" title={item.name}>
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 font-mono">
                          Size: {(item.size / (1024 * 1024)).toFixed(2)} MB • Format: PDF Stream
                        </p>
                      </div>

                      {/* Direction controls / Trash */}
                      <div className="flex items-center justify-end gap-1 px-2.5 py-1.5 md:py-0 bg-black/45 md:bg-transparent rounded-xl border border-white/5 md:border-transparent shrink-0">
                        <button
                          disabled={index === 0}
                          onClick={() => handleMoveUp(index)}
                          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 active:bg-white/10 disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="h-4.5 w-4.5" />
                        </button>
                        <button
                          disabled={index === mergeFiles.length - 1}
                          onClick={() => handleMoveDown(index)}
                          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 active:bg-white/10 disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="h-4.5 w-4.5" />
                        </button>
                        <div className="h-4 w-[1px] bg-white/10 mx-1 hidden md:block" />
                        <button
                          onClick={() => handleRemoveFile(item.id)}
                          className="p-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 active:bg-rose-500/20 transition cursor-pointer"
                          title="Delete from Stream"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {mergeFiles.length === 0 && (
                    <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                      <FileText className="h-10 w-10 text-slate-500 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-slate-400">All stream items cleared</p>
                      <p className="text-xs text-slate-500 mt-1">Add PDF files to begin sequencing</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // PDF to JPG selector
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#94A3B8] uppercase">Select target pages to convert:</span>
                    <span className="text-xs font-bold font-mono text-quantum bg-quantum/10 border border-quantum-20 px-2 py-0.5 rounded">
                      {selectedPages.length} of {pdfPageCount} Selected
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSelectAll}
                      className="px-3 py-1.5 text-xs font-medium border border-white/10 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleClearSelection}
                      className="px-3 py-1.5 text-xs font-medium border border-[#F43F5E]/20 text-rose-300 hover:bg-[#F43F5E]/10 rounded-xl transition cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {allPagesLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <RefreshCw className="h-8 w-8 text-quantum animate-spin" />
                    <p className="text-sm font-mono text-slate-400">Inspecting document pages structure...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[460px] overflow-y-auto pr-1 select-none custom-scrollbar">
                    {pdfFile && Array.from({ length: pdfPageCount }, (_, i) => i + 1).map((pageNum) => {
                      const isSelected = selectedPages.includes(pageNum);
                      return (
                        <div
                          key={pageNum}
                          onClick={() => handleTogglePage(pageNum)}
                          className={`group/page relative rounded-2xl border transition-all cursor-pointer overflow-hidden p-1 bg-[#090F1E] flex flex-col hover:scale-[1.02] shadow-inner ${
                            isSelected 
                              ? 'border-quantum shadow-[0_0_15px_rgba(var(--quantum-color-rgb),0.2)]' 
                              : 'border-white/5 hover:border-white/20'
                          }`}
                        >
                          <div className="relative">
                            <PdfThumbnail file={pdfFile} pageNumber={pageNum} />
                            
                            {/* Overlay check token */}
                            <div className={`absolute top-2.5 right-2.5 h-6 w-6 rounded-lg flex items-center justify-center transition-all ${
                              isSelected 
                                ? 'bg-quantum text-white scale-100 shadow-md' 
                                : 'bg-black/60 border border-white/20 text-transparent scale-90 group-hover/page:scale-100'
                            }`}>
                              <Check className="h-4 w-4" />
                            </div>

                            {/* Page index badge */}
                            <div className="absolute bottom-2 left-2 rounded-md bg-black/65 border border-white/10 px-2 py-0.5 text-[9px] font-mono font-bold text-slate-300">
                              PAGE {pageNum}
                            </div>
                          </div>

                          <div className="py-2.5 px-2 bg-black/25 text-center border-t border-white/5 shrink-0 rounded-b-xl flex items-center justify-between">
                            <span className="text-[10px] font-mono text-slate-400">Page {pageNum}</span>
                            <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-quantum' : 'text-slate-500'}`}>
                              {isSelected ? 'SELECTED' : 'EXCLUDED'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Actions Footer */}
          <div className="px-6 py-5 border-t border-white/5 bg-white/[0.01] shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400 text-center sm:text-left leading-relaxed">
              {mode === 'merge' ? (
                <span>Merged sequence includes <strong className="text-quantum-highlight">{computedTotalMergePages} pages</strong> from <strong className="text-quantum-highlight">{mergeFiles.length} files</strong>.</span>
              ) : (
                <span>Selected <strong className="text-quantum-highlight">{selectedPages.length}</strong> out of <strong className="text-quantum-highlight">{pdfPageCount} available</strong> pages.</span>
              )}
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 border border-white/10 text-xs font-bold uppercase rounded-2xl tracking-wider text-slate-300 hover:text-white hover:bg-white/5 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={mode === 'merge' ? handleExecuteMergeAction : handleExecuteConversionAction}
                disabled={
                  (mode === 'merge' && mergeFiles.length < 2) ||
                  (mode === 'pdf-to-jpg' && selectedPages.length === 0)
                }
                className="w-full sm:w-auto overflow-hidden rounded-2xl bg-gradient-to-r from-quantum to-quantum-highlight p-[1.5px] font-sans text-xs font-bold tracking-wider uppercase text-white transition hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(var(--quantum-color-rgb),0.3)] active:scale-98 disabled:scale-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <span className="w-full h-full flex items-center justify-center gap-2 bg-[#0C1123]/95 hover:bg-transparent px-6 py-2.5 rounded-[15px] transition duration-200">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse text-quantum-highlight" />
                  {mode === 'merge' ? 'Confirm and Synthesize' : 'Confirm and Export'}
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
