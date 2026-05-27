import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, FileText, CheckCircle, AlertTriangle, Trash2, 
  ArrowUp, ArrowDown, Sparkles, RefreshCw, Layers 
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { PDFFileItem } from '../types';

export default function MergeTool() {
  const [files, setFiles] = useState<PDFFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  // Helper: Format byte size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Trigger file dialog
  const handleSelectClick = () => {
    fileInputRef.current?.click();
  };

  // Inspect pages and validate standard PDF format
  const processSelectedFiles = async (selectedList: FileList | File[]) => {
    const itemsArray: PDFFileItem[] = [];
    
    for (let i = 0; i < selectedList.length; i++) {
      const file = selectedList[i];
      if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
        continue; // skip non-pdf
      }

      const itemId = Math.random().toString(36).substring(2, 9);
      const newItem: PDFFileItem = {
        id: itemId,
        file: file,
        name: file.name,
        size: file.size,
        status: 'pending',
      };

      itemsArray.push(newItem);
    }

    if (itemsArray.length === 0) return;

    // Append to list first
    setFiles((prev) => [...prev, ...itemsArray]);

    // Inspect metadata (like page count) in background using pdf-lib
    for (const item of itemsArray) {
      try {
        const fileBuffer = await item.file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(fileBuffer, { 
          ignoreEncryption: true 
        });
        const count = pdfDoc.getPageCount();

        setFiles((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, pageCount: count, status: 'success' } : f))
        );
      } catch (err: any) {
        console.error('Error reading PDF metadata:', err);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  status: 'error',
                  errorMessage: 'Protected or invalid file.',
                }
              : f
          )
        );
      }
    }
  };

  // Handle standard manual pick
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processSelectedFiles(e.target.files);
    }
  };

  // Handle Drag & Drop Events
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

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFiles(e.dataTransfer.files);
    }
  };

  // Delete an item from the merge stream
  const handleDeleteFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Move manual ordering: UP
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setFiles((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy;
    });
  };

  // Move manual ordering: DOWN
  const handleMoveDown = (index: number) => {
    setFiles((prev) => {
      if (index >= prev.length - 1) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return copy;
    });
  };

  // Clear everything
  const handleReset = () => {
    setFiles([]);
    setAlert({ type: null, message: '' });
  };

  // CORE: Merging files client side
  const handleMergePdfStream = async () => {
    const activeFiles = files.filter(f => f.status === 'success');
    if (activeFiles.length < 2) {
      setAlert({
        type: 'error',
        message: 'Please provide at least 2 valid PDFs to combine.',
      });
      return;
    }

    setIsProcessing(true);
    setAlert({ type: null, message: '' });

    try {
      // 1. Create a new PDF document object
      const mergedPdf = await PDFDocument.create();

      // 2. Loop through selected PDFs sequentially in current user-sorted order
      for (const item of activeFiles) {
        const fileBytes = await item.file.arrayBuffer();
        const srcDoc = await PDFDocument.load(fileBytes);
        
        // Copy all pages
        const pageIndices = Array.from({ length: srcDoc.getPageCount() }, (_, i) => i);
        const copiedPages = await mergedPdf.copyPages(srcDoc, pageIndices);
        
        // Insert inside merged PDF
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      // 3. Save into a local array representation
      const mergedPdfBytes = await mergedPdf.save();

      // 4. Generate local blob and trigger standard download
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `pdfusion-merged-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setAlert({
        type: 'success',
        message: 'PDF stream integrated successfully! Download dispatched.',
      });
    } catch (err: any) {
      console.error('Core PDF merging failure:', err);
      setAlert({
        type: 'error',
        message: `Merge operation failed: ${err.message || 'Verification failure'}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section id="merge-tool-section" className="py-12 relative scroll-mt-24">
      {/* Dynamic Ambient Background Spark behind the sandbox */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-[#121A2F]/75 p-6 sm:p-8 backdrop-blur-3xl shadow-[0_25px_60px_rgba(0,0,0,0.6)] relative overflow-hidden">
        {/* Shimmer boundary accent */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

        {/* Module Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white font-sans tracking-tight">Merge PDF Streams</h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Stitch multiple documents sequentially. Executed 100% inside client-side RAM.
              </p>
            </div>
          </div>
          
          {files.length > 0 && (
            <button
              onClick={handleReset}
              disabled={isProcessing}
              className="px-4 py-2 self-start sm:self-center text-xs border border-[#F43F5E]/30 text-rose-300 hover:bg-[#F43F5E]/10 rounded-xl transition-all cursor-pointer disabled:opacity-50 font-semibold"
            >
              Reset Stream
            </button>
          )}
        </div>

        {/* Dynamic Warning Alerts container with physical enter/exit */}
        <AnimatePresence mode="popLayout">
          {alert.type && (
            <motion.div
              initial={{ opacity: 0, y: -15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
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

        {/* Upload Drag area with vertical scanlines */}
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleSelectClick}
          className={`relative cursor-pointer group flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-8 md:p-14 text-center transition-all duration-300 ${
            isDragging
              ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_30px_rgba(6,182,212,0.25)]'
              : 'border-white/10 bg-white/[0.01] hover:border-purple-500/40 hover:bg-white/[0.03]'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,application/pdf"
            multiple
            className="hidden"
          />

          {/* Cyber scanner overlay lines during active drag-and-drop ops */}
          {isDragging && (
            <div className="absolute inset-0 pointer-events-none rounded-[22px] overflow-hidden">
              <motion.div 
                animate={{ y: ['0%', '100%', '0%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                className="w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_#06B6D4]"
              />
            </div>
          )}

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black/40 border border-white/10 text-[#94A3B8] transition-all group-hover:text-purple-400 group-hover:border-purple-500/40 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(124,58,237,0.15)]">
            <Upload className="h-7 w-7" />
          </div>

          <h4 className="mt-5 text-lg font-bold text-white tracking-tight group-hover:text-cyan-300 transition-colors">
            Drag & drop PDF files to compile stream
          </h4>
          <p className="mt-2 text-sm text-[#94A3B8]">
            Or <span className="text-cyan-400 font-semibold group-hover:underline">browse files</span> instantly (Supports files of any layout scale)
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-purple-300 bg-purple-950/40 border border-purple-500/20 py-1 px-3 rounded-md">
              100% Client Isolation
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-300 bg-cyan-950/40 border border-cyan-500/20 py-1 px-3 rounded-md">
              Unlimited size
            </span>
          </div>
        </div>

        {/* Main List display with stagger-animations */}
        {files.length > 0 && (
          <div className="mt-10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs font-mono tracking-wider text-[#94A3B8] uppercase">
                Sequence Order ({files.length} active items)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Linear stitching: top-most aligns as page 1
              </span>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence initial={false}>
                {files.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.98, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`flex items-center justify-between border rounded-2xl p-4 bg-white/[0.01] transition-all ${
                      item.status === 'error'
                        ? 'border-rose-500/20 bg-rose-950/10'
                        : item.status === 'processing'
                        ? 'border-yellow-500/20 bg-yellow-950/5'
                        : 'border-white/5 hover:border-white/15 hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-950/50 border border-purple-500/20 text-purple-400 shadow-inner">
                        <FileText className="h-5 w-5" />
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-md">
                            {item.name}
                          </p>
                          {item.status === 'success' && item.pageCount !== undefined && (
                            <span className="shrink-0 text-[10px] font-mono font-black text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                              {item.pageCount} {item.pageCount === 1 ? 'PAGE' : 'PAGES'}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-[#94A3B8]">
                          <span>{formatBytes(item.size)}</span>
                          <span>•</span>
                          {item.status === 'success' ? (
                            <span className="text-emerald-400 flex items-center gap-1 text-[10px] font-mono font-bold">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Analyzed
                            </span>
                          ) : item.status === 'error' ? (
                            <span className="text-rose-400 text-[10px] font-mono font-semibold">
                              {item.errorMessage || 'Invalid load'}
                            </span>
                          ) : (
                            <span className="text-yellow-400 flex items-center gap-1.5 text-[10px] font-mono animate-pulse">
                              <RefreshCw className="h-3 w-3 animate-spin" /> Sandboxing memory...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Move & Actions controls */}
                    <div className="flex items-center gap-1 ml-3 bg-black/40 p-1 rounded-xl border border-white/5 shrink-0">
                      {/* Move Up */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMoveUp(index); }}
                        disabled={index === 0}
                        className="p-2 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/5 active:bg-white/10 disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      
                      {/* Move Down */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMoveDown(index); }}
                        disabled={index === files.length - 1}
                        className="p-2 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/5 active:bg-white/10 disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>

                      <div className="h-5 w-[1px] bg-white/10 mx-1" />

                      {/* Delete item */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteFile(item.id); }}
                        className="p-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 active:bg-rose-500/20 transition cursor-pointer"
                        title="Delete from Stream"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Execute trigger bar */}
            <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-5">
              <span className="text-xs text-[#94A3B8]/80 text-center sm:text-left leading-relaxed">
                Ensure at least 2 file structures are parsed in the stream above to trigger merging.
              </span>

              <button
                onClick={handleMergePdfStream}
                disabled={files.filter(f => f.status === 'success').length < 2 || isProcessing}
                className="w-full sm:w-auto overflow-hidden rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-500 p-[1.5px] font-sans text-sm font-bold tracking-wide text-white transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] active:scale-95 disabled:scale-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex justify-center items-center"
              >
                <span className="w-full h-full flex items-center justify-center gap-2 bg-[#0C1123]/95 hover:bg-transparent px-8 py-3.5 rounded-[15px] transition-colors duration-200">
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-cyan-300" />
                      Aligning Bytes...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-cyan-300 animate-pulse" />
                      Merge PDF Streams
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
