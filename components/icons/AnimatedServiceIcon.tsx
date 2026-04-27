import React from 'react';

export type AnimatedIconType =
  | 'truck'
  | 'plane'
  | 'bag'
  | 'card'
  | 'document'
  | 'globe'
  | 'shield'
  | 'container';

interface Props {
  type: AnimatedIconType;
  className?: string;
}

const Wrap: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <svg
    viewBox="0 0 64 64"
    className={`asi-wrap ${className ?? ''}`}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const AnimatedServiceIcon: React.FC<Props> = ({ type, className }) => {
  switch (type) {
    case 'truck':
      return (
        <Wrap className={className}>
          <line className="asi-dash" x1="2" y1="50" x2="62" y2="50" />
          <g className="asi-truck">
            <rect x="6" y="22" width="30" height="20" rx="2" />
            <path d="M36 28 H50 L58 36 V42 H36 Z" />
            <circle cx="40" cy="36" r="2" fill="currentColor" stroke="none" />
          </g>
          <g>
            <circle className="asi-wheel" cx="16" cy="46" r="5" />
            <circle cx="16" cy="46" r="1.5" fill="currentColor" stroke="none" />
            <circle className="asi-wheel" cx="46" cy="46" r="5" />
            <circle cx="46" cy="46" r="1.5" fill="currentColor" stroke="none" />
          </g>
        </Wrap>
      );

    case 'container':
      return (
        <Wrap className={className}>
          <line className="asi-dash" x1="2" y1="52" x2="62" y2="52" />
          <g className="asi-truck">
            <rect x="8" y="18" width="48" height="26" rx="2" />
            <path d="M14 18 V44 M22 18 V44 M30 18 V44 M38 18 V44 M46 18 V44" />
          </g>
          <circle className="asi-wheel" cx="18" cy="48" r="4" />
          <circle className="asi-wheel" cx="46" cy="48" r="4" />
        </Wrap>
      );

    case 'plane':
      return (
        <Wrap className={className}>
          <path className="asi-cloud" d="M6 22 q4 -4 8 0 q4 -4 8 0" opacity="0.5" />
          <path className="asi-cloud-2" d="M40 14 q4 -4 8 0 q4 -4 8 0" opacity="0.5" />
          <path className="asi-dash" d="M4 54 H60" />
          <g className="asi-plane">
            <path
              d="M10 38 L46 22 L52 24 L40 34 L46 46 L42 48 L30 38 L18 42 Z"
              fill="currentColor"
              stroke="none"
            />
          </g>
        </Wrap>
      );

    case 'bag':
      return (
        <Wrap className={className}>
          <g className="asi-bag">
            <path d="M14 24 H50 L46 54 H18 Z" />
            <path d="M22 24 V18 a10 10 0 0 1 20 0 V24" />
          </g>
          <circle className="asi-spark" cx="12" cy="14" r="1.5" fill="currentColor" stroke="none" />
          <circle className="asi-spark d1" cx="54" cy="18" r="1.5" fill="currentColor" stroke="none" />
          <circle className="asi-spark d2" cx="50" cy="8" r="1.5" fill="currentColor" stroke="none" />
        </Wrap>
      );

    case 'card':
      return (
        <Wrap className={className}>
          <defs>
            <clipPath id="asiCardClip">
              <rect x="6" y="16" width="52" height="32" rx="4" />
            </clipPath>
          </defs>
          <rect x="6" y="16" width="52" height="32" rx="4" />
          <line x1="6" y1="24" x2="58" y2="24" />
          <rect x="12" y="32" width="10" height="8" rx="1" fill="currentColor" stroke="none" />
          <line x1="26" y1="40" x2="50" y2="40" />
          <g clipPath="url(#asiCardClip)">
            <rect className="asi-shimmer" x="-20" y="16" width="14" height="32" fill="white" opacity="0.35" />
          </g>
        </Wrap>
      );

    case 'document':
      return (
        <Wrap className={className}>
          <rect x="14" y="8" width="36" height="48" rx="2" opacity="0.3" />
          <g className="asi-doc">
            <rect x="14" y="8" width="36" height="48" rx="2" />
            <line x1="20" y1="20" x2="44" y2="20" />
            <line x1="20" y1="28" x2="44" y2="28" />
            <line x1="20" y1="36" x2="36" y2="36" />
            <circle cx="32" cy="48" r="4" />
          </g>
        </Wrap>
      );

    case 'globe':
      return (
        <Wrap className={className}>
          <g className="asi-globe">
            <circle cx="32" cy="32" r="20" />
            <ellipse cx="32" cy="32" rx="20" ry="8" />
            <ellipse cx="32" cy="32" rx="8" ry="20" />
            <line x1="12" y1="32" x2="52" y2="32" />
          </g>
          <g className="asi-orbit">
            <ellipse cx="32" cy="32" rx="26" ry="10" opacity="0.4" />
          </g>
        </Wrap>
      );

    case 'shield':
      return (
        <Wrap className={className}>
          <g className="asi-shield">
            <path d="M32 6 L54 14 V32 c0 14 -10 22 -22 26 c-12 -4 -22 -12 -22 -26 V14 Z" />
            <path className="asi-check" d="M22 32 L30 40 L44 24" />
          </g>
        </Wrap>
      );

    default:
      return null;
  }
};
