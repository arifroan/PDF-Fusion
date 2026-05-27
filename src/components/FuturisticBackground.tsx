import { motion } from 'motion/react';

export default function FuturisticBackground() {
  const points = [
    { top: '15%', left: '25%', delay: 0, size: 'w-1 h-1' },
    { top: '80%', left: '20%', delay: 4, size: 'w-1.5 h-1.5' },
    { top: '35%', left: '80%', delay: 2, size: 'w-1 h-1' },
    { top: '70%', left: '85%', delay: 6, size: 'w-1.5 h-1.5' },
  ];

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden bg-[#0B1020] select-none pointer-events-none">
      {/* Ambient background glow highlights: Animates gently only on md+ desktop, static on mobile */}
      <div className="gpu-accel absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] md:w-[520px] md:h-[520px] rounded-full bg-indigo-900/10 blur-[90px] md:blur-[120px]" />
      <div className="gpu-accel absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] md:w-[620px] md:h-[620px] rounded-full bg-cyan-950/15 blur-[100px] md:blur-[130px]" />
      <div className="gpu-accel absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] md:w-[850px] md:h-[450px] rounded-full bg-purple-950/8 blur-[110px] md:blur-[150px]" />

      {/* Cyber floating matrix sparks - hidden on mobile to avoid JavaScript loop and DOM draw triggers */}
      <div className="hidden md:block absolute inset-0">
        {points.map((pt, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.1, y: 0 }}
            animate={{
              opacity: [0.1, 0.6, 0.1],
              y: [-15, 15, -15],
            }}
            transition={{
              duration: 8 + i * 3,
              repeat: Infinity,
              delay: pt.delay,
              ease: "easeInOut",
            }}
            className={`absolute ${pt.size} rounded-full bg-cyan-400/30 gpu-accel`}
            style={{ top: pt.top, left: pt.left }}
          />
        ))}
      </div>

      {/* Futuristic grid overlay - static lightweight background */}
      <div 
        className="absolute inset-0 opacity-[0.02]" 
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  );
}

