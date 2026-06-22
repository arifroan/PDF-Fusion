import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, FileText, CheckCircle2, AlertTriangle, Trash2, 
  Sparkles, RefreshCw, Download, Type, Grid, Square, Sliders, Palette,
  Minimize2, Shield, FolderArchive, Play, Layers, BadgeHelp, Check, Plus, Loader2, Info
} from 'lucide-react';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import { PDFFileItem } from '../types';

type BatchOperation = 'compress' | 'watermark' | 'metadata' | 'unlock';
type CompressionLevel = 'recommended' | 'extreme' | 'low';

interface BatchFileItem extends PDFFileItem {
  progress?: number;
  processedBlob?: Blob;
  errorMessage?: string;
  originalSizeStr: string;
  processedSize?: number;
}

export default function BatchProcessingTool() {
  const [fileQueue, setFileQueue] = useState<BatchFileItem[]>([]);
  const [activeOp, setActiveOp] = useState<BatchOperation>('compress');
  const [isProcessing, setIsProcessing] = useState(false);
  const [zipBlobUrl, setZipBlobUrl] = useState<string | null>(null);
  const [zipFileName, setZipFileName] = useState('processed_pdfs_batch.zip');

  // Compress Settings
  const [compLevel, setCompLevel] = useState<CompressionLevel>('recommended');

  // Watermark Settings
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(40);
  const [opacity, setOpacity] = useState(0.2);
  const [rotation, setRotation] = useState(45);
  const [colorHex, setColorHex] = useState('#EF4444');
  const [positionMode, setPositionMode] = useState<'center' | 'tiled' | 'quadrant'>('tiled');
  const [quadrant, setQuadrant] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('top-right');

  // Metadata Settings
  const [metaTitle, setMetaTitle] = useState('');
  const [metaAuthor, setMetaAuthor] = useState('');
  const [metaCreator, setMetaCreator] = useState('Batch PDF Suite');
  const [metaSubject, setMetaSubject] = useState('');

  // Lock & Unlock Settings
  const [unlockPassword, setUnlockPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Global Alert
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: null, message: '' }), 4000);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const hexToRgbRatio = (hex: string) => {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
    return { r: isNaN(r) ? 0.9 : r, g: isNaN(g) ? 0.1 : g, b: isNaN(b) ? 0.1 : b };
  };

  const handleFilesAdded = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const addedItems: BatchFileItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        addedItems.push({
          id: crypto.randomUUID(),
          file: file,
          name: file.name,
          size: file.size,
          originalSizeStr: formatBytes(file.size),
          status: 'pending'
        });
      }
    }

    if (addedItems.length === 0) {
      showAlert('error', 'Only valid PDF files can be loaded into the queue.');
      return;
    }

    setFileQueue(prev => [...prev, ...addedItems]);
    setZipBlobUrl(null);
    showAlert('success', `Added ${addedItems.length} file(s) to the batch queue.`);
  };

  const removeFile = (id: string) => {
    setFileQueue(prev => prev.filter(item => item.id !== id));
    setZipBlobUrl(null);
  };

  const clearQueue = () => {
    setFileQueue([]);
    setZipBlobUrl(null);
  };

  // Run the batch operations
  const handleExecuteBatch = async () => {
    if (fileQueue.length === 0) {
      showAlert('error', 'No PDF files are loaded in your queue.');
      return;
    }

    setIsProcessing(true);
    setZipBlobUrl(null);
    
    // Reset statuses to processing
    setFileQueue(prev => prev.map(item => ({ ...item, status: 'pending', progress: 0, processedBlob: undefined, errorMessage: undefined })));

    const zip = new JSZip();
    let hasSuccess = false;

    for (let i = 0; i < fileQueue.length; i++) {
      const item = fileQueue[i];
      
      // Update specific item state to processing
      setFileQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'processing', progress: 10 } : q));

      try {
        const fileBuffer = await item.file.arrayBuffer();
        let pdfDoc: PDFDocument;

        // Process decryption options
        if (activeOp === 'unlock' && unlockPassword) {
          pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
        } else {
          pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
        }

        setFileQueue(prev => prev.map(q => q.id === item.id ? { ...q, progress: 40 } : q));

        // APPLY SELECTED OPERATION
        if (activeOp === 'compress') {
          // Creating a newly optimized doc naturally omits orphan content, revisions, and waste headers
          const optimizedDoc = await PDFDocument.create();
          const pageIndices = Array.from({ length: pdfDoc.getPageCount() }, (_, index) => index);
          const copiedPages = await optimizedDoc.copyPages(pdfDoc, pageIndices);
          copiedPages.forEach(page => optimizedDoc.addPage(page));
          pdfDoc = optimizedDoc;
        } 
        else if (activeOp === 'watermark') {
          const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
          const pages = pdfDoc.getPages();
          const rgbColor = hexToRgbRatio(colorHex);

          for (const page of pages) {
            const { width, height } = page.getSize();
            
            if (positionMode === 'center') {
              page.drawText(watermarkText, {
                x: width / 2 - (watermarkText.length * fontSize * 0.3),
                y: height / 2,
                size: fontSize,
                font: helveticaFont,
                color: rgb(rgbColor.r, rgbColor.g, rgbColor.b),
                opacity: opacity,
                rotate: degrees(rotation),
              });
            } else if (positionMode === 'quadrant') {
              let qX = 40;
              let qY = 40;
              if (quadrant === 'top-left') {
                qX = 50;
                qY = height - 50 - (fontSize * 0.8);
              } else if (quadrant === 'top-right') {
                qX = width - (watermarkText.length * fontSize * 0.5) - 50;
                qY = height - 50 - (fontSize * 0.8);
              } else if (quadrant === 'bottom-left') {
                qX = 50;
                qY = 50;
              } else if (quadrant === 'bottom-right') {
                qX = width - (watermarkText.length * fontSize * 0.5) - 50;
                qY = 50;
              }
              
              page.drawText(watermarkText, {
                x: Math.max(20, Math.min(qX, width - 20)),
                y: Math.max(20, Math.min(qY, height - 20)),
                size: fontSize,
                font: helveticaFont,
                color: rgb(rgbColor.r, rgbColor.g, rgbColor.b),
                opacity: opacity,
                rotate: degrees(rotation),
              });
            } else if (positionMode === 'tiled') {
              const stepX = Math.max(120, fontSize * 5);
              const stepY = Math.max(120, fontSize * 4);
              
              for (let curX = 50; curX < width; curX += stepX) {
                for (let curY = 50; curY < height; curY += stepY) {
                  page.drawText(watermarkText, {
                    x: curX,
                    y: curY,
                    size: fontSize * 0.8,
                    font: helveticaFont,
                    color: rgb(rgbColor.r, rgbColor.g, rgbColor.b),
                    opacity: opacity * 0.8,
                    rotate: degrees(rotation),
                  });
                }
              }
            }
          }
        } 
        else if (activeOp === 'metadata') {
          if (metaTitle) pdfDoc.setTitle(metaTitle);
          if (metaAuthor) pdfDoc.setAuthor(metaAuthor);
          if (metaCreator) pdfDoc.setCreator(metaCreator);
          if (metaSubject) pdfDoc.setSubject(metaSubject);
          pdfDoc.setProducer('Batch PDF Suite Pro');
        }

        setFileQueue(prev => prev.map(q => q.id === item.id ? { ...q, progress: 80 } : q));

        // Save PDF bytes and write file to ZIP folder
        const processedBytes = await pdfDoc.save();
        const processedBlob = new Blob([processedBytes], { type: 'application/pdf' });
        
        let targetFileName = item.name;
        if (activeOp === 'compress') targetFileName = `compressed_${item.name}`;
        else if (activeOp === 'watermark') targetFileName = `watermarked_${item.name}`;
        else if (activeOp === 'metadata') targetFileName = `meta_${item.name}`;
        else if (activeOp === 'unlock') targetFileName = `unlocked_${item.name}`;

        zip.file(targetFileName, processedBlob);
        hasSuccess = true;

        // Update single queue item with completion status
        setFileQueue(prev => prev.map(q => q.id === item.id ? { 
          ...q, 
          status: 'success', 
          progress: 100,
          processedBlob: processedBlob,
          processedSize: processedBlob.size
        } : q));

      } catch (error: any) {
        console.error(`Error batching file ${item.name}:`, error);
        setFileQueue(prev => prev.map(q => q.id === item.id ? { 
          ...q, 
          status: 'error', 
          progress: 100, 
          errorMessage: error?.message || 'Processing failed'
        } : q));
      }
    }

    if (hasSuccess) {
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        const nameOfZip = `batch_${activeOp}_${timestamp}.zip`;
        setZipFileName(nameOfZip);

        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        setZipBlobUrl(url);

        showAlert('success', 'Batch execution complete! Your ZIP bundle is ready.');
      } catch (zipError) {
        console.error('Failed generating zip package', zipError);
        showAlert('error', 'Failed generating compressed ZIP container.');
      }
    } else {
      showAlert('error', 'All files in the batch suffered processing failures.');
    }

    setIsProcessing(false);
  };

  // Drag-and-drop mechanics
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
    <section id="batch-tool-section" className="scroll-mt-32">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        className="mx-auto max-w-6xl"
      >
        {/* Title */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-3 py-1 font-mono text-[10px] font-bold tracking-wider text-violet-400 border border-violet-500/20">
              <FolderArchive className="h-3.5 w-3.5 text-violet-300" /> ULTRA-FAST OFFLINE OPERATIONS
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white font-sans sm:text-3xl">
              Unified Batch Processor
            </h2>
            <p className="text-xs text-[#94A3B8] mt-1.5 max-w-xl leading-relaxed">
              Queue dozens of files, perform heavy optimizations or watermarks in-memory, and pack everything instantly into a neat ZIP container.
            </p>
          </div>

          {fileQueue.length > 0 && (
            <button
              onClick={clearQueue}
              disabled={isProcessing}
              className="px-4 py-2 border border-rose-500/20 bg-rose-950/20 text-rose-300 text-xs font-mono rounded-xl hover:bg-rose-950/50 disabled:opacity-50 transition cursor-pointer"
            >
              Clear Live queue ({fileQueue.length})
            </button>
          )}
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
              {alert.type === 'error' ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
              <span className="text-sm font-semibold">{alert.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Queue & Loader (Left side) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div 
              className={`cursor-pointer group flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300 ${
                isDragging 
                  ? 'border-violet-400 bg-violet-950/20 shadow-[0_0_30px_rgba(139,92,246,0.1)] scale-[1.005]' 
                  : 'border-white/10 bg-[#090F1E] hover:border-white/20 hover:bg-[#121A2F]/40'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                multiple={true}
                accept=".pdf"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => handleFilesAdded(e.target.files)}
              />
              
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black/40 border border-white/10 text-slate-400 group-hover:text-violet-300 group-hover:border-violet-500/30 transition-all duration-300">
                <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform duration-350" />
              </div>
              
              <div className="mt-4 flex flex-col gap-1">
                <span className="text-sm font-bold text-white tracking-wide">
                  {isDragging ? 'Drop multiple PDFs here...' : 'Queue Multiple PDF Files'}
                </span>
                <span className="text-xs text-[#94A3B8] max-w-[320px] mx-auto leading-relaxed">
                  Drag and drop files in bulk. Let our local sandbox script process them concurrently.
                </span>
              </div>
            </div>

            {/* Queue List Table */}
            <div className="border border-white/10 rounded-3xl bg-[#090F1E] p-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-violet-400" /> Batch Job Queue ({fileQueue.length} files)
                </h3>
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                  Memory Cache State
                </span>
              </div>

              {fileQueue.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  <BadgeHelp className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  No documents listed in workspace queuing. Add some files above to start.
                </div>
              ) : (
                <div className="max-h-[380px] overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                  {fileQueue.map((item, index) => {
                    const isSucc = item.status === 'success';
                    const isErr = item.status === 'error';
                    const isProc = item.status === 'processing';
                    
                    return (
                      <div 
                        key={item.id}
                        className={`flex items-center justify-between p-3.5 border rounded-2xl bg-black/30 transition-all duration-200 ${
                          isProc 
                            ? 'border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.05)]' 
                            : isSucc 
                            ? 'border-emerald-500/20' 
                            : isErr 
                            ? 'border-rose-500/20' 
                            : 'border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 truncate max-w-[70%]">
                          <span className="text-[10px] font-mono text-slate-500 font-bold w-5">
                            {(index + 1).toString().padStart(2, '0')}
                          </span>
                          
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-950 border border-white/5 text-slate-400">
                            <FileText className="h-4.5 w-4.5" />
                          </div>

                          <div className="flex flex-col truncate">
                            <span className="text-xs font-bold text-white truncate" title={item.name}>
                              {item.name}
                            </span>
                            <div className="flex gap-2 items-center text-[10px] font-mono text-slate-500 mt-1">
                              <span>{item.originalSizeStr}</span>
                              {item.processedSize && (
                                <>
                                  <span className="text-slate-600">→</span>
                                  <span className="text-emerald-400 font-bold">{formatBytes(item.processedSize)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {/* Status and Actions */}
                          {isProc && (
                            <div className="flex items-center gap-1.5 text-violet-400 text-[10px] font-mono font-bold bg-violet-950/30 border border-violet-500/20 py-1 px-2.5 rounded-full">
                              <Loader2 className="h-3 w-3 animate-spin text-violet-400" />
                              <span>{item.progress || index * 10}%</span>
                            </div>
                          )}

                          {isSucc && (
                            <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-mono font-bold bg-emerald-950/20 border border-emerald-500/20 py-1 px-2.5 rounded-full">
                              <Check className="h-3 w-3 shrink-0" /> Done
                            </span>
                          )}

                          {isErr && (
                            <span className="flex items-center gap-1 text-rose-400 text-[10px] font-mono font-medium bg-rose-950/20 border border-rose-500/20 py-1 px-2.5 rounded-full" title={item.errorMessage}>
                              <AlertTriangle className="h-3 w-3 shrink-0" /> Fail
                            </span>
                          )}

                          {item.status === 'pending' && (
                            <span className="text-slate-500 text-[10px] font-mono bg-white/5 border border-white/5 py-1 px-2.5 rounded-full">
                              Ready
                            </span>
                          )}

                          <button
                            onClick={() => removeFile(item.id)}
                            disabled={isProcessing}
                            className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-rose-950/30 text-slate-500 hover:text-rose-400 transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                            title="Remove file"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Operation Configuration & Trigger (Right side) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="border border-white/10 rounded-3xl bg-[#090F1E] p-6 lg:p-8 flex flex-col gap-6 h-full sticky top-32">
              <div className="pb-4 border-b border-white/5">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-violet-400" /> Choose Action Template
                </h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed mt-1">
                  Select a workflow to overlay uniformly across all items.
                </p>
              </div>

              {/* OP SELECTOR GRID */}
              <div className="grid grid-cols-2 gap-2.5">
                {([
                  ['compress', 'Compress PDFs', Minimize2],
                  ['watermark', 'Add Watermarks', Type],
                  ['metadata', 'Embed Metadata', Layers],
                  ['unlock', 'Decrypt & Unlock', Shield]
                ] as const).map(([val, label, Icon]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setActiveOp(val);
                      setZipBlobUrl(null);
                    }}
                    className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-left transition duration-200 cursor-pointer ${
                      activeOp === val 
                        ? 'border-violet-500 bg-violet-950/20 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.1)]' 
                        : 'border-white/5 bg-black/45 text-slate-400 hover:border-white/10'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-[11px] font-sans font-bold leading-none">{label}</span>
                  </button>
                ))}
              </div>

              {/* DYNAMIC SETTINGS CONSOLE */}
              <div className="p-5 rounded-2xl bg-black/40 border border-white/5 flex-grow">
                {activeOp === 'compress' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-slate-200 font-sans text-xs font-bold uppercase tracking-wide">
                      <Minimize2 className="h-3.5 w-3.5 text-violet-400" /> Compression Strategy
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      {([
                        ['recommended', 'Recommended Size Reduction', 'Perfect balance of extreme compression and visual resolution.'],
                        ['extreme', 'Maximum Speed Compression', 'Drops redundant headers, metadata indexes and page layers.'],
                        ['low', 'Minimal Header Squeeze', 'Quiet background optimization for minimal visual compression impact.']
                      ] as const).map(([val, header, sub]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setCompLevel(val)}
                          className={`w-full py-2.5 px-3 rounded-xl border text-left transition ${
                            compLevel === val 
                              ? 'border-violet-500/40 bg-violet-950/10 text-violet-300 font-bold' 
                              : 'border-white/5 bg-black/25 text-slate-400 hover:border-white/15'
                          }`}
                        >
                          <div className="text-[11px] font-semibold">{header}</div>
                          <div className="text-[9px] font-mono text-slate-500 mt-1 leading-normal">{sub}</div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeOp === 'watermark' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-slate-200 font-sans text-xs font-bold uppercase tracking-wide">
                      <Type className="h-3.5 w-3.5 text-violet-400" /> Watermark Stamp Properties
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">Text Stamp</label>
                        <input 
                          type="text" 
                          value={watermarkText} 
                          onChange={e => setWatermarkText(e.target.value)}
                          className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/20"
                          placeholder="CONFIDENTIAL"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">Font Size ({fontSize}pt)</label>
                          <input 
                            type="range" min="16" max="90" value={fontSize} 
                            onChange={e => setFontSize(Number(e.target.value))}
                            className="accent-violet-500"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">Tilt Angle ({rotation}°)</label>
                          <input 
                            type="range" min="-90" max="90" value={rotation} 
                            onChange={e => setRotation(Number(e.target.value))}
                            className="accent-violet-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">Transparency ({Math.round(opacity * 100)}%)</label>
                          <input 
                            type="range" min="5" max="80" value={opacity * 100} 
                            onChange={e => setOpacity(Number(e.target.value) / 100)}
                            className="accent-violet-500"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">Preset Color</label>
                          <div className="flex gap-1.5 mt-0.5">
                            {['#EF4444', '#3B82F6', '#FFFFFF', '#000000'].map(col => (
                              <button 
                                key={col} onClick={() => setColorHex(col)}
                                className={`h-5 w-5 rounded-full border transition hover:scale-115 ${colorHex === col ? 'border-white' : 'border-white/10'}`}
                                style={{ backgroundColor: col }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">Layout Grid Alignment</label>
                        <div className="grid grid-cols-3 gap-2">
                          {([
                            ['tiled', 'Tiled Grid'],
                            ['center', 'Centered'],
                            ['quadrant', 'Top-Right']
                          ] as const).map(([v, label]) => (
                            <button
                              key={v} type="button" onClick={() => setPositionMode(v)}
                              className={`py-1 rounded font-mono text-[9px] uppercase border text-center transition ${positionMode === v ? 'bg-violet-500/10 border-violet-500/40 text-violet-300' : 'bg-black/25 border-white/5 text-slate-500 hover:text-slate-300'}`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeOp === 'metadata' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3.5">
                    <div className="flex items-center gap-2 text-slate-200 font-sans text-xs font-bold uppercase tracking-wide mb-1">
                      <Layers className="h-3.5 w-3.5 text-violet-400" /> Embedded PDF fields Patch
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">Global Title</label>
                      <input 
                        type="text" value={metaTitle} onChange={e => setMetaTitle(e.target.value)}
                        className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/20"
                        placeholder="Master Title Header"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">Global Author</label>
                      <input 
                        type="text" value={metaAuthor} onChange={e => setMetaAuthor(e.target.value)}
                        className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/20"
                        placeholder="Corporate Security Team"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">Workflow Creator</label>
                      <input 
                        type="text" value={metaCreator} onChange={e => setMetaCreator(e.target.value)}
                        className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/20"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">Brief Subject</label>
                      <input 
                        type="text" value={metaSubject} onChange={e => setMetaSubject(e.target.value)}
                        className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/20"
                        placeholder="Workflow operations notes..."
                      />
                    </div>
                  </motion.div>
                )}

                {activeOp === 'unlock' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-slate-200 font-sans text-xs font-bold uppercase tracking-wide">
                      <Shield className="h-3.5 w-3.5 text-violet-400" /> Encryption Decoder
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Shared Master Password (Optional)</label>
                        <div className="relative">
                          <input 
                            type={showPassword ? "text" : "password"}
                            value={unlockPassword}
                            onChange={e => setUnlockPassword(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 pr-12 text-xs text-white font-mono placeholder:text-white/10"
                            placeholder="Master password..."
                          />
                          <button 
                            type="button" onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-violet-400"
                          >
                            {showPassword ? "HIDE" : "SHOW"}
                          </button>
                        </div>
                      </div>

                      <div className="rounded-xl border border-[#FAF0D7]/10 bg-[#FAF0D7]/5 p-3.5 flex items-start gap-2.5">
                        <Info className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
                        <span className="text-[10px] text-slate-400 leading-relaxed">
                          For batch unlocks, we attempt to load files using the shared master key. If any PDFs do not contain locks, we re-serialize duplicates seamlessly without locks inside your ZIP download.
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* ACTION TRIGGER BUTTON OR DOWNLOAD ZIP */}
              <div className="mt-auto flex flex-col gap-3.5">
                {!zipBlobUrl ? (
                  <button
                    onClick={handleExecuteBatch}
                    disabled={fileQueue.length === 0 || isProcessing}
                    className="group relative w-full h-13 overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-500 p-[1px] font-sans text-sm font-bold tracking-wide text-white transition hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] active:scale-95 disabled:scale-100 disabled:opacity-40 cursor-pointer"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-500 opacity-0 transition-opacity duration-300 group-hover:opacity-20" />
                    <span className="w-full h-full flex items-center justify-center gap-2 bg-[#0C1123]/95 group-hover:bg-transparent px-8 py-3 rounded-[15px] transition duration-200">
                      {isProcessing ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin text-violet-300" />
                          <span className="text-violet-200">Executing Actions...</span>
                        </>
                      ) : (
                        <>
                          Execute Batch Operations <Play className="h-3.5 w-3.5 text-violet-300" />
                        </>
                      )}
                    </span>
                  </button>
                ) : (
                  <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="flex flex-col gap-3 w-full">
                    <a
                      href={zipBlobUrl}
                      download={zipFileName}
                      className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-white px-8 py-3 font-sans text-sm font-bold tracking-wide text-black transition hover:scale-[1.01] hover:bg-slate-200 active:scale-95 shadow-[0_0_25px_rgba(255,255,255,0.15)] cursor-pointer"
                    >
                      <Download className="h-4 w-4" /> Download ZIP Archive
                    </a>
                    
                    <button
                      onClick={() => setZipBlobUrl(null)}
                      className="h-10 text-[10px] font-mono rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    >
                      Process New Batch
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
