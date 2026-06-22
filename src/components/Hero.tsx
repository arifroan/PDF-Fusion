import { motion } from 'motion/react';
import { ShieldAlert, Zap, Layers } from 'lucide-react';
import { ToolId } from '../types';

interface HeroProps {
  onSelectTool: (tool: ToolId) => void;
}

export default function Hero({ onSelectTool }: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-16 pb-20 md:pt-28 md:pb-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
        
        {/* Core Tag */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-[#0F1424] px-4 py-2 text-xs text-cyan-300 mb-10 gpu-accel"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500"></span>
          </span>
          <span className="font-mono tracking-wide">Next-Gen v1.2 • Zero Server Transit Local Core</span>
        </motion.div>

        {/* Quantum Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="text-5xl font-black tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl font-sans leading-[1.1] md:leading-[1.05] gpu-accel"
        >
          <span className="block bg-gradient-to-b from-white via-slate-100 to-[#94A3B8] bg-clip-text text-transparent">
            Synthesize & Refine
          </span>
          <span className="block mt-3 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent font-extrabold pb-2">
            Your PDF Sandbox
          </span>
        </motion.h1>

        {/* Short Mission Detail */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mx-auto mt-8 max-w-2xl text-base md:text-lg lg:text-xl text-[#94A3B8] leading-relaxed font-light"
        >
          Welcome to the absolute apex of client-side document processing. Split, bind, merge and 
          synthesize static PDF documents instantly within your device's browser memory—powered natively 
          by <span className="text-cyan-400 font-semibold underline decoration-cyan-500/30 underline-offset-4">pdf-lib</span>.
        </motion.p>

        {/* Call to Actions with glowing border effects */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-4"
        >
          <button
            onClick={() => onSelectTool('merge')}
            className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] p-[1px] font-sans text-sm font-bold tracking-wide text-white transition-transform hover:scale-[1.01] active:scale-95 cursor-pointer flex justify-center items-center gpu-accel"
          >
            <span className="w-full h-full flex items-center justify-center gap-2 bg-[#0B1020] px-8 py-4 rounded-[11px] hover:bg-transparent transition-colors duration-150">
              <Layers className="h-4 w-4 text-purple-300" />
              Launch Merge Stream
            </span>
          </button>
          
          <button
            onClick={() => onSelectTool('jpg-to-pdf')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#121A2F] hover:bg-[#1C2640] hover:border-white/20 active:scale-95 px-8 py-4.5 text-sm font-bold text-white transition-all duration-150 cursor-pointer gpu-accel"
          >
            <Zap className="h-4 w-4 text-cyan-400" />
            JPG to PDF Synthesiser
          </button>
        </motion.div>

        {/* Floating live parameters status card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mt-20 max-w-5xl rounded-3xl border border-white/5 bg-[#121A2F] p-8 shadow-md relative overflow-hidden gpu-accel"
        >
          {/* Subtle outer neon indicators */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-cyan-400/20" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-purple-500/20" />

          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#090F1E] border border-white/[0.02]">
              <span className="text-2xl md:text-3xl font-black text-cyan-400 tracking-tight">0.0 ms</span>
              <span className="text-[10px] md:text-xs font-mono tracking-wider text-[#94A3B8] uppercase mt-2">
                Latency Queue
              </span>
            </div>
            
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#090F1E] border border-white/[0.02]">
              <span className="text-2xl md:text-3xl font-black text-purple-400 tracking-tight">Pure Client</span>
              <span className="text-[10px] md:text-xs font-mono tracking-wider text-[#94A3B8] uppercase mt-2">
                Architecture
              </span>
            </div>
            
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#090F1E] border border-white/[0.02]">
              <span className="text-2xl md:text-3xl font-black text-emerald-400 tracking-tight">Infinite</span>
              <span className="text-[10px] md:text-xs font-mono tracking-wider text-[#94A3B8] uppercase mt-2">
                File Batch limits
              </span>
            </div>
            
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#090F1E] border border-white/[0.02]">
              <span className="text-2xl md:text-3xl font-black text-rose-400 tracking-tight">Wasm</span>
              <span className="text-[10px] md:text-xs font-mono tracking-wider text-[#94A3B8] uppercase mt-2">
                Isolation Mode
              </span>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-3 border-t border-white/5 pt-6 text-xs text-[#94A3B8] leading-relaxed">
            <ShieldAlert className="h-5 w-5 text-cyan-500 shrink-0" />
            <span>Files never exit your local device sandbox. Merges and JPG-to-PDF translations execute strictly in RAM.</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
