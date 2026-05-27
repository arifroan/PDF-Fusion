import { Shield, Zap, Smartphone, BadgePercent, Cpu, Key, EyeOff } from 'lucide-react';

export default function Features() {
  const highlights = [
    {
      title: 'Zero Latency Local Core',
      description: 'Files are processed inside your browser using compiled pdf-lib code. No waiting, no uploads, no cloud bottlenecks.',
      icon: Zap,
      accent: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      title: 'Sanitised Local Memory',
      description: 'Since data never transits a server, malicious entities cannot intercept, trace, or store sensitive documents. Complete peace of mind.',
      icon: Shield,
      accent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Universal Responsive Form',
      description: 'Optimised touch-zones, fast rendering engines, and modular responsive layouts perfectly tailored to Android, tablets, and desktop displays.',
      icon: Smartphone,
      accent: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    },
    {
      title: '100% Free & Uncapped',
      description: 'Enjoy unlimited batch merge streams and image synthesis pipelines with zero subscription prompts, hidden locks, or premium paywalls.',
      icon: BadgePercent,
      accent: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
  ];

  return (
    <section id="features-section" className="py-16 md:py-24 relative border-t border-white/5 bg-[#121A2F]/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl font-sans">
            Underpinned by High-End Local Isolation
          </h2>
          <p className="mt-4 text-base text-[#94A3B8]">
            PDFusion completely breaks away from legacy cloud-based converters. Enjoy absolute privacy, 
            blazing-fast browser RAM processing, and an immersive neon interface designed for digital craftsmen.
          </p>
        </div>

        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {highlights.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div
                key={index}
                className="group relative rounded-2xl border border-white/10 bg-[#0F1424] p-6 transition-colors duration-150"
              >
                
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl border shrink-0 ${item.accent}`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm text-[#94A3B8] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Sandbox graphic/terminal layout */}
        <div className="mt-16 rounded-2xl border border-white/5 bg-[#121A2F]/40 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Quantum Client-Side Thread Sandbox</h4>
              <p className="text-xs text-[#94A3B8] mt-1 max-w-xl">
                PDFution activates lightweight, independent memory structures matching the browser's Garbage Collection loop. 
                Your files disappear from RAM immediately upon reloading or closing your tab.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <span className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-300 font-mono">
              <Key className="h-3.5 w-3.5 text-yellow-500" /> AES-256 local
            </span>
            <span className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-300 font-mono">
              <EyeOff className="h-3.5 w-3.5 text-purple-400" /> No server trace
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}
