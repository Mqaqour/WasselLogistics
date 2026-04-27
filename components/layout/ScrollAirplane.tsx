import React, { useState } from 'react';
import { Plane } from 'lucide-react';

export const ScrollAirplane: React.FC = () => {
  const [planeError, setPlaneError] = useState(false);

  return (
    <>
        <style>{`
          @keyframes flyLoop {
            0% {
              transform: translate3d(100vw, -50%, 0);
            }
            100% {
              transform: translate3d(-100vw, -50%, 0);
            }
          }
          .plane-animation {
            animation: flyLoop 10s linear infinite;
          }
        `}</style>

        {/* Airplane: Auto Loop Animation (Aligned with text) - Faster */}
        <div 
            className="absolute top-[35%] sm:top-[40%] right-0 z-0 pointer-events-none select-none will-change-transform plane-animation"
        >
            {!planeError ? (
                <img 
                    src="/assets/airplane.png" 
                    alt="Wassel Airplane" 
                    onError={() => setPlaneError(true)}
                    // Increased mobile width significantly for impact
                    className="w-[600px] sm:w-[500px] md:w-[600px] lg:w-[900px] max-w-none h-auto object-contain opacity-80 drop-shadow-2xl"
                />
            ) : (
                <div className="opacity-10 text-wassel-blue">
                    <Plane className="w-[600px] h-[600px] sm:w-[500px] sm:h-[500px] md:w-[600px] md:h-[600px] -rotate-90" strokeWidth={1} />
                </div>
            )}
        </div>
    </>
  );
};