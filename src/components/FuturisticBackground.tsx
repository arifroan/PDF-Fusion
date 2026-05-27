import { motion } from 'motion/react';

export default function FuturisticBackground() {
  const points = [
    { top: '15%', left: '20%', delay: 0, size: 'w-1 h-1' },
    { top: '80%', left: '15%', delay: 4, size: 'w-1.5 h-1.5' },
    { top: '35%', left: '75%', delay: 2, size: 'w-1 h-1' },
    { top: '70%', left: '85%', delay: 6, size: 'w-2 h-2' },
    { top: '50%', left: '45%', delay: 1, size: 'w-1.5 h-1.5' },
    { top: '25%', left: '60%', delay: 8, size: 'w-1 h-1' },
  ];

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden bg-[#0B1020]">
      {/* Ambient background glow highlights */}
      <motion.div
        animate={{
          x: [0, 80, -60, 0],
          y: [0, -100, 50, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-indigo-900/15 blur-[120px]"
      />
      <motion.div
        animate={{
          x: [0, -60, 100, 0],
          y: [0, 80, -50, 0],
          scale: [1.2, 0.9, 1.1, 1.2],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[620px] h-[620px] rounded-full bg-cyan-950/20 blur-[130px]"
      />
      <motion.div
        animate={{
          scale: [0.8, 1.1, 0.9, 0.8],
          opacity: [0.3, 0.6, 0.4, 0.3],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[450px] rounded-full bg-purple-950/10 blur-[150px]"
      />

      {/* Cyber floating matrix sparks */}
      {points.map((pt, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.1, y: 30 }}
          animate={{
            opacity: [0.1, 0.8, 0.3, 0.8, 0.1],
            y: [-25, 25, -25],
            x: [-15, 15, -15],
          }}
          transition={{
            duration: 10 + i * 2,
            repeat: Infinity,
            delay: pt.delay,
            ease: "easeInOut",
          }}
          className={`absolute ${pt.size} rounded-full bg-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.8)]`}
          style={{ top: pt.top, left: pt.left }}
        />
      ))}

      {/* Futuristic grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Digital diagonal scan lines */}
      <div 
        className="absolute inset-0 opacity-[0.01]" 
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #7C3AED, #7C3AED 1px, transparent 0, transparent 50%)',
          backgroundSize: '8px 8px',
        }}
      />
    </div>
  );
}

