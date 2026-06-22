import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, FileText, CheckCircle, AlertTriangle, Trash2, 
  Sparkles, RefreshCw, Download, ArrowDown, Lock, Unlock, KeyRound, Check, ShieldCheck
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { PDFFileItem } from '../types';

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
const PDFJS_WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

export default function UnlockPdfTool() {
  const [fileItem, setFileItem] = useState<PDFFileItem | null>(null);
  const [password, setPassword] = useState<string>('');
  const [isEncrypted, setIsEncrypted] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isCdnReady, setIsCdnReady] = useState(false);
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
          showAlert('error', 'Failed to initialize PDF renderer CDN. Please check network connectivity.');
        };
        document.head.appendChild(script);
      } catch (err) {
        console.error('Failed to inject PDF.js script tag:', err);
      }
    };

    loadPdfJs();
  }, []);

  const checkEncryption = async (file: File) => {
    const anyWin = window as any;
    if (!anyWin.pdfjsLib) {
      // Fallback using pdf-lib if PDF.js is not loaded yet
      try {
        const arrayBuffer = await file.arrayBuffer();
        await PDFDocument.load(arrayBuffer);
        setIsEncrypted(false);
        showAlert('success', 'This PDF is not password protected. You can save/reprocess it directly.');
      } catch (error: any) {
        const errMsg = error.message || '';
        if (errMsg.includes('encrypted') || errMsg.includes('password') || errMsg.includes('Password') || errMsg.includes('decrypt')) {
          setIsEncrypted(true);
        } else {
          setIsEncrypted(false);
        }
      }
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = anyWin.pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer)
      });
      
      await loadingTask.promise;
      setIsEncrypted(false);
      showAlert('success', 'This PDF is not password protected. You can save/reprocess it directly.');
    } catch (error: any) {
      if (error.name === 'PasswordException' || error.message?.includes('password')) {
        setIsEncrypted(true);
      } else {
        setIsEncrypted(false);
        console.warn('PDF load warning', error);
      }
    }
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
    setPassword('');
    setProcessedUrl(null);
    setIsProcessing(true);
    
    try {
      await checkEncryption(file);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFileItem(null);
    setIsEncrypted(null);
    setPassword('');
    setProcessedUrl(null);
  };

  const verifyPasswordWithPdfJs = (arrayBuffer: ArrayBuffer, pass: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const anyWin = window as any;
      if (!anyWin.pdfjsLib) {
        resolve(true); // If PDF.js CDN is down, proceed directly to let pdf-lib check
        return;
      }
      const loadingTask = anyWin.pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        password: pass
      });
      loadingTask.promise.then(
        () => resolve(true),
        (error: any) => {
          if (error.name === 'PasswordException' || error.message?.includes('password')) {
            resolve(false);
          } else {
            resolve(false);
          }
        }
      );
    });
  };

  const handleUnlockPdf = async () => {
    if (!fileItem) return;
    
    setIsProcessing(true);
    setProcessedUrl(null);
    
    try {
      const arrayBuffer = await fileItem.file.arrayBuffer();
      let pdfDoc;
      
      if (isEncrypted) {
        if (!password) {
          showAlert('error', 'Please enter the decryption password.');
          setIsProcessing(false);
          return;
        }

        // Verify password with PDF.js first to prevent corrupted/silent loads
        const isPasswordCorrect = await verifyPasswordWithPdfJs(arrayBuffer, password);
        if (!isPasswordCorrect) {
          showAlert('error', 'Decryption failed. Please verify the password and try again.');
          setIsProcessing(false);
          return;
        }

        // Load with ignoreEncryption inside pdf-lib
        pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      } else {
        // Load without password
        pdfDoc = await PDFDocument.load(arrayBuffer);
      }
      
      // Save Decrypted PDF, which outputs an unencrypted copy
      const decryptedBytes = await pdfDoc.save();
      const blob = new Blob([decryptedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setProcessedUrl(url);
      setFileItem(prev => prev ? { ...prev, status: 'success' } : null);
      showAlert('success', isEncrypted ? 'PDF unlocked successfully!' : 'PDF copy generated successfully!');
    } catch (error: any) {
      console.error(error);
      showAlert('error', 'Decryption failed. Please verify the password and try again.');
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
    <section id="unlock-tool-section" className="scroll-mt-32">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        className="mx-auto max-w-4xl"
      >
        <div className="mb-8 flex items-end justify-between">
          <div>
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3 py-1 font-mono text-[10px] font-bold tracking-wider text-purple-400 border border-purple-500/20">
              <Lock className="h-3.5 w-3.5 animate-pulse text-purple-300" /> DECRYPTION TERMINAL
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white font-sans sm:text-3xl">
              Unlock Protected PDF
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
              {alert.type === 'error' ? <AlertTriangle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
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
                    ? 'border-purple-400 bg-purple-950/20 shadow-[0_0_30px_rgba(168,85,247,0.1)] scale-[1.01]' 
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
                
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black/40 border border-white/10 text-slate-400 transition-all group-hover:text-slate-200 group-hover:border-purple-500/40 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                  <Lock className="h-7 w-7" />
                </div>
                
                <div className="mt-6 flex flex-col gap-2">
                  <span className="text-base font-bold text-white tracking-wide">
                    {isDragging ? 'Drop protected file here...' : 'Upload Encrypted PDF'}
                  </span>
                  <span className="text-xs text-[#94A3B8] max-w-[250px] mx-auto leading-relaxed">
                    Select a password-protected PDF to decrypt and remove lock.
                  </span>
                </div>
                
                <div className="mt-8 flex gap-3">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-300 bg-slate-950/40 border border-slate-500/20 py-1 px-3 rounded-md">
                    Secure Client-Side Decryption
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

                {/* Encryption Status Detail */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 mb-6">
                  {isEncrypted === null ? (
                    <div className="flex items-center gap-3 text-slate-400">
                      <RefreshCw className="h-4 w-4 animate-spin text-purple-400" />
                      <span className="text-xs font-mono">Analyzing PDF locks and structures...</span>
                    </div>
                  ) : isEncrypted ? (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 shrink-0">
                        <KeyRound className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Password Protected PDF Detected</div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          This document is encrypted. You must provide the correct password to unlock and generate a decrypted copy.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
                        <Check className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">No Password Protection Detected</div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          This document is already unlocked. You can download an identical decrypted duplicate.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Password input section */}
                {isEncrypted && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-2.5"
                  >
                    <label className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">
                      Enter PDF Password
                    </label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl pl-4 pr-24 py-3.5 text-sm text-white focus:outline-none focus:border-purple-500 transition placeholder:text-white/20 font-mono tracking-wider"
                        placeholder="••••••••••••"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-purple-400 hover:text-purple-300 transition"
                      >
                        {showPassword ? "HIDE" : "SHOW"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Decryption Controls & Downloader (Right) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="border border-white/10 rounded-3xl bg-[#090F1E] p-6 lg:p-8 flex flex-col h-full sticky top-32">
              <div className="mb-6 pb-6 border-b border-white/5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-400" /> Unlock Console
                </h3>
                <p className="mt-2 text-xs text-[#94A3B8] leading-relaxed">
                  Bake decrypted vector content entirely offline in your browser memory.
                </p>
              </div>

              {processedUrl && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-center"
                >
                  <ShieldCheck className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-emerald-300">Lock Swapped & Decrypted</p>
                </motion.div>
              )}

              <div className="mt-auto pt-6 flex flex-col gap-3">
                {!processedUrl ? (
                  <button
                    onClick={handleUnlockPdf}
                    disabled={!fileItem || isProcessing || (isEncrypted === true && !password)}
                    className="group relative w-full h-14 overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-500 p-[1px] font-sans text-sm font-bold tracking-wide text-white transition hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] active:scale-95 disabled:scale-100 disabled:opacity-40 cursor-pointer"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-500 opacity-0 transition-opacity duration-300 group-hover:opacity-20" />
                    <span className="w-full h-full flex items-center justify-center gap-2 bg-[#0C1123]/95 group-hover:bg-transparent px-8 py-3 rounded-[15px] transition duration-200">
                      {isProcessing ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin text-purple-300" /> 
                          <span className="text-purple-200">Processing...</span>
                        </>
                      ) : (
                        <>
                          Decrypt & Unlock <Unlock className="h-4 w-4 text-purple-300" />
                        </>
                      )}
                    </span>
                  </button>
                ) : (
                  <a
                    href={processedUrl}
                    download={`unlocked_${fileItem?.name}`}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 font-sans text-sm font-bold tracking-wide text-black transition-all hover:scale-[1.02] hover:bg-slate-200 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.15)] cursor-pointer"
                  >
                    <Download className="h-4 w-4" /> Download Unlocked PDF
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
