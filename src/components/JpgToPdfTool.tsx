import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, Image as ImageIcon, CheckCircle, AlertTriangle, Trash2, 
  ArrowLeft, ArrowRight, Sparkles, RefreshCw, SlidersHorizontal, Eye
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
        let isJpg = true;

        const lowercaseName = item.name.toLowerCase();
        const isPng = lowercaseName.endsWith('.png');

        if (isPng) {
          try {
            embeddedImage = await pdfDoc.embedPng(fileBytes);
            isJpg = false;
          } catch {
            // fallback if it was mislabeled
            embeddedImage = await pdfDoc.embedJpg(fileBytes);
          }
        } else {
          try {
            embeddedImage = await pdfDoc.embedJpg(fileBytes);
          } catch {
            // fallback trigger if it is PNG in actual data structure
            embeddedImage = await pdfDoc.embedPng(fileBytes);
            isJpg = false;
          }
        }

        const imgWidth = embeddedImage.width;
        const imgHeight = embeddedImage.height;

        // Establish target Page Box Dimensions
        let pageWidth = 0;
        let pageHeight = 0;

        if (config.pageSize === 'FIT') {
          // Fit page strictly to the original dimensions with standard orientation overrides if requested
          if (config.orientation === 'landscape' && imgHeight > imgWidth) {
            // Rotate the aspect target
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
          // Select predetermined frame sizes
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

        // Calculate available area inside the page constraints (subtracting margins)
        const activeWidth = pageWidth - (selectedMargin * 2);
        const activeHeight = pageHeight - (selectedMargin * 2);

        // Aspect fit calculation rules
        const imageRatio = imgWidth / imgHeight;
        const cardRatio = activeWidth / activeHeight;

        let drawWidth = activeWidth;
        let drawHeight = activeHeight;

        if (imageRatio > cardRatio) {
          // Limited by width
          drawWidth = activeWidth;
          drawHeight = activeWidth / imageRatio;
        } else {
          // Limited by height
          drawHeight = activeHeight;
          drawWidth = activeHeight * imageRatio;
        }

        // Recenter drawing offset calculation within the page limits
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

      // 3. Serialize and trigger the client-side downloader
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
    <section id="jpg-pdf-tool-section" className="py-12 relative scroll-mt-20">
      <div className="mx-auto max-w-5xl rounded-3xl border border-white/5 bg-[#121A2F]/60 p-6 sm:p-8 backdrop-blur-2xl shadow-xl">
        
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/5 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-sans">JPG to PDF Synth</h3>
              <p className="text-xs text-[#94A3B8]">
                Pack JPG, JPEG, or PNG images into an elegant vector bounding-box PDF instantly.
              </p>
            </div>
          </div>

          {images.length > 0 && (
            <button
              onClick={handleReset}
              disabled={isProcessing}
              className="px-3 py-1.5 self-start sm:self-center text-xs border border-white/10 hover:border-white/20 rounded-lg text-slate-300 transition-all cursor-pointer disabled:opacity-50 font-sans"
            >
              Reset Compiler
            </button>
          )}
        </div>

        {/* Dynamic Alerts container */}
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
                <span className="font-semibold">{alert.type === 'success' ? 'Task Completed: ' : 'Error Warning: '}</span>
                {alert.message}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Configuration sliders/menus panel */}
        <div className="mb-8 rounded-2xl border border-white/5 bg-white/[0.01] p-5">
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
                  className={`rounded-lg text-xs font-medium transition cursor-pointer ${
                    config.orientation === 'portrait'
                      ? 'bg-[#7C3AED] text-white'
                      : 'bg-white/5 text-[#94A3B8] hover:bg-white/10'
                  }`}
                >
                  Portrait
                </button>
                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, orientation: 'landscape' }))}
                  className={`rounded-lg text-xs font-medium transition cursor-pointer ${
                    config.orientation === 'landscape'
                      ? 'bg-[#7C3AED] text-white'
                      : 'bg-white/5 text-[#94A3B8] hover:bg-white/10'
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
                className="h-10 rounded-lg bg-white/5 border border-white/5 text-[#94A3B8] px-3 text-xs outline-none focus:border-cyan-500/50 cursor-pointer"
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
                    className={`rounded-lg text-[10px] font-mono font-medium capitalize transition cursor-pointer ${
                      config.margin === marginOpt
                        ? 'bg-cyan-500/25 border border-cyan-500/40 text-cyan-400'
                        : 'bg-white/5 border border-transparent text-[#94A3B8] hover:bg-white/10'
                    }`}
                  >
                    {marginOpt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Upload Drop area style hook */}
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleSelectClick}
          className={`relative cursor-pointer group flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all duration-300 ${
            isDragging
              ? 'border-cyan-400 bg-cyan-950/10 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
              : 'border-white/10 bg-white/[0.01] hover:border-cyan-500/30 hover:bg-white/[0.03]'
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

          <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500/5 via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl -z-10" />

          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 border border-white/5 text-[#94A3B8] transition-colors group-hover:text-cyan-400 group-hover:border-cyan-500/30">
            <Upload className="h-6 w-6 group-hover:scale-110 transition-transform" />
          </div>

          <h4 className="mt-4 text-base font-bold text-white">
            Drag & drop images here to construct album
          </h4>
          <p className="mt-2 text-xs text-[#94A3B8]">
            Or <span className="text-cyan-400 group-hover:underline">browse files</span> from your gallery (Supports JPG, JPEG, and PNG)
          </p>
          <span className="mt-3 text-[10px] uppercase font-mono tracking-wider text-slate-500 bg-white/5 py-1 px-2.5 rounded">
            Highly optimized for mobile camera frames
          </span>
        </div>

        {/* Images Thumbnails Grid */}
        {images.length > 0 && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono tracking-wider text-[#94A3B8] uppercase">
                Pages Stream ({images.length} images queued)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Order Left-to-Right / Top-to-Bottom
              </span>
            </div>

            {/* Grid display layout */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((item, index) => (
                <div
                  key={item.id}
                  className="group/thumb relative aspect-[3/4] bg-slate-950/50 rounded-xl overflow-hidden border border-white/5 hover:border-cyan-500/30 transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Thumbnail Image display */}
                  <img
                    src={item.objectUrl}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover/thumb:opacity-75 transition-opacity"
                  />

                  {/* Top badge counter overlay */}
                  <div className="absolute top-2 left-2 z-10 font-mono text-[10px] bg-black/70 border border-white/10 text-white rounded px-1.5 py-0.5">
                    Pg {index + 1}
                  </div>

                  {/* Action overlays visible on hover */}
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity pointer-events-none" />

                  {/* Floating Action Bars */}
                  <div className="z-10 absolute bottom-2 inset-x-2 flex items-center justify-between gap-1.5 opacity-90 group-hover/thumb:opacity-100 transition-opacity">
                    <div className="flex gap-1">
                      {/* Move Left */}
                      <button
                        type="button"
                        onClick={() => handleMoveLeft(index)}
                        disabled={index === 0}
                        className="h-7 w-7 flex items-center justify-center bg-black/80 border border-white/10 hover:border-white/25 rounded text-[#94A3B8] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
                        title="Move Page Back"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </button>

                      {/* Move Right */}
                      <button
                        type="button"
                        onClick={() => handleMoveRight(index)}
                        disabled={index === images.length - 1}
                        className="h-7 w-7 flex items-center justify-center bg-black/80 border border-white/10 hover:border-white/25 rounded text-[#94A3B8] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
                        title="Move Page Forward"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Trash */}
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(item.id, item.objectUrl)}
                      className="h-7 w-7 flex items-center justify-center bg-rose-950/90 border border-rose-500/20 rounded text-rose-300 hover:bg-rose-900 transition cursor-pointer"
                      title="Remove Image"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Simple text info element */}
                  <div className="absolute bottom-2 left-2 right-2 truncate text-[9px] font-mono text-white/50 bg-black/60 px-1 rounded pointer-events-none group-hover/thumb:hidden">
                    {formatBytes(item.size)}
                  </div>
                </div>
              ))}
            </div>

            {/* Compile button action block */}
            <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-[#94A3B8]/80 text-center sm:text-left">
                Conversion renders instantly. Config choice: <span className="text-cyan-400 capitalize font-medium">{config.pageSize}</span>, page aspect fits.
              </div>

              <button
                onClick={handleCompileImagesToPdf}
                disabled={images.length === 0 || isProcessing}
                className="w-full sm:w-auto px-6 py-3 cursor-pointer rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 font-semibold text-white tracking-wide transition-all select-none hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:brightness-110 active:scale-95 disabled:scale-100 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-cyan-200" />
                    Baking Vector Sheets...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-purple-300 animate-pulse" />
                    Synthesize PDF Document
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
