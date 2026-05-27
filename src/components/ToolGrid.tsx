import { ElementType } from 'react';
import { motion } from 'motion/react';
import { Layers, Image, Scissors, Minimize2, FileImage, Type, Rocket, Ban } from 'lucide-react';
import { ToolId } from '../types';

interface ToolGridProps {
  onSelectTool: (tool: ToolId) => void;
  activeTool: ToolId;
}

interface ToolCard {
  id: ToolId;
  title: string;
  description: string;
  badge: 'ACTIVE' | 'ALPHA' | 'COMING SOON';
  icon: ElementType;
  color: 'purple' | 'cyan' | 'slate';
  latency: string;
}

export default function ToolGrid({ onSelectTool, activeTool }: ToolGridProps) {
  const tools: ToolCard[] = [
    {
      id: 'merge',
      title: 'Merge PDF Stream',
      description: 'Combine multiple PDF files into a single document in any chronological layout.',
      badge: 'ACTIVE',
      icon: Layers,
      color: 'purple',
      latency: 'Instant Wasm',
    },
    {
      id: 'jpg-to-pdf',
      title: 'JPG to PDF Synth',
      description: 'Convert groups of JPG/JPEG images into an elegantly bound single PDF file.',
      badge: 'ACTIVE',
      icon: Image,
      color: 'cyan',
      latency: 'Local Memory',
    },
    {
      id: 'split',
      title: 'Split PDF Structure',
      description: 'Deconstruct a PDF into individual files page-by-page or export pre-selected segments.',
      badge: 'COMING SOON',
      icon: Scissors,
      color: 'slate',
      latency: 'v2 Core Queue',
    },
    {
      id: 'compress',
      title: 'Compress PDF Mass',
      description: 'Shrink file sizes instantly using client-side downsampling algorithms.',
      badge: 'COMING SOON',
      icon: Minimize2,
      color: 'slate',
      latency: 'v2 Core Queue',
    },
    {
      id: 'pdf-to-jpg',
      title: 'PDF to Image Export',
      description: 'Extract raw vector and raster pages from any PDF document to crisp image segments.',
      badge: 'COMING SOON',
      icon: FileImage,
      color: 'slate',
      latency: 'v2 Core Queue',
    },
    {
      id: 'watermark',
      title: 'Inject Watermark',
      description: 'Overlay custom texts or responsive logos onto PDF files with transparency scales.',
      badge: 'COMING SOON',
      icon: Type,
      color: 'slate',
      latency: 'v2 Core Queue',
    },
  ];

  const handleCardClick = (tool: ToolCard) => {
    if (tool.badge !== 'ACTIVE') return;
    onSelectTool(tool.id);
    
    // Auto scroll directly to the tool with offset
    setTimeout(() => {
      const sectionId = tool.id === 'merge' ? 'merge-tool-section' : 'jpg-pdf-tool-section';
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  return (
    <section id="tools-container" className="py-16 relative scroll-mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center md:text-left mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl font-sans bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Quantum Processing Node Menu
            </h2>
            <p className="mt-3 text-sm text-[#94A3B8] max-w-2xl font-light leading-relaxed">
              Select a specialized action module. All computations complete entirely within browser memory space.
            </p>
          </div>
          <div className="flex gap-2 justify-center md:justify-start">
            <button
              onClick={() => onSelectTool('all')}
              className={`rounded-xl px-5 py-2.5 text-xs font-semibold font-mono tracking-wide transition-all duration-300 border backdrop-blur-md cursor-pointer ${
                activeTool === 'all'
                  ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'bg-white/5 border-white/5 text-[#94A3B8] hover:text-white hover:border-white/10'
              }`}
            >
              SHOW ALL MODULES
            </button>
          </div>
        </div>

        {/* Grid System */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const IconComponent = tool.icon;
            const isActive = tool.badge === 'ACTIVE';
            const isCurrentlySelected = activeTool === tool.id;

            return (
              <motion.div
                key={tool.id}
                whileHover={isActive ? { y: -6, scale: 1.02 } : {}}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`relative flex flex-col justify-between overflow-hidden rounded-2xl p-6.5 backdrop-blur-xl transition-all duration-300 select-none ${
                  isCurrentlySelected
                    ? 'border-cyan-400/80 bg-[#121A2F]/80 shadow-[0_0_30px_rgba(6,182,212,0.2)]'
                    : isActive
                    ? 'border-white/5 bg-white/[0.03] hover:border-purple-500/30 hover:bg-white/[0.06] cursor-pointer'
                    : 'border-white/[0.02] bg-[#0E1326]/40 opacity-50'
                }`}
                onClick={() => handleCardClick(tool)}
              >
                {/* Visual Glow Effect */}
                {isActive && (
                  <div
                    className={`absolute -top-12 -right-12 h-28 w-28 rounded-full blur-[45px] opacity-25 pointer-events-none transition-all duration-300 ${
                      tool.color === 'purple' ? 'bg-purple-500' : 'bg-cyan-500'
                    }`}
                  />
                )}

                <div>
                  {/* Card Header Info */}
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl transition-transform ${
                        tool.color === 'purple'
                          ? 'bg-purple-950/40 text-purple-400 border border-purple-500/10'
                          : tool.color === 'cyan'
                          ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/10'
                          : 'bg-slate-900/40 text-[#94A3B8] border border-white/5'
                      }`}
                    >
                      <IconComponent className="h-6 w-6" />
                    </div>

                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-mono font-medium tracking-wider border ${
                        tool.badge === 'ACTIVE'
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                          : tool.badge === 'ALPHA'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          : 'bg-white/5 text-[#94A3B8] border-white/5'
                      }`}
                    >
                      {tool.badge}
                    </span>
                  </div>

                  {/* Body Text */}
                  <h3 className="mt-5 text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="mt-2 text-sm text-[#94A3B8] leading-relaxed font-light">
                    {tool.description}
                  </p>
                </div>

                {/* Card footer details */}
                <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4 text-xs font-mono">
                  <span className="text-[#94A3B8]/60 flex items-center gap-1.5">
                    {isActive ? (
                      <Rocket className="h-3.5 w-3.5 text-cyan-400" />
                    ) : (
                      <Ban className="h-3.5 w-3.5 text-slate-500" />
                    )}
                    {tool.latency}
                  </span>
                  
                  {isActive ? (
                    <span
                      className={`text-xs font-semibold hover:underline font-sans cursor-pointer ${
                        tool.color === 'purple' ? 'text-purple-400' : 'text-cyan-400'
                      }`}
                    >
                      Activate module &darr;
                    </span>
                  ) : (
                    <span className="text-[#94A3B8]/40">Locked</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
