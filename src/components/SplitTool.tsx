import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, FileText, CheckCircle, AlertTriangle, Trash2, 
  Sparkles, RefreshCw, Scissors, Layers, SlidersHorizontal, ArrowDown, Download, HelpCircle
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

type SplitMode = 'every' | 'range' | 'custom';

interface SplitResultFile {
  name: string;
  pagesDescription: string;
  blobUrl: string;
}

export default function SplitTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [splitMode, setSplitMode] = useState<SplitMode>('range');
  const [rangeInput, setRangeInput] = useState<string>('1-2');
  const [customInput, setCustomInput] = useState<string>('1, 3');
  const [isProcessing, setIsProcessing] = useState(false);
  const [splitResults, setSplitResults] = useState<SplitResultFile[]>([]);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  // Formatting utility
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
        await loadPdfInfo(selected);
      } else {
        setAlert({ type: 'error', message: 'Please select a valid PDF document.' });
      }
    }
  };

  const loadPdfInfo = async (pdfFile: File) => {
    try {
      setIsProcessing(true);
      setAlert({ type: null, message: '' });
      setSplitResults([]);

      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const totalPages = pdfDoc.getPageCount();

      setPageCount(totalPages);
      setFile(pdfFile);

      // Set sensible defaults based on page range
      if (totalPages > 1) {
        setRangeInput(`1-${Math.min(totalPages, 2)}`);
        setCustomInput(`1, ${totalPages}`);
      } else {
        setRangeInput('1-1');
        setCustomInput('1');
      }
    } catch (err: any) {
      console.error(err);
      setAlert({ type: 'error', message: 'Could not load PDF metadata. File may be encrypted or corrupted.' });
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
        await loadPdfInfo(dropped);
      } else {
        setAlert({ type: 'error', message: 'Only standard PDF documents can be loaded.' });
      }
    }
  };

  const handleClear = () => {
    setFile(null);
    setPageCount(0);
    setSplitResults([]);
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

  const handleSplitPdf = async () => {
    if (!file || pageCount === 0) return;

    setIsProcessing(true);
    setAlert({ type: null, message: '' });
    setSplitResults([]);

    try {
      window.dispatchEvent(new CustomEvent('pdf-progress', {
        detail: { active: true, progress: 10, status: 'Initializing Split Sequence Engine...', type: 'convert' }
      }));

      const fileBuffer = await file.arrayBuffer();
      const originalDoc = await PDFDocument.load(fileBuffer);
      const outputFiles: SplitResultFile[] = [];

      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      if (splitMode === 'every') {
        // Individual page splitter
        window.dispatchEvent(new CustomEvent('pdf-progress', {
          detail: { active: true, progress: 30, status: `Slicing document into ${pageCount} target nodes...`, type: 'convert' }
        }));

        for (let i = 0; i < pageCount; i++) {
          const percent = Math.round(30 + ((i / pageCount) * 60));
          window.dispatchEvent(new CustomEvent('pdf-progress', {
            detail: { active: true, progress: percent, status: `Extracting segment element Page ${i + 1}...`, type: 'convert' }
          }));

          const subDoc = await PDFDocument.create();
          const [copiedPage] = await subDoc.copyPages(originalDoc, [i]);
          subDoc.addPage(copiedPage);

          const bytes = await subDoc.save();
          const blob = new Blob([bytes], { type: 'application/pdf' });
          const blobUrl = URL.createObjectURL(blob);

          outputFiles.push({
            name: `${file.name.replace('.pdf', '')}_p${i + 1}.pdf`,
            pagesDescription: `Page ${i + 1}`,
            blobUrl
          });

          await sleep(50); // Avoid micro-stuttering on slow mobile devices
        }

      } else if (splitMode === 'range') {
        const parts = rangeInput.split('-');
        const startPage = parseInt(parts[0], 10);
        const endPage = parseInt(parts[1], 10);

        if (isNaN(startPage) || isNaN(endPage) || startPage < 1 || endPage > pageCount || startPage > endPage) {
          throw new Error(`Invalid range parameters. Please use values between 1 and ${pageCount}.`);
        }

        window.dispatchEvent(new CustomEvent('pdf-progress', {
          detail: { active: true, progress: 50, status: `Copying range mapping ${startPage} - ${endPage}...`, type: 'convert' }
        }));

        const subDoc = await PDFDocument.create();
        const indices = Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index - 1);
        const copiedPages = await subDoc.copyPages(originalDoc, indices);
        copiedPages.forEach(p => subDoc.addPage(p));

        const bytes = await subDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);

        outputFiles.push({
          name: `${file.name.replace('.pdf', '')}_range_${startPage}-${endPage}.pdf`,
          pagesDescription: `Pages ${startPage} to ${endPage}`,
          blobUrl
        });

      } else {
        // Custom parsed subsets
        const pagesToExtract = parsePageNumbers(customInput, pageCount);
        if (pagesToExtract.length === 0) {
          throw new Error('No valid page integers extracted from input formatting.');
        }

        window.dispatchEvent(new CustomEvent('pdf-progress', {
          detail: { active: true, progress: 50, status: `Harvesting subsets, total pages: ${pagesToExtract.length}...`, type: 'convert' }
        }));

        // Option 1: Combine extracted pages into single document (preferred user experience)
        const subDoc = await PDFDocument.create();
        const indices = pagesToExtract.map(p => p - 1);
        const copiedPages = await subDoc.copyPages(originalDoc, indices);
        copiedPages.forEach(p => subDoc.addPage(p));

        const bytes = await subDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);

        outputFiles.push({
          name: `${file.name.replace('.pdf', '')}_extracted_pages.pdf`,
          pagesDescription: `Pages: ${pagesToExtract.join(', ')}`,
          blobUrl
        });
      }

      window.dispatchEvent(new CustomEvent('pdf-progress', {
        detail: { active: true, progress: 100, status: 'Completed splits successfully.', type: 'convert' }
      }));

      setSplitResults(outputFiles);
      setAlert({
        type: 'success',
        message: `Task Complete! Document processed into ${outputFiles.length} optimized segments.`,
      });

    } catch (err: any) {
      console.error(err);
      setAlert({
        type: 'error',
        message: err.message || 'Parsing failure during splitting algorithm.'
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
    splitResults.forEach((res, i) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = res.blobUrl;
        link.download = res.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, i * 250); // Dynamic stagger to prevent standard browser simultaneous download limits
    });
  };

  return (
    <section id="split-tool-section" className="py-12 relative scroll-mt-24">
      <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-[#0D111C] p-6 sm:p-8 relative overflow-hidden gpu-accel">
        {/* Shimmer purple-indigo boundary accent */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#7C3AED]/40 to-transparent" />

        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7C3AED]/10 text-purple-400 border border-[#7C3AED]/20 shadow-md">
              <Scissors className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white font-sans tracking-tight">Split PDF Structure</h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Deconstruct or harvest discrete page mappings from your document client-side with full confidentiality.
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

        {/* Dynamic Alerts Container */}
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

        {/* Configuration Pane - Only interactive if file loaded */}
        <div className={`mb-8 rounded-2xl border transition-all ${
          file ? 'border-white/10 bg-white/[0.015] p-5' : 'border-white/5 bg-[#121A2F]/20 opacity-40 p-5 pointer-events-none'
        } relative overflow-hidden`}>
          <div className="absolute top-0 left-0 w-24 h-[1px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
          
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-400 uppercase tracking-wider mb-4">
            <SlidersHorizontal className="h-4 w-4" />
            <span>Target Extraction Protocol</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Split each page */}
            <button
              type="button"
              onClick={() => { setSplitMode('every'); setSplitResults([]); }}
              className={`flex flex-col text-left p-4 rounded-2xl select-none transition border cursor-pointer ${
                splitMode === 'every'
                  ? 'bg-[#7C3AED]/10 border-[#7C3AED]/40 text-[#C084FC] shadow-md'
                  : 'bg-[#121A2F]/40 border-white/5 text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-sm font-bold">Split Every Page</span>
              <span className="text-[10px] uppercase font-mono tracking-wide text-purple-400 mt-1">Slices page-by-page</span>
              <span className="text-xs text-slate-400 mt-2 font-light">
                Generates {pageCount > 0 ? pageCount : 'N'} unique single-page files.
              </span>
            </button>

            {/* Custom Range */}
            <button
              type="button"
              onClick={() => { setSplitMode('range'); setSplitResults([]); }}
              className={`flex flex-col text-left p-4 rounded-2xl select-none transition border cursor-pointer ${
                splitMode === 'range'
                  ? 'bg-[#7C3AED]/10 border-[#7C3AED]/40 text-[#C084FC] shadow-md'
                  : 'bg-[#121A2F]/40 border-white/5 text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-sm font-bold">Page Span Range</span>
              <span className="text-[10px] uppercase font-mono tracking-wide text-purple-400 mt-1">Bound bounds selection</span>
              <span className="text-xs text-slate-400 mt-2 font-light">
                Extracts exactly which window (e.g. 1-3) into a consolidated structure.
              </span>
            </button>

            {/* Custom Page Indices */}
            <button
              type="button"
              onClick={() => { setSplitMode('custom'); setSplitResults([]); }}
              className={`flex flex-col text-left p-4 rounded-2xl select-none transition border cursor-pointer ${
                splitMode === 'custom'
                  ? 'bg-[#7C3AED]/10 border-[#7C3AED]/40 text-[#C084FC] shadow-md'
                  : 'bg-[#121A2F]/40 border-white/5 text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-sm font-bold">Segment Harvest</span>
              <span className="text-[10px] uppercase font-mono tracking-wide text-purple-400 mt-1">Discrete mapping subsets</span>
              <span className="text-xs text-slate-400 mt-2 font-light">
                Select custom indexes spaced out individually (e.g. 1, 3, 5).
              </span>
            </button>
          </div>

          {/* Configuration Inputs */}
          {file && splitMode !== 'every' && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 pt-4.5 border-t border-white/5"
            >
              {splitMode === 'range' ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase font-semibold">
                      Range Indices (Max {pageCount} pages available)
                    </label>
                    <input
                      type="text"
                      value={rangeInput}
                      onChange={(e) => { setRangeInput(e.target.value); setSplitResults([]); }}
                      placeholder="e.g. 1-5"
                      className="w-full bg-[#090F1E] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                  <div className="shrink-0 flex items-center gap-2 text-xs text-slate-400 sm:mt-6 bg-[#090F1E] p-2.5 rounded-xl border border-white/5">
                    <HelpCircle className="h-4 w-4 text-purple-400" />
                    <span>Inputs are 1-indexed. For page 1 and 2, write "1-2".</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase font-semibold">
                      Discrete Pages (Max {pageCount} pages, separated by comma)
                    </label>
                    <input
                      type="text"
                      value={customInput}
                      onChange={(e) => { setCustomInput(e.target.value); setSplitResults([]); }}
                      placeholder="e.g. 1, 3, 5-8"
                      className="w-full bg-[#090F1E] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                  <div className="shrink-0 flex items-center gap-2 text-xs text-slate-400 sm:mt-6 bg-[#090F1E] p-2.5 rounded-xl border border-white/10">
                    <HelpCircle className="h-4 w-4 text-purple-400" />
                    <span>e.g. "1, 3, 5" combines pages 1, 3 and 5 into a single output PDF.</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Upload File Select Dropzone area */}
        {!file ? (
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleSelectClick}
            className={`cursor-pointer group flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-10 md:p-14 text-center transition-all duration-300 ${
              isDragging
                ? 'border-purple-400 bg-purple-950/20 shadow-[0_0_30px_rgba(124,58,237,0.25)]'
                : 'border-white/10 bg-white/[0.01] hover:border-purple-500/40 hover:bg-white/[0.03]'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,application/pdf"
              className="hidden"
            />

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black/40 border border-white/10 text-slate-400 transition-all group-hover:text-purple-400 group-hover:border-purple-500/40 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(124,58,237,0.15)]">
              <Upload className="h-6 w-6" />
            </div>

            <h4 className="mt-5 text-lg font-bold text-white tracking-tight group-hover:text-purple-300 transition-colors">
              Drag & drop standard PDF document to split pages
            </h4>
            <p className="mt-2 text-sm text-slate-400">
              Or <span className="text-purple-400 font-semibold group-hover:underline">browse files</span> instantly
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-purple-300 bg-purple-950/40 border border-[#7C3AED]/20 py-1 px-3 rounded-md">
                100% In-Browser Secure
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 bg-slate-950/40 border border-white/15 py-1 px-3 rounded-md">
                Zero Cloud Streaming
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs font-mono tracking-wider text-slate-400 uppercase">
                Active Source Document
              </span>
            </div>

            <div className="flex items-center justify-between border border-white/10 rounded-2xl p-5 bg-white/[0.01]">
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-950/50 border border-purple-500/20 text-purple-400 shadow-inner">
                  <FileText className="h-5.5 w-5.5" />
                </div>
                
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate max-w-[240px] sm:max-w-md">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    {formatBytes(file.size)} &bull; <span className="text-purple-300">{pageCount} Pages</span>
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

            {/* Split Process triggers grid list */}
            <AnimatePresence mode="wait">
              {splitResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4 pt-2"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                    <span className="text-xs font-mono tracking-wider text-slate-400 uppercase">
                      Split Segments Completed ({splitResults.length})
                    </span>

                    {splitResults.length > 1 && (
                      <button
                        onClick={handleDownloadAll}
                        className="text-xs font-bold text-purple-400 hover:text-purple-300 font-mono tracking-wide underline decoration-purple-500/40 underline-offset-4 cursor-pointer"
                      >
                        Download All (Staggered) &darr;
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                    {splitResults.map((res, i) => (
                      <div 
                        key={i}
                        className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-[#090F1E] hover:border-purple-500/20 transition-all"
                      >
                        <div className="min-w-0 pr-3">
                          <p className="text-xs font-bold text-white truncate" title={res.name}>
                            {res.name}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {res.pagesDescription}
                          </p>
                        </div>

                        <a
                          href={res.blobUrl}
                          download={res.name}
                          className="h-8.5 px-3 shrink-0 flex items-center gap-1.5 bg-[#121A2F]/80 hover:bg-[#1A233A] border border-white/5 hover:border-[#7C3AED]/40 rounded-lg text-xs font-mono font-medium text-purple-300 hover:text-white transition cursor-pointer"
                        >
                          <Download className="h-3.5 w-3.5" />
                          GET
                        </a>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Trigger Executor Panel */}
            {splitResults.length === 0 && (
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSplitPdf}
                  disabled={isProcessing}
                  className="w-full sm:w-auto overflow-hidden rounded-2xl bg-gradient-to-r from-[#7C3AED] to-indigo-500 p-[1.5px] font-sans text-sm font-bold tracking-wide text-white transition hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(124,58,237,0.3)] active:scale-95 disabled:scale-100 disabled:opacity-40 select-none"
                >
                  <span className="w-full h-full flex items-center justify-center gap-2 bg-[#0C1123]/95 hover:bg-transparent px-8 py-3.5 rounded-[15px] transition duration-200">
                    {isProcessing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-purple-300" />
                        Extracting mapping layers...
                      </>
                    ) : (
                      <>
                        <Layers className="h-4 w-4 text-purple-300" />
                        Execute Structural Split
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
