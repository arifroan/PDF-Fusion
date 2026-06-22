import { useState, useEffect, useRef, ChangeEvent, DragEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, FileText, CheckCircle, AlertTriangle, Trash2, 
  Sparkles, RefreshCw, FileImage, SlidersHorizontal, Download, ArrowDown, FileOutput, ArrowRight,
  CaseSensitive
} from 'lucide-react';

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
const PDFJS_WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

interface ExportedImage {
  pageNumber: number;
  dataUrl: string;
  name: string;
}

type ImageFormat = 'image/png' | 'image/jpeg';
type ResolutionScale = 1.0 | 1.5 | 2.0;

export default function PdfToJpgTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCdnReady, setIsCdnReady] = useState(false);
  
  // Convert config
  const [format, setFormat] = useState<ImageFormat>('image/png');
  const [scale, setScale] = useState<ResolutionScale>(1.5);
  const [selectedPagesOnly, setSelectedPagesOnly] = useState<boolean>(false);
  const [pagesInput, setPagesInput] = useState<string>('1');
  
  // Batch renaming states
  const [useCustomNaming, setUseCustomNaming] = useState<boolean>(false);
  const [customPrefix, setCustomPrefix] = useState<string>('slide');
  const [namingSeparator, setNamingSeparator] = useState<string>('_'); // '_', '-', or ''
  const [indexPadding, setIndexPadding] = useState<'none' | 'two-digit' | 'three-digit'>('two-digit');
  const [sequenceStart, setSequenceStart] = useState<number>(1);
  
  const [results, setResults] = useState<ExportedImage[]>([]);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const getOutputFilename = (pageNum: number, indexOnList: number, fileExtension: string, originalName: string) => {
    if (!useCustomNaming) {
      return `${originalName.replace(/\.[^/.]+$/, '')}_p${pageNum}.${fileExtension}`;
    }
    
    const seqNum = sequenceStart + indexOnList;
    let seqStr = seqNum.toString();
    if (indexPadding === 'two-digit') {
      seqStr = seqNum.toString().padStart(2, '0');
    } else if (indexPadding === 'three-digit') {
      seqStr = seqNum.toString().padStart(3, '0');
    }
    
    const prefix = customPrefix.trim() || 'export';
    return `${prefix}${namingSeparator}${seqStr}.${fileExtension}`;
  };

  const updateResultNames = () => {
    if (results.length === 0 || !file) return;
    const ext = format === 'image/png' ? 'png' : 'jpg';
    setResults(prev => prev.map((item, idx) => ({
      ...item,
      name: getOutputFilename(item.pageNumber, idx, ext, file.name)
    })));
  };

  // Run update whenever active options change
  useEffect(() => {
    updateResultNames();
  }, [useCustomNaming, customPrefix, namingSeparator, indexPadding, sequenceStart, format]);

  // Load PDF.js dynamically
  useEffect(() => {
    const loadPdfJs = async () => {
      const anyWin = window as any;
      if (anyWin.pdfjsLib) {
        setIsCdnReady(true);
        return;
      }

      try {
        const script = document.createElement('script');
        script.src = PDFJS_CDN;
        script.async = true;
        script.onload = () => {
          anyWin.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
          setIsCdnReady(true);
        };
        script.onerror = () => {
          setAlert({ type: 'error', message: 'Failed to initialize PDF renderer CDN. Please check network connectivity.' });
        };
        document.head.appendChild(script);
      } catch (err) {
        console.error('Failed to inject PDF.js script tag:', err);
      }
    };

    loadPdfJs();
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSelectClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type === 'application/pdf' || selected.name.toLowerCase().endsWith('.pdf')) {
        await parsePdfPagesCount(selected);
      } else {
        setAlert({ type: 'error', message: 'Please select a valid PDF file.' });
      }
    }
  };

  const parsePdfPagesCount = async (pdfFile: File) => {
    const anyWin = window as any;
    if (!anyWin.pdfjsLib) {
      setAlert({ type: 'error', message: 'PDF.js engine is still booting up. Try again in a brief second.' });
      return;
    }

    try {
      setIsProcessing(true);
      setAlert({ type: null, message: '' });
      setResults([]);

      const arrayBuffer = await pdfFile.arrayBuffer();
      const loadingTask = anyWin.pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      setPageCount(pdf.numPages);
      setFile(pdfFile);
      setPagesInput(`1-${Math.min(pdf.numPages, 3)}`);
    } catch (err: any) {
      console.error(err);
      setAlert({ type: 'error', message: 'An error occurred while inspecting pages mapping.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (dropped.type === 'application/pdf' || dropped.name.toLowerCase().endsWith('.pdf')) {
        await parsePdfPagesCount(dropped);
      } else {
        setAlert({ type: 'error', message: 'Only standard PDF documents are supported.' });
      }
    }
  };

  const handleClear = () => {
    setFile(null);
    setPageCount(0);
    setResults([]);
    setAlert({ type: null, message: '' });
  };

  const parsePageNumbers = (input: string, maxPages: number): number[] => {
    const pagesList: number[] = [];
    const elements = input.split(/[\s,]+/);

    for (const el of elements) {
      if (!el.trim()) continue;

      if (el.includes('-')) {
        const [startStr, endStr] = el.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);

        if (!isNaN(start) && !isNaN(end)) {
          const from = Math.min(start, end);
          const to = Math.max(start, end);

          for (let p = from; p <= to; p++) {
            if (p >= 1 && p <= maxPages && !pagesList.includes(p)) {
              pagesList.push(p);
            }
          }
        }
      } else {
        const p = parseInt(el, 10);
        if (!isNaN(p) && p >= 1 && p <= maxPages && !pagesList.includes(p)) {
          pagesList.push(p);
        }
      }
    }

    return pagesList.sort((a, b) => a - b);
  };

  const handleExportImages = async () => {
    if (!file) return;
    const anyWin = window as any;
    if (!anyWin.pdfjsLib) return;

    setIsProcessing(true);
    setAlert({ type: null, message: '' });
    setResults([]);

    try {
      window.dispatchEvent(new CustomEvent('pdf-progress', {
        detail: { active: true, progress: 10, status: 'Initializing Dynamic Canvas Engine...', type: 'convert' }
      }));

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = anyWin.pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      // Decide target pages
      let targetPages: number[] = [];
      if (selectedPagesOnly) {
        targetPages = parsePageNumbers(pagesInput, pdf.numPages);
        if (targetPages.length === 0) {
          throw new Error('No valid target pages matched your criteria.');
        }
      } else {
        targetPages = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
      }

      const exported: ExportedImage[] = [];

      for (let index = 0; index < targetPages.length; index++) {
        const pageNum = targetPages[index];
        const stepProgress = Math.round(15 + ((index / targetPages.length) * 75));

        window.dispatchEvent(new CustomEvent('pdf-progress', {
          detail: { 
            active: true, 
            progress: stepProgress, 
            status: `Rasterizing Page ${pageNum} into high-resolution pixel mapping...`, 
            type: 'convert' 
          }
        }));

        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        
        // Setup offscreen canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas 2D context retrieval failed.');

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render page to canvas context
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        await page.render(renderContext).promise;

        const ext = format === 'image/png' ? 'png' : 'jpg';
        const dataUrl = canvas.toDataURL(format, format === 'image/jpeg' ? 0.92 : undefined);

        exported.push({
          pageNumber: pageNum,
          dataUrl,
          name: getOutputFilename(pageNum, index, ext, file.name)
        });
      }

      window.dispatchEvent(new CustomEvent('pdf-progress', {
        detail: { active: true, progress: 100, status: 'Export Complete.', type: 'convert' }
      }));

      setResults(exported);
      setAlert({
        type: 'success',
        message: `Task Complete! Converted ${exported.length} PDF pages into high-fidelity image cards.`
      });

    } catch (err: any) {
      console.error(err);
      setAlert({
        type: 'error',
        message: err.message || 'Error occurred while loading pages binary tree.'
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('pdf-progress', {
          detail: { active: false, progress: 0, status: '', type: null }
        }));
      }, 800);
    }
  };

  const handleDownloadAll = () => {
    results.forEach((item, i) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = item.dataUrl;
        link.download = item.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, i * 200);
    });
  };

  return (
    <section id="pdf-to-jpg-tool-section" className="py-12 relative scroll-mt-24">
      <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-[#0D111C] p-6 sm:p-8 relative overflow-hidden gpu-accel">
        {/* Shimmer cyan boundary accent */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-md">
              <FileImage className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white font-sans tracking-tight">PDF to Image Export</h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Rasterize your vector document blocks into discrete, ultra-crisp PNG or JPEG segments offline.
              </p>
            </div>
          </div>
          
          {file && (
            <button
              onClick={handleClear}
              className="px-4 py-2 self-start sm:self-center text-xs border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition cursor-pointer"
            >
              Reset Session
            </button>
          )}
        </div>

        {/* Dynamic Alerts */}
        <AnimatePresence mode="popLayout">
          {alert.type && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className={`mb-8 p-4.5 rounded-2xl flex items-start gap-3.5 border shadow-lg ${
                alert.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/25 text-rose-300'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {alert.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-rose-400" />
                )}
              </div>
              <div className="text-sm">
                <span className="font-bold underline decoration-white/20 underline-offset-2 mr-1">
                  {alert.type === 'success' ? 'Task Complete:' : 'System Alert:'}
                </span>
                {alert.message}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Configuration Pane wrapper */}
        <div className={`mb-8 rounded-2xl border transition-all ${
          file ? 'border-white/10 bg-white/[0.015] p-5' : 'border-white/5 bg-[#121A2F]/20 opacity-40 p-5 pointer-events-none'
        } relative overflow-hidden`}>
          <div className="absolute top-0 left-0 w-24 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
          
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-4">
            <SlidersHorizontal className="h-4 w-4" />
            <span>Target Raster Protocol</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Format Selection Choice */}
            <div>
              <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-2">Export format</label>
              <div className="grid grid-cols-2 gap-2 bg-[#090F1E] p-1 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => { setFormat('image/png'); setResults([]); }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    format === 'image/png' ? 'bg-[#121A2F] text-cyan-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  PNG Format
                </button>
                <button
                  type="button"
                  onClick={() => { setFormat('image/jpeg'); setResults([]); }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    format === 'image/jpeg' ? 'bg-[#121A2F] text-cyan-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  JPEG Format
                </button>
              </div>
            </div>

            {/* Scale/Resolution choice */}
            <div>
              <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-2">Resolution density</label>
              <div className="grid grid-cols-3 gap-2 bg-[#090F1E] p-1 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => { setScale(1.0); setResults([]); }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    scale === 1.0 ? 'bg-[#121A2F] text-cyan-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  1.0x (Standard)
                </button>
                <button
                  type="button"
                  onClick={() => { setScale(1.5); setResults([]); }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    scale === 1.5 ? 'bg-[#121A2F] text-cyan-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  1.5x (Crisp)
                </button>
                <button
                  type="button"
                  onClick={() => { setScale(2.0); setResults([]); }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    scale === 2.0 ? 'bg-[#121A2F] text-cyan-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  2.0x (Retina)
                </button>
              </div>
            </div>

            {/* Scope mapping */}
            <div>
              <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-2">Target Pages Range</label>
              <div className="grid grid-cols-2 gap-2 bg-[#090F1E] p-1 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => { setSelectedPagesOnly(false); setResults([]); }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    !selectedPagesOnly ? 'bg-[#121A2F] text-cyan-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All {pageCount > 0 ? `(${pageCount})` : ''} Pages
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedPagesOnly(true); setResults([]); }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedPagesOnly ? 'bg-[#121A2F] text-cyan-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Selected Range
                </button>
              </div>
            </div>
          </div>

          {file && selectedPagesOnly && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 pt-4 border-t border-white/5 flex flex-col sm:flex-row gap-4 sm:items-center"
            >
              <div className="flex-1">
                <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase font-semibold">
                  Specify Range / Comma List (e.g. 1, 3, 5-8)
                </label>
                <input
                  type="text"
                  value={pagesInput}
                  onChange={(e) => { setPagesInput(e.target.value); setResults([]); }}
                  placeholder="e.g. 1-3"
                  className="w-full bg-[#090F1E] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
              <span className="text-[10px] text-slate-400 font-mono sm:mt-6 bg-[#090F1E] p-2.5 rounded-xl border border-white/5">
                Indexes are 1-based constraint. Maximum pages: <span className="text-cyan-400 text-xs font-bold">{pageCount}</span>
              </span>
            </motion.div>
          )}

          {/* Custom Batch Rename Segment */}
          <div className="mt-5 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={() => setUseCustomNaming(!useCustomNaming)}
              className="flex items-center justify-between w-full text-left font-semibold text-slate-300 hover:text-white transition duration-150 py-1"
            >
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                <CaseSensitive className="h-4 w-4 text-cyan-400 animate-pulse" />
                <span>Custom Batch Renaming Sequence</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${useCustomNaming ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/20' : 'bg-white/5 text-slate-500'}`}>
                  {useCustomNaming ? 'ENABLED' : 'DISABLED'}
                </span>
                <span className="text-slate-500 text-xs">{useCustomNaming ? 'Hide' : 'Configure'} &rarr;</span>
              </div>
            </button>

            <AnimatePresence>
              {useCustomNaming && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-1">
                    {/* Prefix Input */}
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-2">Custom Prefix</label>
                      <input
                        type="text"
                        value={customPrefix}
                        onChange={(e) => setCustomPrefix(e.target.value)}
                        placeholder="e.g. slide, invoice"
                        className="w-full bg-[#090F1E] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>

                    {/* Separator Selection */}
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-2">Separator</label>
                      <div className="grid grid-cols-3 gap-1 bg-[#090F1E] p-1 rounded-xl border border-white/5">
                        <button
                          type="button"
                          onClick={() => setNamingSeparator('_')}
                          className={`py-1.5 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
                            namingSeparator === '_' ? 'bg-[#121A2F] text-cyan-300' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          "_"
                        </button>
                        <button
                          type="button"
                          onClick={() => setNamingSeparator('-')}
                          className={`py-1.5 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
                            namingSeparator === '-' ? 'bg-[#121A2F] text-cyan-300' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          "-"
                        </button>
                        <button
                          type="button"
                          onClick={() => setNamingSeparator('')}
                          className={`py-1.5 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
                            namingSeparator === '' ? 'bg-[#121A2F] text-cyan-300' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          None
                        </button>
                      </div>
                    </div>

                    {/* Padding Selection */}
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-2">Number Padding</label>
                      <div className="grid grid-cols-3 gap-1 bg-[#090F1E] p-1 rounded-xl border border-white/5">
                        <button
                          type="button"
                          onClick={() => setIndexPadding('none')}
                          className={`py-1.5 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
                            indexPadding === 'none' ? 'bg-[#121A2F] text-cyan-300' : 'text-slate-400 hover:text-white'
                          }`}
                          title="e.g. 1, 2, 3"
                        >
                          1
                        </button>
                        <button
                          type="button"
                          onClick={() => setIndexPadding('two-digit')}
                          className={`py-1.5 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
                            indexPadding === 'two-digit' ? 'bg-[#121A2F] text-cyan-300' : 'text-slate-400 hover:text-white'
                          }`}
                          title="e.g. 01, 02, 03"
                        >
                          01
                        </button>
                        <button
                          type="button"
                          onClick={() => setIndexPadding('three-digit')}
                          className={`py-1.5 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
                            indexPadding === 'three-digit' ? 'bg-[#121A2F] text-cyan-300' : 'text-slate-400 hover:text-white'
                          }`}
                          title="e.g. 001, 002, 003"
                        >
                          001
                        </button>
                      </div>
                    </div>

                    {/* Sequence Start */}
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-2">Starts At</label>
                      <input
                        type="number"
                        min="1"
                        value={sequenceStart}
                        onChange={(e) => setSequenceStart(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full bg-[#090F1E] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Renaming Live Preview Banner */}
                  <div className="mt-3.5 p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/10 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Naming Template Preview:</span>
                    <span className="font-mono text-cyan-400 font-bold">
                      {customPrefix.trim() || 'export'}{namingSeparator}{
                        indexPadding === 'none' ? sequenceStart :
                        indexPadding === 'two-digit' ? sequenceStart.toString().padStart(2, '0') :
                        sequenceStart.toString().padStart(3, '0')
                      }.{format === 'image/png' ? 'png' : 'jpg'}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* File Select Dropzone area */}
        {!file ? (
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleSelectClick}
            className={`cursor-pointer group flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-10 md:p-14 text-center transition-all duration-300 ${
              isDragging
                ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_30px_rgba(6,182,212,0.25)]'
                : 'border-white/10 bg-white/[0.01] hover:border-cyan-500/40 hover:bg-white/[0.03]'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,application/pdf"
              className="hidden"
            />

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black/40 border border-white/10 text-slate-400 transition-all group-hover:text-cyan-400 group-hover:border-cyan-500/40 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]">
              <Upload className="h-6 w-6" />
            </div>

            <h4 className="mt-5 text-lg font-bold text-white tracking-tight group-hover:text-cyan-300 transition-colors">
              Drag & drop a PDF file to rasterize
            </h4>
            <p className="mt-2 text-sm text-slate-400">
              Or <span className="text-cyan-400 font-semibold group-hover:underline">browse storage</span> locally
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-300 bg-cyan-950/40 border border-cyan-500/20 py-1 px-3 rounded-md">
                GPU Rasterization Sandbox Offline
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 bg-slate-950/40 border border-white/15 py-1 px-3 rounded-md">
                Wasm Threaded
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs font-mono tracking-wider text-slate-400 uppercase">
                Loaded Vector PDF file info
              </span>
            </div>

            <div className="flex items-center justify-between border border-white/10 rounded-2xl p-5 bg-white/[0.01]">
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-950/50 border border-cyan-500/20 text-cyan-400 shadow-inner">
                  <FileText className="h-5.5 w-5.5" />
                </div>
                
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate max-w-[240px] sm:max-w-md">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    {formatBytes(file.size)} &bull; <span className="text-cyan-300">{pageCount} Pages Available</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClear}
                disabled={isProcessing}
                className="h-9 w-9 flex items-center justify-center bg-rose-950/40 hover:bg-rose-950 border border-rose-500/25 rounded-xl text-rose-300 transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none hover:border-rose-500"
                title="Remove file"
              >
                <Trash2 className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* If Converted Display Grid */}
            <AnimatePresence mode="wait">
              {results.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="space-y-4 pt-2"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                    <span className="text-xs font-mono tracking-wider text-slate-400 uppercase">
                      Rasterized Page Outputs ({results.length})
                    </span>

                    <button
                      onClick={handleDownloadAll}
                      className="text-xs font-bold text-cyan-400 hover:text-cyan-300 font-mono tracking-wide underline decoration-cyan-500/40 underline-offset-4 cursor-pointer"
                    >
                      Download All Images (Zip-free Staggered) &darr;
                    </button>
                  </div>

                  {/* Visual Page grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
                    {results.map((item, index) => (
                      <div 
                        key={index}
                        className="group/card relative rounded-2xl border border-white/5 bg-[#090F1E] overflow-hidden hover:border-cyan-500/20 transition-all flex flex-col shadow-inner"
                      >
                        {/* Page Preview Thumbnail */}
                        <div className="aspect-[3/4] overflow-hidden bg-slate-950 relative flex items-center justify-center">
                          <img 
                            src={item.dataUrl} 
                            alt={`Page ${item.pageNumber}`}
                            className="w-full h-full object-contain object-top transition duration-300 group-hover/card:scale-102"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute bottom-2 left-2 rounded-lg bg-black/70 border border-white/10 px-2 py-1 text-[9px] font-mono font-bold text-slate-300">
                            P.{item.pageNumber}
                          </span>
                        </div>

                        {/* Dynamic Filename Display */}
                        <div className="px-3 py-1.5 bg-black/30 border-b border-white/5">
                          <p className="text-[10px] font-mono text-cyan-300 font-bold truncate tracking-wide" title={item.name}>
                            {item.name}
                          </p>
                        </div>

                        {/* File Action Controls footer */}
                        <div className="p-3 bg-white/[0.015] border-t border-white/5 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono text-slate-400 truncate pr-1">
                            {format === 'image/png' ? 'PNG Image' : 'JPEG Image'}
                          </span>
                          <a
                            href={item.dataUrl}
                            download={item.name}
                            className="h-7 w-7 flex items-center justify-center bg-[#121A2F] border border-white/5 rounded-lg text-cyan-400 hover:text-white hover:bg-cyan-500 transition shadow cursor-pointer"
                            title="Download Image"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Trigger Button Panel */}
            {results.length === 0 && (
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleExportImages}
                  disabled={isProcessing || !isCdnReady}
                  className="w-full sm:w-auto overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 p-[1.5px] font-sans text-sm font-bold tracking-wide text-white transition hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 disabled:scale-100 disabled:opacity-45 cursor-pointer"
                >
                  <span className="w-full h-full flex items-center justify-center gap-2 bg-[#0C1123]/95 hover:bg-transparent px-8 py-3.5 rounded-[15px] transition duration-200">
                    {isProcessing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
                        Rendering canvas views...
                      </>
                    ) : (
                      <>
                        <SlidersHorizontal className="h-4 w-4 text-cyan-400" />
                        Execute Page-to-Image Convert
                      </>
                    )}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
