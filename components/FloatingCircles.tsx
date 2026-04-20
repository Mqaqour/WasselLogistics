import React, { useMemo } from 'react';

export const FloatingCircles: React.FC = () => {
  const circles = useMemo(() => {
    return Array.from({ length: 3 }).map((_, i) => ({
      id: i,
      // Small solid circles: 10px to 18px
      size: Math.floor(Math.random() * 8) + 10,
      // Start exactly at center
      left: 50, 
      top: 50, 
      // Duration
      duration: Math.floor(Math.random() * 5) + 10,
      // Stagger delays
      delay: i * 4, 
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      <style>
        {`
          @keyframes orbit-tight {
            0% { transform: translate(-220px, 0) scale(1); z-index: 0; }
            25% { transform: translate(0, -60px) scale(0.85); z-index: 0; }
            50% { transform: translate(220px, 0) scale(1); z-index: 20; }
            75% { transform: translate(0, 60px) scale(1.15); z-index: 20; }
            100% { transform: translate(-220px, 0) scale(1); z-index: 0; }
          }
        `}
      </style>
      {circles.map((circle) => (
        <div
          key={circle.id}
          className="absolute rounded-full bg-[#FFCD00]"
          style={{
            width: `${circle.size}px`,
            height: `${circle.size}px`,
            left: `${circle.left}%`,
            top: `${circle.top}%`,
            marginTop: '-40px', // Adjust vertical center relative to text
            animation: `orbit-tight ${circle.duration}s infinite linear`,
            animationDelay: `-${circle.delay}s`,
          }}
        />
      ))}
    </div>
  );
};