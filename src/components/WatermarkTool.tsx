import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, FileText, CheckCircle, AlertTriangle, Trash2, 
  Sparkles, RefreshCw, Download, Type, Grid, Square, Sliders, Palette, Eye
} from 'lucide-react';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { PDFFileItem } from '../types';

export default function WatermarkTool() {
  const [fileItem, setFileItem] = useState<PDFFileItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  
  // Watermark Settings
  const [text, setText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(0.25);
  const [rotation, setRotation] = useState(45);
  const [colorHex, setColorHex] = useState('#EF4444'); // Tailwind Red-500
  const [positionMode, setPositionMode] = useState<'center' | 'tiled' | 'quadrant'>('tiled');
  const [quadrant, setQuadrant] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('top-right');
  const [pageRangeMode, setPageRangeMode] = useState<'all' | 'first' | 'custom'>('all');
  const [customRange, setCustomRange] = useState('');

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

  const hexToRgbRatio = (hex: string) => {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
    return { r: isNaN(r) ? 0.9 : r, g: isNaN(g) ? 0.1 : g, b: isNaN(b) ? 0.1 : b };
  };

  const handleFilesAdded = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
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
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFileItem(null);
    setProcessedUrl(null);
  };

  const parsePageRange = (rangeText: string, totalPages: number): number[] => {
    const pages = new Set<number>();
    const tokens = rangeText.split(',');
    
    for (const token of tokens) {
      const cleanToken = token.trim();
      if (!cleanToken) continue;
      
      if (cleanToken.includes('-')) {
        const [startStr, endStr] = cleanToken.split('-');
        const start = parseInt(startStr.trim(), 10);
        const end = parseInt(endStr.trim(), 10);
        
        if (!isNaN(start) && !isNaN(end)) {
          const limitStart = Math.max(1, Math.min(start, totalPages));
          const limitEnd = Math.max(1, Math.min(end, totalPages));
          const actualStart = Math.min(limitStart, limitEnd);
          const actualEnd = Math.max(limitStart, limitEnd);
          
          for (let p = actualStart; p <= actualEnd; p++) {
            pages.add(p - 1); // 0-indexed in pdf-lib
          }
        }
      } else {
        const p = parseInt(cleanToken, 10);
        if (!isNaN(p) && p >= 1 && p <= totalPages) {
          pages.add(p - 1);
        }
      }
    }
    
    return Array.from(pages).sort((a, b) => a - b);
  };

  const handleApplyWatermark = async () => {
    if (!fileItem) return;
    
    setIsProcessing(true);
    setProcessedUrl(null);
    
    try {
      const arrayBuffer = await fileItem.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();
      const totalPages = pages.length;

      // Determine pages to watermark
      let pagesToWatermark: number[] = [];
      if (pageRangeMode === 'all') {
        pagesToWatermark = Array.from({ length: totalPages }, (_, i) => i);
      } else if (pageRangeMode === 'first') {
        pagesToWatermark = [0];
      } else if (pageRangeMode === 'custom') {
        if (!customRange.trim()) {
          showAlert('error', 'Please define custom page bounds (Example: 1, 3-5).');
          setIsProcessing(false);
          return;
        }
        pagesToWatermark = parsePageRange(customRange, totalPages);
        if (pagesToWatermark.length === 0) {
          showAlert('error', 'Provided page range bounds fell outside this document list.');
          setIsProcessing(false);
          return;
        }
      }

      const rgbColor = hexToRgbRatio(colorHex);

      for (const pageIdx of pagesToWatermark) {
        if (pageIdx >= totalPages || pageIdx < 0) continue;
        const page = pages[pageIdx];
        const { width, height } = page.getSize();
        
        if (positionMode === 'center') {
          // Centered single watermark
          page.drawText(text, {
            x: width / 2 - (text.length * fontSize * 0.3),
            y: height / 2,
            size: fontSize,
            font: helveticaFont,
            color: rgb(rgbColor.r, rgbColor.g, rgbColor.b),
            opacity: opacity,
            rotate: degrees(rotation),
          });
        } else if (positionMode === 'quadrant') {
          // Position relative to a specific quadrant
          let qX = 40;
          let qY = 40;
          if (quadrant === 'top-left') {
            qX = 50;
            qY = height - 50 - (fontSize * 0.8);
          } else if (quadrant === 'top-right') {
            qX = width - (text.length * fontSize * 0.5) - 50;
            qY = height - 50 - (fontSize * 0.8);
          } else if (quadrant === 'bottom-left') {
            qX = 50;
            qY = 50;
          } else if (quadrant === 'bottom-right') {
            qX = width - (text.length * fontSize * 0.5) - 50;
            qY = 50;
          }
          
          page.drawText(text, {
            x: Math.max(20, Math.min(qX, width - 20)),
            y: Math.max(20, Math.min(qY, height - 20)),
            size: fontSize,
            font: helveticaFont,
            color: rgb(rgbColor.r, rgbColor.g, rgbColor.b),
            opacity: opacity,
            rotate: degrees(rotation),
          });
        } else if (positionMode === 'tiled') {
          // Repeated across a full grid array
          const stepX = Math.max(120, fontSize * 5);
          const stepY = Math.max(120, fontSize * 4);
          
          for (let curX = 50; curX < width; curX += stepX) {
            for (let curY = 50; curY < height; curY += stepY) {
              page.drawText(text, {
                x: curX,
                y: curY,
                size: fontSize * 0.8, // Slightly smaller tiles
                font: helveticaFont,
                color: rgb(rgbColor.r, rgbColor.g, rgbColor.b),
                opacity: opacity * 0.8,
                rotate: degrees(rotation),
              });
            }
          }
        }
      }

      const watermarkedBytes = await pdfDoc.save();
      const blob = new Blob([watermarkedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setProcessedUrl(url);
      setFileItem(prev => prev ? { ...prev, status: 'success' } : null);
      showAlert('success', 'Watermark injected successfully!');
    } catch (error: any) {
      console.error(error);
      showAlert('error', 'Failed to apply watermark layers.');
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
    <section id="watermark-tool-section" className="scroll-mt-32">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        className="mx-auto max-w-5xl"
      >
        <div className="mb-8 flex items-end justify-between">
          <div>
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 font-mono text-[10px] font-bold tracking-wider text-cyan-400 border border-cyan-500/20">
              <Type className="h-3.5 w-3.5 text-cyan-300" /> SECURE WATERMARK INJECTOR
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white font-sans sm:text-3xl">
              Inject Watermark Layers
            </h2>
          </div>
        </div>

        {/* Global Alert Notification */}
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Settings Console (Left side) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="border border-white/10 rounded-3xl bg-[#090F1E] p-6 flex flex-col gap-5">
              <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                <Sliders className="h-4 w-4 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Watermark Settings</h3>
              </div>

              {/* Text Field */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">
                  Watermark Message
                </label>
                <input 
                  type="text" 
                  value={text} 
                  onChange={e => setText(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                  placeholder="DRAFT, CONFIDENTIAL"
                />
              </div>

              {/* Slider Size */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">
                    Font Size
                  </label>
                  <span className="text-xs font-mono text-cyan-400 font-bold">{fontSize}pt</span>
                </div>
                <input 
                  type="range" 
                  min="12" 
                  max="120" 
                  value={fontSize} 
                  onChange={e => setFontSize(Number(e.target.value))}
                  className="w-full accent-cyan-500 bg-white/10 rounded-lg height-1"
                />
              </div>

              {/* Opacity Slider */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">
                    Opacity (Alpha)
                  </label>
                  <span className="text-xs font-mono text-cyan-400 font-bold">{Math.round(opacity * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="100" 
                  value={opacity * 100} 
                  onChange={e => setOpacity(Number(e.target.value) / 100)}
                  className="w-full accent-cyan-500 bg-white/10 rounded-lg height-1"
                />
              </div>

              {/* Rotation Slider */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">
                    Tilt Angle
                  </label>
                  <span className="text-xs font-mono text-cyan-400 font-bold">{rotation}°</span>
                </div>
                <input 
                  type="range" 
                  min="-90" 
                  max="90" 
                  value={rotation} 
                  onChange={e => setRotation(Number(e.target.value))}
                  className="w-full accent-cyan-500 bg-white/10 rounded-lg height-1"
                />
                <div className="flex gap-2 justify-between mt-1">
                  <button onClick={() => setRotation(0)} className="text-[10px] font-mono border border-white/5 bg-white/5 py-0.5 px-1.5 rounded hover:bg-white/10 text-slate-300">0° (Flat)</button>
                  <button onClick={() => setRotation(45)} className="text-[10px] font-mono border border-white/5 bg-white/5 py-0.5 px-1.5 rounded hover:bg-white/10 text-slate-300">45° (Diag)</button>
                  <button onClick={() => setRotation(-45)} className="text-[10px] font-mono border border-white/5 bg-white/5 py-0.5 px-1.5 rounded hover:bg-white/10 text-slate-300">-45° (Diag)</button>
                </div>
              </div>

              {/* Color Hex Input */}
              <div className="flex flex-col gap-2 bg-black/30 p-3 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Palette className="h-3 w-3 text-slate-400" />
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">Color Preset</label>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {['#EF4444', '#94A3B8', '#3B82F6', '#F59E0B', '#10B981', '#FFFFFF', '#000000'].map(color => (
                    <button 
                      key={color}
                      onClick={() => setColorHex(color)}
                      className={`h-6 w-6 rounded-full border transition hover:scale-110 ${colorHex === color ? 'border-white scale-105 shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'border-white/10'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input 
                    type="color" 
                    value={colorHex} 
                    onChange={e => setColorHex(e.target.value)}
                    className="h-6 w-8 bg-transparent cursor-pointer rounded-lg overflow-hidden shrink-0"
                    title="Custom hex picker"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Upload, Positions & Operations Column (Right side) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {!fileItem ? (
              <div 
                className={`cursor-pointer group flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-12 md:p-20 text-center transition-all duration-300 min-h-[350px] ${
                  isDragging 
                    ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_30px_rgba(34,211,238,0.1)] scale-[1.01]' 
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
                
                <div id="watermark-target-box" className="flex h-20 w-20 items-center justify-center rounded-2xl bg-black/40 border border-white/10 text-slate-400 transition-all group-hover:text-slate-200 group-hover:border-cyan-500/40 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]">
                  <Type className="h-9 w-9" />
                </div>
                
                <div className="mt-6 flex flex-col gap-2">
                  <span className="text-lg font-bold text-white tracking-wide">
                    {isDragging ? 'Drop file here...' : 'Upload PDF Document'}
                  </span>
                  <span className="text-xs text-[#94A3B8] max-w-[300px] mx-auto leading-relaxed">
                    Drag & drop your PDF file to start overlaying secure watermark layers in real-time.
                  </span>
                </div>
                
                <div className="mt-8">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-300 bg-cyan-950/40 border border-cyan-500/20 py-1.5 px-4 rounded-full">
                    No Server Connection Needed
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                
                {/* Active file metadata banner */}
                <div className="border border-white/10 rounded-3xl bg-[#090F1E] p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4 truncate">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-950/50 border border-slate-500/20 text-slate-400">
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
                    className="h-10 w-10 shrink-0 flex items-center justify-center bg-rose-950/40 hover:bg-rose-950 border border-rose-500/25 rounded-xl text-rose-300 transition cursor-pointer hover:border-rose-500"
                    title="Remove file"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Position selector panel */}
                  <div className="border border-white/10 rounded-3xl bg-[#090F1E] p-6 flex flex-col gap-5">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                      <Grid className="h-4 w-4 text-cyan-400" />
                      <h3 className="text-sm font-bold text-white">Watermark Positioning</h3>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => setPositionMode('tiled')}
                        className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border text-center transition cursor-pointer ${positionMode === 'tiled' ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300' : 'bg-black/35 border-white/5 text-slate-400 hover:border-white/10'}`}
                      >
                        <Grid className="h-4 w-4" />
                        <span className="text-[10px] font-mono uppercase font-bold tracking-wider">Tiled Grid</span>
                      </button>

                      <button
                        onClick={() => setPositionMode('center')}
                        className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border text-center transition cursor-pointer ${positionMode === 'center' ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300' : 'bg-black/35 border-white/5 text-slate-400 hover:border-white/10'}`}
                      >
                        <Square className="h-4 w-4" />
                        <span className="text-[10px] font-mono uppercase font-bold tracking-wider">Centered</span>
                      </button>

                      <button
                        onClick={() => setPositionMode('quadrant')}
                        className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border text-center transition cursor-pointer ${positionMode === 'quadrant' ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300' : 'bg-black/35 border-white/5 text-slate-400 hover:border-white/10'}`}
                      >
                        <Sliders className="h-4 w-4 rotate-45" />
                        <span className="text-[10px] font-mono uppercase font-bold tracking-wider">Quadrant</span>
                      </button>
                    </div>

                    {/* Quadrant fine-tuning choice */}
                    {positionMode === 'quadrant' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="grid grid-cols-2 gap-2 mt-1"
                      >
                        {([
                          ['top-left', 'Top Left'],
                          ['top-right', 'Top Right'],
                          ['bottom-left', 'Bottom Left'],
                          ['bottom-right', 'Bottom Right']
                        ] as const).map(([val, label]) => (
                          <button
                            key={val}
                            onClick={() => setQuadrant(val)}
                            className={`py-2 px-3 text-xs rounded-xl font-mono border transition duration-150 cursor-pointer ${quadrant === val ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300' : 'bg-black/30 border-white/5 text-slate-400 hover:border-white/10'}`}
                          >
                            {label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>

                  {/* Scope Page boundaries choices */}
                  <div className="border border-white/10 rounded-3xl bg-[#090F1E] p-6 flex flex-col gap-5">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                      <Eye className="h-4 w-4 text-cyan-400" />
                      <h3 className="text-sm font-bold text-white">Target Layout Bounds</h3>
                    </div>

                    <div className="flex flex-col gap-3">
                      {([
                        ['all', 'All pages in document'],
                        ['first', 'Cover / first page only'],
                        ['custom', 'Custom page range bounds']
                      ] as const).map(([val, label]) => (
                        <button
                          key={val}
                          onClick={() => setPageRangeMode(val)}
                          className={`w-full py-2.5 px-4 text-left text-xs rounded-xl font-medium border transition cursor-pointer flex items-center justify-between ${pageRangeMode === val ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 font-bold' : 'bg-black/20 border-white/5 text-slate-400 hover:border-white/10'}`}
                        >
                          <span>{label}</span>
                          <span className={`h-2 w-2 rounded-full ${pageRangeMode === val ? 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.7)]' : 'bg-slate-700'}`} />
                        </button>
                      ))}
                    </div>

                    {pageRangeMode === 'custom' && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-1.5"
                      >
                        <input 
                          type="text"
                          value={customRange}
                          onChange={e => setCustomRange(e.target.value)}
                          className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder:text-white/20 font-mono"
                          placeholder="Example: 1, 3-5, 8"
                        />
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Processing controls block */}
                <div className="border border-white/10 rounded-3xl bg-[#090F1E] p-6 flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    {!processedUrl ? (
                      <button
                        onClick={handleApplyWatermark}
                        disabled={isProcessing || !text.trim()}
                        className="group relative w-full sm:w-auto h-14 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-500 p-[1px] font-sans text-sm font-bold tracking-wide text-white transition hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 disabled:scale-100 disabled:opacity-40 cursor-pointer flex-grow"
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-indigo-500 opacity-0 transition-opacity duration-300 group-hover:opacity-20" />
                        <span className="w-full h-full flex items-center justify-center gap-2 bg-[#0C1123]/95 group-hover:bg-transparent px-8 py-3 rounded-[15px] transition duration-200">
                          {isProcessing ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin text-cyan-300" />
                              <span className="text-cyan-200">Applying Layers...</span>
                            </>
                          ) : (
                            <>
                              Inject Watermark Stamp <Sparkles className="h-4 w-4 text-cyan-300" />
                            </>
                          )}
                        </span>
                      </button>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-4 w-full">
                        <a
                          href={processedUrl}
                          download={`watermarked_${fileItem?.name}`}
                          className="flex h-14 flex-grow items-center justify-center gap-2 rounded-2xl bg-white px-8 py-3.5 font-sans text-sm font-bold tracking-wide text-black transition hover:scale-[1.01] hover:bg-slate-200 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.15)] cursor-pointer"
                        >
                          <Download className="h-4 w-4" /> Download Watermarked PDF
                        </a>
                        <button
                          onClick={() => {
                            setProcessedUrl(null);
                            setFileItem(prev => prev ? { ...prev, status: 'pending' } : null);
                          }}
                          className="h-14 font-mono px-6 rounded-2xl bg-white/5 border border-white/5 text-xs text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/10 transition cursor-pointer"
                        >
                          Reset & Tweak
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
