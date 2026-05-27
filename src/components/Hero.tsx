import { motion } from 'motion/react';
import { ShieldAlert, Zap, Layers, Cpu } from 'lucide-react';
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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-[#0B1020]/80 px-4 py-2 text-xs text-cyan-300 md:backdrop-blur-xl mb-10 shadow-[0_0_15px_rgba(6,182,212,0.1)] laser-line gpu-accel"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500"></span>
          </span>
          <span className="font-mono tracking-wide">Next-Gen v1.2 • Zero Server Transit Local Core</span>
        </motion.div>

        {/* Quantum Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl font-black tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl font-sans leading-[1.1] md:leading-[1.05] gpu-accel"
        >
          <span className="block bg-gradient-to-b from-white via-slate-100 to-[#94A3B8] bg-clip-text text-transparent drop-shadow-sm">
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
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mt-8 max-w-2xl text-base md:text-lg lg:text-xl text-[#94A3B8] leading-relaxed font-light"
        >
          Welcome to the absolute apex of client-side document processing. Split, bind, merge and 
          synthesize static PDF documents instantly within your device's browser memory—powered natively 
          by <span className="text-cyan-400 font-semibold underline decoration-cyan-500/30 underline-offset-4">pdf-lib</span>.
        </motion.p>

        {/* Call to Actions with glowing border effects */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-5"
        >
          <button
            onClick={() => {
              const el = document.getElementById('merge-tool-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              } else {
                onSelectTool('merge');
              }
            }}
            className="w-full sm:w-auto overflow-hidden rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] p-[1.5px] font-sans text-sm font-bold tracking-wide text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(124,58,237,0.3)] active:scale-95 cursor-pointer flex justify-center items-center gpu-accel"
          >
            <span className="w-full h-full flex items-center justify-center gap-2 bg-[#0B1020]/95 px-8 py-4 rounded-[11px] hover:bg-transparent transition-colors duration-200">
              <Layers className="h-4 w-4 text-purple-300" />
              Launch Merge Stream
            </span>
          </button>
          
          <button
            onClick={() => {
              const el = document.getElementById('jpg-pdf-tool-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              } else {
                onSelectTool('jpg-to-pdf');
              }
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#121A2F]/80 hover:bg-[#1C2640] hover:border-white/20 active:scale-95 px-8 py-4.5 text-sm font-bold text-white transition-all duration-200 cursor-pointer md:backdrop-blur-md gpu-accel"
          >
            <Zap className="h-4 w-4 text-cyan-400" />
            JPG to PDF Synthesiser
          </button>
        </motion.div>

        {/* Floating live parameters status card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mt-20 max-w-5xl rounded-3xl border border-white/5 bg-[#121A2F]/85 p-8 md:backdrop-blur-xl shadow-[0_15px_40px_rgba(0,0,0,0.4)] relative overflow-hidden gpu-accel"
        >
          {/* Subtle outer neon indicators */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-60" />

          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#090F1E] border border-white/[0.02] hover:border-white/[0.05] transition-colors">
              <span className="text-2xl md:text-3xl font-black text-cyan-400 tracking-tight">0.0 ms</span>
              <span className="text-[10px] md:text-xs font-mono tracking-wider text-[#94A3B8] uppercase mt-2">
                Latency Queue
              </span>
            </div>
            
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#090F1E] border border-white/[0.02] hover:border-white/[0.05] transition-colors">
              <span className="text-2xl md:text-3xl font-black text-purple-400 tracking-tight">Pure Client</span>
              <span className="text-[10px] md:text-xs font-mono tracking-wider text-[#94A3B8] uppercase mt-2">
                Architecture
              </span>
            </div>
            
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#090F1E] border border-white/[0.02] hover:border-white/[0.05] transition-colors">
              <span className="text-2xl md:text-3xl font-black text-emerald-400 tracking-tight">Infinite</span>
              <span className="text-[10px] md:text-xs font-mono tracking-wider text-[#94A3B8] uppercase mt-2">
                File Batch limits
              </span>
            </div>
            
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#090F1E] border border-white/[0.02] hover:border-white/[0.05] transition-colors">
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

      {/* Decorative floating blur shapes - hidden on mobile to prevent paint lag on scrolling */}
      <div className="hidden md:block absolute top-[40%] left-[5%] w-48 h-48 bg-purple-600/5 rounded-full blur-[90px] pointer-events-none" />
      <div className="hidden md:block absolute top-[15%] right-[8%] w-56 h-56 bg-cyan-600/5 rounded-full blur-[100px] pointer-events-none" />
    </section>
  );
}
