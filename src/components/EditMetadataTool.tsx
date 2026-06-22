import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, FileText, CheckCircle, AlertTriangle, Trash2, 
  Sparkles, RefreshCw, Download, ArrowDown, Tag
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { PDFFileItem } from '../types';

export default function EditMetadataTool() {
  const [fileItem, setFileItem] = useState<PDFFileItem | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  const [metadata, setMetadata] = useState({
    title: '',
    author: '',
    subject: '',
    keywords: '',
    creator: '',
    producer: ''
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: null, message: '' }), 4000);
  };

  const extractInitialMetadata = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      setMetadata({
        title: pdfDoc.getTitle() || '',
        author: pdfDoc.getAuthor() || '',
        subject: pdfDoc.getSubject() || '',
        keywords: pdfDoc.getKeywords() || '',
        creator: pdfDoc.getCreator() || '',
        producer: pdfDoc.getProducer() || ''
      });
    } catch (e) {
      console.warn('Could not extract metadata from PDF', e);
    }
  };

  const handleFilesAdded = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    // Take just the first file
    const file = files[0];
    if (file.type !== 'application/pdf') {
       showAlert('error', 'Only PDF files are supported.');
       return;
    }

    const newItem: PDFFileItem = {
      id: crypto.randomUUID(),
      file: file,
      name: file.name,
      size: file.size,
      status: 'pending'
    };

    setFileItem(newItem);
    setProcessedUrl(null);
    await extractInitialMetadata(file);
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFileItem(null);
    setProcessedUrl(null);
  };

  const handleApplyMetadata = async () => {
    if (!fileItem) return;
    
    setIsProcessing(true);
    setProcessedUrl(null);
    
    try {
      const arrayBuffer = await fileItem.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      if (metadata.title) pdfDoc.setTitle(metadata.title);
      if (metadata.author) pdfDoc.setAuthor(metadata.author);
      if (metadata.subject) pdfDoc.setSubject(metadata.subject);
      if (metadata.keywords) pdfDoc.setKeywords(metadata.keywords);
      if (metadata.creator) pdfDoc.setCreator(metadata.creator);
      if (metadata.producer) pdfDoc.setProducer(metadata.producer);

      const modifiedPdfBytes = await pdfDoc.save();
      const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setProcessedUrl(url);
      setFileItem(prev => prev ? { ...prev, status: 'success' } : null);
      showAlert('success', 'Metadata updated successfully!');
    } catch (error) {
      console.error(error);
      showAlert('error', 'Failed to update metadata. File might be protected or corrupted.');
      setFileItem(prev => prev ? { ...prev, status: 'error', errorMessage: 'Process failed' } : null);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Drag and Drop Handlers ---
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  }, []);

  return (
    <section id="metadata-tool-section" className="scroll-mt-32">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        className="mx-auto max-w-4xl"
      >
        <div className="mb-8 flex items-end justify-between">
          <div>
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-slate-500/10 px-3 py-1 font-mono text-[10px] font-bold tracking-wider text-slate-400 border border-slate-500/20">
              <Tag className="h-3.5 w-3.5 animate-pulse text-slate-300" /> FILE PROPERTIES
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white font-sans sm:text-3xl">
              Edit Metadata
            </h2>
          </div>
        </div>

        {/* Global Notification */}
        <AnimatePresence>
          {alert.type && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mb-6 p-4 rounded-xl flex items-center gap-3 border shadow-lg ${
                alert.type === 'error' 
                  ? 'bg-rose-950/40 border-rose-500/20 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.1)]' 
                  : 'bg-emerald-950/40 border-emerald-500/20 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
              }`}
            >
              {alert.type === 'error' ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
              <span className="text-sm font-semibold">{alert.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Action Area (Left/Top) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {!fileItem ? (
              <div 
                className={`cursor-pointer group flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-10 md:p-14 text-center transition-all duration-300 ${
                  isDragging 
                    ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_30px_rgba(6,182,212,0.1)] scale-[1.01]' 
                    : 'border-white/10 bg-[#090F1E] hover:border-white/30 hover:bg-[#121A2F]'
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  multiple={false}
                  accept=".pdf"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => handleFilesAdded(e.target.files)}
                />
                
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black/40 border border-white/10 text-slate-400 transition-all group-hover:text-slate-200 group-hover:border-slate-500/40 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(148,163,184,0.15)]">
                  <Upload className="h-7 w-7" />
                </div>
                
                <div className="mt-6 flex flex-col gap-2">
                  <span className="text-base font-bold text-white tracking-wide">
                    {isDragging ? 'Drop sequence here...' : 'Upload PDF Document'}
                  </span>
                  <span className="text-xs text-[#94A3B8] max-w-[250px] mx-auto leading-relaxed">
                    Select a single PDF file to inject or modify properties.
                  </span>
                </div>
                
                <div className="mt-8 flex gap-3">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-300 bg-slate-950/40 border border-slate-500/20 py-1 px-3 rounded-md">
                    Target Format .PDF
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col border border-white/10 rounded-3xl bg-[#090F1E] p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/5">
                  <div className="flex items-center gap-4 truncate">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-950/50 border border-slate-500/20 text-slate-400 shadow-inner">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="text-base font-bold text-white truncate" title={fileItem.name}>{fileItem.name}</span>
                      <span className="text-xs font-mono text-slate-500 mt-1">
                        {(fileItem.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={removeFile}
                    className="h-10 w-10 shrink-0 flex items-center justify-center bg-rose-950/40 hover:bg-rose-950 border border-rose-500/25 rounded-xl text-rose-300 transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none hover:border-rose-500"
                    title="Remove file"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Metadata Editor Form */}
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1.5">Title</label>
                      <input 
                        type="text"
                        value={metadata.title}
                        onChange={e => setMetadata({...metadata, title: e.target.value})}
                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-slate-500 transition placeholder:text-white/20"
                        placeholder="Document Title"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1.5">Author</label>
                      <input 
                        type="text"
                        value={metadata.author}
                        onChange={e => setMetadata({...metadata, author: e.target.value})}
                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-slate-500 transition placeholder:text-white/20"
                        placeholder="Author Name"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1.5">Subject</label>
                      <input 
                        type="text"
                        value={metadata.subject}
                        onChange={e => setMetadata({...metadata, subject: e.target.value})}
                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-slate-500 transition placeholder:text-white/20"
                        placeholder="Main Subject"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1.5">Keywords</label>
                      <input 
                        type="text"
                        value={metadata.keywords}
                        onChange={e => setMetadata({...metadata, keywords: e.target.value})}
                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-slate-500 transition placeholder:text-white/20"
                        placeholder="Comma separated"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1.5">Creator</label>
                      <input 
                        type="text"
                        value={metadata.creator}
                        onChange={e => setMetadata({...metadata, creator: e.target.value})}
                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-slate-500 transition placeholder:text-white/20"
                        placeholder="PDF Creator tool"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1.5">Producer</label>
                      <input 
                        type="text"
                        value={metadata.producer}
                        onChange={e => setMetadata({...metadata, producer: e.target.value})}
                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-slate-500 transition placeholder:text-white/20"
                        placeholder="PDF Producer"
                      />
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="border border-white/10 rounded-3xl bg-[#090F1E] p-6 lg:p-8 flex flex-col h-full sticky top-32">
              <div className="mb-6 pb-6 border-b border-white/5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-slate-400" /> Run Process
                </h3>
                <p className="mt-2 text-xs text-[#94A3B8] leading-relaxed">
                  Modify the target PDF's internal attributes metadata block. Changes are baked locally.
                </p>
              </div>

              {processedUrl && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-center"
                >
                  <CheckCircle className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-emerald-300">File Ready</p>
                </motion.div>
              )}

              <div className="mt-auto pt-6 flex flex-col gap-3">
                {!processedUrl ? (
                  <button
                    onClick={handleApplyMetadata}
                    disabled={!fileItem || isProcessing}
                    className="group relative w-full h-14 overflow-hidden rounded-2xl bg-gradient-to-r from-slate-500 to-slate-400 p-[1px] font-sans text-sm font-bold tracking-wide text-white transition hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(148,163,184,0.3)] active:scale-95 disabled:scale-100 disabled:opacity-40 cursor-pointer"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-slate-500 to-slate-400 opacity-0 transition-opacity duration-300 group-hover:opacity-20" />
                    <span className="w-full h-full flex items-center justify-center gap-2 bg-[#0C1123]/95 group-hover:bg-transparent px-8 py-3 rounded-[15px] transition duration-200">
                      {isProcessing ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin text-slate-300" /> 
                          <span className="text-slate-200">Processing...</span>
                        </>
                      ) : (
                        <>
                          Update Metadata <ArrowDown className="h-4 w-4 text-slate-300" />
                        </>
                      )}
                    </span>
                  </button>
                ) : (
                  <a
                    href={processedUrl}
                    download={`metadata_${fileItem?.name}`}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 font-sans text-sm font-bold tracking-wide text-black transition-all hover:scale-[1.02] hover:bg-slate-200 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.15)] cursor-pointer"
                  >
                    <Download className="h-4 w-4" /> Download Updated File
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
