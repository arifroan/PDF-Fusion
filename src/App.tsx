import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import FuturisticBackground from './components/FuturisticBackground';
import Navbar from './components/Navbar';
import ActiveProgressBar from './components/ActiveProgressBar';
import Hero from './components/Hero';
import ToolGrid from './components/ToolGrid';
import MergeTool from './components/MergeTool';
import JpgToPdfTool from './components/JpgToPdfTool';
import Features from './components/Features';
import Footer from './components/Footer';
import { ToolId } from './types';
import { Sparkles, ArrowLeft, History, Cpu, FileCheck } from 'lucide-react';

export default function App() {
  const [activeTool, setActiveTool] = useState<ToolId>('all');

  const handleSelectTool = (tool: ToolId) => {
    setActiveTool(tool);

    // If focusing a specific tool, smoothly scroll to the focused section after state renders
    if (tool !== 'all') {
      setTimeout(() => {
        const targetId = tool === 'merge' ? 'merge-tool-section' : 'jpg-pdf-tool-section';
        const element = document.getElementById(targetId);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } else {
      setTimeout(() => {
        const element = document.getElementById('tools-container');
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  return (
    <div id="app-root-container" className="min-h-screen text-white font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Dynamic Futuristic Canvas Star background */}
      <FuturisticBackground />

      {/* Global Navbar */}
      <Navbar onSelectTool={handleSelectTool} activeTool={activeTool} />

      {/* Global Sandboxed Processing & Loading Progress Tracker */}
      <ActiveProgressBar />

      {/* Hero presentation with quick targets */}
      {activeTool === 'all' && <Hero onSelectTool={handleSelectTool} />}

      {/* Interactive Tools Body */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20 relative z-10">
        
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
                      {activeTool === 'merge' ? 'Merge Document Stream Mode' : 'JPG to PDF Synthesiser Mode'}
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
                </div>
              </>
            ) : activeTool === 'merge' ? (
              <MergeTool />
            ) : (
              <JpgToPdfTool />
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
