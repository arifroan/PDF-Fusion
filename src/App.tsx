import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import FuturisticBackground from './components/FuturisticBackground';
import Navbar from './components/Navbar';
import ActiveProgressBar from './components/ActiveProgressBar';
import Hero from './components/Hero';
import ToolGrid from './components/ToolGrid';
import MergeTool from './components/MergeTool';
import JpgToPdfTool from './components/JpgToPdfTool';
import CompressTool from './components/CompressTool';
import SplitTool from './components/SplitTool';
import PdfToJpgTool from './components/PdfToJpgTool';
import EditMetadataTool from './components/EditMetadataTool';
import UnlockPdfTool from './components/UnlockPdfTool';
import WatermarkTool from './components/WatermarkTool';
import Features from './components/Features';
import Footer from './components/Footer';
import CinematicIntro from './components/CinematicIntro';
import { ToolId } from './types';
import { Sparkles, ArrowLeft, History, Cpu, FileCheck, Minimize2, Scissors, FileImage, Lock, Type } from 'lucide-react';

export default function App() {
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window !== 'undefined') {
      return !sessionStorage.getItem('pdfusion-intro-shown');
    }
    return true;
  });
  const [activeTool, setActiveTool] = useState<ToolId>('all');

  const handleSelectTool = (tool: ToolId) => {
    setActiveTool(tool);

    // If focusing a specific tool, smoothly scroll to the focused section after state renders
    if (tool !== 'all') {
      setTimeout(() => {
        const element = document.getElementById('main-tools-content');
        if (element) {
          const headerOffset = 84; // 64px header + 20px padding margin
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 50);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleIntroComplete = () => {
    sessionStorage.setItem('pdfusion-intro-shown', 'true');
    setShowIntro(false);
  };

  return (
    <div id="app-root-container" className="min-h-screen text-white font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Cinematic Opening Intro on system boot sequence */}
      {showIntro && <CinematicIntro onComplete={handleIntroComplete} />}

      {/* Dynamic Futuristic Canvas Star background */}
      <FuturisticBackground />

      {/* Global Navbar */}
      <Navbar onSelectTool={handleSelectTool} activeTool={activeTool} />

      {/* Global Sandboxed Processing & Loading Progress Tracker */}
      <ActiveProgressBar />

      {/* Hero presentation with quick targets */}
      {activeTool === 'all' && <Hero onSelectTool={handleSelectTool} />}

      {/* Interactive Tools Body */}
      <main id="main-tools-content" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20 relative z-10">
        
        {/* Tool Filter Tabs & Core Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTool}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
          >
            {/* If a tool is active, display a beautiful context navigation bar */}
            {activeTool !== 'all' && (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTool('all')}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-[#94A3B8] hover:text-white transition cursor-pointer"
                    title="Return to Menu"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <span className="text-xs font-mono text-cyan-400">Quantum Node Controller</span>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                      {activeTool === 'merge' 
                        ? 'Merge Document Stream Mode' 
                        : activeTool === 'jpg-to-pdf' 
                        ? 'JPG to PDF Synthesiser Mode'
                        : activeTool === 'split'
                        ? 'Split PDF Structure Mode'
                        : activeTool === 'pdf-to-jpg'
                        ? 'PDF to Image Export Mode'
                        : activeTool === 'metadata'
                        ? 'Edit Metadata Mode'
                        : activeTool === 'unlock'
                        ? 'Unlock Protected PDF Mode'
                        : activeTool === 'watermark'
                        ? 'Watermark Injector Mode'
                        : 'Optimize & Compress Mode'}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-mono text-cyan-400 border border-cyan-500/20">
                    <FileCheck className="h-3.5 w-3.5" /> 100% Secure Sandbox
                  </span>
                  <button
                    onClick={() => setActiveTool('all')}
                    className="text-xs text-[#94A3B8] hover:text-white transition underline cursor-pointer"
                  >
                    View All Tools
                  </button>
                </div>
              </div>
            )}

            {/* Render tools container */}
            {activeTool === 'all' ? (
              <>
                {/* Full grid choice array */}
                <ToolGrid onSelectTool={handleSelectTool} activeTool={activeTool} />

                {/* Live tools displayed sequentially in "All" view with separators */}
                <div className="mt-12 space-y-16">
                  {/* Divider title */}
                  <div className="relative flex py-5 items-center">
                    <div className="flex-grow border-t border-white/5"></div>
                    <span className="flex-shrink mx-4 text-xs font-mono text-purple-400 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles className="h-3 w-3 animate-pulse" /> Live Terminal: Merge Engine
                    </span>
                    <div className="flex-grow border-t border-white/5"></div>
                  </div>
                  
                  <MergeTool />

                  {/* Divider title */}
                  <div className="relative flex py-5 items-center">
                    <div className="flex-grow border-t border-white/5"></div>
                    <span className="flex-shrink mx-4 text-xs font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                      <Cpu className="h-3 w-3" /> Live Terminal: Image Synthesis
                    </span>
                    <div className="flex-grow border-t border-white/5"></div>
                  </div>

                  <JpgToPdfTool />

                  {/* Divider title */}
                  <div className="relative flex py-5 items-center">
                    <div className="flex-grow border-t border-white/5"></div>
                    <span className="flex-shrink mx-4 text-xs font-mono text-purple-400 uppercase tracking-widest flex items-center gap-2">
                      <Scissors className="h-3 w-3" /> Live Terminal: Split Document
                    </span>
                    <div className="flex-grow border-t border-white/5"></div>
                  </div>

                  <SplitTool />

                  {/* Divider title */}
                  <div className="relative flex py-5 items-center">
                    <div className="flex-grow border-t border-white/5"></div>
                    <span className="flex-shrink mx-4 text-xs font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                      <FileImage className="h-3 w-3" /> Live Terminal: PDF to Image Export
                    </span>
                    <div className="flex-grow border-t border-white/5"></div>
                  </div>

                  <PdfToJpgTool />

                  {/* Divider title */}
                  <div className="relative flex py-5 items-center">
                    <div className="flex-grow border-t border-white/5"></div>
                    <span className="flex-shrink mx-4 text-xs font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                      <Minimize2 className="h-3 w-3" /> Live Terminal: PDF Optimize
                    </span>
                    <div className="flex-grow border-t border-white/5"></div>
                  </div>

                  <CompressTool />

                  {/* Divider title */}
                  <div className="relative flex py-5 items-center">
                    <div className="flex-grow border-t border-white/5"></div>
                    <span className="flex-shrink mx-4 text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <FileCheck className="h-3 w-3" /> Live Terminal: Edit Metadata
                    </span>
                    <div className="flex-grow border-t border-white/5"></div>
                  </div>

                  <EditMetadataTool />

                  {/* Divider title */}
                  <div className="relative flex py-5 items-center">
                    <div className="flex-grow border-t border-white/5"></div>
                    <span className="flex-shrink mx-4 text-xs font-mono text-purple-400 uppercase tracking-widest flex items-center gap-2">
                      <Lock className="h-3 w-3" /> Live Terminal: Unlock Protected PDF
                    </span>
                    <div className="flex-grow border-t border-white/5"></div>
                  </div>

                  <UnlockPdfTool />

                  {/* Divider title */}
                  <div className="relative flex py-5 items-center">
                    <div className="flex-grow border-t border-white/5"></div>
                    <span className="flex-shrink mx-4 text-xs font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                      <Type className="h-3 w-3" /> Live Terminal: Inject Watermark Layers
                    </span>
                    <div className="flex-grow border-t border-white/5"></div>
                  </div>

                  <WatermarkTool />
                </div>
              </>
            ) : activeTool === 'merge' ? (
              <MergeTool />
            ) : activeTool === 'jpg-to-pdf' ? (
              <JpgToPdfTool />
            ) : activeTool === 'split' ? (
              <SplitTool />
            ) : activeTool === 'pdf-to-jpg' ? (
              <PdfToJpgTool />
            ) : activeTool === 'metadata' ? (
              <EditMetadataTool />
            ) : activeTool === 'unlock' ? (
              <UnlockPdfTool />
            ) : activeTool === 'watermark' ? (
              <WatermarkTool />
            ) : (
              <CompressTool />
            )}
          </motion.div>
        </AnimatePresence>

      </main>

      {/* Feature merits section */}
      <Features />

      {/* Footer information nodes */}
      <Footer onSelectTool={handleSelectTool} />
    </div>
  );
}
