import { useEffect, useState } from 'react';
import { Layers, ChevronRight } from 'lucide-react';

interface CinematicIntroProps {
  onComplete: () => void;
}

export default function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const [fadingOut, setFadingOut] = useState(false);
  const [hasSkipped, setHasSkipped] = useState(false);

  useEffect(() => {
    // Standard timeline triggers
    const fadeTimeout = setTimeout(() => {
      setFadingOut(true);
    }, 2850); // Begin fading out after 2.85 seconds

    const completeTimeout = setTimeout(() => {
      onComplete();
    }, 3550); // Unmount and transition after 3.55 seconds total

    return () => {
      clearTimeout(fadeTimeout);
      clearTimeout(completeTimeout);
    };
  }, [onComplete]);

  const handleSkip = () => {
    if (hasSkipped) return;
    setHasSkipped(true);
    setFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 450); // Speedy fade out transition on manual skip
  };

  return (
    <div
      id="pdfusion-cinematic-intro"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0B1020] select-none overflow-hidden transition-all duration-[750ms] cubic-bezier(0.16, 1, 0.3, 1) ${
        fadingOut ? 'opacity-0 pointer-events-none scale-[1.015]' : 'opacity-100'
      }`}
    >
      {/* High-Performance Isolated Keyframe Styles */}
      <style>{`
        /* Logo Reveal: Smooth scaling and fade */
        .pdf-intro-logo {
          animation: pdfLogoReveal 1.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          will-change: transform, opacity;
        }

        /* Subtitle Reveal: Balanced entry */
        .pdf-intro-subtitle {
          animation: pdfSubtitleReveal 1.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
          will-change: transform, opacity;
        }

        /* Vector System Line: Symmetrical outward expansion */
        .pdf-intro-line {
          animation: pdfLineExpand 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform: scaleX(0);
          will-change: transform, opacity;
          transform-origin: center;
        }

        /* Premium Faint Static Background Gradients (Zero real-time filter overhead) */
        .pdf-intro-glow-one {
          transform: translate3d(0, 0, 0);
          animation: pdfPulseGlowOne 8s infinite ease-in-out;
        }
        .pdf-intro-glow-two {
          transform: translate3d(0, 0, 0);
          animation: pdfPulseGlowTwo 10s infinite ease-in-out;
        }

        @keyframes pdfLogoReveal {
          0% {
            opacity: 0;
            transform: scale(0.96) translateY(12px);
          }
          15% {
            opacity: 0;
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes pdfSubtitleReveal {
          0% {
            opacity: 0;
            transform: translateY(8s);
          }
          38% {
            opacity: 0;
            transform: translateY(6px);
          }
          100% {
            opacity: 0.85;
            transform: translateY(0);
          }
        }

        @keyframes pdfLineExpand {
          0% {
            transform: scaleX(0);
            opacity: 0;
          }
          45% {
            transform: scaleX(0);
            opacity: 0;
          }
          100% {
            transform: scaleX(1);
            opacity: 0.65;
          }
        }

        @keyframes pdfPulseGlowOne {
          0%, 100% { opacity: 0.15; transform: translate3d(0, 0, 0) scale(1); }
          50% { opacity: 0.28; transform: translate3d(15px, -10px, 0) scale(1.05); }
        }

        @keyframes pdfPulseGlowTwo {
          0%, 100% { opacity: 0.2; transform: translate3d(0, 0, 0) scale(1.05); }
          50% { opacity: 0.12; transform: translate3d(-15px, 15px, 0) scale(0.95); }
        }
      `}</style>

      {/* Subtle Background Ambience (Extremely optimized shapes) */}
      <div className="absolute inset-x-0 inset-y-0 w-full h-full pointer-events-none overflow-hidden">
        {/* Deep Purple glow top-left */}
        <div className="pdf-intro-glow-one absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-purple-900/15 blur-[140px]" />
        {/* Deep Cyan glow bottom-right */}
        <div className="pdf-intro-glow-two absolute -bottom-1/4 -right-1/4 w-[650px] h-[650px] rounded-full bg-cyan-950/20 blur-[150px]" />
      </div>

      {/* Skip Button: Comfortably large touch target, clean, minimal */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 z-[100] inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-4 py-2 text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer duration-200"
      >
        Skip System Boot
        <ChevronRight className="h-3.5 w-3.5 opacity-60" />
      </button>

      {/* Main Core Presentation Container */}
      <div className="relative flex flex-col items-center justify-center text-center px-4 max-w-lg">
        {/* Logo block with refined icon and identity */}
        <div className="pdf-intro-logo flex flex-col items-center gap-4.5">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] p-[1.5px] shadow-[0_8px_30px_rgba(124,58,237,0.15)]">
            <div className="flex h-full w-full items-center justify-center rounded-[15px] bg-[#0B1020]">
              <Layers className="h-8 w-8 text-cyan-400" />
            </div>
            {/* Soft pulse ambient glow */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] opacity-25 blur-md" />
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-wider text-white select-none">
            PDF<span className="text-cyan-400">usion</span>
          </h1>
        </div>

        {/* Subtitle text */}
        <p className="pdf-intro-subtitle mt-5 text-sm sm:text-base tracking-[0.25em] font-sans font-light uppercase text-slate-400">
          Next Generation PDF Tools
        </p>

        {/* Minimal system line animation wrapper */}
        <div className="w-48 h-[1px] mt-6 relative overflow-hidden">
          <div className="pdf-intro-line w-full h-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
        </div>
      </div>

      {/* System Status Nodes - Subtle touch of Linear aesthetics */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2.5 text-[10px] sm:text-xs font-mono text-slate-500 opacity-60">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>SECURE CLIENT SANDBOX ONLINE</span>
      </div>
    </div>
  );
}
