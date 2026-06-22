import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Play, Library, ServerCrash, Sparkles, Check } from 'lucide-react';

interface ProgressEventDetail {
  active: boolean;
  progress: number;
  status: string;
  type: 'merge' | 'convert' | 'analyze' | null;
}

export default function ActiveProgressBar() {
  const [state, setState] = useState<ProgressEventDetail>({
    active: false,
    progress: 0,
    status: '',
    type: null,
  });

  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const handleProgress = (event: Event) => {
      const customEvent = event as CustomEvent<ProgressEventDetail>;
      if (customEvent.detail) {
        setState(customEvent.detail);
        
        if (customEvent.detail.active && customEvent.detail.status) {
          setLogs((prev) => {
            // Keep the last 3 logs for historical context
            const updated = [...prev, customEvent.detail.status];
            if (updated.length > 3) {
              updated.shift();
            }
            return updated;
          });
        }

        if (!customEvent.detail.active) {
          // Clear logs with a slight delay so user can read the success state
          setTimeout(() => {
            setLogs([]);
          }, 4000);
        }
      }
    };

    window.addEventListener('pdf-progress', handleProgress);
    return () => {
      window.removeEventListener('pdf-progress', handleProgress);
    };
  }, []);

  const getTypeIcon = () => {
    switch (state.type) {
      case 'merge':
        return <Library className="h-4 w-4 text-purple-400" />;
      case 'convert':
        return <Play className="h-4 w-4 text-cyan-400" />;
      case 'analyze':
        return <RefreshCw className="h-4 w-4 text-emerald-400" />;
      default:
        return <Sparkles className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getThemeColor = () => {
    return 'from-quantum to-quantum-highlight';
  };

  const getAccentBgClass = () => {
    return 'border-quantum-20 bg-quantum-10 text-quantum';
  };

  return (
    <AnimatePresence>
      {state.active && (
        <motion.div
          id="global-performance-tracker"
          initial={{ opacity: 0, y: -25 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ type: 'tween', duration: 0.2 }}
          className="fixed top-[76px] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-2xl z-50 rounded-2xl border border-white/10 bg-[#0E1528] p-4.5 shadow-md overflow-hidden"
        >
          {/* Top Info Bar */}
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`p-1.5 rounded-lg border ${getAccentBgClass()} flex items-center justify-center shrink-0`}>
                {getTypeIcon()}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono tracking-widest text-[#94A3B8] uppercase block leading-none">
                  Core sandbox compiler activity
                </span>
                <span className="text-xs font-bold text-white truncate block mt-1">
                  {state.status || 'Executing sandboxed WASM compilation...'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 pl-2">
              <span className="font-mono text-sm font-black text-quantum bg-quantum-10 px-2.5 py-1 rounded-xl border border-quantum-20">
                {state.progress}%
              </span>
            </div>
          </div>

          {/* Glowing Progress bar track */}
          <div className="relative h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
            <motion.div
              className={`absolute inset-y-0 left-0 w-full rounded-full bg-gradient-to-r ${getThemeColor()} origin-left gpu-accel`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: state.progress / 100 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            />
          </div>

          {/* Compact terminal process trail */}
          {logs.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between gap-4 text-[10px] font-mono">
              <div className="text-slate-500 truncate max-w-[80%] flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                <span className="text-slate-400">Memory log:</span>
                <span className="text-[#94A3B8] truncate">{logs[logs.length - 1]}</span>
              </div>
              <div className="text-quantum-highlight uppercase tracking-widest text-[9px] font-black shrink-0">
                Local RAM Thread
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
