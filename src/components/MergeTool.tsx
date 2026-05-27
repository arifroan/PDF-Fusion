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
    // Requires at least 2 PDFs to merge
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
    <section id="merge-tool-section" className="py-12 relative scroll-mt-20">
      <div className="mx-auto max-w-5xl rounded-3xl border border-white/5 bg-[#121A2F]/60 p-6 sm:p-8 backdrop-blur-2xl shadow-xl">
        
        {/* Module Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/5 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-sans">Merge PDF Streams</h3>
              <p className="text-xs text-[#94A3B8]">
                Stitch pages in linear order safely. Complete isolation.
              </p>
            </div>
          </div>
          
          {files.length > 0 && (
            <button
              onClick={handleReset}
              disabled={isProcessing}
              className="px-3 py-1.5 self-start sm:self-center text-xs border border-white/10 hover:border-white/20 rounded-lg text-slate-300 transition-all cursor-pointer disabled:opacity-50"
            >
              Reset Stream
            </button>
          )}
        </div>

        {/* Dynamic Warning Alerts container */}
        <AnimatePresence>
          {alert.type && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`mb-6 p-4 rounded-xl flex items-start gap-3 border ${
                alert.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
              }`}
            >
              {alert.type === 'success' ? (
                <CheckCircle className="h-5 w-5 shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 shrink-0" />
              )}
              <div className="text-sm">
                <span className="font-semibold">{alert.type === 'success' ? 'Task Completed: ' : 'Attention Required: '}</span>
                {alert.message}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Drag area */}
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleSelectClick}
          className={`relative cursor-pointer group flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all duration-300 ${
            isDragging
              ? 'border-cyan-400 bg-cyan-950/10 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
              : 'border-white/10 bg-white/[0.01] hover:border-purple-500/30 hover:bg-white/[0.03]'
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

          <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl -z-10" />

          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 border border-white/5 text-[#94A3B8] transition-colors group-hover:text-purple-400 group-hover:border-purple-500/30">
            <Upload className="h-6 w-6 group-hover:scale-110 transition-transform" />
          </div>

          <h4 className="mt-4 text-base font-bold text-white">
            Drag & drop PDF files to compile stream
          </h4>
          <p className="mt-2 text-xs text-[#94A3B8]">
            Or <span className="text-cyan-400 group-hover:underline">browse your folders</span> to select files (Supports multiple select)
          </p>
          <span className="mt-3 text-[10px] uppercase font-mono tracking-wider text-slate-500 bg-white/5 py-1 px-2.5 rounded">
            Maximum Limit: Unlimited
          </span>
        </div>

        {/* Main List display */}
        {files.length > 0 && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono tracking-wider text-[#94A3B8] uppercase">
                Sequence Order ({files.length} active documents)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Order top to bottom is output order
              </span>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {files.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between border rounded-xl p-3.5 bg-white/[0.01] transition-colors ${
                    item.status === 'error'
                      ? 'border-rose-500/20 bg-rose-950/5'
                      : item.status === 'processing'
                      ? 'border-yellow-500/20'
                      : 'border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-950/40 border border-purple-500/10 text-purple-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate text-ellipsis">
                          {item.name}
                        </p>
                        {item.status === 'success' && item.pageCount !== undefined && (
                          <span className="shrink-0 text-[10px] font-mono font-medium text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/10">
                            {item.pageCount} {item.pageCount === 1 ? 'page' : 'pages'}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1 text-xs text-[#94A3B8]">
                        <span>{formatBytes(item.size)}</span>
                        <span>•</span>
                        {item.status === 'success' ? (
                          <span className="text-emerald-400 flex items-center gap-1 text-[10px] font-mono">
                            <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" /> Analyzed
                          </span>
                        ) : item.status === 'error' ? (
                          <span className="text-rose-400 text-[10px] font-mono">
                            {item.errorMessage || 'Invalid load'}
                          </span>
                        ) : (
                          <span className="text-yellow-400 flex items-center gap-1 text-[10px] font-mono animate-pulse">
                            <RefreshCw className="h-2 w-2 spin animate-spin" /> Verifying bytes
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Move & Actions controls */}
                  <div className="flex items-center gap-1.5 ml-3">
                    {/* Move Up */}
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/5 active:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition"
                      title="Move Up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    
                    {/* Move Down */}
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === files.length - 1}
                      className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/5 active:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition"
                      title="Move Down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>

                    <div className="h-5 w-[1px] bg-white/5 mx-1" />

                    {/* Delete item */}
                    <button
                      onClick={() => handleDeleteFile(item.id)}
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 active:bg-rose-500/20 transition cursor-pointer"
                      title="Delete from Stream"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Execute trigger bar */}
            <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-[#94A3B8]/80 text-center sm:text-left">
                Ensure at least 2 files status are <span className="text-cyan-400 font-semibold">'Analyzed'</span> to enable structural merge.
              </span>

              <button
                onClick={handleMergePdfStream}
                disabled={files.filter(f => f.status === 'success').length < 2 || isProcessing}
                className="w-full sm:w-auto px-6 py-3 cursor-pointer rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-semibold text-white tracking-wide transition-all select-none hover:shadow-[0_0_15px_rgba(124,58,237,0.4)] hover:brightness-110 active:scale-95 disabled:scale-100 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-purple-200" />
                    Aligning Bytes...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-cyan-300" />
                    Merge Document Stream
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
