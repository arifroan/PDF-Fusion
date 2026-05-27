export default function FuturisticBackground() {
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden bg-[#07080F] select-none pointer-events-none">
      {/* Ultra-subtle luxury dark vignette to give depth without glowing colors or animations */}
      <div 
        className="absolute inset-0 opacity-[0.25]"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(13, 17, 28, 0.4) 0%, #07080F 100%)'
        }}
      />
      
      {/* Cinematic noise texture overlay at extremely low opacity to avoid flat black */}
      <div 
        className="absolute inset-0 opacity-[0.012] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
