export default function FuturisticBackground() {
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden bg-[#07080F] select-none pointer-events-none">
      {/* Light subtle noise or grid overlay for Vercel/Linear look */}
      <div 
        className="absolute inset-0 opacity-[0.015]" 
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


