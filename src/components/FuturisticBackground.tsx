import { motion } from 'motion/react';

export default function FuturisticBackground() {
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
        className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-900/15 blur-[120px]"
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
        className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-950/20 blur-[130px]"
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
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-purple-950/10 blur-[150px]"
      />

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
