import { useState } from 'react';
import { Menu, X, Layers, Cpu, Shield, Sparkles } from 'lucide-react';
import { ToolId } from '../types';

interface NavbarProps {
  onSelectTool: (tool: ToolId) => void;
  activeTool: ToolId;
  quantumTheme: 'purple' | 'emerald' | 'amber' | 'blue';
  onChangeTheme: (theme: 'purple' | 'emerald' | 'amber' | 'blue') => void;
}

export default function Navbar({ onSelectTool, activeTool, quantumTheme, onChangeTheme }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavClick = (toolId: ToolId) => {
    onSelectTool(toolId);
    setIsOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#07080F]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Brand */}
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => handleNavClick('all')}>
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] p-[1.5px] transition-transform duration-200 group-hover:scale-105">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#121A2F]">
                <Layers className="h-5 w-5 text-cyan-400 transition-colors duration-150" />
              </div>
            </div>
            <span className="bg-gradient-to-r from-white via-indigo-100 to-cyan-400 bg-clip-text text-xl font-bold tracking-wider text-transparent font-sans">
              PDF<span className="text-cyan-400">usion</span>
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => handleNavClick('all')}
              className={`text-sm font-medium transition-colors duration-150 hover:text-cyan-400 ${
                activeTool === 'all' ? 'text-cyan-400' : 'text-[#94A3B8]'
              }`}
            >
              All Tools
            </button>
            <button
              onClick={() => handleNavClick('merge')}
              className={`text-sm font-medium transition-colors duration-150 hover:text-purple-400 ${
                activeTool === 'merge' ? 'text-purple-400' : 'text-[#94A3B8]'
              }`}
            >
              Merge PDF
            </button>
            <button
              onClick={() => handleNavClick('jpg-to-pdf')}
              className={`text-sm font-medium transition-colors duration-150 hover:text-cyan-400 ${
                activeTool === 'jpg-to-pdf' ? 'text-cyan-400' : 'text-[#94A3B8]'
              }`}
            >
              JPG to PDF
            </button>
            <button
              onClick={() => handleNavClick('split')}
              className={`text-sm font-medium transition-colors duration-150 hover:text-purple-400 ${
                activeTool === 'split' ? 'text-purple-400' : 'text-[#94A3B8]'
              }`}
            >
              Split PDF
            </button>
            <button
              onClick={() => handleNavClick('pdf-to-jpg')}
              className={`text-sm font-medium transition-colors duration-150 hover:text-cyan-400 ${
                activeTool === 'pdf-to-jpg' ? 'text-cyan-400' : 'text-[#94A3B8]'
              }`}
            >
              PDF to Image
            </button>
            <button
              onClick={() => handleNavClick('compress')}
              className={`text-sm font-medium transition-colors duration-150 hover:text-emerald-400 ${
                activeTool === 'compress' ? 'text-emerald-400' : 'text-[#94A3B8]'
              }`}
            >
              Compress PDF
            </button>
            <button
              onClick={() => handleNavClick('unlock')}
              className={`text-sm font-medium transition-colors duration-150 hover:text-purple-400 ${
                activeTool === 'unlock' ? 'text-purple-400' : 'text-[#94A3B8]'
              }`}
            >
              Unlock PDF
            </button>
            <button
              onClick={() => handleNavClick('watermark')}
              className={`text-sm font-medium transition-colors duration-150 hover:text-cyan-400 ${
                activeTool === 'watermark' ? 'text-cyan-400' : 'text-[#94A3B8]'
              }`}
            >
              Watermark PDF
            </button>
            <button
              onClick={() => handleNavClick('batch')}
              className={`text-sm font-medium transition-colors duration-150 hover:text-violet-400 ${
                activeTool === 'batch' ? 'text-violet-400' : 'text-[#94A3B8]'
              }`}
            >
              Batch Actions
            </button>
            <a
              href="#features-section"
              className="text-sm font-medium text-[#94A3B8] transition-colors duration-150 hover:text-white"
            >
              Futuristic Engine
            </a>
          </div>

          {/* Action CTA */}
          <div className="hidden md:flex items-center gap-4">
            {/* Quantum Theme Accents Selector */}
            <div className="flex items-center gap-1.5 rounded-full border border-white/5 bg-white/[0.03] p-1 h-8 animate-pulse-slow">
              <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 pl-2 pr-1 font-semibold hidden lg:inline">
                Accent:
              </span>
              <div className="flex gap-1.5 px-1">
                {[
                  { id: 'purple', name: 'Cyber Purple', colorBg: 'bg-purple-500 hover:ring-purple-400/50' },
                  { id: 'emerald', name: 'Quantum Emerald', colorBg: 'bg-emerald-500 hover:ring-emerald-400/50' },
                  { id: 'amber', name: 'Solar Amber', colorBg: 'bg-amber-500 hover:ring-amber-400/50' },
                  { id: 'blue', name: 'Neon Blue', colorBg: 'bg-blue-500 hover:ring-blue-400/50' },
                ].map((th) => (
                  <button
                    key={th.id}
                    title={th.name}
                    onClick={() => onChangeTheme(th.id as any)}
                    className={`h-4.5 w-4.5 rounded-full ${th.colorBg} relative transition-all duration-150 hover:scale-110 cursor-pointer hover:ring-2`}
                  >
                    {quantumTheme === th.id && (
                      <span className="absolute inset-0 m-auto h-2 w-2 rounded-full bg-white scale-120 shadow-md shadow-black" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <span className="flex items-center gap-1.5 rounded-full border border-quantum/20 bg-quantum/10 px-3 h-8 text-[11px] font-mono tracking-wider text-quantum">
              <Cpu className="h-3 w-3 text-quantum" /> Wasm-Core-v1.2
            </span>
            <button
              onClick={() => handleNavClick('merge')}
              className="relative overflow-hidden rounded-xl bg-gradient-to-r from-quantum to-quantum-highlight p-[1px] font-sans text-xs font-semibold tracking-wide text-white transition-colors duration-150"
            >
              <span className="flex items-center gap-1.5 rounded-[11px] bg-[#07080F] px-4 py-2 hover:bg-transparent transition-colors duration-150">
                <Sparkles className="h-3.5 w-3.5 text-quantum" /> Start Processing
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
            <button
              onClick={() => handleNavClick('split')}
              className="block w-full text-left rounded-lg px-3 py-2.5 text-base font-medium text-purple-400 hover:bg-white/5"
            >
              Split PDF
            </button>
            <button
              onClick={() => handleNavClick('pdf-to-jpg')}
              className="block w-full text-left rounded-lg px-3 py-2.5 text-base font-medium text-cyan-400 hover:bg-white/5"
            >
              PDF to Image Export
            </button>
            <button
              onClick={() => handleNavClick('compress')}
              className="block w-full text-left rounded-lg px-3 py-2.5 text-base font-medium text-emerald-400 hover:bg-white/5"
            >
              Compress PDF
            </button>
            <button
              onClick={() => handleNavClick('unlock')}
              className="block w-full text-left rounded-lg px-3 py-2.5 text-base font-medium text-purple-400 hover:bg-white/5"
            >
              Unlock PDF
            </button>
            <button
              onClick={() => handleNavClick('watermark')}
              className="block w-full text-left rounded-lg px-3 py-2.5 text-base font-medium text-cyan-400 hover:bg-white/5"
            >
              Watermark PDF
            </button>
            <button
              onClick={() => handleNavClick('batch')}
              className="block w-full text-left rounded-lg px-3 py-2.5 text-base font-medium text-violet-400 hover:bg-white/5"
            >
              Batch Actions
            </button>
            <a
              href="#features-section"
              onClick={() => setIsOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-base font-medium text-[#94A3B8] hover:bg-white/5"
            >
              Engine Features
            </a>
            
            <div className="pt-3 pb-2 border-t border-white/5 flex flex-col gap-2 px-3">
              <span className="text-xs font-mono text-[#94A3B8]">Quantum Accent Color:</span>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {[
                  { id: 'purple', name: 'Cyber Purple', colorBg: 'bg-purple-500', label: 'Purple' },
                  { id: 'emerald', name: 'Quantum Emerald', colorBg: 'bg-emerald-500', label: 'Emerald' },
                  { id: 'amber', name: 'Solar Amber', colorBg: 'bg-amber-500', label: 'Amber' },
                  { id: 'blue', name: 'Neon Blue', colorBg: 'bg-blue-500', label: 'Blue' },
                ].map((th) => (
                  <button
                    key={th.id}
                    onClick={() => onChangeTheme(th.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs hover:bg-white/10 transition bg-white/5 ${quantumTheme === th.id ? 'border border-quantum/45 text-white font-bold bg-white/10' : 'text-[#94A3B8] border border-transparent'}`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${th.colorBg}`} />
                    <span>{th.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
              <div className="flex items-center justify-between px-3 text-xs text-[#94A3B8] font-mono">
                <span>Secure sandboxed build</span>
                <span className="text-quantum flex items-center gap-1">
                  <Shield className="h-3 w-3 text-quantum" /> Offline-Ready
                </span>
              </div>
              <button
                onClick={() => handleNavClick('merge')}
                className="w-full text-center rounded-xl bg-gradient-to-r from-quantum to-quantum-highlight py-3 text-sm font-semibold text-white"
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
