import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, Image as ImageIcon, CheckCircle, AlertTriangle, Trash2, 
  ArrowLeft, ArrowRight, Sparkles, RefreshCw, SlidersHorizontal
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { ImageFileItem, ImageConversionConfig } from '../types';

export default function JpgToPdfTool() {
  const [images, setImages] = useState<ImageFileItem[]>([]);
  const [config, setConfig] = useState<ImageConversionConfig>({
    orientation: 'portrait',
    pageSize: 'FIT',
    margin: 'none',
  });
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

  // Process selected image files
  const processSelectedImages = (selectedList: FileList | File[]) => {
    const itemsArray: ImageFileItem[] = [];

    for (let i = 0; i < selectedList.length; i++) {
      const file = selectedList[i];
      const normalizedType = file.type.toLowerCase();
      
      // Support common image types (JPG, JPEG, PNG, etc.)
      const isImg = normalizedType.includes('jpeg') || 
                    normalizedType.includes('jpg') || 
                    normalizedType.includes('png');
                    
      if (!isImg && !file.name.match(/\.(jpg|jpeg|png)$/i)) {
        continue; // skip other formats
      }

      const itemId = Math.random().toString(36).substring(2, 9);
      const url = URL.createObjectURL(file);
      
      const newItem: ImageFileItem = {
        id: itemId,
        file: file,
        name: file.name,
        size: file.size,
        objectUrl: url,
        status: 'pending',
      };

      itemsArray.push(newItem);
    }

    if (itemsArray.length === 0) return;

    setImages((prev) => [...prev, ...itemsArray]);
  };

  // Handle standard manual pick
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processSelectedImages(e.target.files);
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
      processSelectedImages(e.dataTransfer.files);
    }
  };

  // Delete individual thumbnail image
  const handleDeleteImage = (id: string, url: string) => {
    URL.revokeObjectURL(url); // prevent memory leak
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Move manual thumbnail left
  const handleMoveLeft = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy;
    });
  };

  // Move manual thumbnail right
  const handleMoveRight = (index: number) => {
    setImages((prev) => {
      if (index >= prev.length - 1) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return copy;
    });
  };

  // Reset tool selection state
  const handleReset = () => {
    images.forEach(img => URL.revokeObjectURL(img.objectUrl));
    setImages([]);
    setAlert({ type: null, message: '' });
  };

  // Core compiling logic
  const handleCompileImagesToPdf = async () => {
    if (images.length === 0) {
      setAlert({
        type: 'error',
        message: 'Please upload at least 1 image to convert.',
      });
      return;
    }

    setIsProcessing(true);
    setAlert({ type: null, message: '' });

    try {
      // 1. Instantiating a new PDF Doc
      const pdfDoc = await PDFDocument.create();

      // Standard ratios
      // A4: 595.27 x 841.89 points
      // LETTER: 612 x 792 points
      const standardSizes = {
        A4: { width: 595.27, height: 841.89 },
        LETTER: { width: 612, height: 792 },
      };

      // Margin in points
      const marginValues = {
        none: 0,
        small: 15,
        medium: 30,
        large: 50,
      };

      const selectedMargin = marginValues[config.margin];

      // Sequential compilation
      for (const item of images) {
        const fileBytes = await item.file.arrayBuffer();
        let embeddedImage;
        const lowercaseName = item.name.toLowerCase();
        const isPng = lowercaseName.endsWith('.png');

        if (isPng) {
          try {
            embeddedImage = await pdfDoc.embedPng(fileBytes);
          } catch {
            embeddedImage = await pdfDoc.embedJpg(fileBytes);
          }
        } else {
          try {
            embeddedImage = await pdfDoc.embedJpg(fileBytes);
          } catch {
            embeddedImage = await pdfDoc.embedPng(fileBytes);
          }
        }

        const imgWidth = embeddedImage.width;
        const imgHeight = embeddedImage.height;

        // Establish target Page Box Dimensions
        let pageWidth = 0;
        let pageHeight = 0;

        if (config.pageSize === 'FIT') {
          if (config.orientation === 'landscape' && imgHeight > imgWidth) {
            pageWidth = imgHeight + (selectedMargin * 2);
            pageHeight = imgWidth + (selectedMargin * 2);
          } else if (config.orientation === 'portrait' && imgWidth > imgHeight) {
            pageWidth = imgHeight + (selectedMargin * 2);
            pageHeight = imgWidth + (selectedMargin * 2);
          } else {
            pageWidth = imgWidth + (selectedMargin * 2);
            pageHeight = imgHeight + (selectedMargin * 2);
          }
        } else {
          const baseFrame = standardSizes[config.pageSize];
          if (config.orientation === 'landscape') {
            pageWidth = baseFrame.height;
            pageHeight = baseFrame.width;
          } else {
            pageWidth = baseFrame.width;
            pageHeight = baseFrame.height;
          }
        }

        // Add a new slide sheet inside PDF Doc
        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        // Calculate available area inside the page constraints
        const activeWidth = pageWidth - (selectedMargin * 2);
        const activeHeight = pageHeight - (selectedMargin * 2);

        // Aspect fit calculation rules
        const imageRatio = imgWidth / imgHeight;
        const cardRatio = activeWidth / activeHeight;

        let drawWidth = activeWidth;
        let drawHeight = activeHeight;

        if (imageRatio > cardRatio) {
          drawWidth = activeWidth;
          drawHeight = activeWidth / imageRatio;
        } else {
          drawHeight = activeHeight;
          drawWidth = activeHeight * imageRatio;
        }

        // Recenter drawing offset calculation
        const drawX = selectedMargin + ((activeWidth - drawWidth) / 2);
        const drawY = selectedMargin + ((activeHeight - drawHeight) / 2);

        // Render on canvas
        page.drawImage(embeddedImage, {
          x: drawX,
          y: drawY,
          width: drawWidth,
          height: drawHeight,
        });
      }

      // 3. Serialize and trigger down load
      const finalPdfBytes = await pdfDoc.save();
      const compiledBlob = new Blob([finalPdfBytes], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(compiledBlob);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `pdfusion-convert-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setAlert({
        type: 'success',
        message: 'Compilation process completed! PDF has been downloaded.',
      });
    } catch (err: any) {
      console.error('Image compression compiler failure:', err);
      setAlert({
        type: 'error',
        message: `Conversion process encountered an unhandled error: ${err.message || 'Decoder payload crash'}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section id="jpg-pdf-tool-section" className="py-12 relative scroll-mt-24">
      {/* Decorative center halo light spark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-[#121A2F]/75 p-6 sm:p-8 backdrop-blur-3xl shadow-[0_25px_60px_rgba(0,0,0,0.6)] relative overflow-hidden">
        {/* Shimmer cyan line accent */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-md">
              <ImageIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white font-sans tracking-tight">JPG to PDF Synth</h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Pack JPG, JPEG, or PNG images into an elegant vector bounding-box PDF instantly.
              </p>
            </div>
          </div>

          {images.length > 0 && (
            <button
              onClick={handleReset}
              disabled={isProcessing}
              className="px-4 py-2 self-start sm:self-center text-xs border border-[#F43F5E]/30 text-rose-300 hover:bg-[#F43F5E]/10 rounded-xl transition-all cursor-pointer disabled:opacity-50 font-semibold"
            >
              Reset Compiler
            </button>
          )}
        </div>

        {/* Dynamic Warning Alerts container with physical active transitions */}
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

        {/* Configuration sliders/menus panel */}
        <div className="mb-8 rounded-2xl border border-white/5 bg-white/[0.015] p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-24 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
          
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-4">
            <SlidersHorizontal className="h-4 w-4" />
            <span>Digital Alignment Properties</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Page Orientation */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-[#94A3B8]">Page Layout Orientation</label>
              <div className="grid grid-cols-2 gap-2 h-10">
                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, orientation: 'portrait' }))}
                  className={`rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    config.orientation === 'portrait'
                      ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                      : 'bg-[#121A2F]/40 border-white/5 text-[#94A3B8] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  Portrait
                </button>
                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, orientation: 'landscape' }))}
                  className={`rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    config.orientation === 'landscape'
                      ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                      : 'bg-[#121A2F]/40 border-white/5 text-[#94A3B8] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  Landscape
                </button>
              </div>
            </div>

            {/* Target Page Dimensions */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-[#94A3B8]">Target Page Size Format</label>
              <select
                value={config.pageSize}
                onChange={(e) => setConfig(prev => ({ ...prev, pageSize: e.target.value as any }))}
                className="h-10 rounded-xl bg-[#0B1020]/60 border border-white/10 text-slate-200 px-3 text-xs outline-none focus:border-cyan-500/40 cursor-pointer font-sans"
              >
                <option value="FIT">Fit to Original Image Dimensions</option>
                <option value="A4">Standard A4 Sheet Format</option>
                <option value="LETTER">US Letter Sheet Format</option>
              </select>
            </div>

            {/* Margin Spacing */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-[#94A3B8]">Outer Margins Spacing</label>
              <div className="grid grid-cols-4 gap-1.5 h-10">
                {(['none', 'small', 'medium', 'large'] as const).map((marginOpt) => (
                  <button
                    key={marginOpt}
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, margin: marginOpt }))}
                    className={`rounded-xl text-[10px] font-mono font-semibold capitalize transition cursor-pointer border ${
                      config.margin === marginOpt
                        ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                        : 'bg-[#121A2F]/40 border-white/5 text-[#94A3B8] hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {marginOpt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Upload Drop area with vertical moving scanner bar */}
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleSelectClick}
          className={`relative cursor-pointer group flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-8 md:p-14 text-center transition-all duration-300 ${
            isDragging
              ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_30px_rgba(6,182,212,0.25)]'
              : 'border-white/10 bg-white/[0.01] hover:border-cyan-500/40 hover:bg-white/[0.03]'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/jpg,image/png"
            multiple
            className="hidden"
          />

          {isDragging && (
            <div className="absolute inset-0 pointer-events-none rounded-[22px] overflow-hidden">
              <motion.div 
                animate={{ y: ['0%', '100%', '0%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                className="w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_#06B6D4]"
              />
            </div>
          )}

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black/40 border border-white/10 text-[#94A3B8] transition-all group-hover:text-cyan-400 group-hover:border-cyan-500/40 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <Upload className="h-6 w-6" />
          </div>

          <h4 className="mt-5 text-lg font-bold text-white tracking-tight group-hover:text-cyan-300 transition-colors">
            Drag & drop images here to construct album
          </h4>
          <p className="mt-2 text-sm text-[#94A3B8]">
            Or <span className="text-cyan-400 font-semibold group-hover:underline">browse files</span> from your gallery (Supports JPG, JPEG, and PNG)
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-300 bg-cyan-950/40 border border-cyan-500/20 py-1 px-3 rounded-md">
              Secure RAM Compiles
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-purple-300 bg-purple-950/40 border border-purple-500/20 py-1 px-3 rounded-md">
              Mobile Friendly
            </span>
          </div>
        </div>

        {/* Images Thumbnails Grid */}
        {images.length > 0 && (
          <div className="mt-10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs font-mono tracking-wider text-[#94A3B8] uppercase">
                Pages Stream ({images.length} images queued)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Order Left-to-Right / Top-to-Bottom
              </span>
            </div>

            {/* Grid display layout with beautiful floaters */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <AnimatePresence initial={false}>
                {images.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                    className="group/thumb relative aspect-[3/4] bg-slate-950/60 rounded-2xl overflow-hidden border border-white/5 hover:border-cyan-500/40 transition-all duration-300 flex flex-col justify-between shadow-md"
                  >
                    {/* Thumbnail Image display */}
                    <img
                      src={item.objectUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover opacity-65 group-hover/thumb:opacity-85 transition-opacity"
                    />

                    {/* Top badge counter overlay */}
                    <div className="absolute top-2.5 left-2.5 z-10 font-mono text-[10px] font-black bg-black/85 border border-white/10 text-cyan-400 rounded px-2 py-0.5 shadow-sm">
                      PG {index + 1}
                    </div>

                    {/* Action overlays visible on hover */}
                    <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity pointer-events-none" />

                    {/* Floating Action Bars */}
                    <div className="z-10 absolute bottom-2.5 inset-x-2.5 flex items-center justify-between gap-1.5 opacity-90 sm:opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                      <div className="flex gap-1 bg-black/60 p-0.5 rounded-lg border border-white/5">
                        {/* Move Left */}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleMoveLeft(index); }}
                          disabled={index === 0}
                          className="h-7.5 w-7.5 flex items-center justify-center bg-transparent hover:bg-white/5 rounded text-[#94A3B8] hover:text-white disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer"
                          title="Move Page Back"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </button>

                        {/* Move Right */}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleMoveRight(index); }}
                          disabled={index === images.length - 1}
                          className="h-7.5 w-7.5 flex items-center justify-center bg-transparent hover:bg-white/5 rounded text-[#94A3B8] hover:text-white disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer"
                          title="Move Page Forward"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Trash */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDeleteImage(item.id, item.objectUrl); }}
                        className="h-7.5 w-7.5 flex items-center justify-center bg-rose-950/90 border border-rose-500/20 rounded-lg text-rose-300 hover:bg-rose-900/90 transition cursor-pointer shadow-lg"
                        title="Remove Image"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Simple text info element */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 truncate text-[9px] font-mono text-white/70 bg-black/70 py-0.5 px-1.5 rounded pointer-events-none group-hover/thumb:hidden border border-white/5">
                      {formatBytes(item.size)}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Compile button action block */}
            <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-[#94A3B8]/80 text-center sm:text-left leading-relaxed">
                Conversion renders instantly inside memory threads with standard aspect sizing.
              </div>

              <button
                onClick={handleCompileImagesToPdf}
                disabled={images.length === 0 || isProcessing}
                className="w-full sm:w-auto overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-500 p-[1.5px] font-sans text-sm font-bold tracking-wide text-white transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] active:scale-95 disabled:scale-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex justify-center items-center"
              >
                <span className="w-full h-full flex items-center justify-center gap-2 bg-[#0C1123]/95 hover:bg-transparent px-8 py-3.5 rounded-[15px] transition-colors duration-200">
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-cyan-300" />
                      Synthesizing Assets...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-purple-300 animate-pulse" />
                      Synthesize PDF Document
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
