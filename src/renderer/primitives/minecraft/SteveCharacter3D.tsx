import React, { useEffect, useState, useRef } from 'react';

export interface SteveCharacter3DProps {
  className?: string;
  autoRotate?: boolean;
}

export const SteveCharacter3D: React.FC<SteveCharacter3DProps> = ({
  className = '',
  autoRotate = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [angles, setAngles] = useState({ yaw: 0, pitch: 0 });

  useEffect(() => {
    let animFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (autoRotate) return;
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;

      // Limit yaw (-55 deg to +55 deg) and pitch (-30 deg to +30 deg)
      const yaw = Math.max(-55, Math.min(55, deltaX * 0.15));
      const pitch = Math.max(-30, Math.min(30, -deltaY * 0.15));

      setAngles({ yaw, pitch });
    };

    window.addEventListener('mousemove', handleMouseMove);

    if (autoRotate) {
      let t = 0;
      const animate = () => {
        t += 0.03;
        setAngles({
          yaw: Math.sin(t) * 35,
          pitch: Math.cos(t * 0.8) * 12,
        });
        animFrameId = requestAnimationFrame(animate);
      };
      animFrameId = requestAnimationFrame(animate);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  }, [autoRotate]);

  return (
    <div
      ref={containerRef}
      className={`relative w-[100px] h-[140px] flex items-center justify-center select-none pointer-events-none ${className}`}
      style={{ perspective: '400px' }}
    >
      {/* 3D Steve Character Root Frame */}
      <div
        className="relative transition-transform duration-75 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${angles.pitch * 0.5}deg) rotateY(${angles.yaw * 0.8}deg)`,
        }}
      >
        {/* === 1. STEVE HEAD CUBE (28px x 28px x 28px) === */}
        <div
          className="absolute -top-[52px] -left-[14px] w-[28px] h-[28px] transition-transform duration-75 ease-out"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${angles.pitch * 0.6}deg) rotateY(${angles.yaw * 0.5}deg)`,
          }}
        >
          {/* Front Face (Eyes, hair & mouth) */}
          <div
            className="absolute inset-0 bg-[#C49272] flex flex-col justify-between p-[1px] pixelated"
            style={{ transform: 'translateZ(14px)' }}
          >
            {/* Hair Fringe */}
            <div className="w-full h-[10px] bg-[#3C2415] border-b border-[#2b180d]" />

            {/* Eyes Row */}
            <div className="flex justify-between items-center w-full px-[2px] my-auto">
              {/* Left Eye */}
              <div className="flex w-[7px] h-[4px] bg-white">
                <div className="w-[3.5px] h-full bg-[#2D2590]" />
              </div>
              {/* Right Eye */}
              <div className="flex w-[7px] h-[4px] bg-white">
                <div className="w-[3.5px] h-full bg-[#2D2590]" />
              </div>
            </div>

            {/* Mouth / Beard */}
            <div className="w-[10px] h-[4px] bg-[#4B2A1E] mx-auto mb-[2px]" />
          </div>

          {/* Back Face (Hair) */}
          <div
            className="absolute inset-0 bg-[#3C2415]"
            style={{ transform: 'rotateY(180deg) translateZ(14px)' }}
          />

          {/* Left Face (Hair + Skin) */}
          <div
            className="absolute inset-0 bg-[#b88565] flex flex-col"
            style={{ transform: 'rotateY(-90deg) translateZ(14px)' }}
          >
            <div className="w-full h-[10px] bg-[#3C2415]" />
          </div>

          {/* Right Face (Hair + Skin) */}
          <div
            className="absolute inset-0 bg-[#b88565] flex flex-col"
            style={{ transform: 'rotateY(90deg) translateZ(14px)' }}
          >
            <div className="w-full h-[10px] bg-[#3C2415]" />
          </div>

          {/* Top Face (Hair) */}
          <div
            className="absolute inset-0 bg-[#3C2415]"
            style={{ transform: 'rotateX(90deg) translateZ(14px)' }}
          />

          {/* Bottom Face (Neck) */}
          <div
            className="absolute inset-0 bg-[#a16e50]"
            style={{ transform: 'rotateX(-90deg) translateZ(14px)' }}
          />
        </div>

        {/* === 2. STEVE TORSO (28px wide x 42px high x 14px deep) === */}
        <div
          className="absolute -top-[24px] -left-[14px] w-[28px] h-[42px]"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front Face (Cyan Shirt) */}
          <div
            className="absolute inset-0 bg-[#00aaaa] flex flex-col justify-between"
            style={{ transform: 'translateZ(7px)' }}
          >
            <div className="w-[10px] h-[5px] bg-[#C49272] mx-auto" />
          </div>

          {/* Back Face */}
          <div
            className="absolute inset-0 bg-[#008888]"
            style={{ transform: 'rotateY(180deg) translateZ(7px)' }}
          />

          {/* Left Face */}
          <div
            className="absolute top-0 left-[7px] w-[14px] h-[42px] bg-[#009999]"
            style={{ transform: 'rotateY(-90deg) translateZ(14px)' }}
          />

          {/* Right Face */}
          <div
            className="absolute top-0 left-[7px] w-[14px] h-[42px] bg-[#009999]"
            style={{ transform: 'rotateY(90deg) translateZ(14px)' }}
          />

          {/* Top Face */}
          <div
            className="absolute top-[14px] left-0 w-[28px] h-[14px] bg-[#00aaaa]"
            style={{ transform: 'rotateX(90deg) translateZ(7px)' }}
          />
        </div>

        {/* === 3. LEFT ARM (14px wide x 42px high x 14px deep) === */}
        <div
          className="absolute -top-[24px] -left-[28px] w-[14px] h-[42px]"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div
            className="absolute inset-0 bg-[#00aaaa] flex flex-col justify-end"
            style={{ transform: 'translateZ(7px)' }}
          >
            <div className="w-full h-[18px] bg-[#C49272]" />
          </div>
          <div
            className="absolute inset-0 bg-[#008888] flex flex-col justify-end"
            style={{ transform: 'rotateY(180deg) translateZ(7px)' }}
          >
            <div className="w-full h-[18px] bg-[#b88565]" />
          </div>
          <div
            className="absolute inset-0 bg-[#009999] flex flex-col justify-end"
            style={{ transform: 'rotateY(-90deg) translateZ(7px)' }}
          >
            <div className="w-full h-[18px] bg-[#b88565]" />
          </div>
          <div
            className="absolute inset-0 bg-[#009999] flex flex-col justify-end"
            style={{ transform: 'rotateY(90deg) translateZ(7px)' }}
          >
            <div className="w-full h-[18px] bg-[#b88565]" />
          </div>
        </div>

        {/* === 4. RIGHT ARM (14px wide x 42px high x 14px deep) === */}
        <div
          className="absolute -top-[24px] left-[14px] w-[14px] h-[42px]"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div
            className="absolute inset-0 bg-[#00aaaa] flex flex-col justify-end"
            style={{ transform: 'translateZ(7px)' }}
          >
            <div className="w-full h-[18px] bg-[#C49272]" />
          </div>
          <div
            className="absolute inset-0 bg-[#008888] flex flex-col justify-end"
            style={{ transform: 'rotateY(180deg) translateZ(7px)' }}
          >
            <div className="w-full h-[18px] bg-[#b88565]" />
          </div>
          <div
            className="absolute inset-0 bg-[#009999] flex flex-col justify-end"
            style={{ transform: 'rotateY(-90deg) translateZ(7px)' }}
          >
            <div className="w-full h-[18px] bg-[#b88565]" />
          </div>
          <div
            className="absolute inset-0 bg-[#009999] flex flex-col justify-end"
            style={{ transform: 'rotateY(90deg) translateZ(7px)' }}
          >
            <div className="w-full h-[18px] bg-[#b88565]" />
          </div>
        </div>

        {/* === 5. LEFT LEG (14px wide x 42px high x 14px deep) === */}
        <div
          className="absolute top-[18px] -left-[14px] w-[14px] h-[42px]"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front Face (Jeans + Shoes) */}
          <div
            className="absolute inset-0 bg-[#2B2D6D] flex flex-col justify-end"
            style={{ transform: 'translateZ(7px)' }}
          >
            <div className="w-full h-[10px] bg-[#404040]" />
          </div>
          {/* Back Face */}
          <div
            className="absolute inset-0 bg-[#1F214F] flex flex-col justify-end"
            style={{ transform: 'rotateY(180deg) translateZ(7px)' }}
          >
            <div className="w-full h-[10px] bg-[#303030]" />
          </div>
          {/* Left Face */}
          <div
            className="absolute inset-0 bg-[#222457] flex flex-col justify-end"
            style={{ transform: 'rotateY(-90deg) translateZ(7px)' }}
          >
            <div className="w-full h-[10px] bg-[#383838]" />
          </div>
          {/* Right Face */}
          <div
            className="absolute inset-0 bg-[#222457] flex flex-col justify-end"
            style={{ transform: 'rotateY(90deg) translateZ(7px)' }}
          >
            <div className="w-full h-[10px] bg-[#383838]" />
          </div>
        </div>

        {/* === 6. RIGHT LEG (14px wide x 42px high x 14px deep) === */}
        <div
          className="absolute top-[18px] left-[0px] w-[14px] h-[42px]"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front Face (Jeans + Shoes) */}
          <div
            className="absolute inset-0 bg-[#2B2D6D] flex flex-col justify-end"
            style={{ transform: 'translateZ(7px)' }}
          >
            <div className="w-full h-[10px] bg-[#404040]" />
          </div>
          {/* Back Face */}
          <div
            className="absolute inset-0 bg-[#1F214F] flex flex-col justify-end"
            style={{ transform: 'rotateY(180deg) translateZ(7px)' }}
          >
            <div className="w-full h-[10px] bg-[#303030]" />
          </div>
          {/* Left Face */}
          <div
            className="absolute inset-0 bg-[#222457] flex flex-col justify-end"
            style={{ transform: 'rotateY(-90deg) translateZ(7px)' }}
          >
            <div className="w-full h-[10px] bg-[#383838]" />
          </div>
          <div
            className="absolute inset-0 bg-[#222457] flex flex-col justify-end"
            style={{ transform: 'rotateY(90deg) translateZ(7px)' }}
          >
            <div className="w-full h-[10px] bg-[#383838]" />
          </div>
        </div>
      </div>
    </div>
  );
};
