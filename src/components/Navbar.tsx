import { useState } from 'react';
import { Menu, X, Layers, Cpu, Shield, Sparkles } from 'lucide-react';
import { ToolId } from '../types';

interface NavbarProps {
  onSelectTool: (tool: ToolId) => void;
  activeTool: ToolId;
}

export default function Navbar({ onSelectTool, activeTool }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavClick = (toolId: ToolId) => {
    onSelectTool(toolId);
    setIsOpen(false);
    
    // Scroll to the tool container or grid
    if (toolId === 'all') {
      const el = document.getElementById('tools-container');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0B1020]/95 md:backdrop-blur-xl md:bg-[#0B1020]/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Brand */}
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => handleNavClick('all')}>
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] p-[1.5px] transition-transform duration-300 group-hover:scale-105">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#121A2F]">
                <Layers className="h-5 w-5 text-cyan-400 group-hover:text-purple-400 transition-colors duration-300" />
              </div>
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] opacity-30 blur-sm duration-300 group-hover:opacity-75" />
            </div>
            <span className="bg-gradient-to-r from-white via-indigo-100 to-cyan-400 bg-clip-text text-xl font-bold tracking-wider text-transparent font-sans">
              PDF<span className="text-cyan-400">usion</span>
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => handleNavClick('all')}
              className={`text-sm font-medium transition-all duration-300 hover:text-cyan-400 ${
                activeTool === 'all' ? 'text-cyan-400 shadow-cyan-500/10' : 'text-[#94A3B8]'
              }`}
            >
              All Tools
            </button>
            <button
              onClick={() => handleNavClick('merge')}
              className={`text-sm font-medium transition-all duration-300 hover:text-purple-400 ${
                activeTool === 'merge' ? 'text-purple-400' : 'text-[#94A3B8]'
              }`}
            >
              Merge PDF
            </button>
            <button
              onClick={() => handleNavClick('jpg-to-pdf')}
              className={`text-sm font-medium transition-all duration-300 hover:text-cyan-400 ${
                activeTool === 'jpg-to-pdf' ? 'text-cyan-400' : 'text-[#94A3B8]'
              }`}
            >
              JPG to PDF
            </button>
            <a
              href="#features-section"
              className="text-sm font-medium text-[#94A3B8] transition-all duration-300 hover:text-white"
            >
              Futuristic Engine
            </a>
          </div>

          {/* Action CTA */}
          <div className="hidden md:flex items-center gap-4">
            <span className="flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-950/30 px-3 h-8 text-[11px] font-mono tracking-wider text-cyan-400">
              <Cpu className="h-3 w-3 animate-spin duration-3000" /> Wasm-Core-v1.2
            </span>
            <button
              onClick={() => handleNavClick('merge')}
              className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] p-[1px] font-sans text-xs font-semibold tracking-wide text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]"
            >
              <span className="flex items-center gap-1.5 rounded-[11px] bg-[#0B1020] px-4 py-2 hover:bg-transparent transition-colors duration-300">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" /> Start Processing
              </span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <span className="flex items-center gap-1 rounded-full border border-purple-500/20 bg-purple-950/20 px-2.5 py-1 text-[9px] font-mono text-purple-400">
              LAN
            </span>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center rounded-lg p-2 text-[#94A3B8] hover:bg-[#121A2F] hover:text-white"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-b border-white/5 bg-[#0A0E1A] gpu-accel">
          <div className="space-y-1 px-4 py-4">
            <button
              onClick={() => handleNavClick('all')}
              className="block w-full text-left rounded-lg px-3 py-2.5 text-base font-medium text-white hover:bg-white/5"
            >
              All Quantum Tools
            </button>
            <button
              onClick={() => handleNavClick('merge')}
              className="block w-full text-left rounded-lg px-3 py-2.5 text-base font-medium text-purple-400 hover:bg-white/5"
            >
              Merge Files (PDF)
            </button>
            <button
              onClick={() => handleNavClick('jpg-to-pdf')}
              className="block w-full text-left rounded-lg px-3 py-2.5 text-base font-medium text-cyan-400 hover:bg-white/5"
            >
              Convert JPG to PDF
            </button>
            <a
              href="#features-section"
              onClick={() => setIsOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-base font-medium text-[#94A3B8] hover:bg-white/5"
            >
              Engine Features
            </a>
            
            <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
              <div className="flex items-center justify-between px-3 text-xs text-[#94A3B8] font-mono">
                <span>Secure sandboxed build</span>
                <span className="text-cyan-400 flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Offline-Ready
                </span>
              </div>
              <button
                onClick={() => handleNavClick('merge')}
                className="w-full text-center rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] py-3 text-sm font-semibold text-white"
              >
                Launch Engine
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
