import React from 'react';
import { Language } from '../types';

interface HeroVisualProps {
    lang: Language;
}

export const HeroVisual: React.FC<HeroVisualProps> = ({ lang }) => {
    // 50 Logistics terms to replace the generic CSS terms
    const terms = [
        "Logistics", "Tracking", "Global", "Speed",
        "Secure", "Freight", "Air", "Sea",
        "Cargo", "Parcel", "WASSEL", "Express", 
        "Export", "Import", "Customs", "Duty",
        "Warehouse", "Storage", "Delivery", "Courier",
        "Supply", "Chain", "Trucking", "Fleet",
        "Commerce", "B2B", "B2C", "Returns",
        "Route", "Map", "Zone", "Lead Time",
        "Network", "Hub", "Gateway", "Port",
        "Transit", "Incoterms", "FOB", "CIF",
        "Priority", "Economy", "Standard", "Next Day",
        "Same Day", "Handling", "Packing", "Crating",
        "Labeling", "Sorting"
    ];

    return (
        <div className="w-full h-full relative overflow-hidden bg-slate-50">
            <style>{`
            @keyframes zoom-in {
              0% {
                transform: translateZ(-1000px);
                opacity: 0;
                filter: blur(5px);
              }
              50% {
                transform: translateZ(0px);
                opacity: 1;
                filter: blur(0px);
              }
              100% {
                transform: translateZ(1000px);
                opacity: 0;
                filter: blur(5px);
              }
            }

            .stuck-grid {
              height: 100%;
              width: 100%;
              perspective: 1000px;
              transform-style: preserve-3d;
              
              display: grid;
              grid-template-columns: repeat(4, 25dvw);
              grid-template-rows: repeat(4, 25dvh);
              place-items: center;
              justify-content: center;
              align-content: center;
            }

            .grid-item {
              transform-style: preserve-3d;
              font-size: 2vw; 
              font-weight: 300;
              color: #002B49;
              white-space: nowrap;
              opacity: 0; 
            }

            /* Responsive Text Sizes */
            @media (max-width: 768px) {
                .grid-item { font-size: 4vw; }
                .grid-item.special b { font-size: 10vw !important; }
            }

            .grid-item.special {
               z-index: 10;
            }

            .grid-item.special b {
              font-size: 6vw;
              color: #FFCD00;
              text-shadow: 0 4px 20px rgba(0,43,73,0.15);
              font-weight: 800;
            }

            @supports (animation-timeline: view()) {
              @media (prefers-reduced-motion: no-preference) {
                .grid-item {
                    animation: zoom-in linear both;
                    animation-timeline: view();
                    will-change: transform, opacity, filter;
                }
              }
            }
            
            /* Fallback */
            @supports not (animation-timeline: view()) {
                .grid-item { opacity: 0.2; }
            }

            /* --- Grid Positioning & Animation Ranges --- */
            
            .grid-item:nth-of-type(1)  { animation-range: 40% 50%; grid-area: 1/1; }
            .grid-item:nth-of-type(2)  { animation-range: 20% 30%; grid-area: 1/2; }
            .grid-item:nth-of-type(3)  { animation-range: 52% 62%; grid-area: 1/3; }
            .grid-item:nth-of-type(4)  { animation-range: 50% 60%; grid-area: 1/4; }
            .grid-item:nth-of-type(5)  { animation-range: 45% 55%; grid-area: 2/1; }
            .grid-item:nth-of-type(6)  { animation-range: 10% 20%; grid-area: 2/2; }
            .grid-item:nth-of-type(7)  { animation-range: 90% 100%; grid-area: 2/3; }
            .grid-item:nth-of-type(8)  { animation-range: 30% 40%; grid-area: 2/4; }
            .grid-item:nth-of-type(9)  { animation-range: 80% 90%; grid-area: 3/1; }
            .grid-item:nth-of-type(10) { animation-range: 70% 80%; grid-area: 3/2; }
            
            /* Center Special Item (WASSEL) */
            .grid-item:nth-of-type(11) { animation-range: 0% 100%; grid-area: 2/2 / span 2 / span 2; } 

            .grid-item:nth-of-type(12) { animation-range: 52% 62%; grid-area: 3/4; }
            .grid-item:nth-of-type(13) { animation-range: 15% 25%; grid-area: 4/1; }
            .grid-item:nth-of-type(14) { animation-range: 7% 17%; grid-area: 4/2; }
            .grid-item:nth-of-type(15) { animation-range: 75% 85%; grid-area: 4/3; }
            .grid-item:nth-of-type(16) { animation-range: 3% 13%; grid-area: 4/4; }
            
            /* Overlapping Items */
            .grid-item:nth-of-type(17) { animation-range: 87% 97%; grid-area: 2/1; }
            .grid-item:nth-of-type(18) { animation-range: 42% 52%; grid-area: 2/2; }
            .grid-item:nth-of-type(19) { animation-range: 57% 67%; grid-area: 2/3; }
            .grid-item:nth-of-type(20) { animation-range: 37% 47%; grid-area: 2/4; }
            .grid-item:nth-of-type(21) { animation-range: 12% 22%; grid-area: 3/1; }
            .grid-item:nth-of-type(22) { animation-range: 8% 18%; grid-area: 3/2; }
            .grid-item:nth-of-type(23) { animation-range: 84% 94%; grid-area: 3/3; }
            .grid-item:nth-of-type(24) { animation-range: 33% 43%; grid-area: 3/4; }
            .grid-item:nth-of-type(25) { animation-range: 48% 58%; grid-area: 1/1; }
            .grid-item:nth-of-type(26) { animation-range: 13% 23%; grid-area: 1/2; }
            .grid-item:nth-of-type(27) { animation-range: 78% 88%; grid-area: 1/3; }
            .grid-item:nth-of-type(28) { animation-range: 62% 72%; grid-area: 1/4; }
            .grid-item:nth-of-type(29) { animation-range: 31% 41%; grid-area: 4/1; }
            .grid-item:nth-of-type(30) { animation-range: 8% 18%; grid-area: 4/2; }
            .grid-item:nth-of-type(31) { animation-range: 4% 14%; grid-area: 4/3; }
            .grid-item:nth-of-type(32) { animation-range: 74% 84%; grid-area: 4/4; }
            .grid-item:nth-of-type(33) { animation-range: 61% 71%; grid-area: 2/1; }
            .grid-item:nth-of-type(34) { animation-range: 26% 36%; grid-area: 2/2; }
            .grid-item:nth-of-type(35) { animation-range: 63% 73%; grid-area: 2/3; }
            .grid-item:nth-of-type(36) { animation-range: 11% 21%; grid-area: 2/4; }
            .grid-item:nth-of-type(37) { animation-range: 89% 99%; grid-area: 3/1; }
            .grid-item:nth-of-type(38) { animation-range: 33% 43%; grid-area: 3/2; }
            .grid-item:nth-of-type(39) { animation-range: 88% 98%; grid-area: 3/3; }
            .grid-item:nth-of-type(40) { animation-range: 22% 32%; grid-area: 3/4; }
            .grid-item:nth-of-type(41) { animation-range: 16% 26%; grid-area: 1/1; }
            .grid-item:nth-of-type(42) { animation-range: 26% 36%; grid-area: 1/2; }
            .grid-item:nth-of-type(43) { animation-range: 66% 76%; grid-area: 1/3; }
            .grid-item:nth-of-type(44) { animation-range: 3% 13%; grid-area: 1/4; }
            .grid-item:nth-of-type(45) { animation-range: 44% 54%; grid-area: 4/1; }
            .grid-item:nth-of-type(46) { animation-range: 11% 21%; grid-area: 4/2; }
            .grid-item:nth-of-type(47) { animation-range: 23% 33%; grid-area: 4/3; }
            .grid-item:nth-of-type(48) { animation-range: 39% 49%; grid-area: 4/4; }
            .grid-item:nth-of-type(49) { animation-range: 59% 69%; grid-area: 3/1; }
            .grid-item:nth-of-type(50) { animation-range: 6% 16%; grid-area: 3/2; }
            `}</style>
            
            <div className="stuck-grid">
                {terms.map((term, i) => (
                    <div 
                        key={i} 
                        className={`grid-item ${i === 10 ? 'special' : ''}`}
                    >
                        {i === 10 ? <b>{term}</b> : term}
                    </div>
                ))}
            </div>

            {/* Gradient Overlay for subtle fade */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-white via-transparent to-white/60"></div>
        </div>
    );
};