import React, { useEffect, useRef } from 'react';

interface LivingEnvironmentBackdropProps {
  rainfallMm: number;
  showRainAnimation?: boolean;
}

export const LivingEnvironmentBackdrop: React.FC<LivingEnvironmentBackdropProps> = ({
  rainfallMm,
  showRainAnimation = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!showRainAnimation) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle density scaled with rainfall amount
    const particleCount = Math.min(180, Math.max(45, Math.round((rainfallMm / 72) * 85)));
    const drops: { x: number; y: number; length: number; speed: number; opacity: number }[] = [];

    for (let i = 0; i < particleCount; i++) {
      drops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: Math.random() * 22 + 10,
        speed: Math.random() * 8 + 12 + (rainfallMm / 50) * 4,
        opacity: Math.random() * 0.28 + 0.1,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = '#49D7D0';
      ctx.lineWidth = 1.2;

      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        ctx.beginPath();
        ctx.globalAlpha = d.opacity;
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 2, d.y + d.length);
        ctx.stroke();

        d.y += d.speed;
        d.x -= d.speed * 0.12;

        if (d.y > height) {
          d.y = -20;
          d.x = Math.random() * width + 50;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [rainfallMm, showRainAnimation]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">

      {/* Layer 1A: Base Midnight Monsoon Deep Background */}
      <div className="absolute inset-0 bg-[#071316]" />

      {/* Layer 1B: Generated Atmospheric Campus Texture (With careful opacity scrim) */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-15 mix-blend-screen transition-opacity duration-1000"
        style={{
          backgroundImage: `url('/src/assets/images/monsoon_campus_environment_1791103593696.jpg')`,
        }}
      />

      {/* Layer 1C: Atmospheric Gradient Overlays for Depth and Contrast */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(73,215,208,0.08)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_90%,rgba(106,169,255,0.06)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#071316]/80 via-[#071316]/95 to-[#071316]" />

      {/* Layer 1D: Ambient Faint Topographic Contour Lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.06] stroke-[#49D7D0] fill-none" xmlns="http://www.w3.org/2000/svg">
        <path d="M -100 200 C 300 150, 600 350, 1200 180 S 1800 400, 2200 250" strokeWidth="1" strokeDasharray="6,8" />
        <path d="M -100 450 C 400 380, 800 580, 1400 420 S 1900 600, 2200 500" strokeWidth="1.2" />
        <path d="M -100 700 C 500 620, 950 820, 1500 680 S 2000 850, 2200 750" strokeWidth="1" strokeDasharray="4,6" />
      </svg>

      {/* Layer 1E: Rain Canvas Animation */}
      {showRainAnimation && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full opacity-60 pointer-events-none"
        />
      )}
    </div>
  );
};
