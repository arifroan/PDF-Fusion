import { ElementType } from 'react';
import { motion } from 'motion/react';
import { Layers, Image, Scissors, Minimize2, FileImage, Type, Rocket, Ban, Tag, Unlock, FolderArchive } from 'lucide-react';
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
      badge: 'ACTIVE',
      icon: Scissors,
      color: 'purple',
      latency: 'Split Splicer',
    },
    {
      id: 'compress',
      title: 'Compress PDF Mass',
      description: 'Shrink file sizes instantly using client-side downsampling algorithms.',
      badge: 'ACTIVE',
      icon: Minimize2,
      color: 'cyan',
      latency: 'RAM Optimizer',
    },
    {
      id: 'pdf-to-jpg',
      title: 'PDF to Image Export',
      description: 'Extract raw vector and raster pages from any PDF document to crisp image segments.',
      badge: 'ACTIVE',
      icon: FileImage,
      color: 'cyan',
      latency: 'Dual-Canvas GPU',
    },
    {
      id: 'metadata',
      title: 'Edit PDF Metadata',
      description: 'View and edit basic PDF metadata fields like Title, Author, and Subject before saving.',
      badge: 'ACTIVE',
      icon: Tag,
      color: 'slate',
      latency: 'Instant Inject',
    },
    {
      id: 'unlock',
      title: 'Unlock Protected PDF',
      description: 'Remove encryption and password protection from secure PDFs using your password.',
      badge: 'ACTIVE',
      icon: Unlock,
      color: 'purple',
      latency: 'Instant Decryption',
    },
    {
      id: 'watermark',
      title: 'Inject Watermark',
      description: 'Overlay custom texts onto PDF files with transparency, custom colors, sizing, and position templates.',
      badge: 'ACTIVE',
      icon: Type,
      color: 'cyan',
      latency: 'Instant Layering',
    },
    {
      id: 'batch',
      title: 'Unified Batch Processor',
      description: 'Queue multiple PDF files to apply compression, watermarks, metadata, or unlock commands in bulk, then download as a single ZIP archive.',
      badge: 'ACTIVE',
      icon: FolderArchive,
      color: 'purple',
      latency: 'Instant Batch ZIP',
    },
  ];

  const handleCardClick = (tool: ToolCard) => {
    if (tool.badge !== 'ACTIVE') return;
    onSelectTool(tool.id);
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
              className={`rounded-xl px-5 py-2.5 text-xs font-semibold font-mono tracking-wide transition-colors duration-150 border cursor-pointer ${
                activeTool === 'all'
                  ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                  : 'bg-white/5 border-white/5 text-[#94A3B8] hover:text-white hover:border-white/10'
              }`}
            >
              SHOW ALL MODULES
            </button>
          </div>
        </div>

        {/* Grid System */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool, index) => {
            const IconComponent = tool.icon;
            const isActive = tool.badge === 'ACTIVE';
            const isCurrentlySelected = activeTool === tool.id;

            return (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.5,
                    delay: index * 0.08,
                    ease: "easeOut"
                  }
                }}
                viewport={{ once: true, margin: "-40px" }}
                whileHover={
                  isActive
                    ? {
                        y: -5,
                        scale: 1.015,
                        boxShadow:
                          tool.color === 'purple'
                            ? '0 12px 30px -10px rgba(124, 58, 237, 0.22)'
                            : '0 12px 30px -10px rgba(6, 182, 212, 0.22)',
                      }
                    : {}
                }
                transition={{ type: "spring", stiffness: 450, damping: 25 }}
                className={`relative flex flex-col justify-between overflow-hidden rounded-2xl p-6.5 border transition-all duration-200 select-none group ${
                  isCurrentlySelected
                    ? 'border-cyan-400 bg-[#121A2F] shadow-[0_0_20px_rgba(6, 182, 212, 0.15)]'
                    : isActive
                    ? tool.color === 'purple'
                      ? 'border-white/15 bg-[#121A2F] hover:border-purple-500/50 hover:bg-[#161E33] cursor-pointer'
                      : 'border-white/15 bg-[#121A2F] hover:border-cyan-500/50 hover:bg-[#111A30] cursor-pointer'
                    : 'border-white/5 bg-[#0E1326]/60 opacity-50'
                } gpu-accel`}
                onClick={() => handleCardClick(tool)}
              >


                <div>
                  {/* Card Header Info */}
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200 ${
                        tool.color === 'purple'
                          ? 'bg-purple-950/40 text-purple-400 border border-purple-500/10 group-hover:scale-110 group-hover:bg-purple-950/70 group-hover:border-purple-500/30'
                          : tool.color === 'cyan'
                          ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/10 group-hover:scale-110 group-hover:bg-cyan-950/70 group-hover:border-cyan-500/30'
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
                  <h3 className={`mt-5 text-lg font-bold text-white transition-colors duration-200 ${
                    isActive
                      ? tool.color === 'purple'
                        ? 'group-hover:text-purple-400'
                        : 'group-hover:text-cyan-400'
                      : ''
                  }`}>
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
