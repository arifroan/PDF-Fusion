import { motion } from 'motion/react';
import { ShieldAlert, Zap, Layers, RefreshCw } from 'lucide-react';
import { ToolId } from '../types';

interface HeroProps {
  onSelectTool: (tool: ToolId) => void;
}

export default function Hero({ onSelectTool }: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
        
        {/* Core Tag */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/20 px-4 py-1.5 text-xs text-purple-300 backdrop-blur-md mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500"></span>
          </span>
          <span>Next-Generation 100% Local PDF Engine</span>
        </motion.div>

        {/* Quantum Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl font-sans"
        >
          <span className="block bg-gradient-to-r from-white via-slate-100 to-[#94A3B8] bg-clip-text text-transparent">
            Assemble & Transform PDFs
          </span>
          <span className="block mt-2 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            at Quantum Speed
          </span>
        </motion.h1>

        {/* Short Mission Detail */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-base md:text-lg text-[#94A3B8]"
        >
          Fast, beautiful, and fully secure. Process, merge, and convert files entirely in your 
          device's system RAM. Underpinned by <span className="text-cyan-400 font-medium">pdf-lib</span> 
          with zero server-side latency or privacy risk.
        </motion.p>

        {/* Call to Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex flex-wrap justify-center gap-4"
        >
          <button
            onClick={() => {
              const el = document.getElementById('merge-tool-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              } else {
                onSelectTool('merge');
              }
            }}
            className="group relative cursor-pointer overflow-hidden rounded-xl bg-[#7C3AED] px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] active:scale-95"
          >
            <span className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-200 transition-transform duration-300 group-hover:rotate-6" />
              Merge Document Stream
            </span>
          </button>
          
          <button
            onClick={() => {
              const el = document.getElementById('jpg-pdf-tool-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              } else {
                onSelectTool('jpg-to-pdf');
              }
            }}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-white/5 active:scale-95 hover:bg-white/10 px-6 py-3.5 text-sm font-semibold text-[#94A3B8] hover:text-white transition-all duration-300"
          >
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-cyan-400" /> Convert JPG to PDF
            </span>
          </button>
        </motion.div>

        {/* Floating live parameters status card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mx-auto mt-16 max-w-4xl rounded-2xl border border-white/5 bg-white/[0.03] p-6 backdrop-blur-xl md:p-8"
        >
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.02]">
              <span className="text-xl md:text-2xl font-black text-cyan-400">0 ms</span>
              <span className="text-[10px] md:text-xs font-mono tracking-wider text-[#94A3B8] uppercase mt-1">
                Server Wait-Time
              </span>
            </div>
            
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.02]">
              <span className="text-xl md:text-2xl font-black text-purple-400">100%</span>
              <span className="text-[10px] md:text-xs font-mono tracking-wider text-[#94A3B8] uppercase mt-1">
                Local Sandbox
              </span>
            </div>
            
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.02]">
              <span className="text-xl md:text-2xl font-black text-emerald-400">Offline</span>
              <span className="text-[10px] md:text-xs font-mono tracking-wider text-[#94A3B8] uppercase mt-1">
                Availability
              </span>
            </div>
            
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.02]">
              <span className="text-xl md:text-2xl font-black text-pink-400">Infinite</span>
              <span className="text-[10px] md:text-xs font-mono tracking-wider text-[#94A3B8] uppercase mt-1">
                File Queue caps
              </span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3 border-t border-white/5 pt-5 text-xs text-[#94A3B8]">
            <ShieldAlert className="h-4 w-4 text-cyan-500 animate-pulse" />
            <span>Files never transit to any database. Secure parsing performed inside web assembly threads natively.</span>
          </div>
        </motion.div>
      </div>

      {/* Decorative floating blur shapes */}
      <div className="absolute top-[40%] left-[10%] w-32 h-32 bg-purple-600/10 rounded-full blur-2xl animate-pulse pointer-events-none" />
      <div className="absolute top-[10%] right-[15%] w-40 h-40 bg-cyan-600/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
    </section>
  );
}
