import { Layers, Github, Heart, Globe, Mail } from 'lucide-react';
import { ToolId } from '../types';

interface FooterProps {
  onSelectTool: (tool: ToolId) => void;
}

export default function Footer({ onSelectTool }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const handleNavClick = (toolId: ToolId) => {
    onSelectTool(toolId);
  };

  return (
    <footer className="border-t border-white/5 bg-[#0B1020] pt-16 pb-8 text-[#94A3B8]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-8">
          
          {/* Brand block */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => handleNavClick('all')}>
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] p-[1px]">
                <div className="flex h-full w-full items-center justify-center rounded-[7px] bg-[#121A2F]">
                  <Layers className="h-4 w-4 text-cyan-400 group-hover:text-purple-400 transition-colors" />
                </div>
              </div>
              <span className="bg-gradient-to-r from-white to-indigo-100 bg-clip-text text-lg font-bold tracking-wider text-transparent">
                PDF<span className="text-cyan-400">usion</span>
              </span>
            </div>
            
            <p className="mt-4 text-sm max-w-sm leading-relaxed text-[#94A3B8]">
              A next-generation browser-integrated PDF suite. Merges, converts, and crafts elegant documents 
              entirely within your sandboxed browser environment with zero external server transits.
            </p>

            <span className="block mt-6 text-xs text-slate-500 font-mono">
              Build v1.2 • Wasm Thread Isolated • Offline Allowed
            </span>
          </div>

          {/* Quick links block */}
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Processing Modules
            </h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => handleNavClick('merge')}
                  className="hover:text-white transition cursor-pointer text-[#94A3B8]"
                >
                  Merge Stream
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNavClick('jpg-to-pdf')}
                  className="hover:text-white transition cursor-pointer text-[#94A3B8]"
                >
                  JPG to PDF Synth
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNavClick('all')}
                  className="hover:text-white transition cursor-pointer text-[#94A3B8]"
                >
                  All Tools Menu
                </button>
              </li>
            </ul>
          </div>

          {/* Security details block */}
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Security Node
            </h4>
            <ul className="mt-4 space-y-2 text-sm font-mono text-xs">
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Client-only (Wasm)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Server upload bypass
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> RAM-wiped on exit
              </li>
            </ul>
          </div>
        </div>

        {/* Divider and bottom credits */}
        <div className="mt-12 border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-[#94A3B8]/60">
          <div>
            © {currentYear} PDFusion Client Suite. No rights reserved. Deployable static build.
          </div>

          <div className="flex items-center gap-1.5 text-center">
            <span>Crafted with</span>
            <Heart className="h-3.5 w-3.5 text-red-500 animate-pulse fill-red-500/20" />
            <span>for direct browser processing</span>
          </div>

          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-cyan-400 transition" title="Global Web link">
              <Globe className="h-4 w-4" />
            </a>
            <a href="#" className="hover:text-purple-400 transition" title="Source repository code">
              <Github className="h-4 w-4" />
            </a>
            <a href="mailto:support@pdfusion.app" className="hover:text-pink-400 transition" title="Email dispatch">
              <Mail className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
