import React, { useEffect, useId, useRef, useState } from 'react';

interface CopilotToggleProps
  extends Omit<React.ComponentPropsWithoutRef<'button'>, 'aria-label'> {
  /** Fades the solid red "flush" squircle in over the gradient (error / attention state). */
  alert?: boolean;
  /** Stops the eyes from following the cursor (and re-centres them). */
  paused?: boolean;
  /** Accessible name for the button. */
  label?: string;
  /** Rendered width/height in px. Defaults to 64. */
  size?: number;
  /**
   * When false, renders a non-interactive `<span role="img">` instead of a
   * `<button>` â use it as a decorative avatar (e.g. beside a heading) where a
   * clickable control would be misleading. The eyes still track and blink.
   * Defaults to true.
   */
  interactive?: boolean;
}

// px offset in the 96x96 SVG's own coordinate space â the eye socket is small,
// so the pupils only ever drift a few units toward the cursor.
const MAX_OFFSET = 5;

/**
 * Mouse-tracking mascot button: the eyes follow the cursor anywhere on the page,
 * it blinks on its own at human-ish intervals, and `alert` fades a red squircle
 * in over the blue/violet gradient. Motion is disabled under
 * `prefers-reduced-motion`. Styling lives in index.css under `.copilot-toggle`.
 */
export const CopilotToggle: React.FC<CopilotToggleProps> = ({
  onClick,
  alert = false,
  paused = false,
  label = 'AI Copilot',
  size = 64,
  interactive = true,
  className = '',
  style,
  ...rest
}) => {
  // useId keeps the gradient id unique if the component is mounted more than once
  // (and is stable across the prerender/hydrate pass).
  const gradientId = useId().replace(/:/g, '');
  const gazeRef = useRef<SVGGElement>(null);
  const [blinking, setBlinking] = useState(false);

  // 1. Eyes follow the cursor. We mutate the transform directly rather than via
  //    state, so a mouse move never triggers a React re-render.
  useEffect(() => {
    const gaze = gazeRef.current;
    if (!gaze) return;

    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gaze.style.transform = 'translate(0px, 0px)';
      return;
    }

    function onMouseMove(e: MouseEvent) {
      const svg = gaze!.ownerSVGElement;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const angle = Math.atan2(dy, dx);
      const dist = Math.min(MAX_OFFSET, Math.hypot(dx, dy) / 12); // /12 = sensitivity

      const ex = Math.cos(angle) * dist;
      const ey = Math.sin(angle) * dist;
      gaze!.style.transform = `translate(${ex.toFixed(2)}px, ${ey.toFixed(2)}px)`;
    }

    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, [paused]);

  // 2. Idle blinking at a random, human-ish interval.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let blinkTimer = 0;
    let resetTimer = 0;

    function scheduleBlink() {
      blinkTimer = window.setTimeout(() => {
        setBlinking(true);
        resetTimer = window.setTimeout(() => setBlinking(false), 110);
        scheduleBlink();
      }, 2500 + Math.random() * 3500);
    }

    const firstBlink = window.setTimeout(scheduleBlink, 1500);
    return () => {
      window.clearTimeout(firstBlink);
      window.clearTimeout(blinkTimer);
      window.clearTimeout(resetTimer);
    };
  }, []);

  const face = (
    <svg viewBox="0 0 96 96" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1B70FF" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <g className="toggle-body">
        <path
          fill={`url(#${gradientId})`}
          d="M38 8 H58 A34 34 0 0 1 92 42 V54 A34 34 0 0 1 58 88 H38 A34 34 0 0 1 4 54 V42 A34 34 0 0 1 38 8 Z"
        />
        <path
          className="toggle-flush"
          fill="#E11D48"
          opacity="0"
          d="M38 8 H58 A34 34 0 0 1 92 42 V54 A34 34 0 0 1 58 88 H38 A34 34 0 0 1 4 54 V42 A34 34 0 0 1 38 8 Z"
        />
        <g className="toggle-gaze" ref={gazeRef}>
          <g className="toggle-perk">
            <g className={`toggle-lid${blinking ? ' is-blinking' : ''}`}>
              <g className="toggle-blink">
                <g className="toggle-eye-l">
                  <ellipse cx="38" cy="47" rx="6" ry="10" fill="#FFFFFF" />
                </g>
                <g className="toggle-eye-r">
                  <ellipse cx="58" cy="47" rx="6" ry="10" fill="#FFFFFF" />
                </g>
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
  );

  const sharedStyle = { width: size, height: size, ...style };
  const cls = `copilot-toggle${interactive ? '' : ' is-static'}${alert ? ' is-alert' : ''}${className ? ` ${className}` : ''}`;

  if (!interactive) {
    return (
      <span role="img" aria-label={label} style={sharedStyle} className={cls}>
        {face}
      </span>
    );
  }

  return (
    <button type="button" {...rest} onClick={onClick} aria-label={label} style={sharedStyle} className={cls}>
      {face}
    </button>
  );
};
